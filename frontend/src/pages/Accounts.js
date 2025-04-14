import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../components/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Accounts.css"; // Arquivo CSS para os estilos

const Accounts = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const goToHome = () => {
      navigate("/home");
    }
  const goToDashboard = () => {
      navigate("/dashboard");
    }
  
  const [accounts, setAccounts] = useState([]);
  //const [newAccountEmail, setNewAccountEmail] = useState("");
  //const [newAccountId, setNewAccountId] = useState("");

  useEffect(() => {
    if (!user) {
      // Redireciona para login se não estiver autenticado
      navigate("/login");
    }
    // Chama a API para listar as contas do GA
    const fetchAccounts = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/ga/accounts_ga", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const email = localStorage.getItem("email");
        console.log(email)
        setAccounts(response.data);
      } catch (error) {
        console.error("Erro ao buscar contas:", error);
      }
    };

    fetchAccounts();
  }, [user, navigate]);

  // Chama a API para adicionar contas do GA
  //const handleAddAccount = async () => {
  // if (newAccountEmail) {
  //    try {
  //      await axios.post("http://localhost:8000/api/ga/accounts", { email: newAccountEmail, account_id: newAccountId }, {
  //        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  //      });
  //      setNewAccountEmail("");
  //      setNewAccountId("");

  const handleAddAccount = async () => {
    const response = await axios.get("http://localhost:8000/api/ga/login_ga");
    window.location.href = response.data.url;
  };

  // Atualiza a lista de contas após a adição
  //const fetchAccounts = async () => {
  //  try {
  //    const response = await axios.get("http://localhost:8000/api/ga/accounts_ga", {
  //      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  //    });
  //    setAccounts(response.data);
  //  } catch (error) {
  //      console.error("Erro ao adicionar conta:", error);
  //    }
  //};
  //fetchAccounts();

  // Chama a API para remover contas do GA
  const handleRemoveAccount = async (accountId) => {
    try {
      await axios.delete(`http://localhost:8000/api/ga/accounts_ga/${accountId}`, {
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
                <span>{account.email}</span>
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
    {/* <h3>Cadastrar Nova Conta</h3>
        <input
          type="text"
          value={newAccountEmail}
          onChange={(e) => setNewAccountEmail(e.target.value)}
          placeholder="Email da nova conta"
        />
        <input
          type="text"
          value={newAccountId}
          onChange={(e) => setNewAccountId(e.target.value)}
          placeholder="Id da nova conta"
        /> */}
        </div> 
        <button onClick={handleAddAccount} className="add-btn">Adicionar Conta</button>
      <button onClick={goToHome} className="logout-btn">Home</button>
      <button onClick={goToDashboard} className="logout-btn">Dashboard</button>
      <button onClick={logout} className="logout-btn">Sair</button>
    </div>
  );
};

export default Accounts;
