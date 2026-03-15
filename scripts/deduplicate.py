#!/usr/bin/env python3
"""
Cross-references MTG and metal data to remove ambiguous entries
that exist in both lists.
"""
import json

with open('data/mtg.json') as f:
    mtg_names = json.load(f)

with open('data/metal.json') as f:
    metal = json.load(f)

# Build lowercase lookup sets
mtg_lower = {name.lower(): name for name in mtg_names}
metal_lower = {title.lower(): i for i, title in enumerate(metal['s'])}

# Find overlaps
overlaps = set(mtg_lower.keys()) & set(metal_lower.keys())
print(f"Found {len(overlaps)} overlapping names:")
for name in sorted(overlaps):
    print(f"  - {mtg_lower[name]} (MTG) / {metal['s'][metal_lower[name]]} by {metal['b'][metal_lower[name]]} (Metal)")

# Remove overlaps from both
mtg_clean = [n for n in mtg_names if n.lower() not in overlaps]
metal_indices = [i for i in range(len(metal['s'])) if metal['s'][i].lower() not in overlaps]

metal_clean = {
    "s": [metal['s'][i] for i in metal_indices],
    "b": [metal['b'][i] for i in metal_indices],
    "a": [metal['a'][i] for i in metal_indices]
}

with open('data/mtg.json', 'w') as f:
    json.dump(mtg_clean, f, separators=(',', ':'))

with open('data/metal.json', 'w') as f:
    json.dump(metal_clean, f, separators=(',', ':'), ensure_ascii=False)

print(f"Cleaned: {len(mtg_clean)} MTG cards, {len(metal_clean['s'])} metal songs")
print(f"Removed {len(mtg_names) - len(mtg_clean)} MTG + {len(metal['s']) - len(metal_clean['s'])} metal overlaps")
