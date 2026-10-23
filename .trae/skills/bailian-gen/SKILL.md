---
name: "bailian-gen"
description: "用百炼 CLI 生成图像和视频：文生图、按指令改图、文生视频、图生视频、首尾帧、多主体参考视频，含异步任务轮询与下载。用户要出图、出视频、做产品图/演示片、批量生成素材时使用。"
---

# 百炼生成：图像与视频

命令都在 `bl image` / `bl video` 下，全部需要 API Key（`bl auth status` 显示 `sk-...` 即可）。

## 图像生成

```bash
# 文生图（同步，直接下载到目录）
bl image generate \
  --prompt "工业级四旋翼清洗无人机悬停在高空玻璃幕墙前，晨光，写实摄影" \
  --model qwen-image-3.0 \
  --size 16:9 \
  --n 1 \
  --out-dir ./out

# 可复现：固定种子
bl image generate --prompt "..." --seed 42 --out-dir ./out

# 排除不想要的元素
bl image generate --prompt "..." --negative-prompt "文字, 水印, 卡通"

# 批量并发（一次 6 张上限，--concurrent 控制并行）
bl image generate --prompt "..." --n 6 --concurrent 3 --out-dir ./out

# 只要任务 ID，不等结果
bl image generate --prompt "..." --async
```

关键参数：
- `--size`：比例（`3:4` / `16:9` / `1:1`）或像素（`2048*2048`）。
- `--n`：单次最多 **6**。
- `--watermark false`：去掉水印（默认 true）。
- `--prompt-extend`：缺省时同步模型默认开启。

```bash
# 按指令改图
bl image edit --image <输入图url或路径> --prompt "把背景换成户外草地，保持机身不变"
```

## 视频生成

```bash
# 文生视频（等完成并直接落盘）
bl video generate \
  --prompt "无人机在葡萄园上方低空匀速喷洒，镜头跟拍，纪实风格" \
  --model wan3.0-video \
  --resolution 1080P \
  --ratio 16:9 \
  --duration 5 \
  --download ./out/demo.mp4

# 图生视频
bl video generate --prompt "..." --image <首帧url> --download ./out/i2v.mp4

# 首尾帧（首图 + 尾图，控制运动终点）
bl video generate --prompt "..." --image <首帧> --last-frame <尾帧> --download ./out/kf2v.mp4

# 参考图视频（多主体 / 多镜头 + 配音）
bl video ref --prompt "..." --file <参考图或路径>
```

异步流程（视频耗时通常几十秒到几分钟，批量时必用）：

```bash
bl video generate --prompt "..." --async          # 返回 task id
bl video task get <task-id>                       # 查状态
bl video download <task-id> --download ./out.mp4  # 完成后下载
```

其他：
- `--resolution`：`720P` / `1080P`（默认 1080P）。
- `--duration`：默认 5 秒。
- `--file`：文件/本地路径输入，仅 `wan3.0-video` 支持，且与 `--image`/`--last-frame` 互斥。
- `bl video edit`：风格迁移、物体替换等编辑操作。

## 视频理解（反向用途）

```bash
bl vision describe --image <视频url> --prompt "逐段描述画面与运镜"
```

## 成本与节奏控制

| 动作 | 建议 |
|---|---|
| 先验证提示词效果 | 用 `--n 1` + 低分辨率/短时长跑一条，确认后再批量 |
| 批量出图 | `--concurrent 2~3`，再高容易触发限流 |
| 批量出视频 | 一律 `--async`，拿 task id 后统一轮询，避免长时间阻塞 |
| 需要复现同一张图 | 记下 `--seed` 与完整 `--prompt` |

## 常见坑

- 输出里的 `[UNDICI-EHPA] Warning` 是代理提示，可忽略。
- `--download` 的父目录不存在时可能失败，先 `mkdir -p`。
- 中英文提示词都行，但**具体名词 + 场景 + 光线 + 风格**比形容词堆砌更有效。
- 图生视频时，首帧图片建议同比例（与 `--ratio` 一致），否则会被裁切。
- 生成的文件在远程沙箱里，若要给用户看，需要放到 `/workspace` 下的可见目录。
