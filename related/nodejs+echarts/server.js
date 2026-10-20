const express = require('express');
const path = require('path');
const csvParser = require('./src/parser/csvParser');
const analyzer = require('./src/nlp/analyzer');
const chartData = require('./src/charts/chartData');

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let keywordsData = [];
let analysisCache = {};

async function loadData() {
  try {
    const csvPath = path.join(__dirname, 'google keywords', 'Keyword Stats 2026-05-13 at 10_11_13.csv');
    keywordsData = await csvParser.parse(csvPath);
    console.log(`Loaded ${keywordsData.length} keywords`);

    analysisCache = {
      entities: analyzer.extractEntities(keywordsData),
      wordFreq: analyzer.getWordFrequency(keywordsData),
      intent: analyzer.classifyIntent(keywordsData),
      brands: analyzer.extractBrands(keywordsData),
      models: analyzer.extractModels(keywordsData)
    };
    console.log('Analysis complete');
  } catch (err) {
    console.error('Failed to load data:', err.message);
  }
}

app.get('/api/keywords', (req, res) => {
  const { page = 1, limit = 50, sort, order, filter } = req.query;
  let result = [...keywordsData];

  if (filter) {
    const f = JSON.parse(filter);
    if (f.competition) result = result.filter(k => k.Competition === f.competition);
    if (f.minSearches) result = result.filter(k => k.avgMonthlySearches >= f.minSearches);
  }

  if (sort) {
    result.sort((a, b) => {
      const aVal = a[sort] || 0;
      const bVal = b[sort] || 0;
      return order === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }

  const start = (page - 1) * limit;
  res.json({
    data: result.slice(start, start + +limit),
    total: result.length,
    page: +page,
    limit: +limit
  });
});

app.get('/api/analysis/entities', (req, res) => {
  res.json(analysisCache.entities);
});

app.get('/api/analysis/wordfreq', (req, res) => {
  res.json(analysisCache.wordFreq);
});

app.get('/api/analysis/intent', (req, res) => {
  res.json(analysisCache.intent);
});

app.get('/api/analysis/brands', (req, res) => {
  res.json(analysisCache.brands);
});

app.get('/api/analysis/models', (req, res) => {
  res.json(analysisCache.models);
});

app.get('/api/charts/wordcloud', (req, res) => {
  res.json(chartData.toWordCloud(analysisCache.wordFreq));
});

app.get('/api/charts/search-volume', (req, res) => {
  res.json(chartData.toSearchVolume(analysisCache.models));
});

app.get('/api/charts/scatter', (req, res) => {
  res.json(chartData.toScatter(keywordsData));
});

app.get('/api/charts/competition', (req, res) => {
  res.json(chartData.toCompetitionPie(keywordsData));
});

app.get('/api/charts/trends', (req, res) => {
  res.json(chartData.toTrends(keywordsData));
});

app.post('/api/import', async (req, res) => {
  try {
    const { filepath } = req.body;
    keywordsData = await csvParser.parse(filepath);
    analysisCache = {
      entities: analyzer.extractEntities(keywordsData),
      wordFreq: analyzer.getWordFrequency(keywordsData),
      intent: analyzer.classifyIntent(keywordsData),
      brands: analyzer.extractBrands(keywordsData),
      models: analyzer.extractModels(keywordsData)
    };
    res.json({ success: true, count: keywordsData.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

loadData().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
});