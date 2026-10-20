"""
Gemma 2 (2B) QLoRA 微调 — 终端版
直接从终端运行，无需 Notebook

使用方法：
1. 在 Colab 中创建 Runtime（Runtime → 运行运行时）
2. 在 Colab 终端中运行：
   wget https://raw.githubusercontent.com/你的repo/colab_terminal_train.py
   python colab_terminal_train.py

或者本地运行：
   python scripts/colab_terminal_train.py
"""

import os
import sys
import subprocess
import json

# ============================================================
# 配置区
# ============================================================
DATA_FILE = "gemma_finetune_dataset.jsonl"
MODEL_NAME = "google/gemma-2-2b-it"       # 完整模型 → 实时量化，保留 instruct 能力
MAX_SEQ_LENGTH = 2048
LORA_R = 8
LORA_ALPHA = 8
LORA_DROPOUT = 0
MAX_STEPS = 360
BATCH_SIZE = 1
GRAD_ACCUM = 2
LEARNING_RATE = 2e-4
WARMUP_STEPS = 18
OUTPUT_DIR = "outputs"

# ============================================================
# 步骤 1：检查环境
# ============================================================
def check_environment():
    print("=" * 60)
    print("🔍 检查环境...")
    print("=" * 60)
    
    # 检查 Python 版本
    print(f"Python: {sys.version}")
    
    # 检查 CUDA
    try:
        import torch
        if torch.cuda.is_available():
            print(f"✅ CUDA 可用")
            print(f"   GPU: {torch.cuda.get_device_name(0)}")
            print(f"   显存: {round(torch.cuda.get_device_properties(0).total_memory/1024**3, 1)} GB")
        else:
            print("❌ CUDA 不可用！请确保 Colab Runtime 已开启 GPU")
            return False
    except ImportError:
        print("❌ PyTorch 未安装")
        return False
    
    # 检查数据集
    if not os.path.exists(DATA_FILE):
        print(f"❌ 找不到数据集文件: {DATA_FILE}")
        print(f"   当前目录: {os.getcwd()}")
        print(f"   请上传文件到当前目录")
        return False
    
    file_size = os.path.getsize(DATA_FILE) / 1024
    print(f"✅ 数据集: {DATA_FILE} ({file_size:.1f} KB)")
    
    # 统计条数
    count = sum(1 for _ in open(DATA_FILE, 'r', encoding='utf-8') if _.strip())
    print(f"   数据条数: {count}")
    
    return True


# ============================================================
# 步骤 2：安装依赖
# ============================================================
def install_dependencies():
    print("\n" + "=" * 60)
    print("📦 安装 Unsloth...")
    print("=" * 60)

    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", "unsloth", "-q"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"❌ Unsloth 安装失败: {result.stderr}")
        return False
    print("✅ Unsloth 安装完成")
    return True


# ============================================================
# 步骤 3：加载模型
# ============================================================
def load_model():
    print("\n" + "=" * 60)
    print(f"🚀 加载模型: {MODEL_NAME}")
    print("=" * 60)
    
    from unsloth import FastLanguageModel
    import torch
    
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=MODEL_NAME,
        max_seq_length=MAX_SEQ_LENGTH,
        dtype=None,
        load_in_4bit=True,
    )
    
    print(f"✅ 模型加载完成")
    print(f"   GPU: {torch.cuda.get_device_name(0)}")
    print(f"   显存: {round(torch.cuda.get_device_properties(0).total_memory/1024**3, 1)} GB")
    
    return model, tokenizer


# ============================================================
# 步骤 4：加载数据集
# ============================================================
def load_dataset(tokenizer):
    print("\n" + "=" * 60)
    print("📚 加载数据集...")
    print("=" * 60)
    
    from unsloth.chat_templates import get_chat_template
    from datasets import load_dataset
    
    # 设置 Chat Template
    tokenizer = get_chat_template(
        tokenizer,
        chat_template="gemma",
    )
    
    # 策略：过滤超长样本（避免截断），用 SFTTrainer + train_on_responses_only
    # SFTTrainer 内部 tokenize 文本时带 truncation=True，文本 <= max_seq_length 就不会截断
    # train_on_responses_only 在完整文本上搜索标记，不会被截断干扰
    def formatting_func(examples):
        convos = examples["messages"]
        texts = []
        for convo in convos:
            text = tokenizer.apply_chat_template(
                convo, tokenize=False, add_generation_prompt=False
            )
            # 预检：先用 tokenizer 编码看是否超出 max_seq_length
            encoded = tokenizer(text, add_special_tokens=False)
            if len(encoded["input_ids"]) <= MAX_SEQ_LENGTH:
                texts.append(text)
        return {"text": texts}

    # 加载数据集
    dataset = load_dataset("json", data_files=DATA_FILE, split="train")
    original_count = len(dataset)
    dataset = dataset.map(formatting_func, batched=True, remove_columns=["messages"])

    # 数据过滤统计
    kept = len(dataset)
    removed = original_count - kept
    print(f"✅ 数据集加载完成: {kept} 条 (原始 {original_count} 条, 过滤 {removed} 条)")

    # 验证：打印第一条样本的 token 化信息
    print(f"\n{'='*60}")
    print("🔬 数据验证")
    print(f"{'='*60}")
    sample_text = dataset[0]["text"]
    sample_encoded = tokenizer(sample_text, add_special_tokens=False)
    print(f"   样本 0: {len(sample_encoded['input_ids'])} tokens")

    # 检查 assistant 标记是否在文本中
    marker = "<start_of_turn>model\n"
    if marker in sample_text:
        pos = sample_text.index(marker)
        print(f"   ✅ '{marker.strip()}' 标记存在于位置 {pos}")
        # 显示标记前 50 字和标记后 50 字
        print(f"   标记前: ...{sample_text[max(0,pos-30):pos]}...")
        print(f"   标记后: ...{sample_text[pos+len(marker):pos+len(marker)+80]}...")
    else:
        print(f"   ⚠️ '{marker.strip()}' 标记不存在！")

    # 统计 token 长度分布
    lengths = []
    for i in range(min(10, len(dataset))):
        enc = tokenizer(dataset[i]["text"], add_special_tokens=False)
        lengths.append(len(enc["input_ids"]))
    print(f"   前 10 条 token 分布: min={min(lengths)}, max={max(lengths)}, avg={sum(lengths)//len(lengths)}")

    return dataset, tokenizer


# ============================================================
# 步骤 5：配置 LoRA
# ============================================================
def configure_lora(model):
    print("\n" + "=" * 60)
    print("🔧 配置 LoRA...")
    print("=" * 60)
    
    from unsloth import FastLanguageModel
    
    model = FastLanguageModel.get_peft_model(
        model,
        r=LORA_R,
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj",
        ],
        lora_alpha=LORA_ALPHA,
        lora_dropout=LORA_DROPOUT,
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=3407,
        use_rslora=False,
        loftq_config=None,
    )
    
    model.print_trainable_parameters()
    return model


# ============================================================
# 步骤 6：训练
# ============================================================
def train(model, tokenizer, dataset):
    print("\n" + "=" * 60)
    print("🏋️ 开始训练...")
    print("=" * 60)
    
    from trl import SFTTrainer
    from transformers import TrainingArguments
    from unsloth import is_bfloat16_supported
    from unsloth.chat_templates import train_on_responses_only
    import torch

    # 配置 Trainer — 文本已在 formatting_func 中预过滤，不会触发截断
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=MAX_SEQ_LENGTH,
        dataset_num_proc=2,
        packing=False,
        args=TrainingArguments(
            per_device_train_batch_size=BATCH_SIZE,
            gradient_accumulation_steps=GRAD_ACCUM,
            warmup_steps=WARMUP_STEPS,
            max_steps=MAX_STEPS,
            learning_rate=LEARNING_RATE,
            fp16=not is_bfloat16_supported(),
            bf16=is_bfloat16_supported(),
            logging_steps=10,
            optim="adamw_8bit",
            weight_decay=0.01,
            lr_scheduler_type="cosine",
            seed=3407,
            output_dir=OUTPUT_DIR,
            report_to="none",
        ),
    )

    # 只训练 assistant 回复 — 文本完整无截断，标记搜索可靠
    trainer = train_on_responses_only(
        trainer,
        instruction_part="<start_of_turn>user\n",
        response_part="<start_of_turn>model\n",
    )
    
    print(f"有效 batch: {BATCH_SIZE}×{GRAD_ACCUM}={BATCH_SIZE*GRAD_ACCUM} | 步数: {MAX_STEPS} | lr: {LEARNING_RATE}")
    
    # 记录显存
    gpu_stats = torch.cuda.get_device_properties(0)
    start_mem = round(torch.cuda.max_memory_reserved() / 1024**3, 3)
    max_mem = round(gpu_stats.total_memory / 1024**3, 3)
    print(f"{gpu_stats.name} | {max_mem} GB | 已用 {start_mem} GB")
    
    # 开始训练
    trainer_stats = trainer.train()
    
    # 训练结果
    used = round(torch.cuda.max_memory_reserved() / 1024**3, 3)
    print(f"\n✅ 训练完成!")
    print(f"   final loss: {trainer_stats.metrics['train_loss']:.4f}")
    print(f"   显存峰值: {used} GB / {max_mem} GB ({round(used/max_mem*100,1)}%)")
    
    return trainer


# ============================================================
# 步骤 7：保存模型
# ============================================================
def save_model(model, tokenizer):
    print("\n" + "=" * 60)
    print("💾 保存模型...")
    print("=" * 60)
    
    # LoRA 适配器 (~50 MB)
    model.save_pretrained("gemma4_diary_lora")
    tokenizer.save_pretrained("gemma4_diary_lora")
    print("✅ LoRA 适配器已保存: gemma4_diary_lora/")
    
    # 合并 16-bit 完整模型
    print("⏳ 合并模型为 16-bit...")
    model.save_pretrained_merged("gemma4_diary_merged", tokenizer, save_method="merged_16bit")
    print("✅ 合并模型已保存: gemma4_diary_merged/")
    
    # GGUF (Ollama 本地用) — 跳过，避免 Colab 断网失败
    # model.save_pretrained_gguf("gemma4_diary_gguf", tokenizer, quantization_method="q4_k_m")
    # print("✅ GGUF 已保存: gemma4_diary_gguf/")
    
    print("\n📁 输出目录:")
    for d in ["gemma4_diary_lora", "gemma4_diary_merged", "gemma4_diary_gguf"]:
        if os.path.exists(d):
            size = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fn in os.walk(d) for f in fn) / 1024**2
            print(f"   {d}/ ({size:.1f} MB)")


# ============================================================
# 步骤 8：测试推理
# ============================================================
def test_inference(model, tokenizer):
    print("\n" + "=" * 60)
    print("🧪 测试推理...")
    print("=" * 60)
    
    from unsloth import FastLanguageModel
    import torch
    
    FastLanguageModel.for_inference(model)
    
    test_questions = [
        "我的主要业务有哪些？最近在做什么？",
        "我在Google Ads和SEO方面做了哪些工作？",
        "2025年10月15日那天我做了什么？",
        "我在AI和编程学习上有哪些进展？",
        "我的心态发生了怎样的变化？",
    ]
    
    for q in test_questions:
        messages = [
            {"role": "user", "content": q},
        ]
        inputs = tokenizer.apply_chat_template(
            messages, tokenize=True, add_generation_prompt=True, return_tensors="pt"
        ).to("cuda")
        
        outputs = model.generate(
            input_ids=inputs,
            max_new_tokens=512,
            temperature=0.7,
            do_sample=True,
            use_cache=True,
            pad_token_id=tokenizer.eos_token_id,
        )
        response = tokenizer.decode(outputs[0][len(inputs[0]):], skip_special_tokens=True)
        
        print(f"\n{'='*60}")
        print(f"Q: {q}")
        print(f"{'='*60}")
        print(f"A: {response}")


# ============================================================
# 主函数
# ============================================================
def main():
    print("""
    ╔═══════════════════════════════════════════════════╗
    ║     Gemma 2 (2B) QLoRA 微调 — 终端版             ║
    ║                                                   ║
    ║  模型: unsloth/gemma-2-2b-it-bnb-4bit             ║
    ║  方法: QLoRA 4-bit                                ║
    ║  数据: 984 条 ChatML                              ║
    ║  显存: ~2 GB (T4 15GB 完全够)                     ║
    ║  训练: 360 steps / ~5 分钟                        ║
    ╚═══════════════════════════════════════════════════╝
    """)
    
    # 步骤 1：检查环境
    if not check_environment():
        sys.exit(1)
    
    # 步骤 2：安装依赖
    if not install_dependencies():
        sys.exit(1)
    
    # 步骤 3：加载模型
    model, tokenizer = load_model()
    
    # 步骤 4：加载数据集
    dataset, tokenizer = load_dataset(tokenizer)
    
    # 步骤 5：配置 LoRA
    model = configure_lora(model)
    
    # 步骤 6：训练
    trainer = train(model, tokenizer, dataset)
    
    # 步骤 7：保存模型
    save_model(model, tokenizer)
    
    # 步骤 8：测试推理
    test_inference(model, tokenizer)
    
    print("\n" + "=" * 60)
    print("🎉 全部完成！")
    print("=" * 60)


if __name__ == "__main__":
    main()
