import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Capturar o token da URL após o redirecionamento
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");

    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl); // Salvar token
      const decoded = jwtDecode(tokenFromUrl);
      setUser(decoded.email);
      window.history.replaceState({}, document.title, "/"); // Remover token da URL
    } else {
      // Se não tem token na URL, verificar no localStorage
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode(token);
        setUser(decoded.email);
      }
    }
  }, []);

  const loginWithGoogle = async () => {
    const response = await axios.get("http://localhost:8000/api/auth/login");
    window.location.href = response.data.url;
    
  };

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};
