#!/usr/bin/env python3
"""
Merge all Reddit cleaning-drone data into unified JSON files.

Outputs:
  data/merged_posts.json   — all unique posts (clean + filtered)
  data/merged_comments.json — all comment files combined by post ID
"""

import json
import os
import re
from datetime import datetime, timezone

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
V2_DIR = os.path.join(DATA_DIR, 'v2_deep')

def load_json(path):
    with open(path) as f:
        return json.load(f)

def safe_utc(val):
    """Normalize created_utc to int."""
    if isinstance(val, str):
        return int(val) if val.isdigit() else 0
    return int(val) if val else 0

# --- Step 1: Merge posts ---
pp = load_json(os.path.join(V2_DIR, 'posts_pullpush.json'))
wb = load_json(os.path.join(V2_DIR, 'posts_webbridge.json'))
clean = load_json(os.path.join(V2_DIR, 'posts_all.json'))
clean_ids = {s['id'] for s in clean['submissions']}

all_posts = {}
for src_name, data in [('pullpush', pp), ('webbridge', wb)]:
    for s in data['submissions']:
        sid = s['id']
        if sid not in all_posts:
            post = s.copy()
            post['_filtered'] = sid not in clean_ids
            all_posts[sid] = post

posts_list = sorted(all_posts.values(), key=lambda x: safe_utc(x.get('created_utc', 0)), reverse=True)
clean_count = sum(1 for p in posts_list if not p['_filtered'])
filtered_count = sum(1 for p in posts_list if p['_filtered'])

merged_posts = {
    'fetched_at': datetime.now(timezone.utc).isoformat(),
    'description': 'Merged & deduplicated Reddit posts about cleaning drones. _filtered=true means removed during noise cleaning.',
    'sources': {
        'pullpush_raw': pp.get('total', len(pp['submissions'])),
        'webbridge_raw': wb.get('total', len(wb['submissions'])),
    },
    'total': len(posts_list),
    'clean_count': clean_count,
    'filtered_count': filtered_count,
    'submissions': posts_list,
}

out_posts = os.path.join(DATA_DIR, 'merged_posts.json')
with open(out_posts, 'w') as f:
    json.dump(merged_posts, f, ensure_ascii=False, indent=2)
print(f'merged_posts.json: {len(posts_list)} posts ({clean_count} clean + {filtered_count} filtered)')

# --- Step 2: Merge comments ---
comment_files = sorted([
    f for f in os.listdir(DATA_DIR)
    if f.startswith('reddit_post_') and f.endswith('_comments.json')
])

merged_comments = {}
for cf in comment_files:
    data = load_json(os.path.join(DATA_DIR, cf))
    post_url = data.get('post_url', '')
    match = re.search(r'/comments/([a-z0-9]+)/', post_url)
    post_id = match.group(1) if match else cf.replace('reddit_post_', '').replace('_comments.json', '')
    merged_comments[post_id] = {
        'post_url': post_url,
        'post_title': data.get('post_title', ''),
        'source': data.get('source', 'unknown'),
        'fetched_at': data.get('fetched_at', ''),
        'comment_count': data.get('comment_count', len(data.get('comments', []))),
        'comments': data.get('comments', []),
    }

out_comments = os.path.join(DATA_DIR, 'merged_comments.json')
with open(out_comments, 'w') as f:
    json.dump(merged_comments, f, ensure_ascii=False, indent=2)
total_comments = sum(c['comment_count'] for c in merged_comments.values())
print(f'merged_comments.json: {len(merged_comments)} posts, {total_comments} comments')

# --- Step 3: Validation ---
errors = []
if len(posts_list) != 1561:
    errors.append(f'Expected 1561 total posts, got {len(posts_list)}')
if filtered_count != 541:
    errors.append(f'Expected 541 filtered posts, got {filtered_count}')
if len(merged_comments) != 6:
    errors.append(f'Expected 6 comment entries, got {len(merged_comments)}')
missing_clean = clean_ids - set(all_posts.keys())
if missing_clean:
    errors.append(f'{len(missing_clean)} clean posts missing from merged')
if len(posts_list) != len(set(p['id'] for p in posts_list)):
    errors.append('Duplicate post IDs found!')

if errors:
    print('\nVALIDATION ERRORS:')
    for e in errors:
        print(f'  - {e}')
else:
    print('\nValidation passed.')

# --- Step 4: Archive old files ---
archive_dir = os.path.join(DATA_DIR, 'archive')
os.makedirs(archive_dir, exist_ok=True)
archived = []
for af in ['reddit_d15r.json', 'reddit_d15r_search.json', 'reddit_d15r.csv', 'reddit_d15r_search.csv']:
    src = os.path.join(DATA_DIR, af)
    if os.path.exists(src):
        os.rename(src, os.path.join(archive_dir, af))
        archived.append(af)
        print(f'Archived: {af}')
if not archived:
    print('No files to archive.')
