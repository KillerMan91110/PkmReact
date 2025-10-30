import { useState } from "react";
import "./Navbar.css"; // 👈 Asegúrate de tener el CSS agregado

export default function AuthModal({ showModal, setShowModal }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    email: "",
    password: "",
    nickname: "",
    repeatPassword: "",
  });

  const fetchCsrf = async () => {
    const res = await fetch("http://localhost:8000/api/csrf/", {
      credentials: "include",
    });
    const data = await res.json();
    return data.csrfToken;
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const loginUser = async (email, password) => {
    const csrftoken = await fetchCsrf();
    const res = await fetch("http://localhost:8000/api/login/", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken,
      },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Credenciales inválidas");
    return await res.json();
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.repeatPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    const csrftoken = await fetchCsrf();
    const res = await fetch("http://localhost:8000/api/register/", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken,
      },
      body: JSON.stringify({
        nickname: form.nickname,
        email: form.email,
        password: form.password,
        repeat_password: form.repeatPassword,
      }),
    });

    if (!res.ok) throw new Error("Error al registrar");

    const userData = await loginUser(form.email, form.password);
    localStorage.setItem("user", JSON.stringify(userData));
    setShowModal(false);
    window.location.href = "/game";
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userData = await loginUser(form.email, form.password);
      localStorage.setItem("user", JSON.stringify(userData));
      setShowModal(false);
      window.location.href = "/game";
    } catch (err) {
      alert("Error al iniciar sesión");
    }
  };

  if (!showModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        {/* ✖ Botón de cierre */}
        <button className="modal-close" onClick={() => setShowModal(false)}>
          ✖
        </button>

        <h2>{isLogin ? "Iniciar Sesión" : "Registrar Cuenta"}</h2>

        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          {!isLogin && (
            <input
              type="text"
              name="nickname"
              placeholder="Nickname"
              value={form.nickname}
              onChange={handleChange}
              required
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Correo"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            required
          />
          {!isLogin && (
            <input
              type="password"
              name="repeatPassword"
              placeholder="Repetir contraseña"
              value={form.repeatPassword}
              onChange={handleChange}
              required
            />
          )}
          <button type="submit">{isLogin ? "Entrar" : "Registrar"}</button>
        </form>

        <p>
          {isLogin ? (
            <>
              ¿No tienes cuenta?{" "}
              <span onClick={() => setIsLogin(false)}>Regístrate</span>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{" "}
              <span onClick={() => setIsLogin(true)}>Inicia sesión</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
