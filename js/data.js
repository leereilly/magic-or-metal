/**
 * Data layer — loads quiz data and fetches Scryfall card details on demand.
 */
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
