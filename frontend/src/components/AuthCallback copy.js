import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Fazer uma requisição para a rota /auth no backend
    axios.get('http://localhost:8000/auth')
      .then(response => {
        const user = response.data.user;
        // Armazenar o token ou dados do usuário (exemplo no localStorage)
        localStorage.setItem('user', JSON.stringify(user));
        navigate.push('/dashboard');  // Redirecionar para o dashboard ou outra rota
      })
      .catch(error => {
        console.error('Erro ao autenticar', error);
      });
  }, [navigate]);

  return <div>Carregando...</div>;
};

export default AuthCallback;
