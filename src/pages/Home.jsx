import { useState } from "react";

export default function Home({ showModal, setShowModal }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    email: "",
    password: "",
    nickname: "",
    repeatPassword: "",
  });

  // Obtener token CSRF
  const fetchCsrf = async () => {
    const res = await fetch("http://localhost:8000/api/csrf/", {
      credentials: "include",
    });
    const data = await res.json();
    return data.csrfToken;
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Login
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

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(JSON.stringify(errorData));
    }

    return await res.json();
  };

  // Registro
  const handleRegister = async (e) => {
    e.preventDefault();

    if (form.password !== form.repeatPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    try {
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

      if (!res.ok) {
        const errorData = await res.json();
        alert("Error al registrar: " + JSON.stringify(errorData));
        return;
      }

      const userData = await loginUser(form.email, form.password);
      localStorage.setItem("user", JSON.stringify(userData));
      setShowModal(false);
      window.location.href = "/game";
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  };

  // Login manual
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userData = await loginUser(form.email, form.password);
      localStorage.setItem("user", JSON.stringify(userData));
      setShowModal(false);
      window.location.href = "/game";
    } catch (err) {
      console.error(err);
      alert("Usuario o contraseña incorrectos: " + err.message);
    }
  };

  return (
    <>
      {showModal && (
        <div className="modal-overlay">
  <div className="modal-box">
    <button
      style={{
        position: "absolute",
        top: "15px",
        right: "20px",
        background: "none",
        border: "none",
        color: "#ccc",
        fontSize: "1.2rem",
        cursor: "pointer",
      }}
      onClick={() => setShowModal(false)}
    >
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
      )}
    </>
  );
}
