#!/usr/bin/env python3
"""
Fetches Scryfall Oracle Cards bulk data and extracts unique card names.
Output: data/mtg-{0..N}.json — sharded JSON arrays of card name strings.
"""
import json
import math
import os
import requests

SHARD_COUNT = 5

def fetch_mtg_names():
    print("Fetching Scryfall bulk data metadata...")
    bulk_meta = requests.get("https://api.scryfall.com/bulk-data/oracle-cards").json()
    download_url = bulk_meta["download_uri"]

    print(f"Downloading: {download_url}")
    resp = requests.get(download_url, stream=True)
    resp.raise_for_status()
    cards = resp.json()
    print(f"Downloaded {len(cards)} card objects")

    names = set()
    excluded_layouts = {'token', 'double_faced_token', 'emblem', 'art_series'}

    for card in cards:
        if card.get('layout') in excluded_layouts:
            continue
        name = card['name']
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

    # Split into shards
    shard_size = math.ceil(len(names) / SHARD_COUNT)
    for i in range(SHARD_COUNT):
        shard = names[i * shard_size : (i + 1) * shard_size]
        with open(f'data/mtg-{i}.json', 'w') as f:
            json.dump(shard, f, separators=(',', ':'))
        print(f"data/mtg-{i}.json: {len(shard)} cards")

    print(f"Wrote {len(names)} MTG card names across {SHARD_COUNT} shards")
