// src/pages/Login.js
import React, { useContext } from "react";
import { AuthContext } from "../components/AuthContext";
import "./Login.css"; // Arquivo CSS para os estilos
import googleIcon from "../images/google-icon.svg";


const Login = () => {
  const { loginWithGoogle } = useContext(AuthContext);

  return (
    <div className="login-container">
      <h2>App Gestão GA</h2>
      <p>Faça login para continuar</p>
      <button className="google-login-button" onClick={loginWithGoogle}>
        <img src={googleIcon} alt="Google" className="google-icon" />
        Continuar com o Google
      </button>
    </div>
  );
};

export default Login;
