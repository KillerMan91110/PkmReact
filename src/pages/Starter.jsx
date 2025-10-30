import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPokemon } from "../data/pokemonService.js";
import StarterPopup from "../components/StarterPopup.jsx";

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export default function Starter() {
  const [user, setUser] = useState(null);
  const [starterSelected, setStarterSelected] = useState(null);
  const [loadedStarters, setLoadedStarters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  const starterGens = [
    [1, 4, 7],
    [152, 155, 158],
    [252, 255, 258],
    [387, 390, 393],
    [495, 498, 501],
    [650, 653, 656],
    [722, 725, 728],
    [810, 813, 816],
    [906, 909, 912],
  ];

  useEffect(() => {
    async function init() {
      try {
        await fetch("http://localhost:8000/api/csrf/", { credentials: "include" });
        const sessionRes = await fetch("http://localhost:8000/api/users/me/", {
          method: "GET",
          credentials: "include",
        });

        if (!sessionRes.ok) {
          navigate("/");
          return;
        }

        const currentUser = await sessionRes.json();
        if (currentUser.starter) {
          navigate("/");
          return;
        }

        setUser(currentUser);

        const allStarters = [];
        for (const gen of starterGens) {
          for (const id of gen) {
            const pkm = await getPokemon(id, 5);
            if (!pkm) continue;
            allStarters.push({
              pokedex_id: pkm.id,
              name: pkm.displayName,
              sprite: pkm.sprite,
            });
          }
        }
        setLoadedStarters(allStarters);
        setLoading(false);
      } catch {
        navigate("/");
      }
    }
    init();
  }, [navigate]);

  const handleChooseStarter = async () => {
    if (!starterSelected) {
      alert("Selecciona un Pokémon inicial antes de continuar.");
      return;
    }

    const csrftoken = getCookie("csrftoken");

    const response = await fetch("http://localhost:8000/api/choose-starter/", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken,
      },
      body: JSON.stringify({ pokedex_id: starterSelected.pokedex_id }),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(`Error: ${error.error || "No se pudo asignar el Pokémon"}`);
      return;
    }

    const data = await response.json();
    localStorage.setItem(
      "user",
      JSON.stringify({
        ...user,
        starter: true,
        pokedollars: (user.pokedollars || 0) + 10000,
      })
    );

    // ✅ Mostrar popup animado
    setShowPopup(true);
  };

  return (
    <div className="game-container">
      <h1>¡Bienvenido, {user?.nickname}!</h1>
      <h2>Elige tu Pokémon inicial</h2>

      {starterGens.map((gen, i) => (
        <div key={i} className="starter-grid">
          {gen.map((id) => {
            const p = loadedStarters.find((s) => s.pokedex_id === id);
            if (!p) return null;
            return (
              <div
                key={p.pokedex_id}
                className={`starter-card ${
                  starterSelected?.pokedex_id === p.pokedex_id ? "selected" : ""
                }`}
                onClick={() => setStarterSelected(p)}
              >
                <img src={p.sprite} alt={p.name} />
                <div className="starter-info">
                  <input
                    type="radio"
                    name="starter"
                    checked={starterSelected?.pokedex_id === p.pokedex_id}
                    onChange={() => setStarterSelected(p)}
                  />
                  <p>{p.name}</p>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <button onClick={handleChooseStarter} className="choose-btn">
        Elegir Pokémon Inicial
      </button>

      {/* 💥 Popup final con bonus */}
      <StarterPopup
        show={showPopup}
        pokemon={starterSelected}
        nickname={user?.nickname}
        onClose={() => navigate("/map")}
      />
    </div>
  );
}
