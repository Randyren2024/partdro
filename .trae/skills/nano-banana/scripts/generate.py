#!/usr/bin/env python
"""Generate or edit images via Google Nano Banana Pro (gemini-3-pro-image-preview)."""
import argparse
import base64
import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

API_KEY = os.environ.get(
    "NANO_BANANA_API_KEY",
    "AQ.Ab8RN6I8YDeXGQ7jp2Zt4kOqU_cKt0yOHE-5FrKhNJbRSnyUCQ",
)
MODEL = "gemini-3-pro-image-preview"
ENDPOINT = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
)
MIME_BY_EXT = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
    "gif": "image/gif",
}


def build_parts(prompt, image_paths):
    parts = []
    if image_paths:
        for path in image_paths:
            ext = Path(path).suffix.lower().lstrip(".")
            mime = MIME_BY_EXT.get(ext, "image/png")
            with open(path, "rb") as f:
                encoded = base64.b64encode(f.read()).decode("ascii")
            parts.append({"inlineData": {"mimeType": mime, "data": encoded}})
    parts.append({"text": prompt})
    return parts


def call_api(prompt, image_paths):
    payload = {
        "contents": [{"role": "user", "parts": build_parts(prompt, image_paths)}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
    }
    req = urllib.request.Request(
        f"{ENDPOINT}?key={API_KEY}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=600) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        sys.stderr.write(f"HTTP {e.code}: {e.reason}\n")
        sys.stderr.write(e.read().decode("utf-8", errors="replace")[:2000])
        sys.exit(1)


def extract_response(result):
    candidates = result.get("candidates") or []
    if not candidates:
        sys.stderr.write("No candidates in response.\n")
        sys.stderr.write(json.dumps(result, indent=2)[:2000])
        sys.exit(1)
    parts = candidates[0].get("content", {}).get("parts", [])
    text_chunks, image_bytes = [], None
    for p in parts:
        if "text" in p:
            text_chunks.append(p["text"])
        if "inlineData" in p:
            image_bytes = base64.b64decode(p["inlineData"]["data"])
    return text_chunks, image_bytes


def main():
    ap = argparse.ArgumentParser(
        description="Generate or edit images via Nano Banana Pro."
    )
    ap.add_argument("prompt", help="Text prompt describing the image")
    ap.add_argument(
        "-i",
        "--image",
        action="append",
        default=[],
        help="Input image path (repeat for multiple). Enables image-to-image mode.",
    )
    ap.add_argument(
        "-o", "--out", default="nano_banana_output.png", help="Output image path"
    )
    ap.add_argument(
        "--model",
        default=MODEL,
        help=f"Model name (default: {MODEL}; alternatives: gemini-3-pro-image, gemini-2.0-flash-exp)",
    )
    args = ap.parse_args()

    result = call_api(args.prompt, args.image or None)
    text_chunks, image_bytes = extract_response(result)

    if image_bytes is None:
        sys.stderr.write("Model returned no image.\n")
        sys.stderr.write(" ".join(text_chunks)[:1000])
        sys.exit(1)

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(image_bytes)

    print(f"Saved: {out.resolve()}  ({len(image_bytes):,} bytes)")
    if text_chunks:
        print(f"Model: {''.join(text_chunks).strip()[:400]}")


if __name__ == "__main__":
    main()
