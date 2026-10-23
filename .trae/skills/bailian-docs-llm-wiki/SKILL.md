---
name: "bailian-docs-llm-wiki"
description: "把本地文档/目录批量灌入阿里云百炼知识库（RAG），并用 knowledge search / chat 做语义检索与问答，形成可持续更新的「LLM 可查 wiki」。用户要建知识库、把文档变成可检索问答、做 RAG、问文档内容、维护文档 wiki 时使用。"
---

# 百炼知识库：文档 → LLM 可查 wiki

用 `bl knowledge` 把本地 Markdown/PDF/Word 等文档变成可语义检索的知识库，再通过检索/问答接口反查。

## 完整链路（四步，顺序不能反）

```bash
# 1) 上传文件或整个目录到「数据中心」（目录会递归扫描，不支持格式自动跳过）
bl knowledge doc upload --file ./docs --tag partdro --output json
#    记下返回的 doc-id（批量时是多个）

# 2) 用 doc-id 建知识库（也可用 --category-id 一次导入某个分类下全部文件）
bl knowledge create \
  --name "Partdro 产品资料" \
  --description "D15R/C500/Y160 产品参数、报价规则与常见问题" \
  --doc-id <doc-id> \
  --chunk-size 600 \
  --wait
```

要点：
- `--name` 限 **1–20 字**，`--description` 限 **1–500 字**，且同 workspace 内 name 唯一。
- `--chunk-size` 默认 600，推荐 300–800；太小会切断语义，太大检索不精准。
- `--wait` 会轮询首次导入任务到终态，脚本里建议加。

```bash
# 3) 查看与维护
bl knowledge list                      # 有哪些知识库
bl knowledge info --index-id <id>      # 配置详情
bl knowledge doc list --index-id <id>  # 文档及其解析/索引状态
bl knowledge doc status --index-id <id> --doc-id <id>   # 导入任务状态
bl knowledge update --index-id <id> --name "新名字"
bl knowledge doc delete --index-id <id> --doc-id <id>
bl knowledge delete --index-id <id>    # 连文档带分块一起删（不可逆）
```

```bash
# 4) 检索与问答
bl knowledge search --query "D15R 的载荷是多少" --agent-id <检索服务ID>
bl knowledge chat   --query "对比 D15R 和 C500 的适用场景" --agent-id <检索服务ID>
```

## 最容易踩的坑：`--agent-id` 不是知识库 ID

`knowledge search` / `knowledge chat` 要的是**控制台「知识检索」页创建的检索服务 ID**，不是 `--index-id`。两者混用会报错或检索不到内容。

如果还没有检索服务：先到百炼控制台 → 知识库 → 知识检索 → 新建检索服务并绑定知识库，再拿那个 ID。

## 判断索引是否真的好了

别只看"创建成功"。按顺序验：

```bash
bl knowledge doc list --index-id <id> --output json   # 每个文档的 parse/index 状态
bl knowledge search --query "<你文档里明确有的事实>" --agent-id <id>
```

检索返回里命中你已知的事实，才算真的可用了。

## 什么时候值得建知识库

- 文档量大（几十份以上）、且会被反复提问 → 值得。
- 只有一两份短文档 → 直接 `bl text chat --message-file` 把正文喂进去更省事，不必建库。
- 文档更新频繁 → 每次更新后要重新 `doc upload` + 导入，索引不会自动跟随文件变化。

## 与本地 wiki 的关系

本项目已有两篇飞书文档（工作日志 + 每日日报）。若要把它们纳入检索：

1. 先用 `lark-cli docs +fetch --doc <url> --as user` 导出 Markdown；
2. 再 `bl knowledge doc upload --file <导出的.md>`；
3. 建库后即可语义检索。

注意飞书文档持续增长，需要定期重新导出覆盖，否则知识库是旧快照。
