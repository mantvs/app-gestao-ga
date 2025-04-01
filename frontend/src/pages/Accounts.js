import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../components/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Accounts.css"; // Arquivo CSS para os estilos

const Account = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [accounts, setAccounts] = useState([]);
  const [newAccount, setNewAccount] = useState("");

  useEffect(() => {
    if (!user) {
      // Redireciona para login se não estiver autenticado
      navigate("/login");
    }
    // Chama a API para listar as contas do GA
    const fetchAccounts = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/ga/accounts", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setAccounts(response.data);
      } catch (error) {
        console.error("Erro ao buscar contas:", error);
      }
    };

    fetchAccounts();
  }, [user, navigate]);

  const handleAddAccount = async () => {
    if (newAccount) {
      try {
        await axios.post("http://localhost:8000/api/ga/accounts", { accountName: newAccount }, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setNewAccount("");
        // Atualiza a lista de contas após a adição
        const response = await axios.get("http://localhost:8000/api/ga/accounts", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setAccounts(response.data);
      } catch (error) {
        console.error("Erro ao adicionar conta:", error);
      }
    }
  };

  const handleRemoveAccount = async (accountId) => {
    try {
      await axios.delete(`http://localhost:8000/api/ga/accounts/${accountId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      // Atualiza a lista de contas após a remoção
      setAccounts(accounts.filter(account => account.id !== accountId));
    } catch (error) {
      console.error("Erro ao remover conta:", error);
    }
  };

  return (
    <div className="account-container">
      <h2>Contas do Google Analytics</h2>
      <div className="account-list">
        <h3>Minhas Contas</h3>
        {accounts.length === 0 ? (
          <p>Você não tem nenhuma conta cadastrada.</p>
        ) : (
          <ul>
            {accounts.map((account) => (
              <li key={account.id} className="account-item">
                <span>{account.name}</span>
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveAccount(account.id)}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="add-account">
        <h3>Cadastrar Nova Conta</h3>
        <input
          type="text"
          value={newAccount}
          onChange={(e) => setNewAccount(e.target.value)}
          placeholder="Nome da nova conta"
        />
        <button onClick={handleAddAccount} className="add-btn">Adicionar Conta</button>
      </div>

      <button onClick={logout} className="logout-btn">Sair</button>
    </div>
  );
};

export default Account;
