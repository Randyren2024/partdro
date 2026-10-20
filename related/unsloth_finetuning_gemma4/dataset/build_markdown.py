#!/usr/bin/env python3
"""
将 2025年日报/ 和 2026年日报/ 下所有 .txt 合并为一个 .md 文件

输出格式:
# 日报记录 (2025-2026)
## 2025年
### 1月
#### 2025.01.01
- 条目1
- 条目2
...

隐私脱敏：手机号→[PHONE] 地址→[ADDR] 身份证→[ID]
"""

import re
import os
from pathlib import Path
from collections import defaultdict

# ══════════════════════════════════════════════════
# 0. 配置
# ══════════════════════════════════════════════════

BASE_DIR = Path(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_FILE = BASE_DIR / "日报全集.md"
YEAR_DIRS = {
    2025: BASE_DIR / "2025年 日报",
    2026: BASE_DIR / "2026年 日报",
}

# ══════════════════════════════════════════════════
# 1. 脱敏正则
# ══════════════════════════════════════════════════

PHONE_RE = re.compile(r'1[3-9]\d{9}')
ID_CARD_RE = re.compile(r'\d{17}[\dXx]')
ADDR_RE = re.compile(
    r'(?:[\u4e00-\u9fff]{2,6}(?:省|自治区))?'
    r'[\u4e00-\u9fff]{2,10}(?:市|区|县|镇)'
    r'[\u4e00-\u9fff]{2,20}(?:路|街|道|巷|弄|村)'
    r'[\u4e00-\u9fff\d\-]{1,20}(?:号|栋|楼|室|房)'
)
URL_RE = re.compile(r'https?://[^\s]+')

def redact_sensitive(text):
    """替换敏感信息为占位符"""
    text = PHONE_RE.sub("[PHONE]", text)
    text = ID_CARD_RE.sub("[ID]", text)
    text = ADDR_RE.sub("[ADDR]", text)
    # URL 保留但可选择性脱敏
    # text = URL_RE.sub("[URL]", text)
    return text


# ══════════════════════════════════════════════════
# 2. 解析所有日报
# ══════════════════════════════════════════════════

def parse_all_journals():
    """
    返回: { year: { month: { day: [content_lines] } } }
    """
    data = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

    for year, year_dir in YEAR_DIRS.items():
        if not year_dir.exists():
            continue

        for txt_file in sorted(year_dir.glob("*.txt")):
            stem = txt_file.stem  # "2025.02.08"
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

            # 脱敏
            raw_text = redact_sensitive(raw_text)

            # 按 * 或 ** 开头的行拆分为条目
            entries = []
            current_entry_lines = []

            for line in raw_text.split("\n"):
                stripped = line.strip()
                if not stripped:
                    # 空行视为条目分隔
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
# 3. 生成 Markdown
# ══════════════════════════════════════════════════

def generate_markdown(data):
    """将结构化数据转为 Markdown 字符串"""
    lines = []

    # 总天数统计
    total_days = sum(
        sum(len(month_data) for month_data in year_data.values())
        for year_data in data.values()
    )

    lines.append("# 日报记录 (2025-2026)")
    lines.append("")
    lines.append(f"> 共收录 **{total_days}篇** 日报，涵盖业务思考、心理状态、技术探索和个人生活。")
    lines.append("")
    lines.append("---")

    for year in sorted(data.keys()):
        year_data = data[year]
        lines.append("")
        lines.append(f"## {year}年")

        # 统计该年数据
        total_days = sum(len(month_data) for month_data in year_data.values())
        lines.append(f"")
        lines.append(f"> 全年共记录 **{total_days}** 天")
        lines.append("")

        for month in sorted(year_data.keys()):
            month_data = year_data[month]
            lines.append(f"### {month}月")

            for day in sorted(month_data.keys()):
                entries = month_data[day]
                date_str = f"{year}.{month:02d}.{day:02d}"
                lines.append(f"")
                lines.append(f"#### {date_str}")

                for entry in entries:
                    # 转义 Markdown 特殊字符
                    safe_entry = entry.replace("|", "\\|")
                    lines.append(f"- {safe_entry}")

                # 每天之间加空行
                lines.append("")

            # 每月之间加分隔
            lines.append("")

    # 最后加一个元数据统计
    lines.append("---")
    lines.append("")
    lines.append("## 数据统计")
    lines.append("")

    for year in sorted(data.keys()):
        year_data = data[year]
        total_days = sum(len(month_data) for month_data in year_data.values())
        months_with_data = len(year_data)

        # 统计每月的天数
        monthly_counts = []
        for month in range(1, 13):
            if month in year_data:
                count = len(year_data[month])
                monthly_counts.append(f"{month}月({count}天)")
            else:
                monthly_counts.append(f"*{month}月(无记录)*")

        lines.append(f"### {year}年")
        lines.append(f"- 总记录天数: **{total_days}**")
        lines.append(f"- 有记录的月份: **{months_with_data}**")
        lines.append(f"- 各月分布: {' / '.join(monthly_counts)}")
        lines.append("")

    return "\n".join(lines)


# ══════════════════════════════════════════════════
# 4. 主流程
# ══════════════════════════════════════════════════

def main():
    print("=" * 60)
    print("Daily Journal -> Single Markdown")
    print("=" * 60)

    print("\n[1/3] Parsing all journal files...")
    data = parse_all_journals()

    total_days = sum(
        sum(len(month_data) for month_data in year_data.values())
        for year_data in data.values()
    )
    total_entries = sum(
        sum(sum(len(day_data) for day_data in month_data.values())
            for month_data in year_data.values())
        for year_data in data.values()
    )
    print(f"  [OK] Parsed {total_days} days, {total_entries} entries")

    for year in sorted(data.keys()):
        for month in sorted(data[year].keys()):
            days = len(data[year][month])
            print(f"    {year}年{month}月: {days} 天")

    print("\n[2/3] Generating Markdown...")
    md_content = generate_markdown(data)
    print(f"  [OK] Generated {len(md_content)} characters")

    print(f"\n[3/3] Writing to {OUTPUT_FILE}")
    OUTPUT_FILE.write_text(md_content, encoding="utf-8")

    file_size = OUTPUT_FILE.stat().st_size
    print(f"  [OK] Written: {file_size / 1024:.1f} KB")

    # Show preview
    print("\n" + "=" * 60)
    print(f"Done: {OUTPUT_FILE.name}")
    print(f"  Size: {file_size / 1024:.1f} KB")
    print(f"  Days: {total_days}")
    print("=" * 60)

    # Print first 600 chars as preview
    print("\n--- Preview (first 600 chars) ---")
    print(md_content[:600])
    print("...")


if __name__ == "__main__":
    main()
