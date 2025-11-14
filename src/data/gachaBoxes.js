// src/data/gachaBoxes.js
export const GACHA_BOXES = [
  {
    id: "gen1-starters",
    label: "Gen 1 – Starters",
    category: "Gen 1",
    price: 60,
    banner: "/imgs/gacha/gen1_starters.png",
    odds: { common: 55, rare: 30, epic: 10, legendary: 3, shiny: 2 },
    poolPreview: [
      { name: "Bulbasaur", rarity: "common" },
      { name: "Charmander", rarity: "common" },
      { name: "Squirtle", rarity: "common" },
      { name: "Ivysaur", rarity: "rare" },
      { name: "Charmeleon", rarity: "rare" },
      { name: "Wartortle", rarity: "rare" },
      { name: "Venusaur", rarity: "epic" },
      { name: "Charizard", rarity: "legendary" },
      { name: "Blastoise", rarity: "epic" },
      { name: "Cualquiera (Shiny)", rarity: "shiny" }
    ],
    notes: "Lv 5–10 • IVs 8–31 • 5% chance de habilidad oculta"
  },
  {
    id: "shiny-hunt",
    label: "Shiny Hunt",
    category: "Shiny",
    price: 120,
    banner: "/imgs/gacha/shiny.png",
    odds: { common: 0, rare: 0, epic: 0, legendary: 0, shiny: 100 },
    poolPreview: [{ name: "Shiny pool (todas gens)", rarity: "shiny" }],
    notes: "Garantiza un Pokémon Shiny • Rango de IVs 15–31"
  },
  {
    id: "legendary-vault",
    label: "Legendary Vault",
    category: "Legendary",
    price: 200,
    banner: "/imgs/gacha/legendary.png",
    odds: { common: 0, rare: 10, epic: 40, legendary: 48, shiny: 2 },
    poolPreview: [
      { name: "Articuno", rarity: "legendary" },
      { name: "Zapdos", rarity: "legendary" },
      { name: "Moltres", rarity: "legendary" },
      { name: "Mewtwo", rarity: "legendary" },
      { name: "Legendario (Shiny)", rarity: "shiny" }
    ],
    notes: "Lv 50–70 • IVs 20–31 • Naturalezas balanceadas"
  },
  {
    id: "items-boosters",
    label: "Cofre de Objetos",
    category: "Items",
    price: 30,
    banner: "/imgs/gacha/items.png",
    odds: { common: 65, rare: 25, epic: 8, legendary: 2, shiny: 0 },
    poolPreview: [
      { name: "Poción", rarity: "common" },
      { name: "Superpoción", rarity: "rare" },
      { name: "MT aleatoria", rarity: "epic" },
      { name: "Piedra Lunar", rarity: "legendary" }
    ],
    notes: "Incluye berries, MTs y piedras evolutivas"
  }
];

export const GACHA_CATEGORIES = [
  "Gen 1","Gen 2","Gen 3","Gen 4","Gen 5","Gen 6","Gen 7","Gen 8","Gen 9",
];
