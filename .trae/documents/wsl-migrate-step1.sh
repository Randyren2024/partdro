#!/bin/bash
set -e
SRC="/mnt/c/Users/81102/Desktop/partdro"
DST="$HOME/partdro"
mkdir -p "$DST"

echo "=== rsync incremental sync ==="
rsync -a \
  --exclude="node_modules" \
  --exclude="dist" \
  --exclude=".vite" \
  --exclude="screenshots" \
  --exclude=".git/objects/pack" \
  "$SRC/" "$DST/" 2>&1 | tail -5

echo "=== cleanup Zone.Identifier files ==="
find "$DST" -name '*:Zone.Identifier' -type f -print -delete | wc -l

echo "=== verify top-level ==="
ls "$DST" | grep -v ':Zone.Identifier' | head -30
echo "=== subdirs ==="
ls "$DST/src" 2>&1 | head -10
ls "$DST/public" 2>&1 | head -5
ls "$DST/data" 2>&1 | head -5
ls "$DST/.trae/documents" 2>&1 | head -5

echo "=== size & file count ==="
du -sh "$DST"
find "$DST" -type f | wc -l
