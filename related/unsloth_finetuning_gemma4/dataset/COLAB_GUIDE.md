# Google Colab 微调指南 — Gemma 4 数字分身

## 推荐使用：`gemma4_colab_finetune.ipynb`

> ⚠️ `Unsloth_Studio_Colab.ipynb` 会启动一个 Web UI 界面（端口 8888），
> 你在本地打开 `.ipynb` 文件时看到 `localhost 拒绝连接` 是正常的——
> 它需要在 **Google Colab** 的远程 GPU 环境中运行。

---

## 操作步骤

### 第 1 步：准备数据集

确保 `gemma_finetune_dataset.jsonl` 文件已存在（984 条 QA 对）。
如果需要重新生成，运行：

```bash
cd unsloth_finetuning_gemma4/dataset
python build_dataset.py
```

### 第 2 步：上传到 Google Colab

**方法一（推荐）：直接上传文件**
1. 打开 https://colab.research.google.com/
2. 点击 **File → Upload Notebook**
3. 上传 `gemma4_colab_finetune.ipynb`
4. 在 Colab 左侧文件面板中，上传 `gemma_finetune_dataset.jsonl`

**方法二：挂载 Google Drive**
1. 将 `gemma4_colab_finetune.ipynb` 和 `gemma_finetune_dataset.jsonl` 上传到 Google Drive
2. 在 Colab 中打开笔记本
3. 在第一个 cell 添加：
   ```python
   from google.colab import drive
   drive.mount('/content/drive')
   !cp /content/drive/MyDrive/gemma_finetune_dataset.jsonl /content/
   ```

### 第 3 步：设置运行时

1. 点击 **Runtime → Change runtime type**
2. **Hardware accelerator**: 选择 **T4 GPU**（免费）
3. 点击 **Save**

### 第 4 步：按顺序运行所有 Cell

每个 Cell 的功能：

| Cell | 功能 | 预计时间 |
|------|------|---------|
| 1 | 安装 Unsloth | ~2 分钟 |
| 2 | 检查数据集 | ~1 秒 |
| 3 | 加载 Gemma 4 模型 (4-bit) | ~3 分钟 |
| 4 | 加载数据集 + Chat Template | ~30 秒 |
| 5 | 配置 LoRA | ~5 秒 |
| 6 | 配置 Trainer | ~5 秒 |
| 7 | 只训练 assistant 回复 | ~2 秒 |
| 8 | **开始训练** | **~15-25 分钟** |
| 9 | 保存模型 | ~5 分钟 |
| 10 | 测试推理 | ~1 分钟 |

### 第 5 步：下载训练好的模型

训练完成后，在 Colab 左侧文件面板中：
- `gemma4_diary_lora/` — LoRA 适配器 (~50 MB，推荐下载)
- `gemma4_diary_merged/` — 合并后的 16-bit 模型
- `gemma4_diary_gguf/` — GGUF 格式（可用于 Ollama 本地运行）

右键点击 → **Download**

---

## 常见问题

### Q: Colab 断连怎么办？
A: Colab 免费版最长运行 12 小时。建议：
- 在 Cell 8（训练）完成后立即下载 LoRA 适配器
- 或者使用 `gemma4_diary_lora` 目录，它最小（~50 MB）

### Q: 训练 loss 不降怎么办？
A: 笔记本附录有调参指南：
- loss > 1.0：增加 `max_steps = 180`, `lr = 4e-4`
- loss < 0.2（过拟合）：减少 `max_steps = 60`, `lr = 1e-4`
- CUDA OOM：`batch = 1`, `grad_accum = 16`, `seq_len = 256`

### Q: 如何在本地使用训练好的模型？
A: 下载 `gemma4_diary_gguf/` 目录，然后用 Ollama：
```bash
ollama create my-digital-twin -f ./gemma4_diary_gguf
ollama run my-digital-twin
```

---

## 两个笔记本的区别

| 特性 | `gemma4_colab_finetune.ipynb` ✅ | `Unsloth_Studio_Colab.ipynb` |
|------|------|------|
| 方式 | 代码式，按 Cell 运行 | 图形界面 (Web UI) |
| 模型 | Gemma 4 (2B) | 任意模型 |
| 复杂度 | 简单直接 | 需要启动服务 |
| 推荐度 | ⭐⭐⭐ 推荐 | ⭐⭐ |

**建议使用 `gemma4_colab_finetune.ipynb`**，它更稳定、更简单。
