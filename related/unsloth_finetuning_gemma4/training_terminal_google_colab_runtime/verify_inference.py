"""
快速验证 — 贪婪解码 vs 随机采样
在 Colab 现有 notebook 最后加一个 cell，粘贴运行即可
"""
import torch
from unsloth import FastLanguageModel
from peft import PeftModel
from unsloth.chat_templates import get_chat_template

# 加载模型（如果已经在内存中，这步会很快）
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/gemma-2-2b-it-bnb-4bit",
    max_seq_length=2048, dtype=None, load_in_4bit=True,
)
model = PeftModel.from_pretrained(model, "gemma4_diary_lora")
tokenizer = get_chat_template(tokenizer, chat_template="gemma")
FastLanguageModel.for_inference(model)

question = "我的主要业务有哪些？最近在做什么？"

inputs = tokenizer.apply_chat_template(
    [{"role": "user", "content": question}],
    tokenize=True, add_generation_prompt=True, return_tensors="pt"
).to("cuda")

# === 贪婪解码 ===
print("=" * 60)
print("贪婪解码 (do_sample=False)")
print("=" * 60)
outputs = model.generate(input_ids=inputs, max_new_tokens=300, do_sample=False, use_cache=True)
print(tokenizer.decode(outputs[0][len(inputs[0]):], skip_special_tokens=True))

# === 采样 (temperature=0.7) ===
print("\n" + "=" * 60)
print("随机采样 (temperature=0.7)")
print("=" * 60)
outputs = model.generate(input_ids=inputs, max_new_tokens=300, temperature=0.7, do_sample=True, use_cache=True)
print(tokenizer.decode(outputs[0][len(inputs[0]):], skip_special_tokens=True))

# === 采样 (temperature=0.2) ===
print("\n" + "=" * 60)
print("低温度采样 (temperature=0.2)")
print("=" * 60)
outputs = model.generate(input_ids=inputs, max_new_tokens=300, temperature=0.2, do_sample=True, use_cache=True)
print(tokenizer.decode(outputs[0][len(inputs[0]):], skip_special_tokens=True))
