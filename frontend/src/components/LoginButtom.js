import React from 'react';

const LoginButton = () => {
  const handleLogin = () => {
    // Redireciona para a rota de login no backend (FastAPI)
    window.location.href = 'http://localhost:8000/login';
  };

  return (
    <button onClick={handleLogin}>
      Login com Google
    </button>
  );
};

export default LoginButton;
