/**
 * Data layer — loads a random shard of quiz data per session.
 * Data is split across multiple files so the browser only fetches one of each.
 */
const Data = {
  MTG_SHARDS: 5,
  METAL_SHARDS: 5,
  mtgNames: [],
  metalSongs: [],
  mtgShardIndex: -1,
  metalShardIndex: -1,

  async load() {
    this.mtgShardIndex = Math.floor(Math.random() * this.MTG_SHARDS);
    this.metalShardIndex = Math.floor(Math.random() * this.METAL_SHARDS);

    const [mtgResp, metalResp] = await Promise.all([
      fetch(`data/mtg-${this.mtgShardIndex}.json`),
      fetch(`data/metal-${this.metalShardIndex}.json`)
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

  // SoundCloud playlists — verified black & death metal playlists for gameplay
  soundcloudTracks: [
    "https://soundcloud.com/moxxy2112/sets/black-metal-top-tracks",
    "https://soundcloud.com/raphael-malke-239747974/sets/black-death-metal",
    "https://soundcloud.com/user-820886078/sets/brutal-death-metal",
    "https://soundcloud.com/dominic-fischer-372860636/sets/black-metal-top-tracks",
    "https://soundcloud.com/circuit-machine/sets/black-metal-top-tracks",
    "https://soundcloud.com/theociderecords/sets/death-metal-brutal-death-metal"
  ],

  getRandomTrack() {
    return this.soundcloudTracks[Math.floor(Math.random() * this.soundcloudTracks.length)];
  },

  async fetchAlbumArt(band, album) {
    try {
      const query = encodeURIComponent(`release:"${album}" AND artist:"${band}"`);
      const resp = await fetch(
        `https://musicbrainz.org/ws/2/release/?query=${query}&limit=1&fmt=json`,
        { headers: { 'User-Agent': 'MagicOrMetal/1.0 (github.com/leereilly/magic-or-metal)' } }
      );
      if (!resp.ok) return null;
      const data = await resp.json();
      if (!data.releases || data.releases.length === 0) return null;
      const mbid = data.releases[0].id;
      const artResp = await fetch(`https://coverartarchive.org/release/${mbid}`);
      if (!artResp.ok) return null;
      const artData = await artResp.json();
      const front = artData.images?.find(img => img.front) || artData.images?.[0];
      return front?.thumbnails?.small || front?.thumbnails?.['250'] || front?.image || null;
    } catch (e) {
      console.warn(`Failed to fetch album art for "${album}" by "${band}":`, e);
      return null;
    }
  },

  async fetchCardDetails(cardName) {
    try {
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
    } catch (e) {
      console.warn(`Failed to fetch card details for "${cardName}":`, e);
      return null;
    }
  }
};
