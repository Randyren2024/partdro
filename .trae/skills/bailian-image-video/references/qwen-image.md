# Qwen-Image API Reference

Qwen-Image is Alibaba's text-to-image and image-editing model family, served via the Bailian DashScope `image-synthesis` endpoint.

## Endpoint

```
POST https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis
```

Required headers:
- `Authorization: Bearer ${DASHSCOPE_API_KEY}`
- `Content-Type: application/json`
- `X-DashScope-Async: enable` (recommended — async mode is more reliable for any non-trivial request)

## Models

| Model | Notes |
|---|---|
| `qwen-image` | **Recommended default.** Currently serves Qwen-Image-2.0 weights on Bailian. |
| `qwen-image-2.0` | Explicit model ID — requires model-marketplace enablement, may 400 (`url error`) on accounts that haven't opted in. Prefer `qwen-image`. |

## Request body

```json
{
  "model": "qwen-image",
  "input": {
    "prompt": "A cyberpunk cat with neon whiskers",
    "ref_image": "data:image/png;base64,...."   // OPTIONAL — for editing / style transfer
  },
  "parameters": {
    "size": "1024*1024",
    "n": 1,
    "seed": 42                                    // OPTIONAL — reproducibility
  }
}
```

### `input.prompt`
- Max 5000 non-CJK chars or 2500 CJK chars.
- For Chinese text rendering inside images, keep the visible text to ~4 characters for best accuracy.

### `input.ref_image` (optional)
- Local file → base64-encode into a `data:image/{mime};base64,...` URI.
- Public HTTP(S) URL also accepted.
- Use cases: editing ("add a hat to the subject"), style transfer, character consistency.

### `parameters.size`
Format: `{width}*{height}` (note the asterisk). Common values:
- `1024*1024` (1:1, default)
- `720*1280` (9:16 portrait)
- `1280*720` (16:9 landscape)
- `2048*2048` (high-res — slower, more expensive)

### `parameters.n`
Number of images, 1-4 typical.

### `parameters.seed`
Integer. Same prompt + same seed → same image (mostly — generation is still stochastic at the model level).

## Async response (submit)

```json
{ "output": { "task_id": "abc-123", "task_status": "PENDING" }, "request_id": "..." }
```

## Async response (poll — SUCCEEDED)

```
GET https://dashscope.aliyuncs.com/api/v1/tasks/{task_id}
```

```json
{
  "output": {
    "task_id": "abc-123",
    "task_status": "SUCCEEDED",
    "task_metrics": { "TOTAL": 12.3, "SUCCEED": 12.3 },
    "images": [{ "url": "https://dashscope-result.oss-.../xxx.png" }]
  }
}
```

Image URLs are valid for **24 hours** — download immediately.

## Common errors

| Code | Meaning |
|---|---|
| `InvalidApiKey` | Missing/expired `DASHSCOPE_API_KEY` |
| `InvalidParameter` | Bad model name, size, or unsupported parameter combo |
| `QuotaExceeded` / `Arrearage` | Account overdue or out of credit — top up at https://bailian.console.aliyun.com/ |
| `ContentFiltered` | Prompt or ref image blocked by content moderation |