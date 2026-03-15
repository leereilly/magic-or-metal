# ⚔️ Magic or Metal? 🤘

**Can you tell a Magic: The Gathering card name from a Heavy Metal song title?**

A static quiz web app hosted on GitHub Pages. No frameworks, no backend — just vanilla HTML/CSS/JS and two legendary data sources.

## 🎮 Play

👉 **[Play Magic or Metal?](https://leereilly.github.io/magic-or-metal/)**

## How It Works

You're shown a phrase — it's either the name of a **Magic: The Gathering** card or a **Heavy Metal** song title. Your job is to guess which one it is. 10 questions per round.

- 🧙‍♂️ **MAGIC** — It's a Magic: The Gathering card
- 🤘 **METAL** — It's a heavy metal song

### Results

After each round, you'll see your score and — for any wrong answers — rich details:
- **MTG cards**: Card art, type line, oracle text, and set info (fetched from Scryfall)
- **Metal songs**: Band name and album

## URL Parameters

| Parameter | Example | Description |
|-----------|---------|-------------|
| `?n=15`   | 15 questions | Change round size (default: 10) |
| `?timer=10` | 10s per question | Enable speed mode |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` / `←` / `m` | Choose Magic |
| `2` / `→` / `e` | Choose Metal |
| `Enter` / `Space` | Play / Play Again |

## Data Sources

- **MTG Cards**: ~27,000 unique card names from [Scryfall](https://scryfall.com) Oracle Cards bulk data
- **Metal Songs**: 5,000+ songs from [MusicBrainz](https://musicbrainz.org), spanning 20 metal subgenres

Ambiguous entries (names that appear in both lists) are automatically removed.

## Refreshing Data

Data is refreshed automatically on the 1st of each month via GitHub Actions. To refresh manually:

```bash
pip install -r scripts/requirements.txt
python scripts/fetch-mtg.py
python scripts/fetch-metal.py
python scripts/deduplicate.py
```

## Tech Stack

- Vanilla HTML/CSS/JS — zero runtime dependencies
- Google Fonts: [Metal Mania](https://fonts.google.com/specimen/Metal+Mania), [MedievalSharp](https://fonts.google.com/specimen/MedievalSharp), [Inter](https://fonts.google.com/specimen/Inter)
- [Scryfall API](https://scryfall.com/docs/api) for on-demand card details
- GitHub Pages for hosting
- GitHub Actions for automated data updates

## Credits & Attribution

- Card data powered by [Scryfall](https://scryfall.com). Scryfall is not affiliated with Wizards of the Coast.
- Song data from [MusicBrainz](https://musicbrainz.org), available under CC0.
- Magic: The Gathering is a trademark of Wizards of the Coast LLC.

## License

MIT
