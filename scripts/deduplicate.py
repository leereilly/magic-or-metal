#!/usr/bin/env python3
"""
Cross-references MTG and metal data shards to remove ambiguous entries
that exist in both lists.
"""
import glob
import json

# Load all MTG shards
mtg_shards = {}
all_mtg_names = {}
for path in sorted(glob.glob('data/mtg-*.json')):
    with open(path) as f:
        names = json.load(f)
    mtg_shards[path] = names
    for name in names:
        all_mtg_names[name.lower()] = name

# Load all metal shards
metal_shards = {}
all_metal_titles = {}
for path in sorted(glob.glob('data/metal-*.json')):
    with open(path) as f:
        metal = json.load(f)
    metal_shards[path] = metal
    for i, title in enumerate(metal['s']):
        all_metal_titles[title.lower()] = (path, i, title)

# Find overlaps
overlaps = set(all_mtg_names.keys()) & set(all_metal_titles.keys())
print(f"Found {len(overlaps)} overlapping names:")
for name in sorted(overlaps):
    info = all_metal_titles[name]
    print(f"  - {all_mtg_names[name]} (MTG) / {info[2]} (Metal)")

# Remove overlaps from MTG shards
total_mtg_removed = 0
for path, names in mtg_shards.items():
    clean = [n for n in names if n.lower() not in overlaps]
    removed = len(names) - len(clean)
    total_mtg_removed += removed
    with open(path, 'w') as f:
        json.dump(clean, f, separators=(',', ':'))
    if removed:
        print(f"  {path}: removed {removed}")

# Remove overlaps from metal shards
total_metal_removed = 0
for path, metal in metal_shards.items():
    keep = [i for i in range(len(metal['s'])) if metal['s'][i].lower() not in overlaps]
    removed = len(metal['s']) - len(keep)
    total_metal_removed += removed
    clean = {
        "s": [metal['s'][i] for i in keep],
        "b": [metal['b'][i] for i in keep],
        "a": [metal['a'][i] for i in keep]
    }
    with open(path, 'w') as f:
        json.dump(clean, f, separators=(',', ':'), ensure_ascii=False)
    if removed:
        print(f"  {path}: removed {removed}")

print(f"\nRemoved {total_mtg_removed} MTG + {total_metal_removed} metal overlaps")
