import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext"; // 👈 nuevo import
import "./Navbar.css";

export default function Navbar({ onAuthClick }) {
  const { user, setUser } = useContext(UserContext); // 👈 usamos el contexto
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const csrfRes = await fetch("http://localhost:8000/api/csrf/", {
        credentials: "include",
      });
      const { csrfToken } = await csrfRes.json();

      const res = await fetch("http://localhost:8000/api/logout/", {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRFToken": csrfToken },
      });

      if (!res.ok) return console.error("Error al cerrar sesión:", res.status);

      document.cookie.split(";").forEach((cookie) => {
        const name = cookie.split("=")[0].trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
      });

      setUser(null); // 👈 Limpia el contexto
      localStorage.removeItem("user");
      window.location.href = "/";
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 100_000) return Math.floor(num / 1_000) + "k";
    if (num >= 10_000) return (num / 1_000).toFixed(1) + "k";
    return num;
  };

  const getXPProgress = () => {
    if (!user) return 0;
    const { experience, experience_to_next_level } = user;
    if (!experience_to_next_level || experience_to_next_level <= 0) return 0;
    return Math.min((experience / experience_to_next_level) * 100, 100);
  };

  return (
    <nav className="navbar">
      <div className="navbar-left" onClick={() => navigate("/")}>
        <h2 className="navbar-logo">Pokémon Idle RPG</h2>
      </div>

      <div className="navbar-right">
        {!user ? (
          <button className="navbar-btn" onClick={onAuthClick}>
            Iniciar Sesión / Registrarse
          </button>
        ) : (
          <>
            <div className="navbar-currencies">
              <div className="currency-item">
                <img src="/sprites/sprites/items/pokedollar.png" alt="Pokédollar" className="currency-icon" />
                <span>{formatNumber(user.pokedollars || 0)}</span>
              </div>
              <div className="currency-item">
                <img src="/sprites/sprites/items/pokediamond.png" alt="Pokédiamond" className="currency-icon" />
                <span>{formatNumber(user.pokediamonds || 0)}</span>
              </div>
            </div>

            <div className="navbar-user">
              <div className="level-circle">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path
                    className="circle"
                    strokeDasharray={`${getXPProgress()}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="21" className="level-text" transform="rotate(90, 18, 18)">
                    {user.level || 1}
                  </text>
                </svg>
              </div>

              <div className="navbar-profile" onClick={() => setMenuOpen(!menuOpen)}>
                <img src="/sprites/sprites/items/poke-ball.png" alt="profile" className="profile-icon" />
                <span>{user.nickname}</span>
              </div>

              {menuOpen && (
                <div className="navbar-dropdown"> 
                  <button onClick={() => navigate("/pcbox")}>PC</button>
                  <button onClick={() => navigate("/team")}>Ver equipo</button>
                  <button onClick={() => navigate("/inventory")}>Inventario</button>
                  <button onClick={() => navigate("/shop")}>Tienda</button>
                  <button onClick={() => navigate("/gacha")}>Gacha</button>
                  <button onClick={handleLogout}>Cerrar sesión</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
