#!/usr/bin/env python3
"""
Fetches metal song titles from MusicBrainz API.
Output: data/metal.json — {s: [titles], b: [bands], a: [albums]}
"""
import json
import os
import time
import requests

GENRES = [
    "heavy metal", "thrash metal", "death metal", "black metal",
    "power metal", "doom metal", "speed metal", "progressive metal",
    "symphonic metal", "folk metal", "melodic death metal",
    "groove metal", "nu metal", "metalcore", "sludge metal",
    "gothic metal", "industrial metal", "stoner metal",
    "viking metal", "grindcore"
]

HEADERS = {
    "User-Agent": "MagicOrMetal/1.0 (https://github.com/leereilly/magic-or-metal)",
    "Accept": "application/json"
}


def fetch_songs_for_genre(genre, max_songs=500):
    """Fetch song titles for a specific genre tag from MusicBrainz."""
    songs = []
    offset = 0
    limit = 100

    while offset < max_songs:
        url = "https://musicbrainz.org/ws/2/recording"
        params = {
            "query": f'tag:"{genre}"',
            "limit": limit,
            "offset": offset,
            "fmt": "json"
        }

        try:
            resp = requests.get(url, params=params, headers=HEADERS, timeout=30)
        except requests.exceptions.RequestException as e:
            print(f"  Request error: {e}, retrying...")
            time.sleep(3)
            continue

        if resp.status_code == 503:
            print("  Rate limited, waiting...")
            time.sleep(3)
            continue

        if resp.status_code != 200:
            print(f"  HTTP {resp.status_code}, skipping offset {offset}")
            break

        data = resp.json()
        recordings = data.get("recordings", [])
        if not recordings:
            break

        for rec in recordings:
            title = rec.get("title", "")
            artists = rec.get("artist-credit", [])
            band = artists[0]["name"] if artists else "Unknown"
            releases = rec.get("releases", [])
            album = releases[0]["title"] if releases else "Unknown"
            songs.append({"title": title, "band": band, "album": album})

        offset += limit
        time.sleep(1.1)  # Rate limit: 1 req/sec

    return songs


def fetch_all_metal_songs():
    all_songs = []
    seen_titles = set()

    for genre in GENRES:
        print(f"Fetching: {genre}...")
        songs = fetch_songs_for_genre(genre, max_songs=500)

        for song in songs:
            key = f"{song['title'].lower()}|{song['band'].lower()}"
            if key not in seen_titles:
                seen_titles.add(key)
                all_songs.append(song)

        print(f"  Got {len(songs)} songs, total unique: {len(all_songs)}")

    return all_songs


if __name__ == '__main__':
    os.makedirs('data', exist_ok=True)
    songs = fetch_all_metal_songs()

    # Columnar format for better compression
    output = {
        "s": [s["title"] for s in songs],
        "b": [s["band"] for s in songs],
        "a": [s["album"] for s in songs]
    }

    with open('data/metal.json', 'w') as f:
        json.dump(output, f, separators=(',', ':'), ensure_ascii=False)

    print(f"Wrote {len(songs)} metal songs to data/metal.json")
