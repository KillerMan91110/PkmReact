// src/pages/GachaRoll.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

// ---- Card para la lista de contenido del cofre (abajo) ----
function PokemonCard({ data }) {
  const [shiny, setShiny] = useState(false);

  const currentSprite =
    shiny && data.shiny_sprite ? data.shiny_sprite : data.normal_sprite;

  const displayedProbability = shiny
    ? (data.shiny_chance * 100).toFixed(2)
    : (data.probability ?? 0).toFixed(2);

  return (
    
    <div className="relative rounded-xl bg-slate-800/70 p-3 border border-slate-700 text-center hover:bg-slate-700/40 transition">
      {/* Probabilidad */}
      <div className="absolute top-2 right-2 text-[10px] bg-black/60 px-2 py-0.5 rounded-full">
        {displayedProbability}%
      </div>

      {/* Sprite */}
      <img
        src={currentSprite}
        alt={data.species_name}
        className="w-16 h-16 mx-auto mb-2 pixelated"
      />

      {/* Nombre */}
      <div className="text-xs font-semibold">{data.species_name}</div>

      {/* Rareza (se muestra tal cual viene del backend) */}
      <div className="text-[10px] text-slate-400 mb-2">{data.rarity}</div>

      {/* Botón Normal / Shiny */}
      {data.shiny_sprite && (
        <button
          onClick={() => setShiny((s) => !s)}
          className="text-[10px] px-2 py-1 bg-amber-500/20 rounded hover:bg-amber-500/40"
        >
          {shiny ? "Normal" : "Shiny"}
        </button>
      )}
    </div>
  );
}

// ======================================================
//             GACHA ROLL COMPLETAMENTE RANDOM
// ======================================================
export default function GachaRoll() {
  const { boxId } = useParams();
  const nav = useNavigate();

  const [box, setBox] = useState(null);
  const [spinning, setSpinning] = useState(false);

  const [displayedRail, setDisplayedRail] = useState([]);
  const [result, setResult] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const VISIBLE = 8;
  const CENTER_INDEX = 3;

  // ===========================================
  // CSRF
  // ===========================================
  useEffect(() => {
    fetch("http://localhost:8000/api/csrf/", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => localStorage.setItem("csrfToken", data.csrfToken))
      .catch(console.error);
  }, []);

  // ===========================================
  // Cargar box
  // ===========================================
  useEffect(() => {
    fetch(`http://localhost:8000/api/gacha/boxes/${boxId}/`)
      .then((res) => res.json())
      .then((data) => {
        setBox(data);
        fillRandomRail(data.pool);
      })
      .catch(() => nav("/gacha"));
  }, [boxId, nav]);

  // ===========================================
  // Generar rail RANDOM (solo para el carril de arriba)
  // ===========================================
  function fillRandomRail(pool) {
    if (!pool || pool.length === 0) return;
    const newItems = Array.from({ length: VISIBLE }, () =>
      pool[Math.floor(Math.random() * pool.length)]
    );
    setDisplayedRail(newItems);
  }

  // ===========================================
  // Pool combinado para grid inferior ORDENADO
  // ===========================================
  const mergedPool = useMemo(() => {
    if (!box || !box.pool) return [];

    const map = {};

    for (const p of box.pool) {
      const name = p.species_name;
      if (!map[name]) {
        map[name] = {
          species_name: name,
          rarity: p.rarity,
          probability: p.probability,
          normal_sprite: p.sprite,
          shiny_sprite: null,
          shiny_chance: p.shiny_chance,
        };
      }
      if (p.rarity === "shiny" || p.shiny_chance > 0.02) {
        map[name].shiny_sprite = p.sprite;
      }
    }

    const arr = Object.values(map);

    // 🔥 Orden fijo por rareza
    const rarityOrder = {
      common: 1,
      comun: 1,

      rare: 2,
      raro: 2,

      epic: 3,
      epico: 3,

      ultrabeast: 4,
      ultraente: 4,

      legendary: 5,
      legendario: 5,

      mythical: 6,
      mythic: 6,
      mitico: 6,
    };

    const normalizeRarity = (raw) => {
      if (!raw) return "";
      return raw
        .toString()
        .normalize("NFD") // separa acentos
        .replace(/[\u0300-\u036f]/g, "") // quita acentos
        .toLowerCase(); // comun, raro, epico, etc.
    };

    arr.sort((a, b) => {
      const ra = rarityOrder[normalizeRarity(a.rarity)] ?? 999;
      const rb = rarityOrder[normalizeRarity(b.rarity)] ?? 999;

      // 1) Orden por rareza
      if (ra !== rb) return ra - rb;

      // 2) Dentro de la misma rareza, orden por nombre
      return a.species_name.localeCompare(b.species_name);
    });

    return arr;
  }, [box]);

  // ===========================================
  // Tirada random + detener en resultado
  // ===========================================
  const startRoll = async () => {
    if (!box || spinning) return;

    setSpinning(true);
    setShowPopup(false);
    setResult(null);

    const csrfToken = localStorage.getItem("csrfToken") || "";

    const res = await fetch("http://localhost:8000/api/gacha/roll/", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify({ box_id: box.id }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error(data);
      setSpinning(false);
      return;
    }

    setResult(data.pokemon);

    // 2. girar random por 4 segundos
    const SPIN_TIME = 4000;

    const spinInterval = setInterval(() => {
      fillRandomRail(box.pool);
    }, 100);

    await new Promise((r) => setTimeout(r, SPIN_TIME));
    clearInterval(spinInterval);

    // 3. Construir rail con ganador en el centro
    const finalRail = Array.from({ length: VISIBLE }, (_, i) =>
      i === CENTER_INDEX
        ? box.pool.find((p) => p.species_name === data.pokemon.species)
        : box.pool[Math.floor(Math.random() * box.pool.length)]
    );

    setDisplayedRail(finalRail);

    // 4. mostrar popup un poquito después
    setTimeout(() => {
      setSpinning(false);
      setShowPopup(true);
    }, 500);
  };

  // ===========================================
  // Render
  // ===========================================
  if (!box) return null;

  const genderLabel =
    result && result.gender !== "genderless"
      ? result.gender === "male"
        ? "♂"
        : "♀"
      : "";

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 text-white">
      {/* HEADER */}
      <header className="flex items-center gap-3 mb-5">
        <button
          onClick={() => nav("/gacha")}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700"
        >
          ← Volver
        </button>

        <h2 className="text-xl md:text-2xl font-bold">{box.name}</h2>

        <div className="ml-auto rounded bg-black/50 px-2 py-1 text-sm">
          Precio: <span className="font-bold">💎 {box.price}</span>
        </div>
      </header>

      {/* CARRIL RANDOM (solo visual) */}
      <div className="gacha-rail-window">
        <div className="gacha-rail-center-line" />

        <div className="gacha-rail-strip">
          {displayedRail.map((p, i) => (
            <div key={i} className="gacha-rail-card">
              <div className="gacha-rail-card-rarity">
                {p.rarity.toUpperCase()}
              </div>
              <img
                src={p.sprite}
                className="gacha-rail-card-sprite pixelated"
                alt={p.species_name}
              />
              <div className="gacha-rail-card-name">{p.species_name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Botón */}
      <div className="mt-5">
        <button
          onClick={startRoll}
          disabled={spinning}
          className={`roll-button px-6 py-2.5 rounded-xl font-bold ${
            spinning ? "roll-button--disabled" : ""
          }`}
        >
          {spinning ? "Rodando..." : "Abrir cofre"}
        </button>
      </div>

      {/* Pool inferior (AHORA ORDENADO SIEMPRE) */}
      <section className="mt-8">
        <h3 className="text-lg font-bold mb-3">Contenido del cofre</h3>
        <div className="cofre-grid">
          {mergedPool.map((p) => (
            <PokemonCard key={p.species_name} data={p} />
          ))}
        </div>
      </section>

      {/* POPUP RESULTADO */}
      {showPopup && result && (
        <div
          className="gacha-popup-overlay"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="gacha-popup-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gacha-popup-header">
              🎉 ¡Has obtenido un Pokémon!
            </div>

            <div className="gacha-popup-body">
              <img
                src={
                  result.shiny
                    ? result.sprite_shiny || result.sprite
                    : result.sprite
                }
                className="gacha-popup-sprite pixelated"
                alt={result.species}
              />
              <div className="gacha-popup-info">
                <div className="gacha-popup-name">
                  {result.shiny && (
                    <span className="gacha-popup-shiny">✨</span>
                  )}
                  {result.species}
                  <span className="gacha-popup-level">
                    {genderLabel && ` ${genderLabel}`} • Nv {result.level}
                  </span>
                </div>

                <div className="gacha-popup-nature">
                  Naturaleza: <span>{result.nature}</span>
                </div>

                {result.ivs && (
                  <div className="gacha-popup-ivs">
                    <span>
                      HP {result.ivs.hp} / Atk {result.ivs.attack} / Def{" "}
                      {result.ivs.defense} / SpA {result.ivs.spAttack} / SpD{" "}
                      {result.ivs.spDefense} / Spe {result.ivs.speed}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              className="gacha-popup-close"
              onClick={() => setShowPopup(false)}
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
