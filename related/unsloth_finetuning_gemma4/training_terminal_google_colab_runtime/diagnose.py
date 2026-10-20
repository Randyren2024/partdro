"""
诊断 v5 — 跳过 for_inference，直接用原生 generate
"""
import torch, gc

torch.cuda.reset_peak_memory_stats()

from unsloth import FastLanguageModel

print("Loading google/gemma-2-2b-it (real-time 4-bit, no for_inference)...")
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="google/gemma-2-2b-it",
    max_seq_length=2048, dtype=None, load_in_4bit=True,
)
vram = torch.cuda.memory_allocated() / 1024**3
print(f"VRAM after load: {vram:.1f} GB")

# Skip for_inference — use native generate
model.eval()

# Test: text completion (simple)
print("\n=== Text completion ===")
ids = tokenizer.encode("The capital of France is", add_special_tokens=False, return_tensors="pt").to("cuda")
out = model.generate(ids, max_new_tokens=20, do_sample=False, use_cache=True, pad_token_id=tokenizer.eos_token_id)
print(f"→ [{tokenizer.decode(out[0][len(ids[0]):], skip_special_tokens=True)}]")

# Test: chat format (manual)
print("\n=== Chat format (manual) ===")
prompt = "<bos><start_of_turn>user\nWhat is 1+1?<end_of_turn>\n<start_of_turn>model\n"
ids2 = tokenizer.encode(prompt, add_special_tokens=False, return_tensors="pt").to("cuda")
out2 = model.generate(ids2, max_new_tokens=30, do_sample=False, use_cache=True, pad_token_id=tokenizer.eos_token_id)
new = out2[0][len(ids2[0]):]
print(f"Tokens: {new.tolist()}")
print(f"A: [{tokenizer.decode(new, skip_special_tokens=True)}]")

# Test: Chinese chat
print("\n=== Chinese chat ===")
prompt3 = "<bos><start_of_turn>user\n你好，请用中文回复。1+1等于几？<end_of_turn>\n<start_of_turn>model\n"
ids3 = tokenizer.encode(prompt3, add_special_tokens=False, return_tensors="pt").to("cuda")
out3 = model.generate(ids3, max_new_tokens=60, do_sample=False, use_cache=True, pad_token_id=tokenizer.eos_token_id)
new3 = out3[0][len(ids3[0]):]
print(f"Tokens: {new3.tolist()}")
print(f"A: [{tokenizer.decode(new3, skip_special_tokens=True)}]")

print(f"\nPeak VRAM: {torch.cuda.max_memory_allocated() / 1024**3:.1f} GB")
