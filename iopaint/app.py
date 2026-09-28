import base64
import io
import os
import tempfile
import time
from pathlib import Path
from flask import Flask, render_template, request, jsonify
from gradio_client import Client, handle_file
from PIL import Image

app = Flask(__name__)

_ENV_FILE = Path(__file__).with_name(".env")
if _ENV_FILE.exists():
    for line in _ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

FLUX_SPACE = "black-forest-labs/FLUX.1-Fill-dev"
QWEN_API_KEY = os.environ.get("QWEN_API_KEY", "")
QWEN_BASE_URL = "https://maas.qianwenaiapi.com/api/v1"

_flux_client = None


def get_flux_client():
    global _flux_client
    if _flux_client is None:
        hf_token = os.environ.get("HF_TOKEN")
        _flux_client = Client(FLUX_SPACE, token=hf_token)
        print(f"[FLUX Fill] 已连接到 Space: {FLUX_SPACE}")
    return _flux_client


def data_uri_to_image(data_uri: str) -> Image.Image:
    if "," in data_uri:
        _, encoded = data_uri.split(",", 1)
    else:
        encoded = data_uri
    return Image.open(io.BytesIO(base64.b64decode(encoded)))


def bytes_to_data_uri(raw: bytes) -> str:
    try:
        fmt = Image.open(io.BytesIO(raw)).format
    except Exception:
        fmt = None
    mime = {"PNG": "png", "WEBP": "webp", "JPEG": "jpg"}.get(fmt, "png")
    b64 = base64.b64encode(raw).decode("ascii")
    return f"data:image/{mime};base64,{b64}"


class _NoProxy:
    """临时清除代理环境变量，避免本地代理未运行导致连接失败。"""

    KEYS = ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy",
            "ALL_PROXY", "all_proxy"]

    def __enter__(self):
        self._saved = {k: os.environ.pop(k, None) for k in self.KEYS}
        return self

    def __exit__(self, *exc):
        for k, v in self._saved.items():
            if v is not None:
                os.environ[k] = v
        return False


def edit_flux(data):
    original_img = data_uri_to_image(data["original_image"]).convert("RGB")
    mask_img = data_uri_to_image(data["mask"])
    prompt = data.get("prompt", "")
    steps = int(data.get("steps", 28))
    guidance = float(data.get("guidance_scale", 30.0))

    if mask_img.mode != "L":
        mask_img = mask_img.convert("L")

    w, h = original_img.size
    mask_img = mask_img.resize((w, h), Image.LANCZOS)

    tmp_dir = tempfile.mkdtemp()
    bg_path = os.path.join(tmp_dir, "background.png")
    mask_path = os.path.join(tmp_dir, "mask.png")
    composite_path = os.path.join(tmp_dir, "composite.png")
    tmp_files = [bg_path, mask_path, composite_path]
    try:
        original_img.save(bg_path, "PNG")
        mask_img.save(mask_path, "PNG")
        original_img.save(composite_path, "PNG")

        input_image = {
            "background": handle_file(bg_path),
            "layers": [handle_file(mask_path)],
            "composite": handle_file(composite_path),
        }

        print(f"[FLUX Fill] 调用: prompt='{prompt}', size={w}x{h}, steps={steps}, guidance={guidance}")

        client = get_flux_client()
        result = client.predict(
            edit_images=input_image,
            prompt=prompt,
            seed=0,
            randomize_seed=True,
            width=w,
            height=h,
            guidance_scale=guidance,
            num_inference_steps=steps,
            api_name="/infer",
        )

        if result is None:
            return {"success": False, "error": "API 返回空结果"}

        img_info, seed = result
        img_path = None
        if isinstance(img_info, dict):
            img_path = img_info.get("path") or img_info.get("url")
        elif isinstance(img_info, str):
            img_path = img_info

        if img_path and os.path.exists(img_path):
            with open(img_path, "rb") as f:
                raw = f.read()
            return {"success": True, "image": bytes_to_data_uri(raw)}

        return {"success": False, "error": "无法获取结果", "raw": str(result)[:500]}
    finally:
        for f in tmp_files:
            if os.path.exists(f):
                try:
                    os.remove(f)
                except:
                    pass


def edit_wanx(data):
    import dashscope
    from dashscope import ImageSynthesis

    dashscope.base_http_api_url = QWEN_BASE_URL

    original_img = data_uri_to_image(data["original_image"]).convert("RGB")
    mask_img = data_uri_to_image(data["mask"])
    prompt = data.get("prompt", "")[:800]

    if mask_img.mode != "L":
        mask_img = mask_img.convert("L")
    w, h = original_img.size
    mask_img = mask_img.resize((w, h), Image.LANCZOS)
    # 万相要求纯白[255,255,255]/纯黑[0,0,0]，二值化消除抗锯齿灰边
    mask_img = mask_img.point(lambda p: 255 if p > 127 else 0)

    if w < 512 or h < 512:
        return {"success": False, "error": "万相2.1 要求图像分辨率不小于 512×512，当前为 {}x{}".format(w, h)}
    if w > 4096 or h > 4096:
        return {"success": False, "error": "万相2.1 要求图像分辨率不大于 4096×4096，当前为 {}x{}".format(w, h)}

    def _uri(im):
        buf = io.BytesIO()
        im.save(buf, format="PNG")
        return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

    base_uri = _uri(original_img)
    mask_uri = _uri(mask_img)
    if len(base_uri) > 10 * 1024 * 1024 or len(mask_uri) > 10 * 1024 * 1024:
        return {"success": False, "error": "图像过大（超过10MB限制），请压缩后重试"}

    print(f"[wanx2.1-imageedit] 局部重绘: prompt='{prompt}', size={w}x{h}")

    with _NoProxy():
        try:
            rsp = ImageSynthesis.call(
                model="wanx2.1-imageedit",
                prompt=prompt,
                task="image2image",
                extra_input={
                    "function": "description_edit_with_mask",
                    "base_image_url": base_uri,
                    "mask_image_url": mask_uri,
                },
                api_key=QWEN_API_KEY,
            )
        except Exception as call_err:
            err = str(call_err)
            if "quota" in err.lower() or "allocation" in err.lower() or "Throttling" in err:
                return {"success": False, "error": "万相免费额度已用完，请切换到 FLUX Fill 模型，或等待额度重置"}
            if "ProxyError" in err or "10061" in err or "Max retries" in err:
                return {"success": False, "error": f"wanx 网络连接失败（代理未开启），请关闭系统代理或切换 FLUX 模型: {err[:300]}"}
            return {"success": False, "error": f"wanx 调用异常: {err[:500]}"}

        if rsp.status_code != 200:
            code = getattr(rsp, "code", "")
            message = getattr(rsp, "message", "")
            hint = ""
            if "arrearage" in str(message).lower() or "quota" in str(message).lower() or "额度" in str(message):
                hint = "（额度/计费问题，请切换到 FLUX Fill 模型）"
            if "balance" in str(message).lower() or "insufficient" in str(message).lower():
                hint = "（余额不足，请充值或切换到 FLUX Fill 模型）"
            return {"success": False, "error": f"wanx 提交失败: status={rsp.status_code}, code={code}, message={message} {hint}"}

        task_id = rsp.output.task_id
        print(f"[wanx2.1-imageedit] 任务已提交: task_id={task_id}")

        for i in range(90):
            time.sleep(1)
            try:
                fetch = ImageSynthesis.fetch(task_id, api_key=QWEN_API_KEY)
                status = getattr(fetch.output, "task_status", "")
                if i % 5 == 0:
                    print(f"[wanx2.1-imageedit] 轮询 #{i+1}: status={status}")

                if status == "SUCCEEDED":
                    url = fetch.output.results[0].url
                    import requests as rq
                    img_resp = rq.get(url, timeout=30)
                    return {"success": True, "image": bytes_to_data_uri(img_resp.content)}

                if status == "FAILED":
                    err = getattr(fetch.output, "message", "") or str(fetch.output)
                    hint = "（若为额度/计费问题，请切换到 FLUX Fill 模型）"
                    return {"success": False, "error": f"wanx 生成失败: {err} {hint}"}

            except Exception as poll_err:
                print(f"[wanx2.1-imageedit] 轮询异常: {poll_err}")
                continue

        return {"success": False, "error": "wanx 生成超时（90秒），请重试"}


@app.after_request
def add_cors(resp):
    """partdro 编辑器从 http://localhost:5173/8888 直连本服务，放开 CORS（含 OPTIONS 预检）"""
    resp.headers.setdefault("Access-Control-Allow-Origin", "*")
    resp.headers.setdefault("Access-Control-Allow-Headers", "Content-Type")
    resp.headers.setdefault("Access-Control-Allow-Methods", "POST, OPTIONS")
    return resp


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/edit", methods=["POST"])
def edit_image():
    try:
        data = request.get_json()
        model = data.get("model", "flux")
        if model == "wanx":
            result = edit_wanx(data)
        else:
            result = edit_flux(data)
        return jsonify(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
