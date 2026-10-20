"""
验证 LoRA — 使用正确的 chat template 格式
"""
import subprocess, sys
subprocess.run([sys.executable, "-m", "pip", "install", "transformers==4.51.3", "--force-reinstall", "-q"])

import torch
from unsloth import FastLanguageModel
from unsloth.chat_templates import get_chat_template

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/gemma-2-2b-it-bnb-4bit",
    max_seq_length=2048, dtype=None, load_in_4bit=True,
)
tokenizer = get_chat_template(tokenizer, chat_template="gemma")

def ask(desc, mdl, q, max_tok=30):
    inputs = tokenizer.apply_chat_template(
        [{"role": "user", "content": q}],
        tokenize=True, add_generation_prompt=True, return_tensors="pt"
    ).to("cuda")
    out = mdl.generate(input_ids=inputs, max_new_tokens=max_tok, do_sample=False, use_cache=True)
    resp = tokenizer.decode(out[0][len(inputs[0]):], skip_special_tokens=True)
    print(f"\n=== {desc} ===")
    print(f"Q: {q}")
    print(f"A: {resp}")

FastLanguageModel.for_inference(model)
ask("无 LoRA", model, "What is the capital of France?")

from peft import PeftModel
model = PeftModel.from_pretrained(model, "gemma4_diary_lora")
FastLanguageModel.for_inference(model)
ask("LoRA (greedy)", model, "What is the capital of France?", max_tok=5)
ask("LoRA (greedy, more tokens)", model, "我的主要业务有哪些？", max_tok=100)

# LoRA 权重范数
total = sum(p.data.norm().item() for n, p in model.named_parameters() if "lora" in n)
print(f"\nLoRA 总范数: {total:.1f} — {'有效' if total > 0.1 else '可能异常'}")
