// src/pages/Login.js
import React, { useContext } from "react";
import { AuthContext } from "../components/AuthContext";
import "./Login.css"; // Arquivo CSS para os estilos
import googleIcon from "../images/google-icon.svg";
import appLogo2 from "../images/app_gestao_ga_logo2.png";


const Login = () => {
  const { loginWithGoogle } = useContext(AuthContext);

  return (
    <div className="login-container">      
      <img src={appLogo2} alt="Gestao GA" className="app-logo-login"/>
      <h2 className="app-title-login">Gestão GA</h2>
      <button className="google-login-button" onClick={loginWithGoogle}>
        <img src={googleIcon} alt="Google" className="google-icon" />
        Continuar com o Google
      </button>
    </div>
  );
};

export default Login;
