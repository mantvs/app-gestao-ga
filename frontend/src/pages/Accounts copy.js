import React, { useEffect, useState } from "react";
import axios from "axios";

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [email, setEmail] = useState("");
  const [accountId, setAccountId] = useState("");

  // Carregar contas ao montar o componente
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/services/accounts");
      setAccounts(response.data);
    } catch (error) {
      console.error("Erro ao buscar contas:", error);
    }
  };

  const addAccount = async () => {
    if (!email || !accountId) return;

    try {
      await axios.post("http://localhost:8000/api/services/accounts", { email, account_id: accountId });
      fetchAccounts(); // Atualiza lista
      setEmail("");
      setAccountId("");
    } catch (error) {
      console.error("Erro ao adicionar conta:", error);
    }
  };

  const removeAccount = async (accountId) => {
    try {
      await axios.delete(`http://localhost:8000/api/accounts/${accountId}`);
      fetchAccounts();
    } catch (error) {
      console.error("Erro ao remover conta:", error);
    }
  };

  return (
    <div>
      <h2>Contas do Google Analytics</h2>

      {/* Formulário para adicionar conta */}
      <div>
        <input
          type="text"
          placeholder="Email da conta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="text"
          placeholder="ID da Conta GA"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        />
        <button onClick={addAccount}>Adicionar Conta</button>
      </div>

      {/* Lista de contas */}
      <ul>
        {accounts.map((account) => (
          <li key={account.account_id}>
            {account.email} (ID: {account.account_id})
            <button onClick={() => removeAccount(account.account_id)}>Remover</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Accounts;
