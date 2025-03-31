import React, { useContext } from "react";
import { AuthContext } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Home.css"; // Importando o CSS

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove o token do localStorage
    navigate("/"); // Redireciona para a tela de login
    window.location.reload(); // Força a atualização da página
  };

  return (
    <div className="home-container">
      <div className="sidebar">
        <h2>Menu</h2>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
      <div className="content">
        <h1>Bem-vindo, {user}!</h1>
        <p>Você está autenticado com sua conta do Google.</p>
      </div>
    </div>
  );
};

export default Home;
