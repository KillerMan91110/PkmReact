import React from "react";

export default function StarterPopup({ show, pokemon, onClose, nickname }) {
  if (!show) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <h2 className="popup-title">¡Escogiste!</h2>
        <img src={pokemon.sprite} alt={pokemon.name} className="popup-pokemon" />
        <h3 className="popup-name">{pokemon.name}</h3>

        <div className="popup-bonus">
          <h4>🎁 Bonus</h4>
          <div className="bonus-items">
            <div className="item">
              <img src="/sprites/sprites/items/pokedollar.png" alt="Pokédollars" />
              <span>+10000</span>
            </div>
            <div className="item">
              <img src="/sprites/sprites/items/poke-ball.png" alt="Pokéball" />
              <span>x10</span>
            </div>
            <div className="item">
              <img src="/sprites/sprites/items/great-ball.png" alt="Superball" />
              <span>x10</span>
            </div>
            <div className="item">
              <img src="/sprites/sprites/items/potion.png" alt="Poción" />
              <span>x5</span>
            </div>
          </div>
        </div>

        <button className="popup-btn" onClick={onClose}>
          ¡Buena suerte, {nickname}!
        </button>
      </div>
    </div>
  );
}
