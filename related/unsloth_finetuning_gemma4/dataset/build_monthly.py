#!/usr/bin/env python3
"""
将日报按月份拆分为独立的 .md 文件，解决 Dify 批量导入触发 API 限流的问题。

输出目录: dataset/monthly/
文件命名: 2025_02.md, 2025_03.md, ...

每个文件结构:
# 2025年2月 日报
#### 2025.02.08
- 条目1
- 条目2
#### 2025.02.10
- ...

Dify 分段建议: 用 #### 作为分段分隔符，每月文件可单独上传。
"""

import re
import os
from pathlib import Path
from collections import defaultdict

# ══════════════════════════════════════════════════
# 0. 配置
# ══════════════════════════════════════════════════

BASE_DIR = Path(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = BASE_DIR / "monthly"
YEAR_DIRS = {
    2025: BASE_DIR / "2025年 日报",
    2026: BASE_DIR / "2026年 日报",
}

# ══════════════════════════════════════════════════
# 1. 脱敏
# ══════════════════════════════════════════════════

PHONE_RE = re.compile(r'1[3-9]\d{9}')
ID_CARD_RE = re.compile(r'\d{17}[\dXx]')
ADDR_RE = re.compile(
    r'(?:[\u4e00-\u9fff]{2,6}(?:省|自治区))?'
    r'[\u4e00-\u9fff]{2,10}(?:市|区|县|镇)'
    r'[\u4e00-\u9fff]{2,20}(?:路|街|道|巷|弄|村)'
    r'[\u4e00-\u9fff\d\-]{1,20}(?:号|栋|楼|室|房)'
)

def redact_sensitive(text):
    text = PHONE_RE.sub("[PHONE]", text)
    text = ID_CARD_RE.sub("[ID]", text)
    text = ADDR_RE.sub("[ADDR]", text)
    return text


# ══════════════════════════════════════════════════
# 2. 解析
# ══════════════════════════════════════════════════

def parse_journals():
    """返回 { year: { month: { day: [entries] } } }"""
    data = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

    for year, year_dir in YEAR_DIRS.items():
        if not year_dir.exists():
            continue

        for txt_file in sorted(year_dir.glob("*.txt")):
            stem = txt_file.stem
            parts = stem.split(".")
            if len(parts) != 3:
                continue
            try:
                y, m, d = int(parts[0]), int(parts[1]), int(parts[2])
            except ValueError:
                continue
            if y != year:
                continue

            raw_text = txt_file.read_text(encoding="utf-8").strip()
            if not raw_text:
                continue

            raw_text = redact_sensitive(raw_text)

            entries = []
            current_entry_lines = []

            for line in raw_text.split("\n"):
                stripped = line.strip()
                if not stripped:
                    if current_entry_lines:
                        entry_text = " ".join(current_entry_lines)
                        entry_text = re.sub(r'^\*{1,2}\s*', '', entry_text).strip()
                        if entry_text:
                            entries.append(entry_text)
                        current_entry_lines = []
                    continue

                if re.match(r'^\*{1,2}(?!\*)', stripped):
                    if current_entry_lines:
                        entry_text = " ".join(current_entry_lines)
                        entry_text = re.sub(r'^\*{1,2}\s*', '', entry_text).strip()
                        if entry_text:
                            entries.append(entry_text)
                    current_entry_lines = [stripped]
                else:
                    if current_entry_lines:
                        current_entry_lines.append(stripped)

            if current_entry_lines:
                entry_text = " ".join(current_entry_lines)
                entry_text = re.sub(r'^\*{1,2}\s*', '', entry_text).strip()
                if entry_text:
                    entries.append(entry_text)

            if entries:
                data[y][m][d] = entries

    return data


# ══════════════════════════════════════════════════
# 3. 生成月度 md
# ══════════════════════════════════════════════════

def month_to_emoji(month):
    """月份 → emoji (仅装饰用)"""
    emoji_map = {
        1: "1月 ❄️", 2: "2月 🎐", 3: "3月 🌱",
        4: "4月 🌸", 5: "5月 🌿", 6: "6月 ☀️",
        7: "7月 🔥", 8: "8月 🌊", 9: "9月 🍂",
        10: "10月 🍁", 11: "11月 🌬️", 12: "12月 🎄",
    }
    return emoji_map.get(month, f"{month}月")


def generate_monthly_file(year, month, month_data):
    """生成单月 md 内容"""
    lines = []
    days = len(month_data)
    total_entries = sum(len(e) for e in month_data.values())

    lines.append(f"# {year}年{month}月 日报")
    lines.append("")
    lines.append(f"> {days}天记录 · {total_entries}条内容")
    lines.append("")

    for day in sorted(month_data.keys()):
        entries = month_data[day]
        date_str = f"{year}.{month:02d}.{day:02d}"
        lines.append(f"#### {date_str}")

        for entry in entries:
            safe_entry = entry.replace("|", "\\|")
            lines.append(f"- {safe_entry}")

        lines.append("")

    return "\n".join(lines)


# ══════════════════════════════════════════════════
# 4. 主流程
# ══════════════════════════════════════════════════

def main():
    print("=" * 60)
    print("Split Journals into Monthly Markdown Files")
    print("=" * 60)

    print("\n[1/3] Parsing all journals...")
    data = parse_journals()

    total_months = sum(len(year_data) for year_data in data.values())
    total_days = sum(
        len(month_data)
        for year_data in data.values()
        for month_data in year_data.values()
    )
    print(f"  [OK] {total_days} days across {total_months} months")

    print(f"\n[2/3] Creating output directory: {OUTPUT_DIR}")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("\n[3/3] Generating monthly files:")

    generated_files = []
    for year in sorted(data.keys()):
        for month in sorted(data[year].keys()):
            month_data = data[year][month]
            filename = f"{year}_{month:02d}.md"
            filepath = OUTPUT_DIR / filename

            content = generate_monthly_file(year, month, month_data)
            filepath.write_text(content, encoding="utf-8")

            days = len(month_data)
            size_kb = filepath.stat().st_size / 1024
            chunk_estimate = days  # 一个 #### = 一个 chunk，即一天

            print(f"    {filename}  |  {days:2d}天  |  {size_kb:5.1f}KB  |  ~{chunk_estimate}个Dify分段")

            generated_files.append((filename, days, size_kb, chunk_estimate))

    # 汇总
    total_size = sum(f[2] for f in generated_files)
    max_chunks = max(f[3] for f in generated_files)

    print("\n" + "=" * 60)
    print(f"Done! {len(generated_files)} files in {OUTPUT_DIR}")
    print(f"  Total size: {total_size:.0f} KB")
    print(f"  Max chunks per file: {max_chunks} (safe for rate limits)")
    print("")
    print("Dify import:")
    print("  1. Upload one file at a time")
    print("  2. Chunk by: '####' (custom separator)")
    print("  3. Each '#### 2025.02.08' = one chunk = one day")
    print("=" * 60)


if __name__ == "__main__":
    main()
