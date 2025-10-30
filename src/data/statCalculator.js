import { natures } from "./natures.js";

export function generateRandomIVs() {
  const stats = ["hp", "attack", "defense", "spAttack", "spDefense", "speed"];
  const ivs = {};
  stats.forEach(stat => {
    ivs[stat] = Math.floor(Math.random() * 32); // 0–31
  });
  return ivs;
}

export function getRandomNature() {
  const random = natures[Math.floor(Math.random() * natures.length)];
  return random;
}

// Fórmulas oficiales
export function calculateStats(baseStats, level, ivs, nature) {
  const stats = {};

  // HP
  stats.hp = Math.floor(((2 * baseStats.hp + ivs.hp) * level) / 100) + level + 10;

  // Los demás stats
  const otherStats = ["attack", "defense", "spAttack", "spDefense", "speed"];
  otherStats.forEach(stat => {
    let natureModifier = 1;
    if (nature.plus === stat) natureModifier = 1.1;
    if (nature.minus === stat) natureModifier = 0.9;

    stats[stat] = Math.floor(
      (((2 * baseStats[stat] + ivs[stat]) * level) / 100 + 5) * natureModifier
    );
  });

  return stats;
}
