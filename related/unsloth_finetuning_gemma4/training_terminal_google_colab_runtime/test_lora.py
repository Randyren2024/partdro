"""
快速推理测试 — 加载已保存的 LoRA 适配器，测试 5 个问题
在 Colab 直接运行: python test_lora.py
"""
import torch
from unsloth import FastLanguageModel
from peft import PeftModel

MODEL_NAME = "unsloth/gemma-2-2b-it-bnb-4bit"
MAX_SEQ_LENGTH = 2048

print("加载基础模型...")
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=MODEL_NAME,
    max_seq_length=MAX_SEQ_LENGTH,
    dtype=None,
    load_in_4bit=True,
)

print("加载 LoRA 适配器...")
model = PeftModel.from_pretrained(model, "gemma4_diary_lora")

from unsloth.chat_templates import get_chat_template
tokenizer = get_chat_template(tokenizer, chat_template="gemma")

FastLanguageModel.for_inference(model)

test_questions = [
    "我的主要业务有哪些？最近在做什么？",
    "我在Google Ads和SEO方面做了哪些工作？",
    "2025年10月15日那天我做了什么？",
    "我在AI和编程学习上有哪些进展？",
    "我的心态发生了怎样的变化？",
]

print("=" * 60)
print("推理测试")
print("=" * 60)

for q in test_questions:
    messages = [
        {"role": "system", "content": "你是用户的数字分身，基于他2025-2026年间的每日记录训练而成。请根据训练数据如实回答。"},
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
    )
    response = tokenizer.decode(outputs[0][len(inputs[0]):], skip_special_tokens=True)

    print(f"\n{'='*60}")
    print(f"Q: {q}")
    print(f"A: {response}")

print(f"\n{'='*60}")
print("推理测试完成")
print("=" * 60)
