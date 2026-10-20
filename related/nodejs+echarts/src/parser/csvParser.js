const fs = require('fs');

function clean(s) {
  return String(s || '').replace(/[\u0000]/g, '').trim();
}

function parse(filepath) {
  return new Promise((resolve, reject) => {
    try {
      const raw = fs.readFileSync(filepath, 'utf-8');
      const lines = raw.split(/\r?\n/).filter(l => l.trim());

      let headerLine = '';
      let startIdx = 0;
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        const cleaned = clean(lines[i]);
        if (cleaned.includes('Keyword') && cleaned.includes('Avg.')) {
          headerLine = cleaned;
          startIdx = i + 1;
          break;
        }
      }

      if (!headerLine) {
        reject(new Error('Could not find header line'));
        return;
      }

      const headers = headerLine.split('\t').map(h => clean(h));

      const data = [];
      for (let i = startIdx; i < lines.length; i++) {
        const line = clean(lines[i]);
        if (!line) continue;

        const vals = line.split('\t');
        if (vals.length < 2) continue;

        const row = {};
        headers.forEach((h, idx) => {
          row[h] = vals[idx] || '';
        });

        const keyword = row['Keyword'];
        if (!keyword) continue;

        const searchesRaw = row['Avg. monthly searches'] || '0';
        const numSearches = parseInt(searchesRaw.replace(/,/g, ''), 10) || 0;

        const competition = row['Competition'] || 'Unknown';
        const compIdxRaw = row['Competition (indexed value)'] || '0';
        const competitionIdx = parseFloat(compIdxRaw.replace(/,/g, '')) || 0;

        const bidLowRaw = row['Top of page bid (low range)'] || '0';
        const bidHighRaw = row['Top of page bid (high range)'] || '0';
        const bidLow = parseFloat(bidLowRaw.replace(/,/g, '')) || 0;
        const bidHigh = parseFloat(bidHighRaw.replace(/,/g, '')) || 0;

        data.push({
          keyword,
          avgMonthlySearches: numSearches,
          competition,
          competitionIndex: competitionIdx,
          bidLow,
          bidHigh,
          bidAvg: (bidLow + bidHigh) / 2 || 0,
          threeMonthChange: row['Three month change'] || '0%',
          yoyChange: row['YoY change'] || '0%',
          inAccount: row['In account?'] || '',
          inPlan: row['In plan?'] || ''
        });
      }

      console.log(`Parsed ${data.length} keywords`);
      if (data.length > 0) console.log('Sample:', JSON.stringify(data[0]));
      resolve(data);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { parse };