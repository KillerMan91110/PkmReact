import { useEffect, useState } from "react";

export default function PCBox() {
  const [team, setTeam] = useState([]);
  const [box, setBox] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedBox, setSelectedBox] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const teamRes = await fetch("http://localhost:8000/api/pokemons/all/?active=true", { credentials: "include" });
      const teamData = await teamRes.json();
      setTeam(teamData.sort((a, b) => (a.slot || 999) - (b.slot || 999))); // 🔢 Ordena por slot

      const boxRes = await fetch("http://localhost:8000/api/pokemons/all/?active=false", { credentials: "include" });
      const boxData = await boxRes.json();
      setBox(boxData.sort((a, b) => (a.slot_pc || 9999) - (b.slot_pc || 9999))); // 🔢 Ordena por slot
    };
    fetchData();
  }, []);

  const swapPokemons = async () => {
    if (!selectedTeam || !selectedBox) return;
    const csrf = document.cookie.split("; ").find(r => r.startsWith("csrftoken="))?.split("=")[1];

    const res = await fetch("http://localhost:8000/api/pokemons/swap/", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRFToken": csrf },
      body: JSON.stringify({
        team_pokemon_id: selectedTeam.id,
        box_pokemon_id: selectedBox.id
      })
    });

    const data = await res.json();
    if (res.ok) {
        setMessage(data.message);

        // 📦 Actualiza el estado local inmediatamente sin recargar
        setTeam(prev =>
            prev
            .map(p => (p.id === selectedTeam.id ? { ...selectedBox, active: true, slot: selectedTeam.slot, slot_pc: 0 } : p))
            .sort((a, b) => (a.slot || 999) - (b.slot || 999))
        );

        setBox(prev =>
            prev
            .map(p => (p.id === selectedBox.id ? { ...selectedTeam, active: false, slot: 0, slot_pc: selectedBox.slot_pc } : p))
            .sort((a, b) => (a.slot_pc || 9999) - (b.slot_pc || 9999))
        );

        setSelectedTeam(null);
        setSelectedBox(null);
        } else {
            setMessage(data.error || "Error al intercambiar Pokémon");
         }
     };

  return (
    <div className="pcbox-wrapper p-6">
      <h2 className="text-2xl font-bold mb-3 text-center">💾 PC BOX</h2>

      {message && <p className="text-center text-green-600 mb-2">{message}</p>}

      {/* Equipo Actual */}
      <h3 className="text-lg font-semibold mt-4 mb-2 text-maroon">Equipo Actual</h3>
      <div className="pokemon-grid">
        {team.map((pkm) => (
          <div
            key={pkm.id}
            onClick={() => setSelectedTeam(pkm)}
            className={`pokemon-card ${selectedTeam?.id === pkm.id ? "selected-team animate-pulse" : ""}`}
          >
            <div className="slot-number">#{pkm.slot || "-"}</div>
            <img
            src={pkm.shiny
                ? `/sprites/sprites/pokemon/shiny/${pkm.species.pokedex_id}.png`
                : `/sprites/sprites/pokemon/${pkm.species.pokedex_id}.png`}
            alt={pkm.nickname}
            className={pkm.shiny ? "shine" : ""}
            />
            <div className="pkm-header">
            <p className="pkm-name">
                {pkm.nickname}
                {pkm.gender === "male" && <span className="gender male"> ♂️</span>}
                {pkm.gender === "female" && <span className="gender female"> ♀️</span>}
            </p>
            {pkm.shiny && <span className="shiny-badge">✨ Shiny</span>}
            </div>
            <p className="pkm-lvl">Lvl {pkm.level}</p>

          </div>
        ))}
      </div>

      <div className="flex justify-center my-4">
        <button
          onClick={swapPokemons}
          className="swap-btn"
          disabled={!selectedTeam || !selectedBox}
        >
          🔄 Intercambiar
        </button>
      </div>

      {/* Pokémon en PC */}
      <h3 className="text-lg font-semibold mt-4 mb-2 text-maroon">Pokémon en PC</h3>
      <div className="pokemon-grid">
        {box.map((pkm) => (
          <div
            key={pkm.id}
            onClick={() => setSelectedBox(pkm)}
            className={`pokemon-card ${selectedBox?.id === pkm.id ? "selected-box animate-pulse" : ""}`}
          >
            <div className="slot-number">#{pkm.slot_pc || "-"}</div>
            <img
            src={pkm.shiny
                ? `/sprites/sprites/pokemon/shiny/${pkm.species.pokedex_id}.png`
                : `/sprites/sprites/pokemon/${pkm.species.pokedex_id}.png`}
            alt={pkm.nickname}
            className={pkm.shiny ? "shine" : ""}
            />
            <div className="pkm-header">
            <p className="pkm-name">
                {pkm.nickname}
                {pkm.gender === "male" && <span className="gender male"> ♂️</span>}
                {pkm.gender === "female" && <span className="gender female"> ♀️</span>}
            </p>
            {pkm.shiny && <span className="shiny-badge">✨ Shiny</span>}
            </div>
            <p className="pkm-lvl">Lvl {pkm.level}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
