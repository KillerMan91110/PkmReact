import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";

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

const categories = [
  { key: "PokeBall", label: "Poké Balls" },
  { key: "Medicinas", label: "Medicinas" },
  { key: "evolution", label: "Evolución" },
  { key: "mega_stones", label: "Mega Evolución" },
];

export default function Shop() {
  const { user, setUser } = useContext(UserContext); // ✅ dentro del componente
  const [shopItems, setShopItems] = useState([]);
  const [activeTab, setActiveTab] = useState("PokeBall");
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // 🧩 Cargar ítems y usuario
  useEffect(() => {
    async function fetchData() {
      try {
        const [itemsRes, userRes] = await Promise.all([
          fetch("http://localhost:8000/api/shop/"),
          fetch("http://localhost:8000/api/users/me/", { credentials: "include" }),
        ]);
        const items = await itemsRes.json();
        const userData = await userRes.json();
        setShopItems(items);
        setUser(userData); // 🔥 actualiza el contexto global
      } catch (error) {
        console.error("Error cargando tienda:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [setUser]);

  // 🧮 Agregar al carrito
  const addToCart = (item, qty = 1) => {
    if (qty <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { ...item, qty }];
    });
  };

  // 🛍️ Comprar todo el carrito
  const checkout = async () => {
    if (cart.length === 0) return;
    try {
      for (const i of cart) {
        const csrfToken = getCookie("csrftoken");
        const res = await fetch("http://localhost:8000/api/shop/buy/", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({ shop_id: i.id, quantity: i.qty }),
        });

        if (!res.ok) {
          const errData = await res.json();
          console.error("Error de compra:", errData);
          setMessage(`❌ ${errData.error || "No se pudo completar la compra."}`);
          return;
        }
      }

      setCart([]);
      setMessage("✅ ¡Compra realizada con éxito!");
      setTimeout(() => setMessage(""), 3000);

      // 🔄 Refrescar datos del usuario (para Navbar)
      const userRes = await fetch("http://localhost:8000/api/users/me/", {
        credentials: "include",
      });
      const updatedUser = await userRes.json();
      setUser(updatedUser); // 🔥 actualiza el contexto global

    } catch (err) {
      console.error("Error al comprar:", err);
      setMessage("❌ Error al realizar la compra.");
    }
  };

  const total = cart.reduce((sum, i) => sum + i.cost * i.qty, 0);

  if (loading)
    return <p className="text-center text-gray-500 mt-6">Cargando tienda...</p>;

  return (
    <div className="shop-container p-4 max-w-6xl mx-auto">
      <h2 className="shop-title">🏬 PokéMart</h2>

      {/* Categorías */}
      <div className="shop-tabs">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveTab(cat.key)}
            className={`shop-tab ${activeTab === cat.key ? "active" : ""}`}
          >
            {cat.label}
          </button>
        ))}
        <button
          onClick={() => setActiveTab("cart")}
          className={`shop-tab ${activeTab === "cart" ? "active-cart" : ""}`}
        >
          🛒 Carrito ({cart.length})
        </button>
      </div>

      {/* Lista de ítems */}
      {activeTab !== "cart" ? (
        <div className="shop-grid">
          {shopItems
            .filter((i) => i.shop_category === activeTab)
            .map((item) => (
              <div key={item.id} className="shop-card">
                <h3 className="shop-item-name">
                  <img src={item.sprite_path} alt="" className="inline-icon" />{" "}
                  {item.name}
                </h3>
                <p className="shop-item-desc">{item.description}</p>
                <p className="shop-item-cost">💰 {item.cost}₽</p>

                <div className="qty-select">
                  <label htmlFor={`qty-${item.id}`} className="text-sm text-gray-600 mr-1">
                    Cantidad:
                  </label>
                  <select id={`qty-${item.id}`} className="qty-dropdown">
                    {[...Array(10).keys()].map((n) => (
                      <option key={n + 1} value={n + 1}>
                        {n + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    const qty = parseInt(document.getElementById(`qty-${item.id}`).value);
                    addToCart(item, qty);
                  }}
                  className="shop-btn"
                >
                  Añadir al carrito
                </button>
              </div>
            ))}
        </div>
      ) : (
        // 🛒 Carrito
        <div className="cart-box">
          <h3>🛍️ Tu Carrito</h3>
          {cart.length === 0 ? (
            <p className="text-gray-500">No has añadido ningún ítem.</p>
          ) : (
            <>
              {cart.map((i) => (
                <div key={i.id} className="cart-item">
                  <img src={i.sprite_path} alt={i.name} className="cart-sprite" />
                  <span>{i.qty}x {i.name}</span>
                  <span>{i.cost * i.qty} ₽</span>
                </div>
              ))}
              <p className="mt-3 font-bold">Total: {total}₽</p>
              <p className="text-gray-700 mb-3">
                Tu dinero: <strong>{user?.pokedollars || 0}₽</strong>
              </p>
              <button
                onClick={checkout}
                disabled={total > (user?.pokedollars || 0)}
                className={`checkout-btn ${total > (user?.pokedollars || 0) ? "disabled" : ""}`}
              >
                Comprar
              </button>
            </>
          )}
        </div>
      )}

      {message && <div className="success-message">{message}</div>}
    </div>
  );
}
