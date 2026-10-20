const API_BASE = '';
let currentPage = 1;
let totalPages = 1;
let currentSort = { column: 'avgMonthlySearches', order: 'desc' };
let currentFilter = { competition: '', minSearches: '' };
let allKeywords = [];

const charts = {};

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

async function init() {
  showLoading(true);

  try {
    const [wc, sv, comp, sc, trends, keywords] = await Promise.all([
      fetchJSON(`${API_BASE}/api/charts/wordcloud`),
      fetchJSON(`${API_BASE}/api/charts/search-volume`),
      fetchJSON(`${API_BASE}/api/charts/competition`),
      fetchJSON(`${API_BASE}/api/charts/scatter`),
      fetchJSON(`${API_BASE}/api/charts/trends`),
      fetchJSON(`${API_BASE}/api/keywords?page=1&limit=100`)
    ]);

    initChart('wordcloud', wc);
    initChart('searchVolume', sv);
    initChart('competition', comp);
    initChart('scatter', sc);
    initChart('trends', trends);

    allKeywords = keywords.data;
    totalPages = Math.ceil(keywords.total / 50);
    updateTable(keywords.data);
    updateStats();

    setupEventListeners();
  } catch (err) {
    console.error(err);
    alert('加载数据失败: ' + err.message);
  } finally {
    showLoading(false);
  }
}

function initChart(id, option) {
  const el = document.getElementById(id);
  if (!el) return;
  const chart = echarts.init(el);
  chart.setOption(option);
  charts[id] = chart;

  window.addEventListener('resize', () => chart.resize());
}

function updateTable(data) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = data.map(k => `
    <tr>
      <td class="keyword" title="${k.keyword}">${k.keyword}</td>
      <td class="num">${k.avgMonthlySearches.toLocaleString()}</td>
      <td class="comp-${k.competition}">${k.competition}</td>
      <td class="num">${k.competitionIndex}</td>
      <td class="num">¥${k.bidAvg.toFixed(2)}</td>
      <td class="num ${k.threeMonthChange?.includes('-') ? 'comp-High' : (k.threeMonthChange?.includes('+') ? 'comp-Low' : '')}">${k.threeMonthChange}</td>
    </tr>
  `).join('');

  renderPagination();
}

function renderPagination() {
  const pg = document.getElementById('pagination');
  if (totalPages <= 1) { pg.innerHTML = ''; return; }

  let html = `<button class="page-btn" onclick="goPage(1)">首页</button>`;
  html += `<button class="page-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>上一页</button>`;

  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }

  html += `<button class="page-btn" onclick="goPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>下一页</button>`;
  html += `<button class="page-btn" onclick="goPage(${totalPages})">末页</button>`;

  pg.innerHTML = html;
}

async function goPage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;

  const params = new URLSearchParams({
    page,
    limit: 50,
    sort: currentSort.column,
    order: currentSort.order
  });

  if (currentFilter.competition) params.append('filter', JSON.stringify(currentFilter));

  showLoading(true);
  try {
    const res = await fetchJSON(`${API_BASE}/api/keywords?${params}`);
    updateTable(res.data);
  } finally {
    showLoading(false);
  }
}

function updateStats() {
  const total = allKeywords.length;
  const totalSearches = allKeywords.reduce((sum, k) => sum + k.avgMonthlySearches, 0);
  const avgBid = allKeywords.filter(k => k.bidAvg > 0).reduce((sum, k, _, arr) => sum + k.bidAvg / arr.length, 0);

  document.getElementById('totalKeywords').textContent = total.toLocaleString();
  document.getElementById('totalSearches').textContent = (totalSearches / 1000).toFixed(0) + 'K';
  document.getElementById('avgBid').textContent = '¥' + avgBid.toFixed(2);
}

function setupEventListeners() {
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (currentSort.column === col) {
        currentSort.order = currentSort.order === 'desc' ? 'asc' : 'desc';
      } else {
        currentSort.column = col;
        currentSort.order = 'desc';
      }
      goPage(1);
    });
  });

  document.getElementById('filterComp').addEventListener('change', (e) => {
    currentFilter.competition = e.target.value;
    goPage(1);
  });

  document.getElementById('filterMinSearch').addEventListener('change', (e) => {
    currentFilter.minSearches = e.target.value;
    goPage(1);
  });

  if (charts.searchVolume) {
    charts.searchVolume.on('click', (params) => {
      const modelName = params.name;
      console.log('Clicked model:', modelName);
    });
  }

  if (charts.competition) {
    charts.competition.on('click', (params) => {
      const comp = params.name;
      if (comp) {
        document.getElementById('filterComp').value = comp;
        currentFilter.competition = comp;
        goPage(1);
      }
    });
  }
}

function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'block' : 'none';
}

init();