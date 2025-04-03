import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [trafficData, setTrafficData] = useState({});
  const [consolidatedData, setConsolidatedData] = useState([]);
  const [selectedView, setSelectedView] = useState("Individual"); // Novo dropdown
  const [selectedHost, setSelectedHost] = useState("");
  const [loading, setLoading] = useState(true);
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
          setSelectedAccount(response.data[0]);
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
        setConsolidatedData(response.data.consolidated);
        setSelectedHost(Object.keys(response.data.traffic)[0] || "");
      } catch (error) {
        console.error("Erro ao buscar dados do GA:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrafficData();
  }, [selectedAccount]);

  const handleViewChange = (e) => {
    setSelectedView(e.target.value);
  };

  const handleHostChange = (e) => {
    setSelectedHost(e.target.value);
  };

  return (
    <div className="dashboard-container">
      <h2>Dashboard do Google Analytics</h2>

      {/* Dropdown para selecionar a conta */}
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

      {/* Dropdown para selecionar "Individual" ou "Consolidado" */}
      <select className="view-selector" value={selectedView} onChange={handleViewChange}>
        <option value="Individual">Individual</option>
        <option value="Consolidado">Consolidado</option>
      </select>

      {/* Dropdown para escolher o site quando está no modo "Individual" */}
      {selectedView === "Individual" && (
        <select className="host-selector" value={selectedHost} onChange={handleHostChange}>
          {Object.keys(trafficData).map((host) => (
            <option key={host} value={host}>
              {host}
            </option>
          ))}
        </select>
      )}

      {loading ? (
        <p>Carregando dados...</p>
      ) : selectedView === "Individual" ? (
        trafficData[selectedHost] ? (
          <Bar
            data={{
              labels: trafficData[selectedHost].map((item) => item.period),
              datasets: [
                {
                  label: `Usuários Ativos - ${selectedHost}`,
                  backgroundColor: "#10a37f",
                  borderColor: "#0d8a6b",
                  borderWidth: 1,
                  data: trafficData[selectedHost].map((item) => item.activeUsers),
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
          <p>Nenhum dado disponível para este Host</p>
        )
      ) : (
        <Bar
          data={{
            labels: consolidatedData.map((item) => item.period),
            datasets: [
              {
                label: "Usuários Ativos (Consolidado)",
                backgroundColor: "#ff9800",
                borderColor: "#e68900",
                borderWidth: 1,
                data: consolidatedData.map((item) => item.activeUsers),
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
      )}
      <button onClick={goToHome} className="logout-btn">Home</button>
      <button onClick={goToAccounts} className="logout-btn">Gerenciar Contas</button>
    </div>
  );
};

export default Dashboard;
