---
name: nano-banana
description: Generate or edit images using Google Nano Banana Pro (gemini-3-pro-image-preview). Use this skill whenever the user wants to create an image from a text prompt, transform or edit an existing image, or invoke the Nano Banana image generation model. Triggers on requests like "generate an image of...", "create a picture...", "edit this image to...", "nano banana...", "用 nano banana 生成图片", "画一张...", "把这张图改成...".
---

# Nano Banana Pro Image Generation

Generate or edit images via Google's `gemini-3-pro-image-preview` model through the Gemini API.

## How to run

The skill ships a Python script at `scripts/generate.py`. Use it via Bash:

```bash
python scripts/generate.py "<prompt>" [-i <input.png> ...] [-o <output.png>] [--model <model-name>]
```

### Arguments

| Flag | Description |
| --- | --- |
| `prompt` (positional) | Text description of the desired image |
| `-i`, `--image` | Input image path. Repeat to pass multiple images (image-to-image / editing). |
| `-o`, `--out` | Output path (default: `nano_banana_output.png`) |
| `--model` | Override model. Default `gemini-3-pro-image-preview`. Also valid: `gemini-3-pro-image`, `gemini-2.0-flash-exp`. |

## Modes

### 1. Text → Image
No `-i` flag. The model generates from the prompt alone.

```bash
python scripts/generate.py "A tiny banana wearing a space helmet, vibrant digital art"
```

### 2. Image → Image (edit / transform / restyle)
Pass one or more `--image` flags. The model uses them as references and applies the prompt as an edit instruction.

```bash
python scripts/generate.py "Make it sunset with neon glow" -i photo.png -o photo_sunset.png
```

```bash
python scripts/generate.py "Combine these into one product photo on a white background" \
  -i shirt.png -i pants.png -o outfit.png
```

## Workflow

1. Run the script. It prints `Saved: <path>` plus any text the model returned.
2. Show the resulting image to the user (use the `Read` tool on the output path — it accepts PNG/JPG).
3. If the user wants variations, re-run with a refined prompt or different inputs.

## Notes

- API key: the script reads `NANO_BANANA_API_KEY` env var first, then falls back to a hardcoded key bundled with the skill. Override either way.
- The response is multimodal — `TEXT` + `IMAGE`. Text is logged, image is saved to disk.
- If the API returns no image (refusal, safety, parse error), the script exits non‑zero and prints the raw payload to stderr.
- `nano-banana-pro-preview` and `gemini-3-pro-image` are aliases for the same model surface.
