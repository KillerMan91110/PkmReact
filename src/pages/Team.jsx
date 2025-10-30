import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TeamPopup from "../components/TeamPopup.jsx";

export default function Team() {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTeam() {
      try {
        const userData = JSON.parse(localStorage.getItem("user"));
        if (!userData) {
          navigate("/");
          return;
        }
        setUser(userData);

        const res = await fetch("http://localhost:8000/api/pokemons/?active=true", {
          credentials: "include",
        });

        if (!res.ok) {
          console.error("Error obteniendo equipo Pokémon:", res.status);
          setTeam([]);
          return;
        }

        const data = await res.json();

        // 🔹 Filtrar solo los Pokémon del usuario y ordenar por el campo 'slot'
        const filtered = data
          .filter((p) => p.user === userData.id)
          .sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));

        setTeam(filtered);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTeam();
  }, [navigate]);

  if (loading) return <h2 style={{ textAlign: "center" }}>Cargando equipo...</h2>;

  // 🔹 Garantiza siempre 6 slots (aunque algunos estén vacíos)
  const fullTeam = Array.from({ length: 6 }).map(
    (_, i) => team.find((p) => p.slot === i + 1) || null
  );

  // 🔹 Función para obtener el sprite correcto (shiny o normal)
  const getSprite = (pokemon) => {
    if (!pokemon || !pokemon.species) return "/sprites/unknown.png";

    const pokeId = pokemon.species.pokedex_id || pokemon.species.id;
    const shiny = pokemon.shiny === true;

    if (shiny) {
      return `/sprites/sprites/pokemon/shiny/${pokeId}.png`;
    } else {
      return `/sprites/sprites/pokemon/${pokeId}.png`;
    }
  };

  return (
    <div className="team-container">
      <h1 className="team-title">Tu Equipo Pokémon</h1>

      <div className="team-grid">
        {fullTeam.map((p, index) => {
          const slotNumber = index + 1;

          if (!p) {
            // 🟥 Slot vacío
            return (
              <div key={index} className="team-card empty-slot">
                <div className="pokeball-bg-team" />
                <div className="team-info">
                  <h3>Slot {slotNumber}</h3>
                  <p style={{ color: "#777" }}>Vacío</p>
                </div>
              </div>
            );
          }

          // ✅ Slot con Pokémon
          const genderSymbol =
            p.gender === "female" ? "♀️" : p.gender === "male" ? "♂️" : "";
          const stats = p.stats ?? {};
          const maxHp = stats.hp ?? 1;
          const currentHp = p.current_hp ?? maxHp;
          const hpPercent = Math.max(0, Math.min((currentHp / maxHp) * 100, 100));
          const sprite = getSprite(p);

          return (
            <div
              key={p.id}
              className="team-card"
              onClick={() => setSelectedPokemon(p)}
              style={{ cursor: "pointer" }}
            >
              <h3 className="slot-title">Slot {slotNumber}</h3>

              <img
                src={sprite}
                alt={p.nickname || p.species?.name}
                className={`team-sprite ${p.shiny ? "shiny-sprite" : ""}`}
              />

              <div className="team-info">
                <h3>
                  {p.nickname || p.species?.name}{" "}
                  {p.shiny ? "✨" : ""} {genderSymbol} Lv.{p.level}
                </h3>

                <div className="hp-bar">
                  <div className="hp-fill" style={{ width: `${hpPercent}%` }}></div>
                </div>

                <span className="hp-text">
                  {currentHp}/{maxHp}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPokemon && (
        <TeamPopup
          pokemon={selectedPokemon}
          onClose={() => setSelectedPokemon(null)}
        />
      )}
    </div>
  );
}
