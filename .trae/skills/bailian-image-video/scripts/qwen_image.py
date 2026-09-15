#!/usr/bin/env python3
"""Qwen-Image generation via Alibaba Cloud Bailian (DashScope) HTTP API.

Supports text-to-image and reference-image-guided generation (editing / style transfer).

Usage:
    python3 qwen_image.py --prompt "..." [--ref-image PATH_OR_URL] [--size 1024*1024] [--n 1] [--seed 42] [--output-dir /home/user1102/partdro]

API key is read from ${DASHSCOPE_API_KEY}.
"""

import argparse
import json
import os
import sys
import time
import urllib.request
from pathlib import Path

ENDPOINT = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis"
DEFAULT_MODEL = "qwen-image"  # qwen-image-2.0 not available on this account; qwen-image serves the latest model family
DEFAULT_SIZE = "1024*1024"


def to_data_uri(path_or_url: str) -> str:
    """If a local file is passed, base64-encode it into a data URI. Otherwise return as-is."""
    if path_or_url.startswith(("http://", "https://", "data:")):
        return path_or_url
    p = Path(path_or_url)
    if not p.exists():
        raise FileNotFoundError(f"ref-image not found: {path_or_url}")
    import base64
    mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}.get(
        p.suffix.lower().lstrip("."), "image/jpeg"
    )
    b64 = base64.b64encode(p.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{b64}"


def call_api(prompt: str, model: str, size: str, n: int, seed: int | None,
             ref_image: str | None, api_key: str) -> dict:
    import urllib.request
    import urllib.error

    payload: dict = {
        "model": model,
        "input": {"prompt": prompt},
        "parameters": {"size": size, "n": n},
    }
    if ref_image:
        payload["input"]["ref_image"] = to_data_uri(ref_image)
    if seed is not None:
        payload["parameters"]["seed"] = seed

    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "X-DashScope-Async": "enable",  # async mode is more reliable for any non-trivial request
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        sys.stderr.write(f"HTTP {e.code}: {e.reason}\n{body[:2000]}\n")
        sys.exit(1)


def poll_task(task_id: str, api_key: str, interval: int = 5, max_attempts: int = 60) -> dict:
    """Poll the task until SUCCEEDED / FAILED / UNKNOWN."""
    import urllib.request
    import urllib.error

    query_url = f"https://dashscope.aliyuncs.com/api/v1/tasks/{task_id}"
    for attempt in range(1, max_attempts + 1):
        req = urllib.request.Request(
            query_url,
            headers={"Authorization": f"Bearer {api_key}"},
            method="GET",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        status = data.get("output", {}).get("task_status")
        if status == "SUCCEEDED":
            return data
        if status == "FAILED":
            raise RuntimeError(f"Qwen-Image task FAILED: {data.get('output', {}).get('message')}")
        if status == "UNKNOWN":
            raise RuntimeError(f"Qwen-Image task UNKNOWN (expired or invalid task_id): {task_id}")
        time.sleep(interval)
    raise TimeoutError(f"Qwen-Image task {task_id} did not finish within {max_attempts * interval}s")


def download(url: str, dest: Path) -> Path:
    with urllib.request.urlopen(url, timeout=60) as resp:
        dest.write_bytes(resp.read())
    return dest


def main():
    ap = argparse.ArgumentParser(description="Generate images with Qwen-Image via DashScope.")
    ap.add_argument("--prompt", required=True, help="Text prompt")
    ap.add_argument("--model", default=DEFAULT_MODEL, help=f"Model name (default: {DEFAULT_MODEL})")
    ap.add_argument("--size", default=DEFAULT_SIZE, help=f"Image size W*H (default: {DEFAULT_SIZE})")
    ap.add_argument("--n", type=int, default=1, help="Number of images (default: 1)")
    ap.add_argument("--seed", type=int, default=None, help="Random seed for reproducibility")
    ap.add_argument("--ref-image", default=None, help="Local path or URL for reference image (editing / style transfer)")
    ap.add_argument("--output-dir", default="/home/user1102/partdro", help="Directory to save images")
    ap.add_argument("--poll-interval", type=int, default=5, help="Seconds between polls (default: 5)")
    ap.add_argument("--max-attempts", type=int, default=60, help="Max poll attempts (default: 60)")
    args = ap.parse_args()

    api_key = os.environ.get("DASHSCOPE_API_KEY")
    if not api_key:
        print("ERROR: DASHSCOPE_API_KEY env var is not set.", file=sys.stderr)
        sys.exit(2)

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"[qwen-image] model={args.model} size={args.size} n={args.n}", file=sys.stderr)
    print(f"[qwen-image] prompt: {args.prompt}", file=sys.stderr)

    submit = call_api(
        prompt=args.prompt,
        model=args.model,
        size=args.size,
        n=args.n,
        seed=args.seed,
        ref_image=args.ref_image,
        api_key=api_key,
    )

    task_id = submit.get("output", {}).get("task_id")
    # Normalize the result into a list of image objects. The DashScope API uses
    # `results[]` (text-to-image) and may also surface `images[]` depending on
    # model/region — accept either.
    def extract_images(payload: dict) -> list[dict]:
        out = payload.get("output", {})
        return out.get("results") or out.get("images") or []

    if not task_id:
        # Sync mode returned images directly
        images = extract_images(submit)
        if not images:
            raise RuntimeError(f"No task_id and no images in response: {submit}")
        print(f"[qwen-image] sync mode — {len(images)} image(s) returned", file=sys.stderr)
    else:
        print(f"[qwen-image] task_id={task_id} — polling every {args.poll_interval}s…", file=sys.stderr)
        result = poll_task(task_id, api_key, args.poll_interval, args.max_attempts)
        images = extract_images(result)
        if not images:
            raise RuntimeError(f"Task succeeded but no images: {result}")

    saved = []
    ts = int(time.time())
    for i, img in enumerate(images):
        url = img.get("url")
        if not url:
            continue
        suffix = f"_{i}" if len(images) > 1 else ""
        dest = out_dir / f"qwen_image_{ts}{suffix}.png"
        download(url, dest)
        saved.append(str(dest))
        print(f"[qwen-image] saved: {dest}", file=sys.stderr)

    print(json.dumps({"task_id": task_id, "saved": saved, "count": len(saved)}))


if __name__ == "__main__":
    main()