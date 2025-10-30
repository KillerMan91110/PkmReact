import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function PrivateRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function verifySession() {
      try {
        const res = await fetch("http://localhost:8000/api/users/me/", {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          setAuthorized(true);
        } else {
          // 🔹 Elimina el user si la sesión no existe
          localStorage.removeItem("user");
          setAuthorized(false);
        }
      } catch (err) {
        console.error("Error verificando sesión:", err);
        setAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    }

    verifySession();
  }, []);

  if (isLoading) {
    return (
        <div style={{ textAlign: "center", marginTop: "100px", color: "#fff" }}>
        <img
            src="/sprites/sprites/items/poke-ball.png"
            alt="Cargando..."
            style={{
            width: "60px",
            height: "60px",
            animation: "spin 1s linear infinite",
            }}
        />
        <p>Verificando sesión...</p>
        </div>
    );
  }


  // 🔒 Si no está autorizado, lo redirigimos al home (login)
  return authorized ? children : <Navigate to="/" replace />;
}
