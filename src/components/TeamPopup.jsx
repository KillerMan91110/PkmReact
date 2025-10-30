import { useState } from "react";
import typeIcons from "../data/typeIcons";

export default function TeamPopup({ pokemon, onClose }) {
  const [showIVs, setShowIVs] = useState(false);
  if (!pokemon) return null;

  const stats = pokemon.stats || {};
  const ivs = pokemon.ivs || {
    hp: 0,
    attack: 0,
    defense: 0,
    spAttack: 0,
    spDefense: 0,
    speed: 0,
  };

  const genderSymbol =
    pokemon.gender === "female" ? "♀️" : pokemon.gender === "male" ? "♂️" : "";

  const types = pokemon.species?.types || [];
  const nature = pokemon.nature || "Desconocida";
  const natureData = pokemon.nature_data || { plus: null, minus: null };
  const ability =
    pokemon.ability || pokemon.species?.ability || "Desconocida";

  // --- Calcular sprite correcto según shiny ---
  const getSprite = (pokemon) => {
    if (!pokemon || !pokemon.species) return "/sprites/unknown.png";
    const pokeId = pokemon.species.pokedex_id || pokemon.species.id;
    return pokemon.shiny
      ? `/sprites/sprites/pokemon/shiny/${pokeId}.png`
      : `/sprites/sprites/pokemon/${pokeId}.png`;
  };

  const sprite = getSprite(pokemon);

  // --- IV Radar Setup ---
  const normalize = (val) => Math.max(0, Math.min(val / 31, 1));
  const basePoints = [
    { name: "HP", key: "hp", x: 0, y: -85 },
    { name: "DEF", key: "defense", x: 73.7, y: -42.5 },
    { name: "SpDEF", key: "spDefense", x: 73.7, y: 42.5 },
    { name: "SPD", key: "speed", x: 0, y: 85 },
    { name: "SpATK", key: "spAttack", x: -73.7, y: 42.5 },
    { name: "ATK", key: "attack", x: -73.7, y: -42.5 },
  ];

  const ivVals = basePoints.map((p) => normalize(ivs[p.key] || 0));
  const radarPoints = basePoints
    .map((p, i) => `${p.x * ivVals[i]},${p.y * ivVals[i]}`)
    .join(" ");

  const maxHp = stats.hp ?? 1;
  const currentHp = pokemon.current_hp ?? maxHp;
  const hpPercent = Math.max(0, Math.min((currentHp / maxHp) * 100, 100));

  // 🎨 Color por naturaleza
  const getColor = (key) => {
    if (natureData.plus === key) return "#ff6b6b";
    if (natureData.minus === key) return "#5fb0ff";
    return "#ffffff";
  };

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-box" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose}>✖</button>

        <h2 className="popup-title">Pokémon Status</h2>

        {!showIVs ? (
          <>
            {/* === VISTA DE STATS === */}
            <p className="popup-name">
              {pokemon.nickname || pokemon.species?.name}{" "}
              {pokemon.shiny ? "✨" : ""} {genderSymbol}
            </p>
            <p className="popup-lv">Lv. {pokemon.level}</p>

            <div className="popup-main">
              <div className="popup-left">
                <img
                  src={sprite}
                  alt={pokemon.species?.name}
                  className={`popup-sprite ${pokemon.shiny ? "shiny-sprite" : ""}`}
                />
                <div className="popup-types">
                  {types.map((type, i) => (
                    <img
                      key={i}
                      src={typeIcons[type.toLowerCase()]}
                      alt={type}
                      className="type-icon"
                    />
                  ))}
                </div>
              </div>

              <div className="popup-right">
                {/* HP */}
                <div className="stat-label">
                  <span>HP</span>
                  <div className="hp-container">
                    <div className="hp-bar">
                      <div
                        className="hp-fill"
                        style={{ width: `${hpPercent}%` }}
                      ></div>
                    </div>
                    <span className="hp-text">
                      {currentHp}/{maxHp}
                    </span>
                  </div>
                </div>

                {/* Otras Stats */}
                {[
                  { label: "Attack", key: "attack" },
                  { label: "Defense", key: "defense" },
                  { label: "Sp. Atk", key: "spAttack" },
                  { label: "Sp. Def", key: "spDefense" },
                  { label: "Speed", key: "speed" },
                ].map((s) => (
                  <div className="stat-label" key={s.key}>
                    <span>{s.label}</span>
                    <span
                      className={`stat-value ${
                        natureData.plus === s.key
                          ? "stat-plus"
                          : natureData.minus === s.key
                          ? "stat-minus"
                          : ""
                      }`}
                    >
                      {stats[s.key] ?? "?"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Naturaleza + Habilidad */}
            <div className="nature-ability">
              <p className="nature">Naturaleza: {nature}</p>
              <p className="ability">Habilidad: {ability}</p>
            </div>

            <button
              className="switch-btn"
              onClick={() => setShowIVs(true)}
              title="Ver IVs"
            >
              ➜
            </button>
          </>
        ) : (
          <>
            {/* === VISTA DE IVs === */}
            <p className="popup-name">
              {pokemon.nickname || pokemon.species?.name}{" "}
              {pokemon.shiny ? "✨" : ""} {genderSymbol}
            </p>
            <p className="popup-lv">Lv. {pokemon.level}</p>

            <div className="popup-main">
              <div className="popup-left">
                <img
                  src={sprite}
                  alt={pokemon.species?.name}
                  className={`popup-sprite ${pokemon.shiny ? "shiny-sprite" : ""}`}
                />
                <div className="popup-types">
                  {types.map((type, i) => (
                    <img
                      key={i}
                      src={typeIcons[type.toLowerCase()]}
                      alt={type}
                      className="type-icon"
                    />
                  ))}
                </div>
              </div>

              {/* Derecha: Hexágono IVs */}
              <div className="ivs-container">
                <svg viewBox="-140 -140 280 280" className="ivs-svg">
                  {/* Base */}
                  <polygon
                    points={basePoints.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke="#555"
                    strokeWidth="1"
                  />

                  {/* Polígono de IVs */}
                  <polygon
                    points={radarPoints}
                    fill="rgba(100, 200, 255, 0.4)"
                    stroke="#64c8ff"
                    strokeWidth="2"
                  />

                  {/* Etiquetas con color según naturaleza */}
                  {basePoints.map((p) => (
                    <text
                      key={p.name}
                      x={p.x * 1.3}
                      y={p.y * 1.3}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      style={{
                        fill: getColor(p.key),
                        fontWeight: 600,
                      }}
                    >
                      {p.name}
                    </text>
                  ))}

                  {/* Valores numéricos */}
                  {basePoints.map((p, i) => (
                    <text
                      key={i + "_val"}
                      x={p.x * 1.3}
                      y={p.y * 1.3 + 12}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      className="ivs-label"
                    >
                      {ivs[p.key] ?? 0}
                    </text>
                  ))}
                </svg>
              </div>
            </div>

            <button
              className="switch-btn"
              onClick={() => setShowIVs(false)}
              title="Volver a Stats"
            >
              ←
            </button>
          </>
        )}
      </div>
    </div>
  );
}
