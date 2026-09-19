#!/usr/bin/env python3
# 生成分析 digest：按时间倒序，每帖一行压缩格式，供 AI 分批细读
# 用法: python3 scripts/make_digest.py [批数]  （默认 4）
import json, sys

parts = int(sys.argv[1]) if len(sys.argv) > 1 else 4

data = json.load(open('data/v2_deep/posts_all.json'))
posts = [p for p in data['submissions'] if p.get('created_utc')]
for p in posts:
    try:
        p['created_utc'] = float(p['created_utc'])
    except (TypeError, ValueError):
        p['created_utc'] = 0
posts.sort(key=lambda p: p['created_utc'], reverse=True)

# 分批细读
n = len(posts)
chunk = (n + parts - 1) // parts
for i in range(parts):
    part = posts[i * chunk:(i + 1) * chunk]
    lines = []
    for j, p in enumerate(part):
        idx = i * chunk + j
        date = p['created_iso'][:10] if p.get('created_iso') else '????-??-??'
        title = (p.get('title') or '').replace('\n', ' ')[:90]
        body = (p.get('selftext') or '').replace('\n', ' ').strip()
        # 跳过无信息量正文
        if body.lower() in ('[removed]', '[deleted]', ''):
            body = ''
        body = body[:220]
        line = f"#{idx}|{date}|r/{p.get('subreddit','?')}|↑{p.get('score',0)}|💬{p.get('num_comments',0)}| {title}"
        if body:
            line += f" || {body}"
        lines.append(line)
    open(f'data/v2_deep/digest_part{i+1}.txt', 'w').write('\n'.join(lines))
    print(f'digest_part{i+1}.txt: {len(part)} 帖, {sum(len(l) for l in lines)//1024}KB')

# 高价值样本（score>=10 或 评论>=10 单独一份细读）
hi = [p for p in posts if p.get('score', 0) >= 10 or p.get('num_comments', 0) >= 10]
lines = []
for j, p in enumerate(hi):
    date = p['created_iso'][:10] if p.get('created_iso') else '????-??-??'
    title = (p.get('title') or '').replace('\n', ' ')[:90]
    body = (p.get('selftext') or '').replace('\n', ' ').strip()[:400]
    if body.lower() in ('[removed]', '[deleted]'):
        body = ''
    line = f"H{j}|{date}|r/{p.get('subreddit','?')}|↑{p.get('score',0)}|💬{p.get('num_comments',0)}| {title}"
    if body:
        line += f" || {body}"
    lines.append(line)
open('data/v2_deep/digest_highvalue.txt', 'w').write('\n'.join(lines))
print(f'digest_highvalue.txt: {len(hi)} 帖 (score>=10 或评论>=10), {sum(len(l) for l in lines)//1024}KB')
