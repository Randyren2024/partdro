---
name: reddit-data-miner
description: Mines Reddit posts/comments (cleaning-drone market) via PullPush API + Kimi WebBridge and writes insight reports. Invoke when asked to scrape Reddit or dig comment insights.
---

# Reddit Data Miner（清洗无人机市场情报挖掘）

从 Reddit 采集"清洗无人机 / 高空擦窗 / 光伏板清洁"相关帖子与评论，清洗去噪、分层细读，输出可落地的商业情报报告（服务于 Partdro / D15R 产品定位）。

## 何时使用
- 用户要求"挖掘 / 抓取 Reddit 数据"、"分析 Reddit 帖子或评论"
- 需要从评论区提取采购追问、真实车主证言、信任危机信号
- 需要更新 `data/v2_deep/analysis_report.md` 或评论深挖报告

## 数据源与工具
| 工具 | 用途 | 特点 |
|---|---|---|
| PullPush API (`api.pullpush.io`) | 历史帖子 + 评论走量 | 无鉴权；node fetch 会被指纹拦截，**走量用 curl**；评论单页 100，游标分页 |
| Kimi WebBridge (`http://127.0.0.1:10086/command`) | 抓新鲜帖（PullPush 有延迟） | 需先启动浏览器扩展守护进程 |

## 关键文件
| 文件 | 作用 |
|---|---|
| `scripts/collect_v2.mjs` | 主编排：pullpush / webbridge / merge 三阶段 |
| `scripts/collect_pullpush_curl.mjs` | curl 版 PullPush 采集（绕过指纹） |
| `scripts/wb-search-reddit.mjs` / `wb-scrape.mjs` / `wb-brand-queries.mjs` | WebBridge 搜索 / 抓取 / 品牌词 |
| `scripts/clean_posts_v2.py` | 帖子去噪（相关性过滤） |
| `scripts/merge_data.py` | 合并去重 → `merged_posts.json` / `merged_comments.json` |
| `scripts/make_digest.py` | 生成分批细读 digest（含高价值样本） |
| `scripts/fetch-post-comments-pp.mjs` | 单帖评论全量抓取（PullPush link_id） |

## 工作流

### Phase 1 — 帖子采集
```bash
node scripts/collect_v2.mjs --phase all --pages 2 --sleep-ms 4000
# 增量批次（避开已抓索引）
node scripts/collect_pullpush_curl.mjs --from 67 --pages 3
```
- 查询矩阵：EN 核心短语 + 品牌词（Aerones / LucidBots / JIUSI / Apellix / Lavo / Sherpa）+ 子版限定（r/windowcleaning、r/pressurewashing、r/solar…）+ 多语种（es/fr/de）。
- 产物：`data/v2_deep/posts_pullpush.json`、`posts_webbridge.json`、`posts_all.json`。

### Phase 2 — 清洗与合并
```bash
python scripts/clean_posts_v2.py
python scripts/merge_data.py
```

### Phase 3 — 生成 digest
```bash
python scripts/make_digest.py 4
```
输出 `digest_part1..N.txt`（时间倒序压缩行）+ `digest_highvalue.txt`（score≥10 或评论≥10）。

### Phase 4 — 帖子层细读
分批 Read digest，产出 `data/v2_deep/analysis_report.md`。模板见 `references/report-template.md` §A。

### Phase 5 — 评论区金矿
1. 从 `posts_all.json` 按 `num_comments` 排序挑高价值帖。
2. 逐帖抓取评论：
```bash
node scripts/fetch-post-comments-pp.mjs <postId>
```
产物：`data/reddit_post_<id>_comments.json` + `.csv`（按 score 降序）。
3. 聚合：`data/comments_deep.json`、`data/merged_comments.json`。

### Phase 6 — 评论深挖报告
筛选高赞长评（score≥10、去低质短评），提取：
- 真实车主证言 / 全画像
- 真实客户差评与失败案例（如高价设备翻车）
- 从业者技术质疑
- 采购方追问（价格 / ROI / 效率）

输出 `data/v2_deep/comments_deep_analysis.md`。模板见 `references/report-template.md` §B。

## 踩坑速查（硬约束）
- **PullPush 评论 404**：必须用 `link_id=t3_<postId>`，不能直接用帖子 ID。
- **评论量大的帖子**：分页上限设 25 页（100/页），否则丢评论。
- **429 / 5xx**：指数退避（20s × (i+1)），最多 8 次重试。
- **Windows 命令**：用 PowerShell 语法，不要 `ls -la`。
- **node fetch 被拦**：PullPush 走量用 `collect_pullpush_curl.mjs`（curl）。
- **新增抓取批次**：用 `--from <已抓最大索引>` 避免重复。
- **误命中帖**（如 Shahed 军事帖、海滩清理帖）：仍保留文件备查，但分析时不引用其信号。

## 产物清单
`data/v2_deep/{posts_all.json, digest_*.txt, analysis_report.md, comments_deep_analysis.md}`、`data/{comments_deep.json, merged_posts.json, merged_comments.json}`
