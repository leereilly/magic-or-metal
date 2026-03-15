# Magic or Metal — Complete Implementation Plan

## Executive Summary

**Magic or Metal** is a static quiz web app hosted on GitHub Pages where players guess whether a given phrase is a **Magic: The Gathering card name** or a **heavy metal song title**. The app will contain ~27,000 MTG card names sourced from the Scryfall Oracle Cards bulk data and ~5,000+ metal song titles sourced from MusicBrainz. Total page payload will be kept under **200KB gzipped** by storing only names/titles at load time and fetching rich card details from the Scryfall API on-demand at results time. The UI will be a dark fantasy/metal hybrid theme using Google Fonts, CSS animations, and fully responsive vanilla HTML/CSS/JS — no framework needed. Zero backend. Zero dependencies at runtime. Pure static site.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Pages (Static)                    │
│                                                              │
│  index.html ─── css/style.css                               │
│       │                                                      │
│       ├── js/app.js        (game logic, state machine)      │
│       ├── js/ui.js         (DOM rendering, animations)      │
│       └── js/data.js       (fetch & parse data files)       │
│                                                              │
│  data/mtg.json             (~100KB gzipped, names only)     │
│  data/metal.json           (~60KB gzipped, song+band+album) │
└──────────────┬──────────────────────────────────────────────┘
               │ At results time only
               ▼
┌──────────────────────────────┐
│  Scryfall API (on-demand)    │
│  GET /cards/named?exact=...  │
│  → image, oracle_text, type  │
└──────────────────────────────┘
```

### Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Framework** | Vanilla HTML/CSS/JS | Zero bundle size, instant load, GitHub Pages native |
| **MTG Data Source** | Scryfall Bulk Data (Oracle Cards) | Official, free, ~27K unique cards, updated daily[^1] |
| **Metal Data Source** | MusicBrainz API + curated fallback | Open data, legal, free API, genre-tagged[^2] |
| **Data Strategy** | Names-only at load; rich data on-demand | Keeps payload <200KB; Scryfall serves details at results time[^3] |
| **Hosting** | GitHub Pages | Free, auto-gzip, 1GB limit is plenty[^4] |
| **Build Tool** | Python scripts (offline, pre-deploy) | Fetches & processes data, outputs compact JSON |

---

## Data Strategy (The Critical Piece)

### MTG Card Data — Scryfall Oracle Cards

**Source**: [Scryfall Bulk Data API](https://scryfall.com/docs/api/bulk-data)[^1]

The Oracle Cards bulk file contains **one entry per unique card** (by Oracle ID). As of early 2025, this is approximately **27,000+ unique cards**[^5]. The full bulk file is ~100MB+ of JSON, but we only need the `name` field.

**What we store in `data/mtg.json`**:
```json
["Lightning Bolt","Black Lotus","Doom Blade","Gravecrawler","Slaughter Pact",...]
```

**Size estimate**:
- ~27,000 names × ~15 chars average = ~405KB raw JSON
- GitHub Pages auto-gzips: **~100-120KB transferred**[^4]

**What we fetch at results time** (only for wrong answers, ~5 per round max):
```
GET https://api.scryfall.com/cards/named?exact=Lightning+Bolt
```

This returns the full card object including[^3]:
- `image_uris.art_crop` — beautiful rectangular art crop
- `image_uris.normal` — full card image
- `oracle_text` — rules text
- `type_line` — "Instant", "Creature — Human Wizard", etc.
- `set_name` — "Magic 2010", etc.
- `mana_cost` — "{R}", "{2}{B}{B}", etc.

**Rate limits**: Scryfall asks for 50-100ms delay between requests. For ~5 result lookups, this is trivial[^6].

### Metal Song Data — MusicBrainz + Curated List

**Primary Source**: [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API)[^2]

MusicBrainz has extensive genre tagging. We query recordings tagged with metal subgenres:

```
GET https://musicbrainz.org/ws/2/recording?query=tag:metal&limit=100&offset=0&fmt=json
```

**Subgenre queries to run** (each returns unique songs):
- `tag:heavy metal`
- `tag:thrash metal`
- `tag:death metal`
- `tag:black metal`
- `tag:power metal`
- `tag:doom metal`
- `tag:speed metal`
- `tag:progressive metal`
- `tag:symphonic metal`
- `tag:folk metal`
- `tag:melodic death metal`
- `tag:groove metal`
- `tag:nu metal`
- `tag:metalcore`
- `tag:sludge metal`

**Rate limits**: 1 request/second with a proper `User-Agent` header[^7].

**What we store in `data/metal.json`** (columnar for better compression):
```json
{
  "s": ["Master of Puppets","Raining Blood","Holy Wars","Ace of Spades",...],
  "b": ["Metallica","Slayer","Megadeth","Motörhead",...],
  "a": ["Master of Puppets","Reign in Blood","Rust in Peace","Ace of Spades",...]
}
```

Where: `s` = song titles, `b` = band names, `a` = album names (parallel arrays, same index).

**Size estimate**:
- 5,000 songs × ~60 chars (title+band+album) = ~300KB raw
- Columnar encoding + gzip: **~60-80KB transferred**

**Fallback/Supplement**: [Encyclopaedia Metallum (Metal Archives)](https://www.metal-archives.com/) has **4,274,869 songs** cataloged[^8]. While they lack an official API, community tools like [enmet](https://github.com/lukjak/enmet)[^9] and [metal-api.dev](https://metal-api.dev/)[^10] provide access. Use sparingly and respectfully for supplementary data.

### Deduplication — The Ambiguity Problem

Some phrases exist as BOTH an MTG card name and a metal song title (e.g., "Doom Blade" could plausibly be either). The build script must:

1. Build both lists independently
2. Cross-reference: find names appearing in both lists
3. **Remove duplicates from both lists** — only include unambiguous entries
4. Log removed entries for review

This ensures every quiz question has exactly ONE correct answer.

### Total Payload Budget

| Asset | Raw Size | Gzipped (served) |
|-------|----------|-------------------|
| `index.html` | ~5KB | ~2KB |
| `css/style.css` | ~8KB | ~2KB |
| `js/app.js` | ~6KB | ~2KB |
| `js/ui.js` | ~8KB | ~3KB |
| `js/data.js` | ~3KB | ~1KB |
| `data/mtg.json` | ~405KB | ~110KB |
| `data/metal.json` | ~300KB | ~70KB |
| Google Fonts (cached) | ~40KB | ~40KB |
| **TOTAL** | **~775KB** | **~230KB** |

First load under **250KB**. Subsequent loads instant (cached). This is comfortably within GitHub Pages' 1GB site limit and 100GB/month bandwidth[^4].

---

## Game Design

### Game Flow

```
┌──────────────┐     ┌───────────────┐     ┌──────────────────┐
│  START SCREEN │────▶│  QUIZ ROUND   │────▶│  RESULTS SCREEN  │
│  Play button  │     │  10 questions  │     │  Score + details │
│  How to play  │     │  2 buttons per │     │  Wrong = expanded │
└──────────────┘     └───────────────┘     └──────┬───────────┘
                                                   │
                                                   ▼
                                           ┌──────────────┐
                                           │  PLAY AGAIN   │
                                           └──────────────┘
```

### Quiz Round Mechanics

1. **Round size**: 10 questions (configurable via URL param `?n=15`)
2. **Question selection**: Randomly pick 5 MTG cards + 5 metal songs (balanced), shuffle order
3. **Display**: Show the phrase in a fancy card-styled container
4. **Answer**: Two large buttons — 🧙‍♂️ **MAGIC** and 🤘 **METAL**
5. **Feedback**: Instant visual feedback (green flash = correct, red shake = wrong)
6. **Progress**: Dot indicators or progress bar showing question X/10
7. **No timer by default**: Friendly and accessible. Optional speed mode via `?timer=10`

### Question Selection Algorithm

```javascript
function selectQuestions(mtgNames, metalSongs, count = 10) {
  const half = Math.floor(count / 2);
  
  // Pick random MTG cards
  const mtgPicks = shuffle(mtgNames).slice(0, half).map(name => ({
    text: name,
    answer: 'magic',
    source: 'mtg'
  }));
  
  // Pick random metal songs
  const metalPicks = shuffle(metalSongs).slice(0, count - half).map((song, i) => ({
    text: song.title,
    answer: 'metal',
    source: 'metal',
    band: song.band,
    album: song.album
  }));
  
  return shuffle([...mtgPicks, ...metalPicks]);
}
```

### Card Name Selection — Making It Fun

Not all card names make good quiz material. Filter for maximum ambiguity/fun:

**Good MTG names for the quiz** (sound metal-ish):
- "Deathbringer Regent", "Grave Titan", "Slaughter Pact", "Blood Artist"
- "Doom Blade", "Wrath of God", "Damnation", "Hellfire"

**Good metal songs for the quiz** (sound MTG-ish):
- "Holy Wars" (Megadeth), "Halls of Valhalla" (Judas Priest)
- "The Sentinel" (Judas Priest), "Phantom Lord" (Metallica)

**Optional enhancement**: Pre-tag entries as "tricky" (high ambiguity score) and bias question selection toward them. This makes the game hilarious and challenging.

### Difficulty Tiers (Optional Enhancement)

| Tier | Description | Example MTG | Example Metal |
|------|-------------|-------------|---------------|
| **Easy** | Obviously one or the other | "Forest" (basic land) | "Enter Sandman" (Metallica) |
| **Medium** | Could be either | "Grave Titan" | "The Sentinel" |
| **Hard** | Maximum trickery | "Infernal Darkness" | "Ritual of Infinity" |

### Results Screen

After all 10 questions:

**For correct answers**: ✅ Compact row with the phrase and "MAGIC" or "METAL" label

**For wrong answers** — expanded detail cards:

**If it was MTG**:
```
┌──────────────────────────────────────────┐
│  ❌ You said: METAL                       │
│  Actually: MAGIC THE GATHERING CARD       │
│                                           │
│  ┌─────────┐  Lightning Bolt              │
│  │ [CARD   │  Instant · {R}               │
│  │  ART]   │  "Lightning Bolt deals 3     │
│  │         │   damage to any target."     │
│  └─────────┘  Set: Magic 2010            │
└──────────────────────────────────────────┘
```

Card image loaded from Scryfall on-demand: `https://api.scryfall.com/cards/named?exact=Lightning+Bolt&format=image&version=art_crop`[^3]

**If it was Metal**:
```
┌──────────────────────────────────────────┐
│  ❌ You said: MAGIC                       │
│  Actually: HEAVY METAL SONG              │
│                                           │
│  🤘 "Master of Puppets"                  │
│  Band: Metallica                          │
│  Album: Master of Puppets (1986)          │
│  Genre: Thrash Metal                      │
└──────────────────────────────────────────┘
```

---

## UI/UX Design — "World's Most Friendly"

### Visual Theme: Dark Fantasy Meets Metal

The design sits at the intersection of two aesthetics:
- **MTG side**: Ornate borders, parchment textures, mystical glow effects
- **Metal side**: Dark backgrounds, sharp edges, metallic gradients, red/orange accents

### Color Palette

```css
:root {
  --bg-dark:        #0d0d0f;        /* Deep void black */
  --bg-card:        #1a1a2e;        /* Dark navy card bg */
  --border-gold:    #c9a84c;        /* MTG gold border */
  --text-primary:   #e8dcc8;        /* Parchment cream */
  --text-secondary: #8b8680;        /* Muted stone */
  --accent-magic:   #4a90d9;        /* Blue mana */
  --accent-metal:   #dc3545;        /* Blood red */
  --accent-correct: #28a745;        /* Success green */
  --glow-gold:      rgba(201, 168, 76, 0.3);
  --glow-magic:     rgba(74, 144, 217, 0.4);
  --glow-metal:     rgba(220, 53, 69, 0.4);
}
```

### Typography

```html
<link href="https://fonts.googleapis.com/css2?family=MedievalSharp&family=Metal+Mania&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
```

| Element | Font | Usage |
|---------|------|-------|
| Logo/Title | **Metal Mania**[^11] | "MAGIC OR METAL?" header |
| Card names (quiz) | **MedievalSharp**[^12] | The phrase being quizzed |
| Body/UI | **Inter** | Buttons, scores, body text |

### Key UI Components

**1. Start Screen**
- Large animated logo: "MAGIC OR METAL?"
- Subtitle: "Can you tell a Magic: The Gathering card from a Heavy Metal song?"
- Big glowing **PLAY** button
- Subtle particle/ember animation in background (CSS only)

**2. Quiz Card** (center screen)
```css
.quiz-card {
  background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
  border: 3px solid var(--border-gold);
  border-radius: 16px;
  box-shadow: 0 0 30px var(--glow-gold), 0 8px 32px rgba(0,0,0,0.5);
  padding: 3rem 2rem;
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
}

.quiz-card .phrase {
  font-family: 'MedievalSharp', serif;
  font-size: 2.2rem;
  color: var(--text-primary);
  text-shadow: 0 0 20px rgba(232, 220, 200, 0.3);
}
```

**3. Answer Buttons** (big, touchable, side-by-side on mobile)
```
┌─────────────────┐  ┌─────────────────┐
│   🧙‍♂️ MAGIC     │  │   🤘 METAL      │
│   (blue glow)    │  │   (red glow)     │
└─────────────────┘  └─────────────────┘
```

**4. Animations**
- **Question enter**: Slide up + fade in
- **Correct answer**: Green pulse + sparkle
- **Wrong answer**: Red shake + brief card flip revealing answer
- **Score increment**: Counter animates up
- **Results cards**: Staggered cascade entry

All animations CSS-only (no JS animation libraries):
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-8px); }
  40%, 80% { transform: translateX(8px); }
}

@keyframes pulse-correct {
  0% { box-shadow: 0 0 0 0 var(--glow-magic); }
  70% { box-shadow: 0 0 0 20px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}
```

### Responsive Design

```css
/* Mobile-first */
.answer-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Tablet+ */
@media (min-width: 600px) {
  .answer-buttons {
    flex-direction: row;
    justify-content: center;
  }
}
```

Minimum touch target: 48×48px (WCAG). Buttons will be ~200px wide × 60px tall.

### Accessibility

- High contrast ratios (cream on dark navy > 7:1)
- Keyboard navigable (Tab between buttons, Enter to select)
- `aria-live` region for score announcements
- `prefers-reduced-motion` media query to disable animations
- Screen reader text for emoji decorations

---

## File Structure

```
magic-or-metal/
├── index.html                 # Single page app
├── css/
│   └── style.css              # All styles, responsive, themed
├── js/
│   ├── app.js                 # Game state machine, event handlers
│   ├── ui.js                  # DOM rendering, animations
│   └── data.js                # Fetch & parse data files, Scryfall API calls
├── data/
│   ├── mtg.json               # Array of card names (build artifact)
│   └── metal.json             # {s:[],b:[],a:[]} song data (build artifact)
├── img/
│   └── og-image.png           # Social sharing preview image
├── scripts/
│   ├── fetch-mtg.py           # Downloads Scryfall bulk → extracts names
│   ├── fetch-metal.py         # Queries MusicBrainz → extracts songs
│   ├── deduplicate.py         # Cross-references & removes ambiguous entries
│   └── requirements.txt       # Python deps (requests only)
├── .github/
│   └── workflows/
│       └── update-data.yml    # Monthly cron to refresh data
├── CNAME                      # Optional custom domain
└── README.md                  # Project description & credits
```

---

## Build Scripts (Data Pipeline)

### `scripts/fetch-mtg.py` — Scryfall Bulk Data Processor

```python
#!/usr/bin/env python3
"""
Fetches Scryfall Oracle Cards bulk data and extracts unique card names.
Output: data/mtg.json — a JSON array of card name strings.
"""
import json
import requests
import re

def fetch_mtg_names():
    # Step 1: Get bulk data download URL
    bulk_meta = requests.get("https://api.scryfall.com/bulk-data/oracle-cards").json()
    download_url = bulk_meta["download_uri"]
    
    # Step 2: Download (streaming, ~100MB)
    print(f"Downloading: {download_url}")
    resp = requests.get(download_url, stream=True)
    cards = resp.json()
    
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
    names = fetch_mtg_names()
    with open('data/mtg.json', 'w') as f:
        json.dump(names, f, separators=(',', ':'))
    print(f"Wrote {len(names)} MTG card names to data/mtg.json")
```

### `scripts/fetch-metal.py` — MusicBrainz Song Collector

```python
#!/usr/bin/env python3
"""
Fetches metal song titles from MusicBrainz API.
Output: data/metal.json — {s: [titles], b: [bands], a: [albums]}
"""
import json
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
    "User-Agent": "MagicOrMetal/1.0 (https://github.com/youruser/magic-or-metal)",
    "Accept": "application/json"
}

def fetch_songs_for_genre(genre, max_songs=500):
    """Fetch song titles for a specific genre tag from MusicBrainz."""
    songs = []
    offset = 0
    limit = 100
    
    while offset < max_songs:
        url = f"https://musicbrainz.org/ws/2/recording"
        params = {
            "query": f'tag:"{genre}"',
            "limit": limit,
            "offset": offset,
            "fmt": "json"
        }
        
        resp = requests.get(url, params=params, headers=HEADERS)
        if resp.status_code == 503:
            time.sleep(2)
            continue
        
        data = resp.json()
        recordings = data.get("recordings", [])
        if not recordings:
            break
        
        for rec in recordings:
            title = rec.get("title", "")
            # Get artist
            artists = rec.get("artist-credit", [])
            band = artists[0]["name"] if artists else "Unknown"
            # Get first release (album)
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
```

### `scripts/deduplicate.py` — Ambiguity Resolver

```python
#!/usr/bin/env python3
"""
Cross-references MTG and metal data to remove ambiguous entries.
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
```

---

## GitHub Actions — Automated Monthly Data Refresh

### `.github/workflows/update-data.yml`

```yaml
name: Update Quiz Data

on:
  schedule:
    - cron: '0 6 1 * *'  # 1st of each month at 6am UTC
  workflow_dispatch:        # Manual trigger

jobs:
  update-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: pip install requests

      - name: Fetch MTG card names
        run: python scripts/fetch-mtg.py

      - name: Fetch metal songs
        run: python scripts/fetch-metal.py

      - name: Deduplicate
        run: python scripts/deduplicate.py

      - name: Commit updated data
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/
          git diff --staged --quiet || git commit -m "chore: update quiz data $(date +%Y-%m-%d)"
          git push
```

This ensures the quiz always has the latest MTG cards (new sets release every few months) and can pick up new metal songs[^1][^2].

---

## JavaScript Architecture

### `js/data.js` — Data Layer

```javascript
// Compact data loading + Scryfall API integration
const Data = {
  mtgNames: [],
  metalSongs: [],

  async load() {
    const [mtgResp, metalResp] = await Promise.all([
      fetch('data/mtg.json'),
      fetch('data/metal.json')
    ]);
    
    this.mtgNames = await mtgResp.json();
    const metal = await metalResp.json();
    
    // Expand columnar format into objects
    this.metalSongs = metal.s.map((title, i) => ({
      title,
      band: metal.b[i],
      album: metal.a[i]
    }));
  },

  async fetchCardDetails(cardName) {
    // On-demand Scryfall lookup for results screen
    const resp = await fetch(
      `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`
    );
    if (!resp.ok) return null;
    const card = await resp.json();
    return {
      name: card.name,
      image: card.image_uris?.art_crop || card.card_faces?.[0]?.image_uris?.art_crop,
      imageNormal: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal,
      typeLine: card.type_line,
      oracleText: card.oracle_text,
      manaCost: card.mana_cost,
      setName: card.set_name,
      artist: card.artist
    };
  }
};
```

### `js/app.js` — Game State Machine

```javascript
const STATES = { START: 'start', QUIZ: 'quiz', RESULTS: 'results' };

const Game = {
  state: STATES.START,
  questions: [],
  currentIndex: 0,
  answers: [],  // { question, userAnswer, correct }
  
  async init() {
    await Data.load();
    UI.renderStart();
  },

  startRound(count = 10) {
    this.state = STATES.QUIZ;
    this.currentIndex = 0;
    this.answers = [];
    this.questions = this.selectQuestions(count);
    UI.renderQuestion(this.questions[0], 0, count);
  },

  selectQuestions(count) {
    const half = Math.floor(count / 2);
    const mtg = shuffle(Data.mtgNames).slice(0, half).map(name => ({
      text: name, answer: 'magic'
    }));
    const metal = shuffle(Data.metalSongs).slice(0, count - half).map(song => ({
      text: song.title, answer: 'metal',
      band: song.band, album: song.album
    }));
    return shuffle([...mtg, ...metal]);
  },

  submitAnswer(userAnswer) {
    const q = this.questions[this.currentIndex];
    const correct = userAnswer === q.answer;
    this.answers.push({ question: q, userAnswer, correct });
    
    UI.showFeedback(correct);
    
    setTimeout(() => {
      this.currentIndex++;
      if (this.currentIndex >= this.questions.length) {
        this.showResults();
      } else {
        UI.renderQuestion(
          this.questions[this.currentIndex],
          this.currentIndex,
          this.questions.length
        );
      }
    }, 800);
  },

  async showResults() {
    this.state = STATES.RESULTS;
    const score = this.answers.filter(a => a.correct).length;
    
    // Fetch Scryfall details for wrong MTG answers
    const wrongMtg = this.answers.filter(
      a => !a.correct && a.question.answer === 'magic'
    );
    const cardDetails = await Promise.all(
      wrongMtg.map(a => Data.fetchCardDetails(a.question.text))
    );
    
    // Merge details into answers
    let detailIndex = 0;
    for (const a of this.answers) {
      if (!a.correct && a.question.answer === 'magic') {
        a.cardDetails = cardDetails[detailIndex++];
      }
    }
    
    UI.renderResults(this.answers, score, this.questions.length);
  }
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

### `js/ui.js` — Rendering

```javascript
const UI = {
  app: document.getElementById('app'),

  renderStart() {
    this.app.innerHTML = `
      <div class="start-screen">
        <h1 class="logo">⚔️ MAGIC<br><span class="or">or</span><br>METAL? 🤘</h1>
        <p class="subtitle">Is it a Magic: The Gathering card<br>or a Heavy Metal song?</p>
        <button class="btn-play" onclick="Game.startRound()">PLAY</button>
        <p class="credit">
          Cards from <a href="https://scryfall.com" target="_blank">Scryfall</a> · 
          Songs from <a href="https://musicbrainz.org" target="_blank">MusicBrainz</a>
        </p>
      </div>
    `;
  },

  renderQuestion(question, index, total) {
    const score = Game.answers.filter(a => a.correct).length;
    this.app.innerHTML = `
      <div class="quiz-screen">
        <div class="quiz-header">
          <div class="progress">${index + 1} / ${total}</div>
          <div class="score">Score: ${score}</div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${((index) / total) * 100}%"></div>
        </div>
        <div class="quiz-card animate-enter">
          <p class="phrase">${question.text}</p>
        </div>
        <div class="answer-buttons">
          <button class="btn-magic" onclick="Game.submitAnswer('magic')">
            🧙‍♂️ MAGIC
          </button>
          <button class="btn-metal" onclick="Game.submitAnswer('metal')">
            🤘 METAL
          </button>
        </div>
      </div>
    `;
  },

  showFeedback(correct) {
    const card = document.querySelector('.quiz-card');
    card.classList.add(correct ? 'correct' : 'wrong');
  },

  renderResults(answers, score, total) {
    const pct = Math.round((score / total) * 100);
    const message = pct === 100 ? "🏆 PERFECT! You are a true MTG Judge AND Metalhead!"
      : pct >= 80 ? "🔥 Impressive! You know your stuff!"
      : pct >= 60 ? "👍 Not bad! Keep studying your cards and albums."
      : pct >= 40 ? "😅 Room for improvement..."
      : "💀 The Dark Lord of Confusion claims another victim.";

    const cards = answers.map(a => this.renderResultCard(a)).join('');

    this.app.innerHTML = `
      <div class="results-screen">
        <h2 class="results-title">Round Complete!</h2>
        <div class="score-display">
          <span class="score-number">${score}</span>
          <span class="score-divider">/</span>
          <span class="score-total">${total}</span>
        </div>
        <p class="results-message">${message}</p>
        <div class="results-list">${cards}</div>
        <button class="btn-play" onclick="Game.startRound()">PLAY AGAIN</button>
      </div>
    `;
  },

  renderResultCard(answer) {
    const { question, userAnswer, correct, cardDetails } = answer;
    const icon = correct ? '✅' : '❌';
    const actualLabel = question.answer === 'magic' ? '🧙‍♂️ Magic Card' : '🤘 Metal Song';
    
    let details = '';
    if (!correct) {
      if (question.answer === 'magic' && cardDetails) {
        details = `
          <div class="detail-card mtg-detail">
            ${cardDetails.image ? `<img src="${cardDetails.image}" alt="${cardDetails.name}" loading="lazy">` : ''}
            <div class="detail-info">
              <strong>${cardDetails.typeLine || ''}</strong>
              <p>${cardDetails.oracleText || ''}</p>
              <small>Set: ${cardDetails.setName || 'Unknown'} · Artist: ${cardDetails.artist || 'Unknown'}</small>
            </div>
          </div>
        `;
      } else if (question.answer === 'metal') {
        details = `
          <div class="detail-card metal-detail">
            <div class="detail-info">
              <strong>🎸 ${question.band}</strong>
              <p>Album: ${question.album}</p>
            </div>
          </div>
        `;
      }
    }
    
    return `
      <div class="result-row ${correct ? 'correct' : 'wrong'}">
        <div class="result-header">
          <span class="result-icon">${icon}</span>
          <span class="result-phrase">"${question.text}"</span>
          <span class="result-label">${actualLabel}</span>
        </div>
        ${details}
      </div>
    `;
  }
};
```

---

## Implementation Phases

### Phase 1: Scaffold & Static Shell (Day 1)
- Create `index.html`, `css/style.css`, `js/app.js`, `js/ui.js`, `js/data.js`
- Build the start screen with logo, play button
- Implement dark fantasy/metal CSS theme
- Deploy to GitHub Pages to validate hosting

### Phase 2: Build Data Pipeline (Day 1-2)
- Write `scripts/fetch-mtg.py` — download Scryfall bulk data, extract names
- Write `scripts/fetch-metal.py` — query MusicBrainz for metal songs
- Write `scripts/deduplicate.py` — remove ambiguous overlaps
- Run scripts, commit `data/mtg.json` and `data/metal.json`
- Validate data sizes (target: <200KB gzipped total)

### Phase 3: Core Game Logic (Day 2)
- Implement `Data.load()` — fetch and parse both data files
- Implement question selection with balanced random picks
- Implement answer submission with instant feedback
- Wire up state machine: START → QUIZ → RESULTS → PLAY AGAIN

### Phase 4: Results Screen with Rich Details (Day 2-3)
- Implement `Data.fetchCardDetails()` — Scryfall API on-demand
- Build results screen with expanded detail cards for wrong answers
- Load card art images lazily from Scryfall CDN
- Style metal song details (band, album, genre)

### Phase 5: Polish & Accessibility (Day 3)
- CSS animations: enter, correct pulse, wrong shake
- Keyboard navigation (Tab + Enter)
- Screen reader support (aria-live, aria-labels)
- `prefers-reduced-motion` support
- Mobile testing and responsive tweaks
- Open Graph meta tags for social sharing

### Phase 6: CI/CD & Automation (Day 3)
- Set up GitHub Actions workflow for monthly data refresh
- Add `CNAME` if using custom domain
- Final testing on GitHub Pages
- Write README with credits and attributions

---

## Key External Dependencies & Attribution

| Service | Usage | License/Terms | Attribution Required |
|---------|-------|---------------|---------------------|
| [Scryfall](https://scryfall.com)[^1] | Card names (bulk) + card details (API) | Free, non-commercial friendly | Yes — link to Scryfall |
| [MusicBrainz](https://musicbrainz.org)[^2] | Metal song titles, bands, albums | CC0 / Public Domain data | Yes — link to MusicBrainz |
| [Google Fonts](https://fonts.google.com) | MedievalSharp, Metal Mania, Inter | SIL Open Font License | No (but nice to credit) |

**Scryfall's terms**: They explicitly allow and encourage use of their data for fan projects. Include "Powered by Scryfall" with a link. Do not claim affiliation with Wizards of the Coast[^6].

**MusicBrainz's terms**: Data is available under CC0 (public domain). Respect rate limits (1 req/sec). Include "Data from MusicBrainz" attribution[^7].

---

## Potential Enhancements (Future)

| Feature | Effort | Impact |
|---------|--------|--------|
| **Difficulty selector** (Easy/Medium/Hard) | Medium | High — curated tricky names |
| **Streak mode** (endless, lives system) | Low | High — replayability |
| **Leaderboard** (localStorage top scores) | Low | Medium — personal bests |
| **Share results** (clipboard/social) | Low | High — virality |
| **Sound effects** (metal riff on wrong, spell sound on right) | Medium | High — immersion |
| **Multiplayer** (pass-and-play, same device) | Medium | Medium — party game |
| **"Both" mode** (include entries that are both) | Low | Fun — bonus round |
| **Art mode** (show card art, guess if it's MTG or album cover) | High | Very high — visual quiz |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Scryfall data strategy** | ✅ Very High | Official API, well-documented, bulk data confirmed ~27K cards |
| **MusicBrainz as metal source** | ✅ High | Free, legal, genre-tagged. May need supplementing with curated lists for iconic tracks |
| **Data size estimates** | ✅ High | Based on character count math + known gzip ratios for text |
| **GitHub Pages hosting** | ✅ Very High | 1GB limit, auto-gzip, well within budget |
| **On-demand Scryfall detail fetch** | ✅ Very High | `/cards/named` endpoint confirmed, rate limits generous |
| **Deduplication approach** | ⚠️ Medium | Overlap count unknown until data is fetched; may need fuzzy matching |
| **Metal Archives supplementation** | ⚠️ Medium | No official API; community tools may break; use only as fallback |
| **CSS animations (no library)** | ✅ High | Standard CSS keyframes, well-supported |
| **Monthly CI data refresh** | ✅ High | Standard GitHub Actions cron pattern |

---

## Footnotes

[^1]: [Scryfall Bulk Data API Documentation](https://scryfall.com/docs/api/bulk-data) — Official documentation for downloading Oracle Cards bulk data. Updated daily.

[^2]: [MusicBrainz API Documentation](https://musicbrainz.org/doc/MusicBrainz_API) — Open music metadata database with genre-tagged recordings.

[^3]: [Scryfall `/cards/named` API](https://scryfall.com/docs/api/cards/named) — Single card lookup by exact or fuzzy name. Returns image_uris, oracle_text, type_line, set_name.

[^4]: [GitHub Pages Limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) — 1GB site size, 100GB/month bandwidth, auto-gzip serving.

[^5]: [JakeTurner616/mtg-bulk-database](https://github.com/JakeTurner616/mtg-bulk-database) — Community project tracking Scryfall bulk data card counts over time.

[^6]: [Scryfall API Request Formats](https://scryfall.com/docs/api/request-formats) — Rate limiting guidance: 50-100ms between requests.

[^7]: [MusicBrainz API Rate Limits](https://musicbrainz.org/doc/MusicBrainz_API) — 1 request/second with proper User-Agent.

[^8]: [Metal Archives Statistics](https://www.metal-archives.com/stats) — 4,274,869 songs, 195,831 bands, 677,099 albums cataloged.

[^9]: [lukjak/enmet](https://github.com/lukjak/enmet) — Python API for Encyclopaedia Metallum (Metal Archives).

[^10]: [Metal-API](https://metal-api.dev/index.html) — Unofficial REST API for Metal Archives data.

[^11]: [Metal Mania font on Google Fonts](https://fonts.google.com/specimen/Metal+Mania) — Free metal-style display font.

[^12]: [MedievalSharp font on Google Fonts](https://fonts.google.com/specimen/MedievalSharp) — Free medieval/fantasy display font.

[^13]: [Scryfall Card Imagery Documentation](https://scryfall.com/docs/api/images) — Image URI formats including `art_crop`, `small`, `normal`.

[^14]: [Keyrune MTG set symbol font](https://keyrune.andrewgioia.com/) — CSS icon font for MTG set symbols by Andrew Gioia.

[^15]: [MusicBrainz API Search](https://musicbrainz.org/doc/MusicBrainz_API/Search) — Advanced search syntax for recordings with tag filters.

[^16]: [GitHub Community Discussion: Compression](https://github.com/orgs/community/discussions/21655) — GitHub Pages serves gzip automatically; no native Brotli support for pre-compressed assets.
