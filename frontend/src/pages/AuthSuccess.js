// src/pages/AuthSuccess.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const AuthSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      localStorage.setItem("token", token);
      const decoded = jwtDecode(token);
      console.log("Usuário autenticado:", decoded.email);
      navigate("/dashboard", { replace: true }); // Redireciona para Dashboard
    } else {
      navigate("/", { replace: true }); // Se não tiver token, volta para login
    }
  }, [navigate]);

  return <h2>Autenticando...</h2>;
};

export default AuthSuccess;
