---
name: "bailian-cli"
description: "通过 bl（bailian-cli）命令行调用阿里云百炼 Model Studio / DashScope：文本对话、视觉理解、结构化决策、应用/工作流调用、记忆管理，以及给 Claude Code / Codex 等编码 agent 接上百炼模型。用户提到百炼、DashScope、通义、qwen、bl 命令、把模型接到 CLI 时使用。"
---

# 百炼 CLI（bl / bailian-cli）

阿里云百炼（Model Studio，底层 DashScope）的官方命令行工具。本机已安装并完成 API Key 认证。

## 前置检查（每次调用前先确认）

```bash
bl --version              # 期望 bl 2.5.0 或更高
bl auth status            # 看 API key (model) 是否显示 sk-...
```

- 命令名是 **`bl`**，也接受 `bailian`（同一二进制）。
- 认证来源优先级：环境变量 `DASHSCOPE_API_KEY` > `~/.bailian/config.json`。
- 若提示未认证：`bl auth login --api-key "$DASHSCOPE_API_KEY"`（会校验并写入配置文件）。
- 本项目 key 在 `/workspace/.secrets/partdro.env` 的 `DASHSCOPE_API_KEY`。

## 当前默认端点（2026-10-21 已切换）

```
base_url: https://llm-9v5dueszmhe0o86i.cn-beijing.maas.aliyuncs.com
```

这是百炼 MaaS 专属端点，**聚合 178 个模型**（不止 Qwen 一家）。查看实时清单：

```bash
curl -s -H "Authorization: Bearer $DASHSCOPE_API_KEY" \
  https://llm-9v5dueszmhe0o86i.cn-beijing.maas.aliyuncs.com/compatible-mode/v1/models
```

已验证可用的模型举例：

| 类别 | 模型 ID |
|---|---|
| Qwen 旗舰 | `qwen3.8-max`、`qwen3.8-flash`、`qwen3.7-plus` |
| 第三方 | `deepseek-v4.1-flash`、`deepseek-v4-pro`、`kimi-k3`、`glm-5.3`、`MiniMax/MiniMax-M3.1-Flash`、`stepfun/step-5-preview`、`xiaomi/mimo-v2.6-pro-ultraspeed` |
| 图像 | `qwen-image-3.0`、`qwen-image-2.1-pro`、`wan2.7-image`、`z-image-turbo` |
| 语音 | `qwen3-tts-flash`、`qwen-audio-3.0-realtime-plus`、`fun-asr-flash-*` |
| 向量/重排 | `qwen3.7-text-embedding`、`qwen3.7-text-rerank` |

- 文本与图像生成都在该端点**实测通过**。
- 想临时走别的端点：加 `--base-url <url>`。
- 想切回官方公共端点：`bl auth login --api-key "$DASHSCOPE_API_KEY" --base-url https://dashscope.aliyuncs.com/compatible-mode/v1`。
- CLI 保存配置时会自动去掉 `/compatible-mode/v1` 后缀，属正常。

## 文本对话

```bash
# 单轮
bl text chat --message "用一句话解释 RAG" --model qwen-flash

# 指定系统提示 + 限制长度 + 关闭流式（脚本里更稳）
bl text chat --message "..." --system "你是严谨的技术审校" --max-tokens 800 --model qwen-plus --no-stream

# 多轮（messages 数组文件）
bl text chat --messages-file msgs.json --model qwen-plus
```

要点：
- `--model` 缺省是 `qwen3.8-max`（贵）。**做批量/廉价任务显式指定 `qwen-flash`**。
- 脚本里加 `--output json` 便于解析；`--stream` 在非 TTY 下容易混入控制字符。
- 推理型模型（qwen3/qwq）可加 `--enable-thinking --thinking-budget 4096`。

## 视觉理解

```bash
bl vision describe --image <url或本地路径> --prompt "描述这张图里的设备"
```

## 结构化决策（打分/选择，而非自由文本）

```bash
bl decision --prompt "这条线索的意向强度" --choices "高,中,低"
```

适合需要可解析结果的分类场景（比让模型自由作答再解析更稳）。

## 应用与工作流

```bash
bl app list                       # 需要 Console 登录
bl app call --app-id <id> --input '{"question":"..."}'
```

把百炼控制台里已编排好的 Agent / 工作流当函数调用。

## 记忆（跨会话上下文）

```bash
bl memory add --user-id <uid> --content "客户只接受 FOB 报价"
bl memory search --user-id <uid> --query "报价偏好"
bl memory list --user-id <uid>
```

## 给编码 agent 接百炼

```bash
bl config agent --agent claude-code --region cn-beijing --api-key "$DASHSCOPE_API_KEY" --model qwen3-coder-plus
```

`--agent` 支持 `claude-code | qwen-code | opencode | openclaw | hermes | codex | pi`。

## 配置与更新

```bash
bl config show            # 当前配置
bl config list            # 所有 profile
bl config use <name>      # 切 profile
bl update                 # 升级 CLI
```

## 常见坑

- 输出里带 `[UNDICI-EHPA] Warning` 是实验性代理提示，**不影响结果**，可忽略或 `2>/dev/null`。
- 参数是 `--message`，**不是位置参数**：`bl text chat "你好"` 会报 `Unexpected argument`。
- 中国大陆站点与国际站点 key 不通用；跨境访问若超时，先确认 `--base-url`。
- 认证只覆盖"模型调用"；`app list` 这类控制台接口需要 `bl auth login --console`（浏览器）。
