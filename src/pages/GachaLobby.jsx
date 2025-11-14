import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GACHA_CATEGORIES } from "../data/gachaBoxes.js";

function RarityTag({ rarity }) {
  const label = {
    common: "Común",
    rare: "Rara",
    epic: "Épica",
    legendary: "Legendaria",
    shiny: "Shiny",
  }[rarity];

  return (
    <span className={`text-[10px] font-semibold rounded px-2 py-0.5
      ${rarity === "common" ? "bg-gray-700 text-gray-200" : ""}
      ${rarity === "rare" ? "bg-blue-700 text-blue-100" : ""}
      ${rarity === "epic" ? "bg-purple-700 text-purple-100" : ""}
      ${rarity === "legendary" ? "bg-amber-600 text-amber-100" : ""}
      ${rarity === "shiny" ? "bg-emerald-700 text-emerald-100" : ""}
    `}>
      {label}
    </span>
  );
}

export default function GachaLobby() {
  const nav = useNavigate();

  const [activeCategory, setActiveCategory] = useState("Gen 1");
  const [balance, setBalance] = useState(null);
  const [boxes, setBoxes] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/currency/", { credentials: "include" })
      .then(res => res.json())
      .then(data => setBalance(data.pokediamonds ?? 0))
      .catch(() => setBalance(0));
  }, []);

  useEffect(() => {
    fetch("http://localhost:8000/api/gacha/boxes/")
      .then(res => res.json())
      .then(data => setBoxes(data))
      .catch(err => console.error(err));
  }, []);

  const filteredBoxes = useMemo(
    () => boxes.filter(b => b.category === activeCategory),
    [boxes, activeCategory]
  );

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 text-white">
      <header className="mb-6 flex items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold">🎁 Gatcha • Cofres</h2>
        <div className="ml-auto flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5">
          <img src="/icons/diamond.svg" alt="PD" className="w-5 h-5" />
          <span className="text-sm font-semibold">
            {balance === null ? "…" : `${balance} PokéDiamonds`}
          </span>
        </div>
      </header>

      <div className="mb-5 flex w-full overflow-x-auto gap-2 no-scrollbar">
        {GACHA_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border
              ${activeCategory === cat
                ? "bg-amber-500 border-amber-400 text-black"
                : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBoxes.map(box => (
          <article key={box.id}
            className="rounded-2xl bg-slate-900/70 border border-slate-800 
                       shadow-lg overflow-hidden hover:shadow-xl transition">

            {/* Cofre 3D clickable */}
            <div
              className="chest-3d cursor-pointer"
              onClick={() => nav(`/gacha/${box.id}`)}
            >
              <div className="chest-3d-inner">
                <div className="chest-3d-lid" />
                <div className="chest-3d-body" />
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <h3 className="text-lg font-bold">{box.name}</h3>
                <div className="ml-auto inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1">
                  <img src="/icons/diamond.svg" className="w-4 h-4" alt="" />
                  <span className="text-sm font-semibold">{"Precio: "}{box.price} 💎</span>
                </div>
              </div>

              {/* Odds por rareza */}
              {box.rarity_breakdown && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(box.rarity_breakdown).map(([rarity, pct]) => (
                    <div key={rarity} className="flex items-center gap-1">
                      <RarityTag rarity={rarity} />
                      <span className="text-xs text-slate-300">{pct} %</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                disabled={balance !== null && balance < box.price}
                onClick={() => nav(`/gacha/${box.id}`)}
                className={`w-full rounded-xl py-2 font-bold text-sm
                  ${balance !== null && balance < box.price
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-amber-500 hover:bg-amber-400 text-black"}`}
              >
                {balance !== null && balance < box.price ? "Saldo insuficiente" : "Ver y tirar"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
