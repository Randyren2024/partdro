// Google Ads + GA4 日报（云沙箱架构，与 gsc-daily-report 同款）：
// Timer 每天 09:15(北京) → 本函数 → E2B 创建阿里云云沙箱(code-interpreter-v1)
//   → 写入 python 脚本(标准库直连 Google Ads API v25 REST + GA4 Data API REST) → 执行
//   → 取回 Markdown → OSS PutObject(私有) + 函数日志全文输出 → 销毁沙箱
// 凭据全部经环境变量注入，不落代码仓库。
import { Sandbox } from 'e2b'
import * as crypto from 'node:crypto'

const CUSTOMER_ID = process.env.ADS_CUSTOMER_ID || ''

// ---------- 沙箱内执行的 Python 脚本（仅标准库，凭据在写入时插值） ----------
function buildAdsReportScript(cred: {
  adsClientId: string
  adsClientSecret: string
  adsRefreshToken: string
  adsDeveloperToken: string
  adsCustomerId: string
  adsLoginCustomerId: string
  ga4ClientId: string
  ga4ClientSecret: string
  ga4RefreshToken: string
  ga4PropertyId: string
}): string {
  return `# -*- coding: utf-8 -*-
# Google Ads + GA4 日报：沙箱内执行（香港直连 Google API）。仅用标准库。
import json, urllib.request, urllib.error, os, time
from datetime import date, timedelta

ADS_CID = ${JSON.stringify(cred.adsClientId)}
ADS_CSEC = ${JSON.stringify(cred.adsClientSecret)}
ADS_RTOK = ${JSON.stringify(cred.adsRefreshToken)}
ADS_DEV = ${JSON.stringify(cred.adsDeveloperToken)}
ADS_CUSTOMER = ${JSON.stringify(cred.adsCustomerId)}
ADS_LOGIN = ${JSON.stringify(cred.adsLoginCustomerId)}
GA4_CID = ${JSON.stringify(cred.ga4ClientId)}
GA4_CSEC = ${JSON.stringify(cred.ga4ClientSecret)}
GA4_RTOK = ${JSON.stringify(cred.ga4RefreshToken)}
GA4_PROP = ${JSON.stringify(cred.ga4PropertyId)}
OUT = "/home/user/report.md" if os.path.isdir("/home/user") else os.path.join(os.getcwd(), "report.md")

def _http_once(url, payload, headers):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(
        url, data=data,
        headers=dict({"Content-Type": "application/json"}, **(headers or {})),
        method="POST" if data is not None else "GET")
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read().decode())

def http(url, payload=None, headers=None, attempts=4):
    # 网络抖动（SSL EOF / 超时 / 5xx / 429）自动重试；4xx 业务错误直接抛出
    last = None
    for i in range(attempts):
        try:
            return _http_once(url, payload, headers)
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="replace")
            if e.code == 429 or e.code >= 500:
                last = "HTTP " + str(e.code) + " -> " + body[:400]
            else:
                raise SystemExit("HTTP " + str(e.code) + " " + url + " -> " + body[:600])
        except Exception as e:
            last = repr(e)
        if i < attempts - 1:
            time.sleep(2 + 2 * i)
    raise SystemExit("network failed after " + str(attempts) + " attempts: " + str(last))

def access_token(cid, csec, rtok, label):
    last = None
    for i in range(4):
        try:
            r = _http_once("https://oauth2.googleapis.com/token", {
                "client_id": cid, "client_secret": csec,
                "refresh_token": rtok, "grant_type": "refresh_token"}, None)
            at = r.get("access_token")
            if at:
                return at
            last = json.dumps(r)[:300]
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="replace")
            # 400 invalid_grant 属于凭据问题，不重试
            if e.code == 400:
                raise SystemExit(label + " token HTTP 400: " + body[:400])
            last = "HTTP " + str(e.code) + " " + body[:200]
        except Exception as e:
            last = repr(e)
        if i < 3:
            time.sleep(2 + 2 * i)
    raise SystemExit(label + " token exchange failed: " + str(last))

def num(v):
    try:
        return float(v)
    except Exception:
        return 0.0

def g(obj, *path):
    cur = obj
    for p in path:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(p)
        if cur is None:
            return None
    return cur

# ==================== Google Ads (API v25 REST) ====================
ads_at = access_token(ADS_CID, ADS_CSEC, ADS_RTOK, "Google Ads")
ADS_H = {"Authorization": "Bearer " + ads_at, "developer-token": ADS_DEV}
if ADS_LOGIN:
    ADS_H["login-customer-id"] = ADS_LOGIN
ADS_URL = "https://googleads.googleapis.com/v25/customers/" + ADS_CUSTOMER + "/googleAds:search"

def ads_search(query):
    out = []
    page = None
    for _ in range(6):
        # 注意：REST search 不支持 pageSize（固定 10000 行/页），只传 query/pageToken
        body = {"query": query}
        if page:
            body["pageToken"] = page
        r = http(ADS_URL, body, ADS_H)
        out.extend(r.get("results") or [])
        page = r.get("nextPageToken")
        if not page:
            break
    return out

campaigns = ads_search(
    "SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,"
    " campaign_budget.amount_micros"
    " FROM campaign WHERE campaign.status != 'REMOVED'")
camp_meta = {}
for r in campaigns:
    cid = str(g(r, "campaign", "id") or "")
    camp_meta[cid] = {
        "name": g(r, "campaign", "name") or "-",
        "status": g(r, "campaign", "status") or "-",
        "budget": num(g(r, "campaignBudget", "amountMicros")) / 1e6,
    }

camp7 = ads_search(
    "SELECT campaign.id, campaign.name, metrics.impressions, metrics.clicks, metrics.ctr,"
    " metrics.average_cpc, metrics.cost_micros, metrics.conversions"
    " FROM campaign WHERE segments.date DURING LAST_7_DAYS"
    " ORDER BY metrics.cost_micros DESC")
camp_rows = []
for r in camp7:
    cid = str(g(r, "campaign", "id") or "")
    meta = camp_meta.get(cid) or {}
    imp = num(g(r, "metrics", "impressions"))
    clk = num(g(r, "metrics", "clicks"))
    cost = num(g(r, "metrics", "costMicros")) / 1e6
    conv = num(g(r, "metrics", "conversions"))
    st = meta.get("status", "-")
    # 过滤已移除/无活动的历史系列；但保留仍启用但零展示的系列（便于发现异常）
    if imp == 0 and clk == 0 and cost == 0 and st != "ENABLED":
        continue
    camp_rows.append({
        "id": cid,
        "name": g(r, "campaign", "name") or "-",
        "status": st,
        "budget": meta.get("budget", 0.0),
        "impressions": imp, "clicks": clk, "cost": cost, "conversions": conv,
        "ctr": (clk / imp) if imp else 0.0,
        "cpc": (cost / clk) if clk else 0.0,
        "cpa": (cost / conv) if conv else 0.0,
    })

daily = ads_search(
    "SELECT segments.date, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions"
    " FROM customer WHERE segments.date DURING LAST_7_DAYS ORDER BY segments.date")
daily_rows = [{
    "date": g(r, "segments", "date") or "-",
    "impressions": num(g(r, "metrics", "impressions")),
    "clicks": num(g(r, "metrics", "clicks")),
    "cost": num(g(r, "metrics", "costMicros")) / 1e6,
    "conversions": num(g(r, "metrics", "conversions")),
} for r in daily]

# 昨日
y_rows = ads_search(
    "SELECT campaign.id, campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions"
    " FROM campaign WHERE segments.date DURING YESTERDAY ORDER BY metrics.cost_micros DESC")
yesterday = []
for r in y_rows:
    imp = num(g(r, "metrics", "impressions"))
    clk = num(g(r, "metrics", "clicks"))
    cost = num(g(r, "metrics", "costMicros")) / 1e6
    if imp == 0 and clk == 0 and cost == 0:
        continue  # 过滤无活动的历史系列
    yesterday.append({
        "name": g(r, "campaign", "name") or "-",
        "impressions": imp, "clicks": clk, "cost": cost,
        "conversions": num(g(r, "metrics", "conversions")),
    })

search_terms = ads_search(
    "SELECT search_term_view.search_term, campaign.name, metrics.impressions, metrics.clicks,"
    " metrics.cost_micros, metrics.conversions"
    " FROM search_term_view WHERE segments.date DURING LAST_7_DAYS"
    " ORDER BY metrics.cost_micros DESC LIMIT 60")
st_rows = [{
    "term": g(r, "searchTermView", "searchTerm") or "-",
    "campaign": g(r, "campaign", "name") or "-",
    "impressions": num(g(r, "metrics", "impressions")),
    "clicks": num(g(r, "metrics", "clicks")),
    "cost": num(g(r, "metrics", "costMicros")) / 1e6,
    "conversions": num(g(r, "metrics", "conversions")),
} for r in search_terms]

kw_rows_raw = ads_search(
    "SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, campaign.name,"
    " metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions"
    " FROM keyword_view WHERE segments.date DURING LAST_7_DAYS AND metrics.impressions > 0"
    " ORDER BY metrics.impressions DESC LIMIT 60")
kw_rows = [{
    "text": g(r, "adGroupCriterion", "keyword", "text") or "-",
    "match": g(r, "adGroupCriterion", "keyword", "matchType") or "-",
    "campaign": g(r, "campaign", "name") or "-",
    "impressions": num(g(r, "metrics", "impressions")),
    "clicks": num(g(r, "metrics", "clicks")),
    "cost": num(g(r, "metrics", "costMicros")) / 1e6,
    "conversions": num(g(r, "metrics", "conversions")),
} for r in kw_rows_raw]

# GA4 抓取失败不致命：日报仍基于 Google Ads 数据生成，并在报告中标注
ga4_err = ""
T = ["0", "0", "0", "0", "0", "0"]
ga4_camp = []
ga4_land = []
ga4_ev = []
try:
    ga4_at = access_token(GA4_CID, GA4_CSEC, GA4_RTOK, "GA4")
    GA4_H = {"Authorization": "Bearer " + ga4_at}
    GA4_URL = "https://analyticsdata.googleapis.com/v1beta/properties/" + GA4_PROP + ":runReport"
    CPC_FILTER = {"andGroup": {"expressions": [
        {"filter": {"fieldName": "sessionSourceMedium", "stringFilter": {"matchType": "EXACT", "value": "google / cpc"}}},
    ]}}

    def ga4(dims, mets, dim_filter=None, limit=50):
        body = {
            "dateRanges": [{"startDate": "7daysAgo", "endDate": "yesterday"}],
            "dimensions": [{"name": d} for d in dims],
            "metrics": [{"name": m} for m in mets],
            "dimensionFilter": dim_filter or CPC_FILTER,
            "limit": limit,
        }
        return http(GA4_URL, body, GA4_H)

    def ga4_rows(dims, mets, dim_filter=None, limit=50):
        r = ga4(dims, mets, dim_filter, limit)
        return [[dv.get("value") for dv in (row.get("dimensionValues") or [])]
                + [mv.get("value") for mv in (row.get("metricValues") or [])]
                for row in (r.get("rows") or [])]

    ga4_tot = ga4_rows([], ["sessions", "engagedSessions", "engagementRate",
                            "averageSessionDuration", "keyEvents", "screenPageViews"], limit=1)
    T = ga4_tot[0] if ga4_tot else ["0", "0", "0", "0", "0", "0"]
    ga4_camp = ga4_rows(["sessionCampaignName"], ["sessions", "engagedSessions", "keyEvents"])
    ga4_land = ga4_rows(["landingPage"], ["sessions", "engagedSessions"], limit=15)
    ga4_ev = ga4_rows(["eventName"], ["eventCount"], limit=25)
except BaseException as e:
    ga4_err = str(e)[:300]

# ==================== 组装 Markdown ====================
def f1(v):
    return "{:.2f}".format(v)

def f0(v):
    return "{:.0f}".format(v)

def money(v):
    return "¥" + "{:,.2f}".format(v)

def pc(v):
    return "{:.2%}".format(v)

days = 7
end = date.today() - timedelta(days=1)
start = end - timedelta(days=days - 1)

t_imp = sum(c["impressions"] for c in camp_rows)
t_clk = sum(c["clicks"] for c in camp_rows)
t_cost = sum(c["cost"] for c in camp_rows)
t_conv = sum(c["conversions"] for c in camp_rows)
t_ctr = (t_clk / t_imp) if t_imp else 0.0
t_cpc = (t_cost / t_clk) if t_clk else 0.0
t_cpa = (t_cost / t_conv) if t_conv else 0.0

L = []
L.append("# Google Ads 日报（" + start.isoformat() + " ~ " + end.isoformat() + "）")
L.append("")
L.append("## 一、整体表现（近 7 天）")
L.append("")
L.append("| 指标 | 数值 |")
L.append("|---|---|")
L.append("| 展示 | " + f0(t_imp) + " |")
L.append("| 点击 | " + f0(t_clk) + " |")
L.append("| CTR | " + pc(t_ctr) + " |")
L.append("| 平均 CPC | " + money(t_cpc) + " |")
L.append("| 花费 | " + money(t_cost) + " |")
L.append("| 转化 | " + f1(t_conv) + " |")
L.append("| 单次转化成本 | " + (money(t_cpa) if t_conv else "-") + " |")
L.append("")

L.append("## 二、按广告系列（近 7 天）")
L.append("")
L.append("| 广告系列 | 状态 | 日预算 | 展示 | 点击 | CTR | CPC | 花费 | 转化 |")
L.append("|---|---|---|---|---|---|---|---|---|")
for c in camp_rows:
    L.append("| " + c["name"] + " | " + c["status"] + " | " + (money(c["budget"]) if c["budget"] else "-")
             + " | " + f0(c["impressions"]) + " | " + f0(c["clicks"]) + " | " + pc(c["ctr"])
             + " | " + money(c["cpc"]) + " | " + money(c["cost"]) + " | " + f1(c["conversions"]) + " |")
if not camp_rows:
    L.append("| （近 7 天无投放数据） | - | - | - | - | - | - | - | - |")
L.append("")

L.append("## 三、逐日趋势（近 7 天）")
L.append("")
L.append("| 日期 | 展示 | 点击 | 花费 | 转化 |")
L.append("|---|---|---|---|---|")
for d in daily_rows:
    L.append("| " + d["date"] + " | " + f0(d["impressions"]) + " | " + f0(d["clicks"])
             + " | " + money(d["cost"]) + " | " + f1(d["conversions"]) + " |")
if not daily_rows:
    L.append("| （无数据） | - | - | - | - |")
L.append("")

L.append("## 四、昨日表现")
L.append("")
L.append("| 广告系列 | 展示 | 点击 | 花费 | 转化 |")
L.append("|---|---|---|---|---|")
for d in yesterday:
    L.append("| " + d["name"] + " | " + f0(d["impressions"]) + " | " + f0(d["clicks"])
             + " | " + money(d["cost"]) + " | " + f1(d["conversions"]) + " |")
if not yesterday:
    L.append("| （昨日无投放数据） | - | - | - | - |")
L.append("")

L.append("## 五、搜索词 Top 15（按花费）")
L.append("")
L.append("| 搜索词 | 广告系列 | 展示 | 点击 | 花费 | 转化 |")
L.append("|---|---|---|---|---|---|")
for s in st_rows[:15]:
    L.append("| " + s["term"].replace("|", "/") + " | " + s["campaign"] + " | " + f0(s["impressions"])
             + " | " + f0(s["clicks"]) + " | " + money(s["cost"]) + " | " + f1(s["conversions"]) + " |")
if not st_rows:
    L.append("| （无搜索词数据） | - | - | - | - | - |")
L.append("")

# 否定词候选：只看「无关意图特征词」，不把零转化当唯一依据
# （账户整体零转化时，"零转化" 无法区分好坏流量，会误伤核心词）
OFF_PATTERNS = [
    "amazon", "walmart", "meituan", "flytrex", "matternet", "wing", "prime air",
    "zomato", "swiggy", "doordash",
    "kärcher", "kaercher", "kränzle", "kraenzle", "isolar", "reinigungsset",
    "bürste", "buerste", "teleskopstange", "spielzeug", "modellflug", "toy",
]
off = [s for s in st_rows if any(p in s["term"].lower() for p in OFF_PATTERNS)]
off.sort(key=lambda x: -x["cost"])
L.append("### 5.1 疑似无关流量（建议加否定关键词）")
L.append("")
if off:
    L.append("以下搜索词命中消费级/配件/外卖品牌特征，建议评估加入否定关键词：")
    L.append("")
    L.append("| 搜索词 | 花费 | 点击 | 命中特征 |")
    L.append("|---|---|---|---|")
    for s in off[:15]:
        hit = next((p for p in OFF_PATTERNS if p in s["term"].lower()), "")
        L.append("| " + s["term"].replace("|", "/") + " | " + money(s["cost"]) + " | " + f0(s["clicks"]) + " | " + hit + " |")
else:
    L.append("无（近 7 天搜索词未命中消费级/配件特征词）")
L.append("")

waste = [s for s in st_rows if s["cost"] > 0 and s["conversions"] == 0 and s["clicks"] >= 2 and s not in off]
L.append("### 5.2 高花费零转化搜索词（待观察）")
L.append("")
if t_conv == 0:
    L.append("> ⚠ 近 7 天账户整体零转化，此表暂不具备判断力（可能是流量不足而非词本身差），仅供参考。")
    L.append("")
if waste:
    L.append("| 搜索词 | 花费 | 点击 |")
    L.append("|---|---|---|")
    for s in waste[:15]:
        L.append("| " + s["term"].replace("|", "/") + " | " + money(s["cost"]) + " | " + f0(s["clicks"]) + " |")
else:
    L.append("无")
L.append("")

L.append("## 六、关键词表现（高展示优先）")
L.append("")
L.append("| 关键词 | 匹配 | 广告系列 | 展示 | 点击 | CTR | 花费 |")
L.append("|---|---|---|---|---|---|---|")
for k in kw_rows[:15]:
    ctr = (k["clicks"] / k["impressions"]) if k["impressions"] else 0.0
    L.append("| " + k["text"].replace("|", "/") + " | " + str(k["match"]) + " | " + k["campaign"]
             + " | " + f0(k["impressions"]) + " | " + f0(k["clicks"]) + " | " + pc(ctr) + " | " + money(k["cost"]) + " |")
if not kw_rows:
    L.append("| （无关键词数据） | - | - | - | - | - | - |")
L.append("")

L.append("## 七、网站互动（GA4 · google/cpc，近 7 天）")
L.append("")
if ga4_err:
    L.append("> ⚠ GA4 数据获取失败：" + ga4_err + "（本期报告仅含 Google Ads 数据）")
    L.append("")
L.append("| 指标 | 数值 |")
L.append("|---|---|")
L.append("| 会话 | " + f0(num(T[0])) + " |")
L.append("| 互动会话 | " + f0(num(T[1])) + " |")
L.append("| 互动率 | " + pc(num(T[2])) + " |")
L.append("| 平均会话时长 | " + f0(num(T[3])) + "s |")
L.append("| 关键事件 | " + f0(num(T[4])) + " |")
L.append("| 页面浏览 | " + f0(num(T[5])) + " |")
L.append("")
L.append("### 7.1 按广告系列（GA4 会话）")
L.append("")
L.append("| 广告系列 | 会话 | 互动会话 | 关键事件 |")
L.append("|---|---|---|---|")
for r in ga4_camp:
    L.append("| " + str(r[0]) + " | " + f0(num(r[1])) + " | " + f0(num(r[2])) + " | " + f0(num(r[3])) + " |")
if not ga4_camp:
    L.append("| （无会话数据） | - | - | - |")
L.append("")
L.append("### 7.2 落地页")
L.append("")
L.append("| 落地页 | 会话 | 互动会话 |")
L.append("|---|---|---|")
for r in ga4_land[:10]:
    L.append("| " + str(r[0]).replace("|", "/") + " | " + f0(num(r[1])) + " | " + f0(num(r[2])) + " |")
if not ga4_land:
    L.append("| （无数据） | - | - |")
L.append("")

L.append("## 八、广告 → 网站漏斗核对")
L.append("")
L.append("| 广告系列 | Ads 点击 | GA4 会话 | 落地率 |")
L.append("|---|---|---|---|")
ga4_by_name = {str(r[0]): num(r[1]) for r in ga4_camp}
for c in camp_rows:
    gs = ga4_by_name.get(c["name"], 0.0)
    L.append("| " + c["name"] + " | " + f0(c["clicks"]) + " | " + f0(gs) + " | "
             + (pc(gs / c["clicks"]) if c["clicks"] else "-") + " |")
L.append("")
L.append("> 落地率 = GA4 会话 / Ads 点击。明显低于 80% 说明点击在落地环节流失")
L.append("> （页面加载慢、重定向断链、或用户秒关页）。")
L.append("")

# ==================== 建议（规则式） ====================
L.append("## 九、建议")
L.append("")
tips = []
enabled = [c for c in camp_rows if c["status"] == "ENABLED"]
paused = [c for c in camp_rows if c["status"] == "PAUSED"]
if not camp_rows:
    tips.append("近 7 天无任何投放数据：请确认广告系列是否处于启用状态、预算与出价是否正常。")
if enabled:
    for c in enabled:
        if c["impressions"] >= 100 and c["ctr"] < 0.02:
            tips.append("「" + c["name"] + "」CTR 仅 " + pc(c["ctr"]) + "（展示 " + f0(c["impressions"])
                        + "）：建议检查关键词匹配是否过宽、补充否定关键词，或优化广告文案。")
        if c["budget"] and c["cost"] > 0:
            pace = c["cost"] / days / c["budget"]
            if pace > 1.2:
                tips.append("「" + c["name"] + "」日均花费 " + money(c["cost"] / days) + " 已超日预算 "
                            + money(c["budget"]) + " 的 " + pc(pace) + "：注意预算消耗节奏。")
if paused:
    tips.append("当前暂停中：" + "、".join(p["name"] for p in paused[:6])
                + ("等 " + str(len(paused)) + " 个" if len(paused) > 6 else "") + " —— 如需恢复投放请确认预期。")
if off:
    tips.append("发现 " + str(len(off)) + " 个疑似无关搜索词（合计 " + money(sum(s["cost"] for s in off))
                + "），建议评估加入否定关键词，减少无效消耗。")
low_ctr_kw = [k for k in kw_rows if k["impressions"] >= 20 and (k["clicks"] / k["impressions"] if k["impressions"] else 0) < 0.02]
if low_ctr_kw:
    tips.append("高展示低点击关键词 " + str(len(low_ctr_kw)) + " 个，如「"
                + low_ctr_kw[0]["text"] + "」（展示 " + f0(low_ctr_kw[0]["impressions"])
                + "，CTR " + pc((low_ctr_kw[0]["clicks"] / low_ctr_kw[0]["impressions"]) if low_ctr_kw[0]["impressions"] else 0)
                + "）：建议优化对应广告文案或落地页相关性。")
if t_clk and num(T[0]):
    gap = 1 - (num(T[0]) / t_clk)
    if gap > 0.2:
        tips.append("Ads 点击 " + f0(t_clk) + " 次，但 GA4 google/cpc 会话仅 " + f0(num(T[0]))
                    + " 次（缺口 " + pc(gap) + "）：建议核查落地页加载速度、重定向链路与 GTM 触发。")
if t_conv == 0 and t_clk >= 20:
    tips.append("近 7 天 " + f0(t_clk) + " 次点击但零转化：若样本已足，建议检查落地页转化路径与询盘表单可用性。")
if not tips:
    tips.append("整体表现平稳，无需紧急操作。")
for t in tips:
    L.append("- " + t)
L.append("")

md = "\\n".join(L)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(md)
print("REPORT_READY " + str(len(md)) + " chars")
`
}

// ---------- 阿里云邮件推送 DM（RPC HMAC-SHA1 手写签名，零依赖，与 gsc-daily-report 同款） ----------
function dmPercentEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/\+/g, '%20')
    .replace(/\*/g, '%2A')
    .replace(/%7E/g, '~')
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// 轻量 Markdown→HTML（只覆盖日报用到的：h1/h2/h3、表格、列表、引用、段落）
function mdToHtml(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []
  let i = 0
  const isTableSep = (l: string) => /^\s*\|?[\s:|-]+\|?\s*$/.test(l)
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('# ')) {
      out.push(`<h1 style="font-size:20px;margin:0 0 12px;color:#1a1a1a;">${escapeHtml(line.slice(2))}</h1>`)
      i++
    } else if (line.startsWith('## ')) {
      out.push(`<h2 style="font-size:16px;margin:20px 0 8px;color:#1a1a1a;border-left:4px solid #34a853;padding-left:8px;">${escapeHtml(line.slice(3))}</h2>`)
      i++
    } else if (line.startsWith('### ')) {
      out.push(`<h3 style="font-size:14px;margin:14px 0 6px;color:#333;">${escapeHtml(line.slice(4))}</h3>`)
      i++
    } else if (line.includes('|') && isTableSep(lines[i + 1] || '')) {
      const header = line.split('|').slice(1, -1).map((c) => c.trim())
      const rowsOut: string[][] = []
      i += 2
      while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
        rowsOut.push(lines[i].split('|').slice(1, -1).map((c) => c.trim()))
        i++
      }
      const th = (c: string) => `<th style="padding:6px 10px;text-align:left;background:#eef7f0;border-bottom:2px solid #34a853;">${escapeHtml(c)}</th>`
      const td = (c: string) => `<td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(c)}</td>`
      out.push(
        '<table style="border-collapse:collapse;font-size:13px;margin:8px 0 12px;">',
        `<tr>${header.map(th).join('')}</tr>`,
        ...rowsOut.map((r) => `<tr>${r.map(td).join('')}</tr>`),
        '</table>',
      )
    } else if (line.startsWith('> ')) {
      out.push(`<p style="margin:4px 0;padding-left:12px;border-left:3px solid #d0d7de;color:#57606a;font-size:12px;">${escapeHtml(line.slice(2))}</p>`)
      i++
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      out.push(`<p style="margin:4px 0;padding-left:16px;">• ${escapeHtml(line.slice(2))}</p>`)
      i++
    } else if (line.trim() === '') {
      i++
    } else {
      out.push(`<p style="margin:6px 0;color:#333;">${escapeHtml(line)}</p>`)
      i++
    }
  }
  return `<div style="font-family:-apple-system,'Segoe UI',Arial,sans-serif;color:#1a1a1a;max-width:760px;">${out.join('\n')}</div>`
}

async function sendDmReport(md: string, day: string): Promise<void> {
  const to = (process.env.DM_TO || 'info@droneworld.tech').trim()
  const accessKeyId = process.env.DIRECTMAIL_ACCESS_KEY_ID
  const accessKeySecret = process.env.DIRECTMAIL_ACCESS_KEY_SECRET
  const account = process.env.DIRECTMAIL_ACCOUNT
  if (!accessKeyId || !accessKeySecret || !account) {
    console.log('[ads-daily-report] DIRECTMAIL_* 未配置，跳过邮件推送')
    return
  }
  const params: Record<string, string> = {
    AccessKeyId: accessKeyId,
    Action: 'SingleSendMail',
    Format: 'JSON',
    RegionId: process.env.DIRECTMAIL_REGION || 'cn-hangzhou',
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: crypto.randomUUID(),
    SignatureVersion: '1.0', // 关键：DM 只接受 1.0（不是通用 POP 的 1.1）
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    Version: '2015-11-23',
    AccountName: account,
    AddressType: '1',
    ReplyToAddress: 'false',
    ToAddress: to,
    FromAlias: 'Partdro Ads',
    Subject: `[Partdro] Google Ads 日报 ${day}`,
    ClickTrace: '1',
    HtmlBody: mdToHtml(md),
    TextBody: md,
  }
  const canonical = Object.keys(params).sort()
    .map((k) => `${dmPercentEncode(k)}=${dmPercentEncode(params[k])}`).join('&')
  const stringToSign = `POST&${dmPercentEncode('/')}&${dmPercentEncode(canonical)}`
  params.Signature = crypto.createHmac('sha1', `${accessKeySecret}&`).update(stringToSign).digest('base64')

  const res = await fetch('https://dm.aliyuncs.com/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  })
  const raw = await res.text()
  let parsed: Record<string, unknown> = {}
  try { parsed = JSON.parse(raw) } catch { /* 非 JSON 走错误分支 */ }
  if (!res.ok || parsed.Code) {
    throw new Error(`DirectMail failed (${res.status}): ${String(parsed.Code || '')} ${String(parsed.Message || raw).slice(0, 300)}`)
  }
  console.log('[ads-daily-report] 日报邮件已发送至:', to, 'EnvId:', String(parsed.EnvId ?? ''))
}

// ---------- OSS 私有写 + 签名读 URL（V1 签名） ----------
function ossPutObject(key: string, body: string): Promise<void> {
  const bucket = process.env.OSS_BUCKET!
  const region = process.env.OSS_REGION || 'cn-hongkong'
  const ak = process.env.OSS_AK_ID!
  const sk = process.env.OSS_AK_SECRET!
  const host = `${bucket}.oss-${region}.aliyuncs.com`
  const date = new Date().toUTCString()
  const ct = 'text/markdown; charset=utf-8'
  const stringToSign = `PUT\n\n${ct}\n${date}\n/${bucket}/${key}`
  const sig = crypto.createHmac('sha1', sk).update(stringToSign).digest('base64')
  return fetch(`https://${host}/${key}`, {
    method: 'PUT',
    headers: { Authorization: `OSS ${ak}:${sig}`, Date: date, 'Content-Type': ct },
    body,
  }).then(async (res) => {
    if (!res.ok) throw new Error(`OSS put ${key} -> ${res.status}: ${(await res.text()).slice(0, 300)}`)
  })
}

function ossSignedGetUrl(key: string, hours = 168): string {
  const bucket = process.env.OSS_BUCKET
  const region = process.env.OSS_REGION || 'cn-hongkong'
  const ak = process.env.OSS_AK_ID
  const sk = process.env.OSS_AK_SECRET
  if (!bucket || !ak || !sk) return ''
  const host = `${bucket}.oss-${region}.aliyuncs.com`
  const expires = Math.floor(Date.now() / 1000) + hours * 3600
  const stringToSign = `GET\n\n\n${expires}\n/${bucket}/${key}`
  const sig = crypto.createHmac('sha1', sk).update(stringToSign).digest('base64')
  return `https://${host}/${key}?OSSAccessKeyId=${encodeURIComponent(ak)}&Expires=${expires}&Signature=${encodeURIComponent(sig)}`
}

// 本地测试用导出（deploy/invoke 不受影响）
export const __test = { buildAdsReportScript, mdToHtml, sendDmReport }

// ---------- FC 入口 ----------
export const handler = async () => {
  const required = [
    'E2B_API_KEY', 'E2B_API_URL', 'E2B_DOMAIN',
    'ADS_DEVELOPER_TOKEN', 'ADS_CLIENT_ID', 'ADS_CLIENT_SECRET', 'ADS_REFRESH_TOKEN', 'ADS_CUSTOMER_ID',
    'GA4_CLIENT_ID', 'GA4_CLIENT_SECRET', 'GA4_REFRESH_TOKEN', 'GA4_PROPERTY_ID',
    'OSS_BUCKET', 'OSS_AK_ID', 'OSS_AK_SECRET',
  ]
  for (const k of required) {
    if (!process.env[k]) throw new Error(`missing env: ${k}`)
  }

  const sbx = await Sandbox.create('code-interpreter-v1', {
    apiKey: process.env.E2B_API_KEY,
    apiUrl: process.env.E2B_API_URL,
    domain: process.env.E2B_DOMAIN,
    timeoutMs: 300_000,
  })
  console.log('[ads-daily-report] sandbox created:', sbx.sandboxId, 'customer:', CUSTOMER_ID)
  let md = ''
  try {
    const script = buildAdsReportScript({
      adsClientId: process.env.ADS_CLIENT_ID!,
      adsClientSecret: process.env.ADS_CLIENT_SECRET!,
      adsRefreshToken: process.env.ADS_REFRESH_TOKEN!,
      adsDeveloperToken: process.env.ADS_DEVELOPER_TOKEN!,
      adsCustomerId: process.env.ADS_CUSTOMER_ID!,
      adsLoginCustomerId: process.env.ADS_LOGIN_CUSTOMER_ID || '',
      ga4ClientId: process.env.GA4_CLIENT_ID!,
      ga4ClientSecret: process.env.GA4_CLIENT_SECRET!,
      ga4RefreshToken: process.env.GA4_REFRESH_TOKEN!,
      ga4PropertyId: process.env.GA4_PROPERTY_ID!,
    })
    await sbx.files.write('/home/user/ads_report.py', script)
    const run = await sbx.commands.run('python3 /home/user/ads_report.py')
    if (run.exitCode !== 0) {
      throw new Error(`report script failed (exit ${run.exitCode}): ${(run.stderr || run.stdout || '').slice(-1000)}`)
    }
    const f = await sbx.files.read('/home/user/report.md')
    md = typeof f === 'string' ? f : Buffer.from(f as unknown as ArrayBuffer).toString('utf8')
  } finally {
    await sbx.kill().catch(() => {})
  }

  const day = new Date().toISOString().slice(0, 10)
  const key = `ads-reports/${day}.md`
  await ossPutObject(key, md)
  const viewUrl = ossSignedGetUrl(key)

  console.log('===== ADS DAILY REPORT (' + key + ') =====')
  console.log(md)
  console.log('===== END REPORT =====')
  console.log('[ads-daily-report] 报告已存 OSS，7 天有效下载链接:', viewUrl)

  // 邮件推送（失败不影响 OSS 存档与下次调度；结果写入返回体便于核对）
  let email: { ok: boolean; error?: string } = { ok: false }
  try {
    await sendDmReport(md, day)
    email = { ok: true }
  } catch (e) {
    email = { ok: false, error: (e as Error).message }
    console.error('[ads-daily-report] 邮件推送失败（OSS 存档不受影响）:', (e as Error).message)
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true, ossKey: key, email }) }
}
