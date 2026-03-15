#!/usr/bin/env python3
"""
Fetches Scryfall Oracle Cards bulk data and extracts unique card names.
Output: data/mtg.json — a JSON array of card name strings.
"""
import json
import os
import requests

def fetch_mtg_names():
    # Step 1: Get bulk data download URL
    print("Fetching Scryfall bulk data metadata...")
    bulk_meta = requests.get("https://api.scryfall.com/bulk-data/oracle-cards").json()
    download_url = bulk_meta["download_uri"]

    # Step 2: Download (streaming, ~100MB)
    print(f"Downloading: {download_url}")
    resp = requests.get(download_url, stream=True)
    resp.raise_for_status()
    cards = resp.json()
    print(f"Downloaded {len(cards)} card objects")

    # Step 3: Extract names, filtering out tokens/emblems/etc.
    names = set()
    excluded_layouts = {'token', 'double_faced_token', 'emblem', 'art_series'}

    for card in cards:
        if card.get('layout') in excluded_layouts:
            continue
        name = card['name']
        # Skip split/adventure card full names (keep the cool half)
        if ' // ' in name:
            for half in name.split(' // '):
                if len(half) > 2:
                    names.add(half)
        else:
            names.add(name)

    return sorted(names)


if __name__ == '__main__':
    os.makedirs('data', exist_ok=True)
    names = fetch_mtg_names()
    with open('data/mtg.json', 'w') as f:
        json.dump(names, f, separators=(',', ':'))
    print(f"Wrote {len(names)} MTG card names to data/mtg.json")
