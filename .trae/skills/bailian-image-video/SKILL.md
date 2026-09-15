---
name: bailian-image-video
description: Generate images via Qwen-Image and videos via HappyHorse through the Alibaba Cloud Bailian (DashScope) HTTP API. Trigger when users request image or video generation with any of: 百炼, Bailian, DashScope, 通义千问 / Qwen-Image / Qwen 图片, HappyHorse / 快乐小马 / 文生视频 / T2V / I2V / R2V / 参考生视频 / 图生视频. Uses the `DASHSCOPE_API_KEY` secret. Does NOT cover Wan2.x (通义万相) models, generic Qwen LLM chat/text generation, or third-party platforms (ModelScope, PixVerse, etc.).
---

# Bailian Image & Video Generation

Generate images with **Qwen-Image** and videos with **HappyHorse** via the Alibaba Cloud Bailian DashScope HTTP API. Auth comes from the `DASHSCOPE_API_KEY` secret (auto-exported as `${DASHSCOPE_API_KEY}` in bash).

## When to use

Activate on requests like:
- "用百炼生成一张图片…" / "调用 Qwen-Image 画一张…"
- "用 DashScope 生图…" / "百炼文生图"
- "用 HappyHorse 生成视频…" / "快乐小马 文生视频"
- "图生视频…" / "参考生视频…" / "T2V / I2V / R2V"

## When NOT to use

- **Wan2.x / 通义万相** (other image or video models) — different model IDs and endpoints, not covered here
- **Qwen LLM chat** (Qwen-Plus, Qwen-Max, etc.) — use the OpenAI-compatible chat endpoint, not this skill
- **Third-party platforms** (ModelScope, PixVerse, Replicate, etc.)

## Decision tree

```
User request
├─ Mentions image / 图片 / 画图 / T2I? → use scripts/qwen_image.py
│   ├─ Has reference image? → image editing mode (ref_image)
│   └─ Pure text? → text-to-image mode
└─ Mentions video / 视频 / T2V / I2V / R2V? → use scripts/happyhorse.py
    ├─ Has reference image(s)? → use --mode r2v (or i2v if single image)
    └─ Pure text? → use --mode t2v
```

## Procedure

### Step 1: Resolve inputs from the user

Ask only for what is missing:

| Field | Required? | Notes |
|---|---|---|
| `prompt` | always | The text prompt. Be specific — HappyHorse especially rewards camera/shot descriptions. |
| `model` | for image | Default `qwen-image` (currently serves Qwen-Image-2.0 weights on Bailian; explicit `qwen-image-2.0` model ID requires model-marketplace enablement and may not be available on every account). |
| `size` | for image | Default `1024*1024`. Other common: `720*1280`, `1280*720`. **Must use ASCII `*`, not `×` — Chinese full-width × returns `InvalidParameter`.** |
| `ref_image` | optional (image) | Local path or URL. Used for image editing / ref-guided generation. |
| `mode` | for video | `t2v` (default) / `i2v` (single ref image) / `r2v` (1-9 ref images). |
| `ref_images` | for i2v/r2v | Comma-separated local paths or URLs. |
| `ratio` | for video | Default `16:9`. Options: `9:16`, `1:1`, `4:3`, `3:4`, `4:5`, `5:4`, `21:9`, `9:21`. |
| `duration` | for video | Default `5`. Range `3-15` seconds. |
| `resolution` | for video | Default `1080P`. Or `720P` for faster/cheaper. |
| `watermark` | for video | Default `true` ("Happy Horse" corner mark). Set `false` for clean output. |
| `seed` | optional | Integer for reproducibility. |
| `output_dir` | optional | Workspace dir to save into. Default `/home/user1102/partdro`. |

### Step 2: Run the script

Images (sync, ~5-30s):

```bash
python3 /home/user1102/partdro/.trae/skills/bailian-image-video/scripts/qwen_image.py \
  --prompt "A cyberpunk cat with neon whiskers" \
  --size "1024*1024" \
  --output-dir /home/user1102/partdro
```

Images with reference (for editing / style transfer):

```bash
python3 /home/user1102/partdro/.trae/skills/bailian-image-video/scripts/qwen_image.py \
  --prompt "Add a birthday hat to the subject" \
  --ref-image /home/user1102/partdro/photo.jpg \
  --output-dir /home/user1102/partdro
```

Videos (async, 1-5 minutes):

```bash
python3 /home/user1102/partdro/.trae/skills/bailian-image-video/scripts/happyhorse.py \
  --prompt "A golden retriever running on a sunny beach, slow motion" \
  --mode t2v \
  --ratio "16:9" \
  --duration 5 \
  --output-dir /home/user1102/partdro
```

No-watermark variant (clean output for production use):

```bash
python3 /home/user1102/partdro/.trae/skills/bailian-image-video/scripts/happyhorse.py \
  --prompt "..." \
  --mode t2v \
  --ratio "16:9" \
  --watermark false \
  --output-dir /home/user1102/partdro
```

Video from reference images (R2V — multi-character scene, 1-9 ref images):

```bash
python3 /home/user1102/partdro/.trae/skills/bailian-image-video/scripts/happyhorse.py \
  --prompt "[Image 1]中的女孩走进[Image 2]中的咖啡馆，镜头从街景缓缓推入门内" \
  --mode r2v \
  --ref-images "https://example.com/girl.jpg,https://example.com/cafe.jpg" \
  --ratio "16:9" \
  --output-dir /home/user1102/partdro
```

**R2V reference image constraints** (validate before submitting): JPEG/JPG/PNG/WEBP, short side ≥ 400px (720P+ recommended), ≤ 20 MB per file. Public HTTP(S) URL or base64 data URI. Reference images by `[Image 1]`, `[Image 2]` in `media[]` order; **always describe which object in the image**, e.g. `[Image 1]中的女孩`, not just `[Image 1]`.

### Step 3: Deliver results

The script prints the saved file paths on the last line as JSON: `{"saved": ["/home/user1102/partdro/qwen_image_xxx.png", ...]}`. Also include the result in `<deliver-assets>` so the user can see/preview it.

## Output contract

- **Image**: PNG saved to `output-dir/qwen_image_<timestamp>.png`. Always download from the URL — DashScope URLs expire.
- **Video**: MP4 saved to `output-dir/happyhorse_<timestamp>.mp4`. **Always download** — HappyHorse video URLs expire in 24h.
- **Task metadata** (HappyHorse only): prints `task_id`, `submit_time`, `end_time`, `usage`.
- Final deliverable wrapped in `<deliver-assets>` with `<media src="/abs/path" />`.

## Failure handling

| Symptom | Cause | Fix |
|---|---|---|
| `No API-key provided` | Secret not loaded | Re-run via `bash` so `${DASHSCOPE_API_KEY}` resolves. |
| `InvalidParameter` | Bad model name / size / ratio | Check supported values in `references/qwen-image.md` or `references/happyhorse.md`. |
| `quota exhausted` / `insufficient balance` / Bailian returns `Arrearage` | Account overdue | Tell user to top up at Bailian console (https://bailian.console.aliyun.com/). |
| Bailian returns `AccessDenied` with quota info | Model not enabled for this account | User must enable the model in Bailian console first (model marketplace → enable). |
| HappyHorse returns `AccessDenied.Unpurchased` | **HappyHorse video models require a separate paid subscription** (not included by default — they're commercial ATH models) | Direct user to Bailian console → Model Marketplace → HappyHorse → 购买/开通. Note: Qwen-Image works fine without this — only the video side is gated. |
| HappyHorse task `FAILED` with content moderation | Prompt blocked | Suggest a softer rewrite, ask user to approve. |
| Network timeout on video poll | Cold start, queueing | Default poll is 15s × 30 attempts (~7.5min). Re-run if it times out — the task still runs server-side and can be queried by `task_id`. |

If `task_id` is captured on failure, surface it to the user — they (or support) can resume via `GET /api/v1/tasks/{task_id}`.

## Reference

- API details & parameters: `references/qwen-image.md`, `references/happyhorse.md`
- Source: https://help.aliyun.com/zh/model-studio/developer-reference/ (Bailian / Model Studio docs)