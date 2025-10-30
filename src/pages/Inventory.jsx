import { useState, useEffect } from "react";
import categoryIcons from "../data/categoryIcons";
import { getPokemon } from "../data/pokemonService";

const CATEGORIES = [
  { name: "Medicinas", desc: "Contiene todo tipo de objetos curativos" },
  { name: "Poke Balls", desc: "Contiene todo tipo de Poké Balls" },
  { name: "Objetos de Batalla", desc: "Contiene todo tipo de objetos que solo tienen efecto en batalla" },
  { name: "Berries", desc: "Contiene todo tipo de Berries" },
  { name: "Otros Objetos", desc: "Contiene todo tipo de objetos que no están en otros bolsillos" },
  { name: "TMs", desc: "Contiene todo tipo de TMs" },
  { name: "Mega Piedras", desc: "Contiene todo tipo de Mega Piedras utilizadas para Mega Evolución" },
  { name: "Tesoro", desc: "Contiene todo tipo de Objetos Valiosos" },
  { name: "Objetos Clave", desc: "Contiene todo tipo de Objetos Claves" },
];

export default function Inventory() {
  const [currentCategory, setCurrentCategory] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [team, setTeam] = useState([]);
  const [items, setItems] = useState([]);
  const [transitioning, setTransitioning] = useState(false);
  const [selectingPokemon, setSelectingPokemon] = useState(false);
  const [highlightedPokemon, setHighlightedPokemon] = useState(null);
  const [logMessage, setLogMessage] = useState("");

  const category = CATEGORIES[currentCategory];
  const filteredItems = items.filter((i) => i.template_category === category.name);

  // 🔹 Cargar equipo
  useEffect(() => {
    async function fetchTeam() {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (!userData) return;
      const res = await fetch("http://localhost:8000/api/pokemons/?active=true", { credentials: "include" });
      if (!res.ok) return console.error("Error obteniendo equipo Pokémon:", res.status);
      const data = await res.json();
      const filtered = data
      .filter((p) => p.user === userData.id && p.active && p.slot > 0) // solo Pokémon del equipo real
      .sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0))
      .slice(0, 6); // toma solo los 6 primeros slots válidos

    setTeam(filtered);
    }
    fetchTeam();
  }, []);

  // 🔹 Cargar ítems
  useEffect(() => {
    const fetchItems = async () => {
      const res = await fetch("http://localhost:8000/api/user/items/", { credentials: "include" });
      if (!res.ok) return console.error("Error obteniendo items del usuario:", res.status);
      setItems(await res.json());
    };
    fetchItems();
  }, []);

  const handleCategoryChange = (newIndex) => {
    setTransitioning(true);
    setTimeout(() => {
      setCurrentCategory(newIndex);
      setSelectedItem(null);
      setSelectingPokemon(false);
      setTransitioning(false);
    }, 250);
  };

  const getSprite = (pokemon) => {
    if (!pokemon?.species) return "/sprites/unknown.png";
    const pokeId = pokemon.species.pokedex_id || pokemon.species.id;
    return pokemon.shiny
      ? `/sprites/sprites/pokemon/shiny/${pokeId}.png`
      : `/sprites/sprites/pokemon/${pokeId}.png`;
  };

  const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      for (let cookie of document.cookie.split(";")) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + "=")) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  // 🩹 Curar Pokémon usando el endpoint del backend
  const healPokemon = async (pokemon) => {
    if (!selectedItem || !selectedItem.is_healing) return;

    try {
      const csrfToken = getCookie("csrftoken");
      const res = await fetch("http://localhost:8000/api/use_item/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({
          pokemon_id: pokemon.id,
          item_id: selectedItem.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al usar el ítem.");

      // 🔄 Actualizar HP y cantidad de ítems localmente
      setTeam((prev) =>
        prev.map((p) =>
          p.id === pokemon.id ? { ...p, current_hp: data.pokemon.current_hp } : p
        )
      );

      setItems((prev) =>
        prev.map((i) =>
          i.id === selectedItem.id
            ? { ...i, quantity: Math.max(0, data.item_remaining) }
            : i
        )
      );

      setLogMessage(data.message || "Objeto usado correctamente.");
    } catch (error) {
      console.error(error);
      setLogMessage("❌ Error al aplicar el objeto.");
    } finally {
      setSelectingPokemon(false);
      setHighlightedPokemon(null);
    }
  };

  // 🔹 Borrar mensaje de log después de unos segundos
  useEffect(() => {
    if (logMessage) {
      const timer = setTimeout(() => setLogMessage(""), 3500);
      return () => clearTimeout(timer);
    }
  }, [logMessage]);

  return (
    <div className="inventory-container">
      {/* CABECERA */}
      <div className="inventory-header">
        <div className="current-category">{category.name}</div>

        <div className="category-icons">
          <button
            className="arrow-btn"
            onClick={() =>
              handleCategoryChange((currentCategory - 1 + CATEGORIES.length) % CATEGORIES.length)
            }
          >
            ◀
          </button>

          {CATEGORIES.map((cat, i) => (
            <div
              key={cat.name}
              className={`cat-icon ${i === currentCategory ? "active" : ""}`}
              title={cat.name}
              onClick={() => handleCategoryChange(i)}
            >
              <img src={categoryIcons[cat.name]} alt={cat.name} style={{ margin: "-20%" }} />
            </div>
          ))}

          <button
            className="arrow-btn"
            onClick={() => handleCategoryChange((currentCategory + 1) % CATEGORIES.length)}
          >
            ▶
          </button>
        </div>
      </div>

      {/* CUERPO */}
      <div className={`inventory-body ${transitioning ? "fade-out" : "fade-in"}`}>
        {/* EQUIPO */}
        <div className="team-column-inv">
          {team.length > 0 ? (
            team.map((pkm) => {
              const maxHp = pkm.stats?.hp ?? 1;
              const currentHp = pkm.current_hp ?? maxHp;
              const hpPercent = Math.max(0, Math.min((currentHp / maxHp) * 100, 100));
              const sprite = getSprite(pkm);
              const canSelect = selectingPokemon && currentHp < maxHp;

              return (
                <div
                  key={pkm.id}
                  className={`inv-pokemon ${
                    canSelect ? "selectable" : ""
                  } ${highlightedPokemon === pkm.id ? "highlight-pokemon" : ""}`}
                  onMouseEnter={() => selectingPokemon && setHighlightedPokemon(pkm.id)}
                  onMouseLeave={() => setHighlightedPokemon(null)}
                  onClick={() => canSelect && healPokemon(pkm)}
                >
                  <div className="pokeball-bg-inv">
                    <img
                      src="/sprites/sprites/ui/pokeballbackground.png"
                      alt="Pokéball BG"
                      className="pokeball-bg-img-inv"
                    />
                    <img
                      src={sprite}
                      alt={pkm.nickname || pkm.species?.name}
                      className={`pokemon-sprite-inv ${pkm.shiny ? "shiny-sprite" : ""}`}
                    />
                  </div>
                  <div className="hp-bar-inv">
                    <div className="hp-fill-inv" style={{ width: `${hpPercent}%` }}></div>
                    <span className="hp-text-inv">
                      {currentHp}/{maxHp}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="no-team">No Pokémon en el equipo.</p>
          )}
        </div>

        {/* LISTA DE ÍTEMS */}
        <div className="item-list">
          <div className="item-scroll">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div
                  className={`item-row ${selectedItem?.id === item.id ? "highlight" : ""}`}
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                >
                  <span className="item-name">{item.template_name}</span>
                  <span className="item-qty">x{item.quantity}</span>
                </div>
              ))
            ) : (
              <p className="no-items">No objetos en esta bolsillo.</p>
            )}
          </div>
        </div>

        {/* DETALLE */}
        <div className="item-details">
          <div className="item-title-row">
            <h3 className="item-title">{category.name}</h3>
            {selectedItem && selectedItem.is_healing && (
              <button
                className="use-btn-inv"
                onClick={() => setSelectingPokemon(true)}
                disabled={selectingPokemon || selectedItem.quantity <= 0}
              >
                🧴 Usar
              </button>
            )}
          </div>

          <p className="item-desc">{category.desc}</p>

          {selectedItem && (
            <>
              <hr className="divider" />
              <h4 className="item-subtitle">{selectedItem.template_name}</h4>
              <p className="item-subdesc">{selectedItem.template_description}</p>
            </>
          )}

          {logMessage && <p className="log-message">{logMessage}</p>}
        </div>
      </div>
    </div>
  );
}
