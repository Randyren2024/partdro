function toWordCloud(wordFreq) {
  const data = wordFreq.slice(0, 50).map(item => ({
    name: item.word,
    value: item.count
  }));

  return {
    tooltip: {},
    series: [{
      type: 'wordCloud',
      shape: 'circle',
      left: 'center',
      top: 'center',
      width: '90%',
      height: '90%',
      right: null,
      bottom: null,
      sizeRange: [12, 60],
      rotationRange: [-90, 90],
      rotationStep: 45,
      gridSize: 8,
      drawOutOfBound: false,
      layoutAnimation: true,
      textStyle: {
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        color: () => {
          const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];
          return colors[Math.floor(Math.random() * colors.length)];
        }
      },
      emphasis: {
        focus: 'self',
        textStyle: {
          textShadowBlur: 10,
          textShadowColor: '#333'
        }
      },
      data
    }]
  };
}

function toSearchVolume(models) {
  const top15 = models.slice(0, 15);

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '月搜索量',
      axisLabel: { formatter: (v) => v >= 1000 ? (v/1000).toFixed(0) + 'K' : v }
    },
    yAxis: {
      type: 'category',
      data: top15.map(m => m.model).reverse(),
      axisLabel: { interval: 0, fontSize: 11 }
    },
    series: [{
      name: '搜索量',
      type: 'bar',
      data: top15.map(m => m.searches).reverse(),
      itemStyle: {
        color: (params) => {
          const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'];
          return colors[params.dataIndex % colors.length];
        }
      },
      label: {
        show: true,
        position: 'right',
        formatter: (p) => p.value >= 1000 ? (p.value/1000).toFixed(0) + 'K' : p.value
      }
    }]
  };
}

function toScatter(keywords) {
  const validData = keywords
    .filter(k => k.avgMonthlySearches > 0 && k.competitionIndex > 0)
    .map(k => ({
      name: k.keyword,
      value: [k.avgMonthlySearches, k.competitionIndex, k.bidAvg || 0]
    }));

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        return `<b>${params.name}</b><br/>
          搜索量: ${params.value[0].toLocaleString()}<br/>
          竞争度: ${params.value[1]}<br/>
          平均出价: ¥${params.value[2].toFixed(2)}`;
      }
    },
    grid: {
      left: '3%',
      right: '7%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'log',
      name: '月搜索量',
      axisLabel: {
        formatter: (v) => v >= 1000 ? (v/1000).toFixed(0) + 'K' : v
      }
    },
    yAxis: {
      type: 'value',
      name: '竞争指数',
      min: 0,
      max: 100
    },
    visualMap: {
      show: true,
      dimension: 2,
      min: 0,
      max: 50,
      inRange: {
        symbolSize: [5, 30],
        color: ['#5470c6', '#fac858', '#ee6666']
      },
      calculable: true,
      right: 10,
      top: 'center',
      text: ['高出价', '低出价']
    },
    series: [{
      type: 'scatter',
      symbolSize: (val) => Math.max(5, Math.min(30, val[2] * 2)),
      data: validData.slice(0, 200)
    }]
  };
}

function toCompetitionPie(keywords) {
  const compCount = { Low: 0, Medium: 0, High: 0, Unknown: 0 };

  keywords.forEach(k => {
    const c = k.competition || 'Unknown';
    if (compCount[c] !== undefined) {
      compCount[c]++;
    } else {
      compCount.Unknown++;
    }
  });

  const data = Object.entries(compCount)
    .filter(([k, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const colorMap = {
    Low: '#91cc75',
    Medium: '#fac858',
    High: '#ee6666',
    Unknown: '#5470c6'
  };

  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: '0%' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: { show: false, position: 'center' },
      emphasis: {
        label: { show: true, fontSize: 16, fontWeight: 'bold' }
      },
      labelLine: { show: false },
      data: data.map(d => ({ ...d, itemStyle: { color: colorMap[d.name] } }))
    }]
  };
}

function toTrends(keywords) {
  const up = keywords.filter(k => k.threeMonthChange && k.threeMonthChange.includes('+'));
  const down = keywords.filter(k => k.threeMonthChange && k.threeMonthChange.includes('-') && !k.threeMonthChange.includes('+-'));

  const upData = up
    .sort((a, b) => {
      const aVal = parseInt(a.threeMonthChange.replace(/[+%]/g, '')) || 0;
      const bVal = parseInt(b.threeMonthChange.replace(/[+%]/g, '')) || 0;
      return bVal - aVal;
    })
    .slice(0, 10)
    .map(k => ({
      name: k.keyword,
      value: parseInt(k.threeMonthChange.replace(/[+%]/g, '')) || 0
    }));

  const downData = down
    .sort((a, b) => {
      const aVal = parseInt(a.threeMonthChange.replace(/-/g, '')) || 0;
      const bVal = parseInt(b.threeMonthChange.replace(/-/g, '')) || 0;
      return aVal - bVal;
    })
    .slice(0, 10)
    .map(k => ({
      name: k.keyword,
      value: -Math.abs(parseInt(k.threeMonthChange.replace(/-/g, '')) || 0)
    }));

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { formatter: '{c}%' }
    },
    yAxis: {
      type: 'category',
      data: [...upData.map(d => d.name).slice(0, 5), ...downData.map(d => d.name).slice(0, 5)].reverse(),
      axisLabel: { interval: 0, fontSize: 10 }
    },
    series: [
      {
        name: '增长',
        type: 'bar',
        data: upData.slice(0, 5).map(d => d.value).reverse(),
        itemStyle: { color: '#91cc75' }
      },
      {
        name: '下降',
        type: 'bar',
        data: downData.slice(0, 5).map(d => d.value).reverse(),
        itemStyle: { color: '#ee6666' }
      }
    ]
  };
}

module.exports = {
  toWordCloud,
  toSearchVolume,
  toScatter,
  toCompetitionPie,
  toTrends
};