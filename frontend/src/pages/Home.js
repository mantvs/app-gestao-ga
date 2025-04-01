import React, { useContext } from "react";
import { AuthContext } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Home.css"; // Estilos da Home

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const goToAccounts = () => {
    navigate("/accounts");
  }

  if (!user) {
    navigate("/");
    return null; // Evita exibir a Home antes do redirecionamento
  }

  return (
    <div className="home-container">
      <h2>Bem-vindo, {user}!</h2>
      <button onClick={goToAccounts}>Gerenciar Contas</button>
      <p></p>
      <button onClick={logout}>Sair</button>
    </div>
  );
};

export default Home;