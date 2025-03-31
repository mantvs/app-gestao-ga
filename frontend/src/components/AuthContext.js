import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useLocation } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const location = useLocation(); // Verifica a URL atual

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");

    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl); // Salvar token
      const decoded = jwtDecode(tokenFromUrl);
      setUser(decoded.email);
      window.history.replaceState({}, document.title, "/home"); // Remover token da URL e redirecionar
      window.location.href = "/home";
    } else {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode(token);
        setUser(decoded.email);
      }
    }
  }, [location]); // Executa novamente ao mudar a URL

  const loginWithGoogle = async () => {
    const response = await axios.get("http://localhost:8000/api/auth/login");
    window.location.href = response.data.url;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/"; // Redireciona para a tela de login
  };

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
