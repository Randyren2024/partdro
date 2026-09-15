# HappyHorse Video API Reference

HappyHorse-1.0 is Alibaba ATH's video generation model — top-ranked on Artificial Analysis Video Arena at launch. Served via Bailian DashScope **async-only** endpoints.

## Endpoints

**Submit** (always async):
```
POST https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis
```

**Poll** (query task):
```
GET https://dashscope.aliyuncs.com/api/v1/tasks/{task_id}
```

Required headers on submit:
- `Authorization: Bearer ${DASHSCOPE_API_KEY}`
- `Content-Type: application/json`
- `X-DashScope-Async: enable` (MANDATORY — sync calls will fail)

## Models by mode

| Mode | Model name | Input |
|---|---|---|
| `t2v` (text-to-video) | `happyhorse-1.0-t2v` | prompt only |
| `i2v` (image-to-video) | `happyhorse-1.0-i2v` | prompt + 1 reference image |
| `r2v` (reference-to-video) | `happyhorse-1.0-r2v` | prompt + 1-9 reference images |

## Request body — T2V

```json
{
  "model": "happyhorse-1.0-t2v",
  "input": { "prompt": "A golden retriever running on a sunny beach, slow motion" },
  "parameters": {
    "resolution": "1080P",
    "ratio": "16:9",
    "duration": 5,
    "watermark": true,
    "seed": 12345
  }
}
```

## Request body — R2V (multi-image with character pointers)

```json
{
  "model": "happyhorse-1.0-r2v",
  "input": {
    "prompt": "[Image 1]中的女孩走进[Image 2]中的咖啡馆，镜头从街景缓缓推入门内",
    "media": [
      { "type": "reference_image", "url": "https://.../girl.jpg" },
      { "type": "reference_image", "url": "https://.../cafe.jpg" }
    ]
  },
  "parameters": { "resolution": "720P", "ratio": "16:9", "duration": 5 }
}
```

**Prompt rules for R2V:**
- Reference images by their position: `[Image 1]`, `[Image 2]`, etc. — order matches `media[]` order.
- Always describe which object in the image: `[Image 1]中的女孩`, not just `[Image 1]`.
- 1-9 reference images per request.

### Reference image constraints
- Formats: JPEG / JPG / PNG / WEBP
- Short side ≥ 400 px (720P+ recommended)
- Max file size: 20 MB
- Public HTTP(S) URL or `data:image/{mime};base64,...`

## Parameters

| Param | Type | Default | Range / Values |
|---|---|---|---|
| `resolution` | string | `1080P` | `720P`, `1080P` |
| `ratio` | string | `16:9` | `9:16`, `3:4`, `4:3`, `4:5`, `5:4`, `1:1`, `9:21`, `21:9` |
| `duration` | int | `5` | `3`–`15` (seconds) |
| `watermark` | bool | `true` | Adds "Happy Horse" mark to bottom-right corner |
| `seed` | int | random | `0`–`2147483647`. Same prompt + seed → ~same video |

## Lifecycle

| Status | Meaning |
|---|---|
| `PENDING` | Queued |
| `RUNNING` | Processing |
| `SUCCEEDED` | Done — `video_url` present |
| `FAILED` | Error — `code` and `message` present |
| `CANCELED` | Canceled |
| `UNKNOWN` | task_id invalid or expired (>24h) |

Typical wall time: **1-5 minutes**. Recommend polling every 15s.

## SUCCEEDED response

```json
{
  "output": {
    "task_id": "...",
    "task_status": "SUCCEEDED",
    "submit_time": "2026-06-12 10:00:00.000",
    "end_time":    "2026-06-12 10:03:25.123",
    "video_url":   "https://dashscope-result.oss-cn-beijing.aliyuncs.com/xxx.mp4"
  },
  "usage": { "duration": 5, "output_video_duration": 5, "video_count": 1, "SR": 720, "ratio": "16:9" }
}
```

⚠️ **`video_url` expires after 24 hours** — always download immediately and save locally.

## Common errors

| Code | Meaning |
|---|---|
| `InvalidApiKey` | Missing/expired key |
| `InvalidParameter` | Bad resolution/ratio/duration or malformed media[] |
| `QuotaExceeded` / `Arrearage` | Account overdue — top up at https://bailian.console.aliyun.com/ |
| `AccessDenied.Unpurchased` | **HappyHorse is a paid commercial model** — separate subscription required, not enabled by default. Direct user to Bailian console → Model Marketplace → HappyHorse → 购买. |
| Content moderation blocked | Prompt or ref image flagged — soften and retry |

## Prompting tips for HappyHorse

HappyHorse is **strong at multi-shot narrative** — describe camera moves explicitly:
- "镜头从侧面中景缓缓推至面部特写"
- "切至俯拍视角"
- "推近，定格在…"

Camera verbs that work well: 推近, 拉远, 摇镜, 切, 特写, 俯拍, 仰拍, 侧拍, 跟拍.