// src/components/Header.js

import React from 'react';
import { useAuth } from './AuthContext'; // Importe o hook do contexto

const Header = () => {
    const { user, logout } = useAuth();

    return (
        <header>
            <h1>Bem-vindo {user ? user.email : 'Visitante'}</h1>
            {user && (
                <button onClick={logout}>Deslogar</button> // Chama a função de logout
            )}
        </header>
    );
};

export default Header;
