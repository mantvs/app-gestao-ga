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
  const [selectedView, setSelectedView] = useState("Individual");
  const [selectedHost, setSelectedHost] = useState("");
  const [topPages, setTopPages] = useState({});
  const [selectedPagesView, setSelectedPagesView] = useState("Individual");
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

        console.log("📊 Dados recebidos do backend:", response.data);

        setTrafficData(response.data.traffic);
        setConsolidatedData(response.data.consolidated);
        setTopPages(response.data.topPages);
        console.log("🔍 topPages:", response.data.topPages);
        setSelectedHost(Object.keys(response.data.traffic)[0] || "");
        console.log("🌐 selectedHost:", Object.keys(response.data.traffic)[0]);

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

  console.log("📄 topPages[selectedHost]:", topPages[selectedHost]);
  console.log("labels", topPages[selectedHost]?.map((p) => p.pagePath));


  return (
    <div className="dashboard-container">
      <h2>Dashboard do Google Analytics</h2>

      <select
        className="account-selector"
        value={selectedAccount?.property_id || ""}
        onChange={(e) => {
          const account = accounts.find((acc) => acc.property_id === e.target.value);
          setSelectedAccount(account);
        }}
      >
        {accounts.map((account) => (
          <option key={account.property_id} value={account.property_id}>
            {account.email} - {account.property_id}
          </option>
        ))}
      </select>

      <select className="view-selector" value={selectedView} onChange={handleViewChange}>
        <option value="Individual">Individual</option>
        <option value="Consolidado">Consolidado</option>
      </select>

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
        selectedHost && trafficData[selectedHost] ? (
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
            options={{ responsive: true, plugins: { legend: { display: true } } }}
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
          options={{ responsive: true, plugins: { legend: { display: true } } }}
        />
      )}

      <h3>Páginas mais acessadas</h3>
      <select
        className="view-selector"
        value={selectedPagesView}
        onChange={(e) => setSelectedPagesView(e.target.value)}
      >
        <option value="Individual">Individual</option>
        <option value="Consolidado">Consolidado</option>
      </select>

      {selectedPagesView === "Individual" ? (
        selectedHost &&
        topPages &&
        topPages[selectedHost] &&
        Array.isArray(topPages[selectedHost]) &&
        topPages[selectedHost].length > 0 ? (
          <Bar
            data={{
              labels: topPages[selectedHost]?.map((page) => page.pagePath) || [],
              datasets: [
                {
                  label: "Visualizações de Página",
                  backgroundColor: "#3b82f6",
                  borderColor: "#1e3a8a",
                  borderWidth: 1,
                  data: topPages[selectedHost]?.map((page) => page.views) || [],
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: true } },
            }}
          />
        ) : (
          <p>Nenhuma página acessada encontrada</p>
        )
      ) : (
        <p>Modo consolidado ainda não implementado</p>
      )}



      <button onClick={goToHome} className="logout-btn">Home</button>
      <button onClick={goToAccounts} className="logout-btn">Gerenciar Contas</button>
    </div>
  );
};

export default Dashboard;
