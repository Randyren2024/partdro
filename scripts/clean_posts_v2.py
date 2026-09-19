#!/usr/bin/env python3
# 清洗 posts_all.json：删除噪声子版 + 内容级噪音过滤 + 补齐 lang + 重新统计
import json, re, sys

PATH = 'data/v2_deep/posts_all.json'
# 噪声子版：玩梗/影视/遥控车/科幻/网球记者/动画/游戏/招生
BLACKLIST_SUBS = {
    'CDrama', 'rccars', 'HFY', 'BirdsArentReal', 'Warframe', 'tennis', '12ozmouse',
    'MurderDrones', 'SkibidiToiletEmpire', 'FACADEcamp', 'shortstories',
    'GearsOfWars', 'HaloInfinity', 'Tekkens', 'UpGameShop', '247videogame', 'GameProfessional',
    'UTAdmissions', 'chanceme', 'TAMUAdmissions', 'tipofmyjoystick',
    'factorio', 'Factoriohno', 'spaceengineers', 'KerbalAcademy', 'Starminer_Game',
    'SpaceflightSimulator', 'SpaceCraftGame', 'X4Foundations', 'Stormworks', 'raresnacksTR',
}
# 内容级噪音：扫地拖地机器人 + Ozmo网球记者/动画角色 + Anybots杂谈，除非同时涉及窗墙/光伏/高楼/无人机
NOISE_RE = re.compile(r'\bozmo\b|deebot|ecovacs|yeedi|roborock|roomba|irobot|robot vacuum|robot mop|mopping|anybots', re.I)
KEEP_RE = re.compile(r'window|facade|solar|skyscraper|high.?rise|drone|uav', re.I)
# 标题级噪音：游戏预告片垃圾网络
TITLE_NOISE_RE = re.compile(r'official (launch|gameplay|teaser) trailer|launch trailer|gameplay trailer', re.I)

def detect_lang(t):
    t = t.lower()
    if re.search(r'limpieza|limpiar', t): return 'es'
    if re.search(r'nettoyage|nettoyer', t): return 'fr'
    if re.search(r'reinigung|reinigen|fassaden', t): return 'de'
    if re.search(r'pulizia|pulire', t): return 'it'
    return 'en'

data = json.load(open(PATH))
posts = data['submissions']
before = len(posts)

removed, langs_fixed = [], 0
content_removed = 0
cleaned = []
for p in posts:
    if p.get('subreddit') in BLACKLIST_SUBS:
        removed.append((p.get('subreddit'), p.get('title', '')[:60]))
        continue
    t = f"{p.get('title','')} {p.get('selftext','')}"
    if TITLE_NOISE_RE.search(p.get('title', '')):
        content_removed += 1
        continue
    if NOISE_RE.search(t) and not KEEP_RE.search(t):
        content_removed += 1
        continue
    if not p.get('lang') or p.get('lang') == 'undefined':
        p['lang'] = detect_lang(f"{p.get('title','')} {p.get('selftext','')}")
        langs_fixed += 1
    cleaned.append(p)

data['submissions'] = cleaned
data['total'] = len(cleaned)
data['cleaned_at'] = __import__('datetime').datetime.utcnow().isoformat() + 'Z'

json.dump(data, open(PATH, 'w'), ensure_ascii=False, indent=2)
print(f'清洗前: {before} → 清洗后: {len(cleaned)} (删子版 {len(removed)}, 删内容噪音 {content_removed})')
print(f'lang 补齐: {langs_fixed}')
for sub, title in removed[:10]:
    print(f'  删除 r/{sub}: {title}')

# 重新统计
from collections import Counter
langs = Counter(p['lang'] for p in cleaned)
sources = Counter(p['source'] for p in cleaned)
subs = Counter(p['subreddit'] for p in cleaned)
print('\n语种:', dict(langs))
print('来源:', dict(sources))
print('\nTop 20 子版:')
for name, n in subs.most_common(20):
    print(f'  r/{name}: {n}')
years = Counter(p['created_iso'][:4] for p in cleaned if p.get('created_iso'))
print('\n按年份:', dict(sorted(years.items())))
recent = sum(1 for p in cleaned if p.get('created_utc') and float(p['created_utc']) > __import__('time').time() - 86400*90)
print(f'近90天新鲜帖: {recent}')
