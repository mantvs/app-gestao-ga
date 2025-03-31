import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); // Para navegação

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");

    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl); // Salva token
      const decoded = jwtDecode(tokenFromUrl);
      setUser(decoded.email);
      window.history.replaceState({}, document.title, "/"); // Remove o token da URL
      navigate("/home", { replace: true }); // Redireciona para a Home sem criar histórico
    } else {
      const token = localStorage.getItem("token");
      if (token && !user) {
        const decoded = jwtDecode(token);
        setUser(decoded.email);
      }
    }
  }, [navigate]); // Garantir que o efeito rode apenas com dependências seguras

  const loginWithGoogle = async () => {
    const response = await axios.get("http://localhost:8000/api/auth/login");
    window.location.href = response.data.url; // Redireciona para OAuth
  };

  const logout = () => {
    localStorage.removeItem("token"); // Remove o token
    setUser(null); // Limpa usuário
    setTimeout(() => navigate("/", { replace: true }), 0); // Evita atualização de estado durante render
  };

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
