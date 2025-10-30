import { generateRandomIVs, getRandomNature, calculateStats } from "./statCalculator";

const API_URL = "http://localhost:8000/api/pokemon-species";

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

async function getWeaknesses(types) {
  try {
    const typeDataList = await Promise.all(
      types.map(async (type) => {
        const res = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
        const data = await res.json();
        return data.damage_relations;
      })
    );

    const combined = {
      double_damage_from: [],
      half_damage_from: [],
      no_damage_from: [],
    };

    typeDataList.forEach((relations) => {
      Object.keys(combined).forEach((key) => {
        combined[key].push(...relations[key].map((t) => t.name));
      });
    });

    const allTypes = [
      "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
      "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon",
      "dark", "steel", "fairy"
    ];

    const weaknesses = {};
    allTypes.forEach((type) => {
      let multiplier = 1;
      if (combined.double_damage_from.includes(type)) multiplier *= 2;
      if (combined.half_damage_from.includes(type)) multiplier *= 0.5;
      if (combined.no_damage_from.includes(type)) multiplier = 0;
      weaknesses[type] = multiplier;
    });

    return weaknesses;
  } catch (error) {
    console.error("Error al obtener debilidades:", error);
    return Object.fromEntries(
      [
        "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
        "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon",
        "dark", "steel", "fairy"
      ].map((t) => [t, 1])
    );
  }
}

function isShiny() {
  return Math.random() < 1 / 4096;
}

export async function getPokemon(id, level = 5) {
  try {
    const csrftoken = getCookie("csrftoken");
    const res = await fetch(`${API_URL}/${id}/`, {
      method: "GET",
      credentials: "include",
      headers: { "X-CSRFToken": csrftoken },
    });

    if (!res.ok) {
      console.error("No se pudo obtener Pokémon con id:", id, res.status);
      return null;
    }

    const data = await res.json();

    const baseStats = {
      hp: data.stats.hp,
      attack: data.stats.attack,
      defense: data.stats.defense,
      spAttack: data.stats["special-attack"],
      spDefense: data.stats["special-defense"],
      speed: data.stats.speed,
    };

    const types = data.types;
    const ivs = generateRandomIVs();
    const nature = getRandomNature();
    const stats = calculateStats(baseStats, level, ivs, nature);
    const weaknesses = await getWeaknesses(types);
    const shiny = isShiny();

    let sprite = data.sprite;
    const gender = data.gender ?? null;

    if (gender === "female" && shiny)
      sprite = sprite.replace(
        "/sprites/sprites/pokemon/",
        "/sprites/sprites/pokemon/shiny/female/"
      );
    else if (gender === "female")
      sprite = sprite.replace(
        "/sprites/sprites/pokemon/",
        "/sprites/sprites/pokemon/female/"
      );
    else if (shiny)
      sprite = sprite.replace(
        "/sprites/sprites/pokemon/",
        "/sprites/sprites/pokemon/shiny/"
      );

    return {
      id: data.pokedex_id,
      name: data.name,
      displayName: data.name.charAt(0).toUpperCase() + data.name.slice(1),
      sprite,
      level,
      shiny,
      gender,
      types,
      ivs,
      nature,
      baseStats,
      stats,
      gender_rate: data.gender_rate,
      weaknesses,
    };
  } catch (error) {
    console.error("Error obteniendo Pokémon desde el backend:", error);
    return null;
  }
}
