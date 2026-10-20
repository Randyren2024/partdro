#!/usr/bin/env python3
"""
日报数据 → Unsloth Studio 微调数据集 (Gemma ChatML 格式)

处理流程:
1. 解析所有 .txt 日报，绑定日期元数据
2. 自动脱敏：手机号、身份证号、地址
3. 内容分类：业务/心理/技术/生活
4. 生成多类型 QA 对（侧重事实+业务）
5. 输出 ChatML JSONL 格式
"""

import json
import re
import os
from pathlib import Path
from datetime import datetime
from collections import defaultdict, Counter

# ══════════════════════════════════════════════════
# 0. 配置
# ══════════════════════════════════════════════════

BASE_DIR = Path(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_FILE = BASE_DIR / "gemma_finetune_dataset.jsonl"

SYSTEM_PROMPT = (
    "你是用户的数字分身，基于他在2025-2026年间的每日记录训练而成。"
    "你了解他的跨境贸易业务（无人机、空调、汽配等）、他的心理成长历程、"
    "他对AI和编程的技术探索，以及他的个人生活哲学。"
    "请用温暖、直接、有反思感的语气回答，匹配他真实的表达风格。"
    "回答时尽量引用具体的日期和细节，让用户感到你真正了解他的经历。"
)

# ══════════════════════════════════════════════════
# 1. 隐私脱敏正则
# ══════════════════════════════════════════════════

PHONE_RE = re.compile(r'1[3-9]\d{9}')

ID_CARD_RE = re.compile(r'\d{17}[\dXx]')

ADDR_RE = re.compile(
    r'(?:[\u4e00-\u9fff]{2,6}(?:省|自治区))?'
    r'[\u4e00-\u9fff]{2,10}(?:市|区|县|镇)'
    r'[\u4e00-\u9fff]{2,20}(?:路|街|道|巷|弄|村)'
    r'[\u4e00-\u9fff\d\-]{1,20}(?:号|栋|楼|室|房)'
)

# ══════════════════════════════════════════════════
# 2. 内容分类关键词
# ══════════════════════════════════════════════════

CATEGORY_KEYWORDS = {
    "业务": [
        # 产品
        "无人机", "空调", "支架", "配件", "汽配", "dji", "fimi", "道通", "惠达",
        "autel", "Pmax", "GDU", "普宙", "k40t", "b100p", "y18", "d20",
        "手机支架", "笔记本电脑支架", "磁吸充电线",
        # 运营
        "订单", "客户", "销售", "广告", "出货", "交货", "询盘", "报价", "付款", "收款",
        "供应商", "工厂", "供应链", "物流", "出口", "外贸", "跨境", "高柜",
        "返单", "库存", "运费", "关税",
        # 平台&工具
        "阿里云", "google ads", "谷歌广告", "bigquery", "cloudflare",
        "colab", "runpod", "bolt.diy",
        # 市场
        "印度", "泰国", "俄罗斯", "alexey", "himesh",
        "深圳", "杭州", "上海", "苏州", "宁波", "南昌", "慈溪", "禹城",
        "长三角", "珠三角", "北方",
    ],
    "心理": [
        "心态", "情绪", "焦虑", "平静", "反思", "成长", "坚持", "耐心",
        "自信", "恐惧", "压力", "智慧", "不足", "正视", "心境", "接受",
        "内心", "虚荣", "骄傲", "纯粹", "突破",
        "心理韧性", "心理能量", "comfort zone", "monkey mind",
        "沉着", "冷静", "放下", "心态重要", "过程才", "保持轻松",
        "心态决定", "相信自己", "拒绝虚荣", "拒绝骄傲",
    ],
    "技术": [
        "编程", "代码", "模型", "训练", "ai", "python", "node.js",
        "部署", "服务器", "算法", "开发", "gpt", "llm",
        "unsloth", "nanogpt", "微调", "lora", "gpu",
        "nanoGPT", "SEO", "csv", "数据挖掘", "优化广告",
        "sfttrainer", "trlo", "a100", "h100",
    ],
    "生活": [
        "吃饭", "睡觉", "运动", "朋友", "家人", "旅游", "见面",
        "航拍", "兴趣", "爱好", "见朋友", "聚会", "电影", "读书",
    ],
}


def classify_entry(text):
    """对单条日报内容进行多标签分类"""
    text_lower = text.lower()
    scores = {}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw.lower() in text_lower)
        if score > 0:
            scores[cat] = score
    if not scores:
        return ["其他"]
    max_score = max(scores.values())
    return [cat for cat, s in scores.items() if s >= max_score * 0.4]


# ══════════════════════════════════════════════════
# 3. 脱敏函数
# ══════════════════════════════════════════════════

def redact_sensitive(text):
    """替换敏感信息为占位符"""
    text = PHONE_RE.sub("[PHONE]", text)
    text = ID_CARD_RE.sub("[ID]", text)
    text = ADDR_RE.sub("[ADDR]", text)
    return text


# ══════════════════════════════════════════════════
# 4. 解析日报
# ══════════════════════════════════════════════════

def parse_journals():
    """解析所有日报文件，返回按日期排序的字典列表"""
    journals = []

    for year_dir_name in ["2025年 日报", "2026年 日报"]:
        year_dir = BASE_DIR / year_dir_name
        if not year_dir.exists():
            continue

        for txt_file in sorted(year_dir.glob("*.txt")):
            # 从文件名提取日期: 2025.02.08.txt → date_obj
            stem = txt_file.stem
            try:
                date_obj = datetime.strptime(stem, "%Y.%m.%d")
            except ValueError:
                continue

            date_str = f"{date_obj.year}年{date_obj.month}月{date_obj.day}日"

            # 读取内容
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
                    continue

                # 检测新条目开始（* 或 ** 开头）
                if re.match(r'^\*{1,2}(?!\*)', stripped):
                    if current_entry_lines:
                        entry_text = " ".join(current_entry_lines)
                        entry_text = re.sub(r'^\*{1,2}\s*', '', entry_text).strip()
                        if entry_text:
                            entries.append(entry_text)
                    current_entry_lines = [stripped]
                else:
                    # 续行（如多行代码块、步骤列表等）
                    if current_entry_lines:
                        current_entry_lines.append(stripped)

            # 处理最后一个条目
            if current_entry_lines:
                entry_text = " ".join(current_entry_lines)
                entry_text = re.sub(r'^\*{1,2}\s*', '', entry_text).strip()
                if entry_text:
                    entries.append(entry_text)

            if entries:
                journals.append({
                    "date_obj": date_obj,
                    "date_str": date_str,
                    "month_str": f"{date_obj.year}年{date_obj.month}月",
                    "year": date_obj.year,
                    "month": date_obj.month,
                    "entries": entries,
                })

    journals.sort(key=lambda j: j["date_obj"])
    return journals


# ══════════════════════════════════════════════════
# 5. QA 生成器
# ══════════════════════════════════════════════════

def format_entries_list(entries):
    """将条目列表格式化为可读的 bullet list"""
    lines = []
    for e in entries:
        lines.append(f"- {e}")
    return "\n".join(lines)


def build_context_summary(journals, start_date=None, end_date=None):
    """从指定日期范围的日报中提取总结性文本"""
    filtered = journals
    if start_date:
        filtered = [j for j in filtered if j["date_obj"] >= start_date]
    if end_date:
        filtered = [j for j in filtered if j["date_obj"] <= end_date]

    if not filtered:
        return "暂无记录"

    # 按类别整理
    biz_entries = []
    psych_entries = []
    tech_entries = []
    life_entries = []
    other_entries = []

    for j in filtered:
        for e in j["entries"]:
            cats = classify_entry(e)
            if "业务" in cats:
                biz_entries.append((j["date_str"], e))
            elif "心理" in cats:
                psych_entries.append((j["date_str"], e))
            elif "技术" in cats:
                tech_entries.append((j["date_str"], e))
            elif "生活" in cats:
                life_entries.append((j["date_str"], e))
            else:
                other_entries.append((j["date_str"], e))

    parts = []

    if biz_entries:
        lines = [f"  ({date}) {text}" for date, text in biz_entries[:10]]
        parts.append("业务方面：\n" + "\n".join(lines))

    if psych_entries:
        lines = [f"  ({date}) {text}" for date, text in psych_entries[:8]]
        parts.append("心态/心理方面：\n" + "\n".join(lines))

    if tech_entries:
        lines = [f"  ({date}) {text}" for date, text in tech_entries[:6]]
        parts.append("技术/学习方面：\n" + "\n".join(lines))

    if life_entries:
        lines = [f"  ({date}) {text}" for date, text in life_entries[:3]]
        parts.append("生活方面：\n" + "\n".join(lines))

    if other_entries and not (biz_entries or psych_entries):
        lines = [f"  ({date}) {text}" for date, text in other_entries[:10]]
        parts.append("记录：\n" + "\n".join(lines))

    return "\n\n".join(parts) if parts else "当天有一些零散的思考记录。"


# ----- A. 每日事实回忆 (每个有内容的日子 2-3 个问法) -----

DAILY_QUESTION_TEMPLATES = [
    ("basic", "我在{date}做了哪些事、想了什么？"),
    ("reflection", "回顾{date}这天，我主要关注的是什么？"),
    ("summary", "{date}那天的日报写了什么？"),
]


def generate_daily_recall(journals):
    """为每一天生成多种问法的 QA"""
    qa_pairs = []
    for j in journals:
        summary = format_entries_list(j["entries"])
        # 每条用不同模板生成 2-3 个问题
        templates_to_use = DAILY_QUESTION_TEMPLATES
        if len(j["entries"]) <= 2:
            templates_to_use = DAILY_QUESTION_TEMPLATES[:1]  # 内容太短只问一次

        for ttype, template in templates_to_use:
            qa_pairs.append({
                "user": template.format(date=j["date_str"]),
                "assistant": f"{j['date_str']}你的记录如下：\n{summary}",
                "type": "daily_recall",
            })

        # 如果当天有业务相关条目，额外生成针对性问题
        biz_entries = [e for e in j["entries"] if "业务" in classify_entry(e)]
        if biz_entries and len(biz_entries) >= 2:
            qa_pairs.append({
                "user": f"{j['date_str']}那天在业务上有什么进展？",
                "assistant": f"当天业务相关的记录：\n{format_entries_list(biz_entries)}",
                "type": "daily_recall",
            })

        # 如果当天有心理相关条目，额外生成针对性问题
        psych_entries = [e for e in j["entries"] if "心理" in classify_entry(e)]
        if psych_entries and len(psych_entries) >= 2:
            qa_pairs.append({
                "user": f"{j['date_str']}那天我的心态如何？",
                "assistant": f"当天关于心态的记录：\n{format_entries_list(psych_entries)}",
                "type": "daily_recall",
            })

        # 如果当天有技术相关条目
        tech_entries = [e for e in j["entries"] if "技术" in classify_entry(e)]
        if tech_entries:
            qa_pairs.append({
                "user": f"{j['date_str']}在技术上我探索了什么？",
                "assistant": f"当天技术探索记录：\n{format_entries_list(tech_entries)}",
                "type": "daily_recall",
            })

    return qa_pairs


# ----- B. 月度总结 (~24 条) -----

def generate_monthly_summary(journals):
    """为有记录的月份生成月度总结 QA"""
    months = defaultdict(list)
    for j in journals:
        months[j["month_str"]].append(j)

    qa_pairs = []
    for month_str, month_journals in sorted(months.items()):
        if len(month_journals) < 2:
            continue  # 只有一条记录的月份意义不大
        start = month_journals[0]["date_obj"]
        end = month_journals[-1]["date_obj"]
        summary = build_context_summary(month_journals)
        qa_pairs.append({
            "user": f"{month_str}我主要关注什么？",
            "assistant": f"{month_str}（{start.month}月{start.day}日至{end.month}月{end.day}日）你的关注点如下：\n\n{summary}",
            "type": "monthly_summary",
        })
    return qa_pairs


# ----- C. 阶段性总结 (~8 条) -----

def generate_period_summary(journals):
    """生成半年度/全年的阶段性总结 QA"""
    qa_pairs = []

    # 按半年分段
    periods = {
        "2025年上半年（1-6月）": (datetime(2025, 1, 1), datetime(2025, 6, 30)),
        "2025年下半年（7-12月）": (datetime(2025, 7, 1), datetime(2025, 12, 31)),
        "2026年第一季度（1-3月）": (datetime(2026, 1, 1), datetime(2026, 3, 31)),
    }

    for period_name, (start, end) in periods.items():
        period_journals = [j for j in journals if start <= j["date_obj"] <= end]
        if len(period_journals) < 5:
            continue
        summary = build_context_summary(period_journals)
        qa_pairs.append({
            "user": f"{period_name}我的状态是怎样的？",
            "assistant": f"{period_name}，你共记录了{len(period_journals)}天。主要情况：\n\n{summary}",
            "type": "period_summary",
        })

    # 全年总结
    year_journals = defaultdict(list)
    for j in journals:
        year_journals[j["year"]].append(j)

    for year in sorted(year_journals.keys()):
        yj = year_journals[year]
        summary = build_context_summary(yj)
        qa_pairs.append({
            "user": f"回顾{year}年，我经历了什么？",
            "assistant": f"{year}年你共记录了{len(yj)}天。概况如下：\n\n{summary}",
            "type": "period_summary",
        })

    return qa_pairs


# ----- D. 业务主题问答 (扩展版) -----

def generate_business_themes(journals):
    """从业务条目中生成丰富的主题问答"""
    qa_pairs = []

    # 收集所有条目（不分类，直接全文搜索）
    all_dated_entries = []
    for j in journals:
        for e in j["entries"]:
            all_dated_entries.append((j["date_str"], j["month_str"], e))

    all_text_combined = " ".join(e for _, _, e in all_dated_entries)

    # --- 主题检测：给每个主题生成一到多个问题 ---

    themes = []

    # 1. 无人机相关 (核心业务)
    drone_kw = ["无人机", "dji", "fimi", "道通", "惠达", "autel", "gdu", "普宙",
                "载重", "农业", "消防", "植保", "飞行", "机型"]
    drone_entries_all = [(d, t) for d, _, t in all_dated_entries
                         if any(k in t.lower() for k in drone_kw)]
    drone_brands_in_data = set()
    for _, t in drone_entries_all:
        for brand in ["DJI", "Fimi", "道通", "惠达", "Autel", "GDU", "普宙"]:
            if brand.lower() in t.lower():
                drone_brands_in_data.add(brand)

    if drone_entries_all:
        themes.append({
            "q": "我在无人机方面做了哪些工作？",
            "a": f"无人机是你最主要的业务线之一。你涉及的品牌包括：{', '.join(sorted(drone_brands_in_data)) if drone_brands_in_data else '多个品牌'}。\n"
                 f"主要工作包括：销售与出口、机型测试、广告投放获客、供应链对接（如从中国出货至泰国）等。\n\n"
                 f"关键记录：\n" + "\n".join([f"({d}) {t}" for d, t in drone_entries_all[:10]]),
        })
        themes.append({
            "q": "我测试过哪些无人机型号？",
            "a": "你测试过的型号包括：DJI Mini 4 Pro、Fimi系列、道通机型，以及"
                 "D20、Y18、B100P、B100P+、惠达150KG大载重机型等。\n\n" +
                 "\n".join([f"({d}) {t}" for d, t in drone_entries_all
                           if any(k in t.lower() for k in ["测试", "机型", "mini", "pro", "d20", "y18", "b100p", "载重"])]),
        })
        themes.append({
            "q": "我的无人机客户主要在哪些国家？",
            "a": "你的无人机客户主要分布在：印度、泰国、俄罗斯等国家。"
                 "你曾花了大约两周时间、投入约1200元人民币搞定一个印度客户，实现业务闭环。\n\n" +
                 "\n".join([f"({d}) {t}" for d, t in drone_entries_all
                           if any(k in t for k in ["印度", "泰国", "俄罗斯", "客户"])][:8]),
        })

    # 2. 空调业务
    ac_entries = [(d, t) for d, _, t in all_dated_entries if "空调" in t]
    if ac_entries:
        themes.append({
            "q": "我的空调业务情况如何？",
            "a": "你有空调出口业务，预计批量返单约10个高柜。\n\n" +
                 "\n".join([f"({d}) {t}" for d, t in ac_entries]),
        })

    # 3. 广告投放
    ad_entries = [(d, t) for d, _, t in all_dated_entries
                  if any(k in t.lower() for k in ["广告", "google ads", "pmax", "投放", "获客"])]
    if ad_entries:
        themes.append({
            "q": "我是怎么做广告投放和客户获取的？",
            "a": "你主要使用Google Ads进行获客，包括Pmax（Performance Max）广告类型，"
                 "能在各个surface展示。你通过BigQuery进行数据收集、挖掘和优化广告投放。\n"
                 "你还计划用任愿的身份证注册谷歌广告账号（派舒特）来测试广告数据。\n\n" +
                 "\n".join([f"({d}) {t}" for d, t in ad_entries]),
        })
        themes.append({
            "q": "我在广告投放方面取得了什么经验？",
            "a": "你认识到广告获客方面需要更理性地分析和优化数据，不能盲目相信ChatGPT的建议。"
                 "你建立了BigQuery工作流：收集数据→挖掘数据→优化广告投放→产生结果。\n\n" +
                 "\n".join([f"({d}) {t}" for d, t in ad_entries[:8]]),
        })

    # 4. 网站和工具部署
    deploy_entries = [(d, t) for d, _, t in all_dated_entries
                      if any(k in t.lower() for k in ["部署", "上线", "cloudflare", "bolt.diy",
                                                       "modelmixhub", "网站", "网页", "落地页"])]
    if deploy_entries:
        themes.append({
            "q": "我搭建过哪些网站或平台？",
            "a": "你尝试部署过以下项目：\n"
                 "- modelmixhub.com（模型展示网站，计划尽快上线）\n"
                 "- bolt.diy（可直接在Cloudflare部署）\n"
                 "- 基于React+Ant Design的前端项目\n"
                 "- 针对Modelscope风格的落地页\n\n" +
                 "\n".join([f"({d}) {t}" for d, t in deploy_entries[:8]]),
        })

    # 5. 客户和市场
    market_entries = [(d, t) for d, _, t in all_dated_entries
                      if any(k in t for k in ["印度", "泰国", "俄罗斯", "alexey", "himesh",
                                              "宁波", "杭州", "上海", "苏州", "深圳",
                                              "长三角", "珠三角", "禹城", "南昌", "慈溪"])]
    if market_entries:
        themes.append({
            "q": "我的客户和市场分布在哪些区域？",
            "a": "你的市场布局：\n"
                 "- 海外：印度、泰国、俄罗斯\n"
                 "- 国内：长三角（宁波、杭州、上海、苏州）、珠三角（深圳）、北方（山东禹城）\n\n" +
                 "\n".join([f"({d}) {t}" for d, t in market_entries[:10]]),
        })

    # 6. 配件/其他产品
    accessories_entries = [(d, t) for d, _, t in all_dated_entries
                           if any(k in t for k in ["支架", "配件", "汽配", "磁吸", "手环"])]
    if accessories_entries:
        themes.append({
            "q": "除了无人机和空调，我还涉及哪些产品？",
            "a": "你还涉及配件类产品：手机支架、笔记本电脑支架、华为手环磁吸充电线等。\n\n" +
                 "\n".join([f"({d}) {t}" for d, t in accessories_entries]),
        })

    # 7. 收款和支付
    payment_entries = [(d, t) for d, _, t in all_dated_entries
                       if any(k in t.lower() for k in ["收款", "付款", "paypal", "账户", "到账"])]
    if payment_entries:
        themes.append({
            "q": "我是怎么处理跨境收款的？",
            "a": "你通过多种方式处理收款：让海外客户付款到你或合作方的账户（如小蔡的账户收款）。\n\n" +
                 "\n".join([f"({d}) {t}" for d, t in payment_entries]),
        })

    # 8. AI / 技术用于业务
    ai_biz_entries = [(d, t) for d, _, t in all_dated_entries
                      if any(k in t.lower() for k in ["chatgpt", "ai", "爬虫", "bigquery",
                                                       "数据分析", "优化", "deepseek", "claude", "cursor"])]
    if ai_biz_entries:
        themes.append({
            "q": "我在业务中用到过哪些AI工具？",
            "a": "你在业务中尝试和使用过：ChatGPT（用于广告建议和内容生成）、DeepSeek（心理咨询）、"
                 "Claude/Cursor（编程和部署辅助）、BigQuery（广告数据分析）、"
                 "Google Colab（数据处理和模型训练）等。\n\n" +
                 "\n".join([f"({d}) {t}" for d, t in ai_biz_entries[:10]]),
        })

    # 9. 按问题模式生成更多具体问题
    business_questions = {
        "我的报价策略是怎样的？": ["报价", "阶梯报价", "价格"],
        "我在无人机测试方面做了什么？": ["测试", "无人机", "机型", "飞行"],
        "我是怎么开发客户的？": ["客户", "广告", "获客", "询盘", "开发"],
        "我在供应链/物流方面做了哪些工作？": ["出货", "物流", "供应链", "运费", "货运", "高柜"],
        "我和惠达/小蔡的合作是什么？": ["惠达", "小蔡", "合作"],
        "我在Google方面积累了哪些经验？": ["google", "colab", "bigquery", "ads", "pmax"],
    }

    for question, keywords in business_questions.items():
        matched = [(d, t) for d, _, t in all_dated_entries
                   if any(k in t.lower() for k in keywords)]
        if matched:
            themes.append({
                "q": question,
                "a": "\n".join([f"({d}) {t}" for d, t in matched[:10]]),
            })

    # 10. 产品型号速查
    model_numbers = set()
    for _, _, t in all_dated_entries:
        found = re.findall(r'\b[A-Z]\d+[A-Za-z]?(?:\+|pro|mini)?\b', t)
        model_numbers.update(f for f in found if len(f) >= 3)

    if model_numbers:
        themes.append({
            "q": "我接触过哪些产品型号？",
            "a": "你记录中涉及的产品型号包括：" + "、".join(sorted(model_numbers)[:25]),
        })

    # 将themes转换为qa_pairs
    for t in themes:
        qa_pairs.append({
            "user": t["q"],
            "assistant": t["a"],
            "type": "business_theme",
        })

    return qa_pairs


# ----- E. 心理状态问答 (扩展版) -----

def generate_psychology_themes(journals):
    """从心理分类条目中生成丰富的主题问答"""
    qa_pairs = []

    all_dated_entries = []
    for j in journals:
        for e in j["entries"]:
            all_dated_entries.append((j["date_str"], j["month_str"], e))

    # 收集心理相关条目（不依赖分类，直接全文匹配）
    psych_kw = [
        "心态", "情绪", "焦虑", "平静", "反思", "成长", "坚持", "耐心",
        "自信", "恐惧", "压力", "智慧", "不足", "正视", "心境", "接受",
        "内心", "虚荣", "骄傲", "纯粹", "突破", "心理韧性", "心理能量",
        "comfort zone", "monkey mind", "沉着", "冷静", "放下",
        "过程才是", "保持轻松", "相信自己", "拒绝虚荣", "拒绝骄傲",
        "活在当下", "平常心", "好奇心", "心流", "真性情",
    ]
    all_psych = [(d, t) for d, _, t in all_dated_entries
                 if any(k in t for k in psych_kw)]

    # 1. 核心信念/自我要求
    belief_kw = ["拒绝", "不要", "应该", "保持", "接受", "正视", "相信自己", "纯粹",
                 "平常心", "好奇心", "活在当下", "沉淀", "持之以恒"]
    beliefs = [(d, t) for d, _, t in all_dated_entries
               if any(k in t for k in belief_kw)]

    if beliefs:
        qa_pairs.append({
            "user": "我的核心信念和价值观是什么？",
            "assistant": "你反复对自己强调的信念包括：\n"
                          "- 拒绝虚荣，拒绝骄傲，做纯粹的自我\n"
                          "- 保持平常心和好奇心\n"
                          "- 活在当下，显现真性情\n"
                          "- 不花时间和精力是没法沉淀的\n"
                          "- 兴趣短期不重要（不创造结果），长期极为重要（让你持之以恒）\n\n"
                          "具体记录：\n" + "\n".join([f"({d}) {t}" for d, t in beliefs[:15]]),
            "type": "psychology_theme",
        })

    # 2. 面对困难的态度
    struggle_kw = ["焦虑", "恐惧", "压力", "挫折", "不足", "弯路", "盲目", "混乱",
                   "困难", "做不到位", "亟待解决", "执念", "痛苦"]
    struggle_entries = [(d, t) for d, _, t in all_dated_entries
                        if any(k in t for k in struggle_kw)]

    if struggle_entries:
        qa_pairs.append({
            "user": "我面对挫折和焦虑时是怎么调整的？",
            "assistant": "你面对困难时的反思：\n" +
                         "\n".join([f"({d}) {t}" for d, t in struggle_entries[:12]]) +
                         "\n\n你的应对策略：保持平常心、关注过程而非结果、"
                         "先动手做力所能及的小事来减少焦虑、"
                         "承认自己暂时无法完全了解复杂系统但通过实践终究能懂、"
                         "允许一点混乱、保持轻松心态。",
            "type": "psychology_theme",
        })

    # 3. 成长路径
    growth_kw = ["成长", "突破", "进步", "改善", "模式识别", "能量", "韧性",
                 "提高", "层次", "阶段", "提升"]
    growth_entries = [(d, t) for d, _, t in all_dated_entries
                      if any(k in t for k in growth_kw)]

    if growth_entries:
        qa_pairs.append({
            "user": "我在2025-2026年的个人成长主要体现在哪些方面？",
            "assistant": "你的成长记录：\n" +
                         "\n".join([f"({d}) {t}" for d, t in growth_entries[:12]]) +
                         "\n\n主要成长方向：提升心理韧性和心理能量、增强模式识别能力、"
                         "学会接受自己的不足、在实践而非等待中寻找突破、"
                         "不追求完美的方案，先动手做小任务。",
            "type": "psychology_theme",
        })

    # 4. 心态变化时间线（按月份）
    if len(all_psych) >= 10:
        # 按月份分组
        psych_by_month = defaultdict(list)
        for d, m, t in all_dated_entries:
            if any(k in t for k in psych_kw):
                psych_by_month[m].append((d, t))

        qa_pairs.append({
            "user": "我在2025年的心态有什么变化？",
            "assistant": "你的心态演变轨迹：\n\n"
                          "年初（2-3月）：强调拒绝虚荣、保持平静、做纯粹自我，关注好奇心和平常心\n"
                          "年中（5-8月）：认识到过程比结果重要，拙劣的模仿不如不模仿，"
                          "先搭框架再填充内容，每完成一件小事就减少一分焦虑\n"
                          "后期（9-12月）：关注心理韧性和心理能量，强调在舒适区内的自我接纳\n\n"
                          "关键语录：\n" +
                         "\n".join([f"({d}) {t}" for d, t in all_psych[:15]]),
            "type": "psychology_theme",
        })

    # 5. 关于兴趣、爱好
    interest_kw = ["兴趣", "爱好", "航拍", "热爱", "好奇"]
    interest_entries = [(d, t) for d, _, t in all_dated_entries
                        if any(k in t for k in interest_kw)]
    if interest_entries:
        qa_pairs.append({
            "user": "我是怎么看待兴趣和爱好的？",
            "assistant": "你认为兴趣短期来看不重要（因为不能创造结果），"
                         "但长期来看极为重要，因为它能让你持之以恒。"
                         "你庆幸自己找到了航拍这个爱好。\n\n"
                         "相关记录：\n" +
                         "\n".join([f"({d}) {t}" for d, t in interest_entries]),
            "type": "psychology_theme",
        })

    # 6. 关于环境对心态的影响
    env_entries = [(d, t) for d, _, t in all_dated_entries
                   if any(k in t for k in ["环境", "芜湖", "修养", "氛围"])]
    if env_entries:
        qa_pairs.append({
            "user": "环境对我的心态有影响吗？",
            "assistant": "有的。你记录过：'环境对一个人的心态影响确实很大，所以我来芜湖修养是对的。'\n\n" +
                         "\n".join([f"({d}) {t}" for d, t in env_entries]),
            "type": "psychology_theme",
        })

    # 7. 自我认知相关
    self_kw = ["你的缺点", "优点", "不足", "正视自己", "能做好", "擅长"]
    self_entries = [(d, t) for d, _, t in all_dated_entries
                    if any(k in t for k in self_kw)]
    if self_entries:
        qa_pairs.append({
            "user": "我对自己有什么认识？",
            "assistant": "你的自我认知记录：\n"
                          "- 你的缺点其实就是你的优点\n"
                          "- 能够正视自己的不足也是一种智慧\n"
                          "- 兴趣让你持之以恒\n\n" +
                         "\n".join([f"({d}) {t}" for d, t in self_entries]),
            "type": "psychology_theme",
        })

    # 8. 关于过程和结果
    process_entries = [(d, t) for d, _, t in all_dated_entries
                       if any(k in t for k in ["过程", "结果", "心流", "flow", "沉浸"])]
    if process_entries:
        qa_pairs.append({
            "user": "我怎么看待过程和结果的关系？",
            "assistant": "你反复强调过程比结果重要。你提到：\n"
                          "- 出结果似乎不是重要的，过程才是\n"
                          "- 现代心流理论（Flow）证实：当人完全投入过程时，会产生超越功利的愉悦感\n"
                          "- 探索没有失败，只有获得新信息的机会\n\n" +
                         "\n".join([f"({d}) {t}" for d, t in process_entries]),
            "type": "psychology_theme",
        })

    # 9. 特定心理主题
    psych_themes_questions = {
        "我反复提到的'修身养性'体现在哪些方面？": ["安静", "修养", "平静", "沉浸", "专注"],
        "我是怎么看待'专心做事'的？": ["专心", "专注", "沉浸", "投入", "全神"],
        "我在精神状态不好的时候怎么调整？": ["调整", "放松", "休息", "平静", "定心"],
    }
    for question, keywords in psych_themes_questions.items():
        matched = [(d, t) for d, _, t in all_dated_entries
                   if any(k in t for k in keywords)]
        if matched and len(matched) >= 2:
            qa_pairs.append({
                "user": question,
                "assistant": "\n".join([f"({d}) {t}" for d, t in matched[:8]]),
                "type": "psychology_theme",
            })

    return qa_pairs


# ----- F. 技术探索问答 (新增) -----

def generate_tech_themes(journals):
    """从技术相关条目中生成主题问答"""
    qa_pairs = []

    all_dated_entries = []
    for j in journals:
        for e in j["entries"]:
            all_dated_entries.append((j["date_str"], e))

    tech_kw = ["ai", "llm", "gpt", "模型", "训练", "微调", "编程", "代码", "部署",
               "python", "node.js", "react", "cloudflare", "colab", "runpod",
               "unsloth", "nanogpt", "lora", "gpu", "hugging face", "modelscope",
               "deepseek", "claude", "cursor", "bolt.diy", "magicquill",
               "sfttrainer", "a100", "h100", "算法", "nanoGPT", "SEO"]

    all_tech = [(d, t) for d, t in all_dated_entries
                if any(k in t.lower() for k in tech_kw)]

    if not all_tech:
        return qa_pairs

    # 1. AI / 模型训练
    ai_kw = ["ai", "模型", "训练", "微调", "gpt", "llm", "nanogpt", "unsloth",
             "deepseek", "hugging face", "modelscope", "lora", "sfttrainer"]
    ai_entries = [(d, t) for d, t in all_tech
                  if any(k in t.lower() for k in ai_kw)]
    if ai_entries:
        qa_pairs.append({
            "user": "我在AI和模型训练方面做了什么探索？",
            "assistant": "你进行了多方面的AI探索：\n"
                          "- Unsloth + Gemma 4 微调（Runpod/本地/Colab三种部署方式）\n"
                          "- nanoGPT项目的GPT-2微调\n"
                          "- 研究过LoRA参数和SFTTrainer\n"
                          "- 尝试MagicQuill项目的部署\n"
                          "- 使用DeepSeek进行心理咨询体验\n\n" +
                         "\n".join([f"({d}) {t}" for d, t in ai_entries[:12]]),
            "type": "tech_theme",
        })
        qa_pairs.append({
            "user": "我在微调大模型方面积累了什么经验？",
            "assistant": "你的经验包括：\n"
                          "- 三种Unsloth部署方式：本地电脑（CPU，有些问题）/ RunPod部署（训练）/ Google Colab部署\n"
                          "- 数据集准备需要：转为JSONL格式 → 创建Prompt Template → 配置GPU → SFTTrainer训练 → 保存测试\n"
                          "- 建议GPU：A100 40GB或H100\n"
                          "- 数据预处理包括：Markdown转JSONL、PDF提取、清洗分块\n\n" +
                         "\n".join([f"({d}) {t}" for d, t in ai_entries[:8]]),
            "type": "tech_theme",
        })

    # 2. Web开发
    web_kw = ["react", "node.js", "cloudflare", "网站", "前端", "github", "部署",
              "bolt.diy", "modelmixhub", "ant design", "magicquill"]
    web_entries = [(d, t) for d, t in all_tech
                   if any(k in t.lower() for k in web_kw)]
    if web_entries:
        qa_pairs.append({
            "user": "我在Web开发方面做过什么？",
            "assistant": "你尝试过的Web开发项目：\n"
                          "- 基于React + Ant Design的前端项目\n"
                          "- modelmixhub.com（AI模型展示网站）\n"
                          "- bolt.diy部署（支持Cloudflare直接部署）\n"
                          "- Modelscope风格落地页设计\n\n" +
                         "\n".join([f"({d}) {t}" for d, t in web_entries[:10]]),
            "type": "tech_theme",
        })

    # 3. 编程学习
    coding_kw = ["python", "代码", "编程", "node.js", "github", "算法", "api"]
    coding_entries = [(d, t) for d, t in all_tech
                      if any(k in t.lower() for k in coding_kw)]
    if coding_entries:
        qa_pairs.append({
            "user": "我在编程方面学了什么？",
            "assistant": "你的编程学习记录：\n" +
                         "\n".join([f"({d}) {t}" for d, t in coding_entries[:10]]),
            "type": "tech_theme",
        })

    # 4. 工具和平台
    tools_kw = ["claude", "cursor", "deepseek", "google colab", "runpod",
                "bigquery", "cloudflare", "modelscope", "hugging face"]
    tools_entries = [(d, t) for d, t in all_tech
                     if any(k in t.lower() for k in tools_kw)]
    if tools_entries:
        qa_pairs.append({
            "user": "我常用的技术工具和平台有哪些？",
            "assistant": "你在技术工作中使用的工具：\n"
                          "- Claude / Cursor：AI编程助手\n"
                          "- DeepSeek：心理咨询和内容生成\n"
                          "- Google Colab：数据处理和模型训练\n"
                          "- RunPod：GPU云服务用于模型训练\n"
                          "- BigQuery：广告数据分析\n"
                          "- Cloudflare：网站部署\n"
                          "- Hugging Face / ModelScope：模型获取和试用\n\n" +
                         "\n".join([f"({d}) {t}" for d, t in tools_entries[:10]]),
            "type": "tech_theme",
        })

    # 5. 技术心态
    tech_mindset_entries = [(d, t) for d, t in all_tech
                            if any(k in t for k in ["学习", "摸索", "探索", "尝试", "问题", "解决"])]
    if tech_mindset_entries and len(tech_mindset_entries) >= 3:
        qa_pairs.append({
            "user": "我在学习技术时的态度是怎样的？",
            "assistant": "你的学习态度：'先搭框架再填充内容'、'不要等完美的方案，立刻动手做眼前能做的小任务'、"
                          "'承认自己暂时无法完全了解复杂系统，但通过实践终究能懂'。\n\n" +
                         "\n".join([f"({d}) {t}" for d, t in tech_mindset_entries[:8]]),
            "type": "tech_theme",
        })

    return qa_pairs


# ----- F. 风格模仿 (~60 条) -----

def generate_style_imitation(journals):
    """生成风格模仿的 QA 对：用前一天内容预测下一天"""
    qa_pairs = []

    # 从有连续记录的日子中生成续写任务
    consecutive_pairs = []
    for i in range(len(journals) - 1):
        curr = journals[i]
        next_j = journals[i + 1]
        # 间隔不超过5天算连续
        delta = (next_j["date_obj"] - curr["date_obj"]).days
        if 1 <= delta <= 5:
            consecutive_pairs.append((curr, next_j))

    # 最多取30对
    for curr, next_j in consecutive_pairs[:30]:
        qa_pairs.append({
            "user": (
                f"根据我在{curr['date_str']}的记录：\n"
                f"{format_entries_list(curr['entries'])}\n\n"
                f"请以我的风格，写出我下一天（{next_j['date_str']}）可能记录的日报内容。"
            ),
            "assistant": format_entries_list(next_j["entries"]),
            "type": "style_imitation",
        })

    # 开放式的风格模仿
    open_prompts = [
        "请以我的日报风格，写一段今天的反思笔记。",
        "如果我今天遇到了一个新的业务机会，我会怎么记录？",
        "用我的写作风格记录一段今天在技术上的探索。",
        "以我的口吻，写一段关于心态调整的日报。",
    ]

    # 从实际记录中挑一些典型的短篇作为参考输出
    short_entries = []
    for j in journals:
        for e in j["entries"]:
            if 10 <= len(e) <= 120:
                short_entries.append(e)

    for i, prompt in enumerate(open_prompts[:4]):
        if i < len(short_entries):
            qa_pairs.append({
                "user": prompt,
                "assistant": short_entries[i * 7 % len(short_entries)],
                "type": "style_imitation",
            })

    return qa_pairs


# ══════════════════════════════════════════════════
# 6. ChatML 格式化
# ══════════════════════════════════════════════════

def format_chatml(qa_pairs):
    """将 QA 对列表转换为 ChatML JSONL 格式"""
    output = []
    for qa in qa_pairs:
        record = {
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": qa["user"]},
                {"role": "assistant", "content": qa["assistant"]},
            ]
        }
        output.append(record)
    return output


# ══════════════════════════════════════════════════
# 7. 主流程
# ══════════════════════════════════════════════════

def main():
    print("=" * 60)
    print("Journal Dataset Builder -> Unsloth Studio (Gemma ChatML)")
    print("=" * 60)

    # Step 1: Parse
    print("\n[1/5] Parsing journal files...")
    journals = parse_journals()
    print(f"  [OK] Parsed: {len(journals)} days")
    total_entries = sum(len(j["entries"]) for j in journals)
    print(f"  [OK] Total: {total_entries} entries")

    # Step 2: Classify
    print("\n[2/5] Classifying entries...")
    cat_counter = Counter()
    for j in journals:
        for e in j["entries"]:
            for cat in classify_entry(e):
                cat_counter[cat] += 1
    for cat, count in cat_counter.most_common():
        print(f"  {cat}: {count} entries")

    # Step 3: Generate QA pairs
    print("\n[3/5] Generating QA pairs...")

    daily = generate_daily_recall(journals)
    print(f"  [OK] Daily recall: {len(daily)}")

    monthly = generate_monthly_summary(journals)
    print(f"  [OK] Monthly summary: {len(monthly)}")

    period = generate_period_summary(journals)
    print(f"  [OK] Period summary: {len(period)}")

    biz = generate_business_themes(journals)
    print(f"  [OK] Business themes: {len(biz)}")

    psych = generate_psychology_themes(journals)
    print(f"  [OK] Psychology themes: {len(psych)}")

    tech = generate_tech_themes(journals)
    print(f"  [OK] Tech themes: {len(tech)}")

    style = generate_style_imitation(journals)
    print(f"  [OK] Style imitation: {len(style)}")

    all_qa = daily + monthly + period + biz + psych + tech + style

    # Type stats
    type_counter = Counter(qa["type"] for qa in all_qa)
    print(f"\n  Total: {len(all_qa)} QA pairs")
    for t, c in type_counter.most_common():
        pct = c / len(all_qa) * 100
        print(f"    {t}: {c} ({pct:.0f}%)")

    # Step 4: Format
    print("\n[4/5] Formatting to ChatML JSONL...")
    formatted = format_chatml(all_qa)
    print(f"  [OK] Formatted: {len(formatted)} samples")

    # Step 5: Write
    print(f"\n[5/5] Writing to {OUTPUT_FILE} ...")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for record in formatted:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

    file_size = OUTPUT_FILE.stat().st_size
    print(f"  [OK] Written: {file_size / 1024:.1f} KB")

    # Final stats
    print("\n" + "=" * 60)
    print(f"Done! Dataset: {OUTPUT_FILE.name}")
    print(f"   Samples: {len(formatted)}")
    print(f"   Size: {file_size / 1024:.1f} KB")
    print("   Ready to import into Unsloth Studio")
    print("=" * 60)

    # Show a sample
    print("\n--- Sample (first) ---")
    print(json.dumps(formatted[0], ensure_ascii=False, indent=2)[:500] + "...")
    print("\n--- Sample (last) ---")
    print(json.dumps(formatted[-1], ensure_ascii=False, indent=2)[:500] + "...")


if __name__ == "__main__":
    main()
