 实施计划：Google Keywords 数据挖掘与可视化系统
阶段一：项目初始化
步骤 1.1 - 初始化 Node.js 项目
cd "C:\Users\81102\Desktop\partdro\nodejs+echarts"
npm init -y
步骤 1.2 - 安装依赖
npm install express wink-nlp wink-eng-lite-model papaparse echarts
npm install --save-dev nodemon
---
阶段二：项目结构
创建以下文件结构：
nodejs+echarts/
├── package.json
├── server.js                 # Express 服务器
├── data/
│   └── keywords.csv          # 原始关键词数据
├── src/
│   ├── parser/
│   │   └── csvParser.js      # CSV 解析模块
│   ├── nlp/
│   │   └── analyzer.js       # Wink-NLP 分析模块
│   └── charts/
│       └── chartData.js      # ECharts 数据转换
├── public/
│   ├── index.html            # 前端页面
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js           # 前端交互逻辑
└── data-import/
    └── import.js             # CSV 导入脚本
---
### 阶段三：核心模块实现
#### 3.1 CSV 解析 (csvParser.js)
- 使用 papaparse 解析 CSV
- 数据清洗：处理空值、编码问题
- 输出标准化 JSON
#### 3.2 Wink-NLP 分析 (analyzer.js)
- **实体识别**：提取品牌 (DJI, XAG, Joyance) 和型号 (T40, P100, V40)
- **词频统计**：分词、去除停用词、词频排序
- **意图分类**：购买型/信息型/品牌型
- **聚类分析**：相似关键词分组
#### 3.3 ECharts 数据转换 (chartData.js)
- 转换为 ECharts 兼容的数据格式
- 支持图表联动
---
阶段四：前端可视化
图表 1 - 词云图：关键词词频
图表 2 - 柱状图：TOP 20 产品型号搜索量
图表 3 - 散点图：搜索量 vs 竞争度 (气泡=出价)
图表 4 - 饼图：竞争度分布
图表 5 - 表格：详细关键词列表 (可排序/筛选)
联动逻辑：
- 点击柱状图的 "DJI Agras T40" → 散点图高亮 + 表格筛选相关词
- 点击饼图的 "High" → 其他图表筛选高竞争度数据
---
阶段五：数据更新机制
5.1 CSV 导入
node data-import/import.js "新CSV文件路径"
5.2 API 接口
- GET /api/keywords - 获取所有关键词
- GET /api/analysis/entities - 实体分析结果
- GET /api/analysis/trends - 趋势分析
- POST /api/import - 导入新 CSV
---
阶段六：运行与部署
# 开发模式
npm run dev
# 服务器: http://localhost:4000
---
❓ 确认问题
在开始实施前，请确认：
1. 端口选择：4000 端口可以吗？ (partdro_vue 用 3000)
2. 数据源：现有的 CSV 文件路径是 google keywords/Keyword Stats 2026-05-13 at 10_11_13.csv，需要复制到 data/ 目录吗？
3. 样式偏好：深色主题还是浅色主题？