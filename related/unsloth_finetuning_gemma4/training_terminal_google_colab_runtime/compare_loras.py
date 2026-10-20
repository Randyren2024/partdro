"""
对比两个 LoRA 模型 — 权重相似度 + 推理质量
在 Colab GPU 运行: python compare_loras.py
"""
import torch, os, json
from unsloth import FastLanguageModel

BASE_MODEL = "unsloth/gemma-4-E4B-it-unsloth-bnb-4bit"
LORA_V1 = "Mermeid/lora_20260506"
LORA_V2 = "Mermeid/new_lora_20260506"
MAX_SEQ = 4096

# ============================================================
# 1. 加载基础模型
# ============================================================
print("Loading base model...")
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=BASE_MODEL, max_seq_length=MAX_SEQ,
    dtype=None, load_in_4bit=True,
)
mem_base = torch.cuda.max_memory_allocated() / 1024**3

# ============================================================
# 2. 加载 LoRA V1
# ============================================================
print(f"\nLoading LoRA v1: {LORA_V1}")
from peft import PeftModel
model_v1 = PeftModel.from_pretrained(model, LORA_V1, adapter_name="v1")
FastLanguageModel.for_inference(model_v1)

# 收集 V1 权重
weights_v1 = {}
for name, param in model_v1.named_parameters():
    if "lora" in name:
        weights_v1[name] = param.data.clone().cpu()

print(f"  V1 LoRA params: {len(weights_v1)} tensors")
mem_v1 = torch.cuda.max_memory_allocated() / 1024**3

# ============================================================
# 3. 加载 LoRA V2
# ============================================================
print(f"\nLoading LoRA v2: {LORA_V2}")
model_v2 = PeftModel.from_pretrained(model, LORA_V2, adapter_name="v2")
model_v2.set_adapter("v2")
FastLanguageModel.for_inference(model_v2)

weights_v2 = {}
for name, param in model_v2.named_parameters():
    if "lora" in name:
        weights_v2[name] = param.data.clone().cpu()

print(f"  V2 LoRA params: {len(weights_v2)} tensors")
mem_v2 = torch.cuda.max_memory_allocated() / 1024**3

# ============================================================
# 4. 权重对比: 余弦相似度
# ============================================================
print("\n" + "=" * 60)
print("Weight Comparison (cosine similarity per layer)")
print("=" * 60)

common_keys = sorted(set(weights_v1.keys()) & set(weights_v2.keys()))
layer_sims = {}
for key in common_keys:
    w1 = weights_v1[key].float().flatten()
    w2 = weights_v2[key].float().flatten()
    cos_sim = torch.dot(w1, w2) / (torch.norm(w1) * torch.norm(w2) + 1e-8)
    layer_sims[key] = cos_sim.item()

# 按模块分组
groups = {}
for k, v in layer_sims.items():
    group = k.split(".lora_")[0]
    groups.setdefault(group, []).append(v)

print(f"\n{'Layer Group':<45} {'Avg Sim':>8} {'Min':>8} {'Max':>8}")
print("-" * 72)
for name, sims in sorted(groups.items()):
    print(f"  {name:<43} {sum(sims)/len(sims):>8.4f} {min(sims):>8.4f} {max(sims):>8.4f}")

overall = sum(layer_sims.values()) / len(layer_sims)
print(f"\n  Overall Avg Cosine Similarity: {overall:.4f}")
print(f"  {'⟶ Very similar (same training config)' if overall > 0.95 else '⟶ Noticeably different (different hyperparams)' if overall > 0.80 else '⟶ Very different trainings'}")

# ============================================================
# 5. 推理对比
# ============================================================
print("\n" + "=" * 60)
print("Inference Comparison (greedy decoding)")
print("=" * 60)

from unsloth.chat_templates import get_chat_template
tokenizer = get_chat_template(tokenizer, chat_template="gemma")

test_questions = [
    "我的主要业务有哪些？最近在做什么？",
    "我在Google Ads和SEO方面做了哪些工作？",
    "2025年10月15日那天我做了什么？",
    "我在AI和编程学习上有哪些进展？",
    "我的心态发生了怎样的变化？",
]

def ask(model, tokenizer, q, label):
    messages = [{"role": "user", "content": q}]
    inputs = tokenizer.apply_chat_template(
        messages, tokenize=True, add_generation_prompt=True, return_tensors="pt"
    ).to("cuda")
    out = model.generate(
        inputs, max_new_tokens=300, do_sample=False,
        use_cache=True, pad_token_id=tokenizer.eos_token_id,
    )
    return tokenizer.decode(out[0][len(inputs[0]):], skip_special_tokens=True)

for q in test_questions:
    print(f"\n{'─'*60}")
    print(f"Q: {q}")

    model_v1.set_adapter("v1")
    FastLanguageModel.for_inference(model_v1)
    a1 = ask(model_v1, tokenizer, q, "V1")
    print(f"\nV1 ({LORA_V1.split('/')[-1]}):")
    print(a1[:500])

    model_v2.set_adapter("v2")
    FastLanguageModel.for_inference(model_v2)
    a2 = ask(model_v2, tokenizer, q, "V2")
    print(f"\nV2 ({LORA_V2.split('/')[-1]}):")
    print(a2[:500])

# ============================================================
# 6. Summary
# ============================================================
print("\n" + "=" * 60)
print("Summary")
print("=" * 60)
print(f"  Base model:     {BASE_MODEL.split('/')[-1]}")
print(f"  V1:             {LORA_V1}")
print(f"  V2:             {LORA_V2}")
print(f"  Weight sim:     {overall:.4f}")
print(f"  VRAM base:      {mem_base:.1f} GB")
print(f"  VRAM peak:      {max(mem_v1, mem_v2):.1f} GB")
print(f"  Common keys:    {len(common_keys)}")
print(f"\n  Files saved:    weights_v1.pt, weights_v2.pt")
torch.save(weights_v1, "weights_v1.pt")
torch.save(weights_v2, "weights_v2.pt")
