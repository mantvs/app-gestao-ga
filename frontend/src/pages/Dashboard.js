import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [trafficData, setTrafficData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [siteUrl, setSiteUrl] = useState("");
  const navigate = useNavigate();
  const goToHome = () => navigate("/home");
  const goToAccounts = () => navigate("/accounts");

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/ga/accounts_ga", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setAccounts(response.data);
        if (response.data.length > 0) {
          setSelectedAccount(response.data[0]); // Seleciona a primeira conta por padrão
        }
      } catch (error) {
        console.error("Erro ao buscar contas do GA:", error);
      }
    };

    fetchAccounts();
  }, []);

  useEffect(() => {
    if (!selectedAccount) return;

    const fetchTrafficData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:8000/api/ga/data_ga?property_id=${selectedAccount.property_id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setTrafficData(response.data.traffic); 
        setSiteUrl(response.data.site_url);
      } catch (error) {
        console.error("Erro ao buscar dados do GA:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrafficData();
  }, [selectedAccount]);

  return (
    <div className="dashboard-container">
      <h2>Dashboard do Google Analytics</h2>

      <select
        className="account-selector"
        value={selectedAccount?.property_id || ""}
        onChange={(e) => {
          const account = accounts.find(acc => acc.property_id === e.target.value);
          setSelectedAccount(account);
        }}
      >
        {accounts.map((account) => (
          <option key={account.property_id} value={account.property_id}>
            {account.email} - {account.property_id}
          </option>
        ))}
      </select>

      {loading ? (
        <p>Carregando dados...</p>
      ) : trafficData.length > 0 ? (        
        <Bar
          data={{
            labels: trafficData.map((item) => item.period),
            datasets: [
              {
                label: `Usuários Ativos - ${siteUrl}`,
                backgroundColor: "#10a37f",
                borderColor: "#0d8a6b",
                borderWidth: 1,
                data: trafficData.map((item) => item.activeUsers),
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { display: true },
            },
          }}
        />
      ) : (
        <p>Nenhum dado disponível</p>
      )}

      <button onClick={goToHome} className="logout-btn">Home</button>
      <button onClick={goToAccounts} className="logout-btn">Gerenciar Contas</button>
    </div>
  );
};

export default Dashboard;
