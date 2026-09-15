#!/usr/bin/env python3
"""HappyHorse video generation via Alibaba Cloud Bailian (DashScope) HTTP API.

Supports three modes:
  - t2v: text-to-video
  - i2v: image-to-video (single reference image)
  - r2v: reference-to-video (1-9 reference images + character pointers in prompt)

Usage:
    python3 happyhorse.py --prompt "..." --mode t2v [--ratio 16:9] [--duration 5] [--resolution 1080P] [--output-dir /home/user1102/partdro]

API key is read from ${DASHSCOPE_API_KEY}.
"""

import argparse
import json
import os
import sys
import time
import urllib.request
from pathlib import Path

ENDPOINT = "https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis"
TASK_QUERY = "https://dashscope.aliyuncs.com/api/v1/tasks/{task_id}"

# Model name by mode. The "r2v" variant is the reference-to-video (multi-image) model.
MODEL_BY_MODE = {
    "t2v": "happyhorse-1.0-t2v",
    "i2v": "happyhorse-1.0-i2v",
    "r2v": "happyhorse-1.0-r2v",
}

VALID_RATIOS = {"16:9", "9:16", "3:4", "4:3", "4:5", "5:4", "1:1", "9:21", "21:9"}
VALID_RESOLUTIONS = {"720P", "1080P"}


def to_media_url(path_or_url: str) -> dict:
    """Build a single media item. Accepts HTTP(S) URL or local path → base64 data URI."""
    if path_or_url.startswith(("http://", "https://")):
        return {"type": "reference_image", "url": path_or_url}
    p = Path(path_or_url)
    if not p.exists():
        raise FileNotFoundError(f"ref image not found: {path_or_url}")
    import base64
    mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}.get(
        p.suffix.lower().lstrip("."), "image/jpeg"
    )
    b64 = base64.b64encode(p.read_bytes()).decode("ascii")
    return {"type": "reference_image", "url": f"data:{mime};base64,{b64}"}


def submit(prompt: str, mode: str, ref_images: list[str], ratio: str, duration: int,
           resolution: str, watermark: bool, seed: int | None, api_key: str) -> dict:
    model = MODEL_BY_MODE[mode]
    payload: dict = {
        "model": model,
        "input": {"prompt": prompt},
        "parameters": {
            "resolution": resolution,
            "ratio": ratio,
            "duration": duration,
            "watermark": watermark,
        },
    }
    if ref_images:
        payload["input"]["media"] = [to_media_url(u) for u in ref_images]
    if seed is not None:
        payload["parameters"]["seed"] = seed

    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "X-DashScope-Async": "enable",  # HappyHorse is always async
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def poll(task_id: str, api_key: str, interval: int, max_attempts: int) -> dict:
    url = TASK_QUERY.format(task_id=task_id)
    for attempt in range(1, max_attempts + 1):
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {api_key}"}, method="GET")
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        status = data.get("output", {}).get("task_status")
        if status == "SUCCEEDED":
            return data
        if status == "FAILED":
            out = data.get("output", {})
            raise RuntimeError(f"Video task FAILED ({out.get('code')}): {out.get('message')}")
        if status == "UNKNOWN":
            raise RuntimeError(f"Video task UNKNOWN (expired or invalid): {task_id}")
        elapsed = attempt * interval
        print(f"[happyhorse] attempt {attempt}/{max_attempts} — status={status} ({elapsed}s elapsed)", file=sys.stderr)
        time.sleep(interval)
    raise TimeoutError(f"Video task {task_id} did not finish within {max_attempts * interval}s")


def download(url: str, dest: Path) -> Path:
    with urllib.request.urlopen(url, timeout=300) as resp:
        dest.write_bytes(resp.read())
    return dest


def main():
    ap = argparse.ArgumentParser(description="Generate videos with HappyHorse via DashScope.")
    ap.add_argument("--prompt", required=True, help="Text prompt (use [Image 1], [Image 2]… for r2v)")
    ap.add_argument("--mode", choices=list(MODEL_BY_MODE.keys()), default="t2v",
                    help="t2v (text), i2v (single ref image), r2v (multi ref images)")
    ap.add_argument("--ref-images", default=None,
                    help="Comma-separated local paths or URLs (required for i2v/r2v)")
    ap.add_argument("--ratio", default="16:9", choices=sorted(VALID_RATIOS),
                    help="Aspect ratio (default: 16:9)")
    ap.add_argument("--duration", type=int, default=5, help="Video length in seconds, 3-15 (default: 5)")
    ap.add_argument("--resolution", default="1080P", choices=sorted(VALID_RESOLUTIONS),
                    help="Resolution (default: 1080P)")
    ap.add_argument("--watermark", default="true", choices=["true", "false"],
                    help='Add "Happy Horse" watermark (default: true)')
    ap.add_argument("--seed", type=int, default=None, help="Random seed for reproducibility")
    ap.add_argument("--output-dir", default="/home/user1102/partdro", help="Where to save the MP4")
    ap.add_argument("--poll-interval", type=int, default=15, help="Seconds between polls (default: 15)")
    ap.add_argument("--max-attempts", type=int, default=40,
                    help="Max poll attempts (default: 40 = 10 min)")
    args = ap.parse_args()

    api_key = os.environ.get("DASHSCOPE_API_KEY")
    if not api_key:
        print("ERROR: DASHSCOPE_API_KEY env var is not set.", file=sys.stderr)
        sys.exit(2)

    ref_images = []
    if args.ref_images:
        ref_images = [x.strip() for x in args.ref_images.split(",") if x.strip()]
    if args.mode in ("i2v", "r2v") and not ref_images:
        print(f"ERROR: --mode {args.mode} requires --ref-images", file=sys.stderr)
        sys.exit(2)
    if args.mode == "i2v" and len(ref_images) != 1:
        print("ERROR: --mode i2v requires exactly one --ref-images entry", file=sys.stderr)
        sys.exit(2)
    if args.mode == "r2v" and not (1 <= len(ref_images) <= 9):
        print("ERROR: --mode r2v requires 1-9 --ref-images entries", file=sys.stderr)
        sys.exit(2)
    if not (3 <= args.duration <= 15):
        print("ERROR: --duration must be between 3 and 15", file=sys.stderr)
        sys.exit(2)

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"[happyhorse] mode={args.mode} ratio={args.ratio} duration={args.duration}s "
          f"resolution={args.resolution} watermark={args.watermark}", file=sys.stderr)
    print(f"[happyhorse] prompt: {args.prompt}", file=sys.stderr)
    if ref_images:
        print(f"[happyhorse] {len(ref_images)} reference image(s)", file=sys.stderr)

    submit_resp = submit(
        prompt=args.prompt,
        mode=args.mode,
        ref_images=ref_images,
        ratio=args.ratio,
        duration=args.duration,
        resolution=args.resolution,
        watermark=(args.watermark == "true"),
        seed=args.seed,
        api_key=api_key,
    )

    task_id = submit_resp.get("output", {}).get("task_id")
    if not task_id:
        raise RuntimeError(f"No task_id returned: {submit_resp}")
    print(f"[happyhorse] task_id={task_id}", file=sys.stderr)

    result = poll(task_id, api_key, args.poll_interval, args.max_attempts)
    video_url = result.get("output", {}).get("video_url")
    if not video_url:
        raise RuntimeError(f"Task succeeded but no video_url: {result}")

    ts = int(time.time())
    dest = out_dir / f"happyhorse_{ts}.mp4"
    download(video_url, dest)

    out = result.get("output", {})
    usage = result.get("usage", {})
    summary = {
        "task_id": task_id,
        "mode": args.mode,
        "ratio": out.get("ratio") or usage.get("ratio"),
        "resolution": out.get("resolution") or usage.get("SR"),
        "duration": usage.get("duration") or args.duration,
        "submit_time": out.get("submit_time"),
        "end_time": out.get("end_time"),
        "saved": str(dest),
        "video_url_expires_in": "24h (already downloaded locally)",
    }
    print(json.dumps(summary))


if __name__ == "__main__":
    main()