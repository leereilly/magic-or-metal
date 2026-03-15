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
