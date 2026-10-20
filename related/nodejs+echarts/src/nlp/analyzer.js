const winkNLP = require('wink-nlp');
const model = require('wink-eng-lite-web-model');
const nlp = winkNLP(model);

const stopWords = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'each',
  'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'about', 'into', 'over',
  'after', 'before', 'between', 'under', 'above', 'up', 'down', 'out', 'off', 'again',
  'further', 'then', 'once', 'here', 'there', 'any', 'also', 'back', 'much', 'many'
]);

const brandPatterns = [
  { brand: 'DJI', patterns: ['dji', 'agras', 't40', 't30', 't20', 't10', 't16', 't20p', 'mavic', 'phantom', 'smart farm', 'smartfarm'] },
  { brand: 'XAG', patterns: ['xag', 'p100', 'p20', 'p30', 'p40', 'p80', 'v40', 'm500', 'xplanet'] },
  { brand: 'Joyance', patterns: ['joyance'] },
  { brand: 'EFT', patterns: ['eft'] },
  { brand: 'Parrot', patterns: ['parrot', 'bluegrass'] },
  { brand: 'SenseFly', patterns: ['sensefly', 'ebee'] },
  { brand: 'TopXGun', patterns: ['topxgun', 't410'] }
];

function getWordFrequency(keywords) {
  const wordMap = new Map();

  keywords.forEach(item => {
    const text = item.keyword.toLowerCase();
    const tokens = nlp.readDoc(text).tokens().out();

    tokens.forEach(token => {
      const word = token.trim();
      if (word && word.length > 2 && !stopWords.has(word) && !/^\d+$/.test(word)) {
        wordMap.set(word, (wordMap.get(word) || 0) + 1);
      }
    });
  });

  const sorted = [...wordMap.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);

  return sorted.slice(0, 100);
}

function extractBrands(keywords) {
  const brandCount = {};

  keywords.forEach(item => {
    const text = item.keyword.toLowerCase();

    brandPatterns.forEach(({ brand, patterns }) => {
      patterns.forEach(pattern => {
        if (text.includes(pattern)) {
          brandCount[brand] = (brandCount[brand] || 0) + item.avgMonthlySearches;
        }
      });
    });
  });

  return Object.entries(brandCount)
    .map(([brand, searches]) => ({ brand, searches }))
    .sort((a, b) => b.searches - a.searches);
}

function extractModels(keywords) {
  const modelPatterns = [
    { model: 'DJI Agras T40', patterns: ['t40', 'agras t40'] },
    { model: 'DJI Agras T30', patterns: ['t30', 'agras t30'] },
    { model: 'DJI Agras T20', patterns: ['t20', 'agras t20'] },
    { model: 'DJI Agras T10', patterns: ['t10', 'agras t10'] },
    { model: 'DJI Agras T16', patterns: ['t16', 'agras t16'] },
    { model: 'XAG P100', patterns: ['p100'] },
    { model: 'XAG P20', patterns: ['p20'] },
    { model: 'XAG P30', patterns: ['p30'] },
    { model: 'XAG V40', patterns: ['v40'] },
    { model: 'XAG M500', patterns: ['m500'] }
  ];

  const modelCount = {};

  keywords.forEach(item => {
    const text = item.keyword.toLowerCase();

    modelPatterns.forEach(({ model, patterns }) => {
      patterns.forEach(pattern => {
        if (text.includes(pattern)) {
          if (!modelCount[model]) {
            modelCount[model] = { model, searches: 0, count: 0, keywords: [] };
          }
          modelCount[model].searches += item.avgMonthlySearches;
          modelCount[model].count += 1;
          if (!modelCount[model].keywords.includes(item.keyword)) {
            modelCount[model].keywords.push(item.keyword);
          }
        }
      });
    });
  });

  return Object.values(modelCount)
    .sort((a, b) => b.searches - a.searches);
}

function extractEntities(keywords) {
  const entities = {
    products: [],
    actions: [],
    attributes: []
  };

  const productWords = ['drone', 'sprayer', 'uav', 'quadcopter', 'helicopter', 'aircraft'];
  const actionWords = ['spraying', 'spray', 'mapping', 'monitoring', 'scouting', 'fertilizing', 'fumigation'];
  const attrWords = ['price', 'cost', 'sale', 'best', 'professional', 'commercial', 'agricultural', 'precision'];

  keywords.forEach(item => {
    const text = item.keyword.toLowerCase();
    const words = text.split(/\s+/);

    words.forEach(word => {
      if (productWords.includes(word) && !entities.products.includes(word)) {
        entities.products.push(word);
      }
      if (actionWords.includes(word) && !entities.actions.includes(word)) {
        entities.actions.push(word);
      }
      if (attrWords.includes(word) && !entities.attributes.includes(word)) {
        entities.attributes.push(word);
      }
    });
  });

  return entities;
}

function classifyIntent(keywords) {
  const intents = {
    purchase: { label: '购买型', keywords: [] },
    information: { label: '信息型', keywords: [] },
    brand: { label: '品牌型', keywords: [] }
  };

  const purchasePatterns = ['price', 'cost', 'for sale', 'sale', 'buy', 'purchase'];
  const brandPatterns = ['dji', 'xag', 'joyance', 'eft', 'parrot', 'sensefly'];

  keywords.forEach(item => {
    const text = item.keyword.toLowerCase();

    if (purchasePatterns.some(p => text.includes(p))) {
      intents.purchase.keywords.push(item.keyword);
    } else if (brandPatterns.some(b => text.includes(b))) {
      intents.brand.keywords.push(item.keyword);
    } else {
      intents.information.keywords.push(item.keyword);
    }
  });

  return {
    purchase: intents.purchase.keywords.length,
    information: intents.information.keywords.length,
    brand: intents.brand.keywords.length
  };
}

module.exports = {
  getWordFrequency,
  extractBrands,
  extractModels,
  extractEntities,
  classifyIntent
};