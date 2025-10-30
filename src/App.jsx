import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { UserProvider } from "./context/UserContext"; // 👈 Importa el contexto
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Game from "./pages/Starter.jsx";
import AuthModal from "./components/AuthModal.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import Team from "./pages/Team.jsx";
import Inventory from "./pages/Inventory.jsx";
import Battle from "./pages/Battle.jsx";
import Shop from "./pages/Shop.jsx";
import PCBox from "./pages/PCBox.jsx";

export default function App() {
  const [showModal, setShowModal] = useState(false);

  return (
    <UserProvider>
      <Router>
        <Navbar onAuthClick={() => setShowModal(true)} />
        <AuthModal showModal={showModal} setShowModal={setShowModal} />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/game"
            element={
              <PrivateRoute>
                <Game />
              </PrivateRoute>
            }
          />
          <Route
            path="/team"
            element={
              <PrivateRoute>
                <Team />
              </PrivateRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <PrivateRoute>
                <Inventory />
              </PrivateRoute>
            }
          />
          <Route
            path="/battle"
            element={
              <PrivateRoute>
                <Battle />
              </PrivateRoute>
            }
          />
          <Route
            path="/shop"
            element={
              <PrivateRoute>
                <Shop />
              </PrivateRoute>
            }
          />
          <Route
            path="/pcbox"
            element={
              <PrivateRoute>
                <PCBox />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </UserProvider>
  );
}
