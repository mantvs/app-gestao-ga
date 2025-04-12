import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Bar, Line } from "react-chartjs-2";
import "chart.js/auto";
import "./Dashboard.css";

const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("Todas");
  const [selectedProperty, setSelectedProperty] = useState("Todas");
  const [selectedHost, setSelectedHost] = useState("");

  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const [consolidatedRealtimeUsers, setConsolidatedRealtimeUsers] = useState(0);
  const [realtimeUsers, setRealtimeUsers] = useState({});
  const [topPagesRealtime, setTopPagesRealtime] = useState([]);
  const [activeUsersPeriod, setActiveUsersPeriod] = useState([]);
  const [topPagesPeriod, setTopPagesPeriod] = useState([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("access_token");
        const email = localStorage.getItem("email");
        setUserEmail(email);
        const accountsRes = await axios.get("http://localhost:8000/api/ga/accounts_ga", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAccounts(accountsRes.data);
        await fetchData(email); // Fetch dados consolidados e individuais
      } catch (err) {
        console.error("Erro ao buscar dados iniciais:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const email = localStorage.getItem("email");
      if (email) {
        fetchData(email);
      }
    }, 10000); // 10 segundos
  
    return () => clearInterval(interval); // limpa o intervalo ao desmontar
  }, []);

  const fetchData = async (email) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:8000/api/ga/data_ga?email=${email}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });

      const {
        consolidatedRealtimeUsers,
        realtimeUsers,
        top_pages_realtime,
        active_users_period,
        top_pages_period,
      } = res.data;

      setConsolidatedRealtimeUsers(consolidatedRealtimeUsers || 0);
      setRealtimeUsers(realtimeUsers || {});
      setTopPagesRealtime(top_pages_realtime || []);
      setActiveUsersPeriod(active_users_period || []);
      setTopPagesPeriod(top_pages_period || []);
    } catch (err) {
      console.error("Erro ao buscar dados do GA:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("email");
    window.location.href = "/login";
  };

  const filteredData = useMemo(() => {
    if (selectedAccount === "Todas" && selectedProperty === "Todas") {
      return consolidatedRealtimeUsers;
    }
    const filtered = [];
    if (selectedAccount === "Todas") {
      for (const acc in realtimeUsers) {
        for (const prop in realtimeUsers[acc]) {
          filtered.push({ account: acc, property: prop, users: realtimeUsers[acc][prop] });
        }
      }
    } else if (selectedProperty === "Todas") {
      for (const prop in realtimeUsers[selectedAccount] || {}) {
        filtered.push({ account: selectedAccount, property: prop, users: realtimeUsers[selectedAccount][prop] });
      }
    } else {
      filtered.push({
        account: selectedAccount,
        property: selectedProperty,
        users: realtimeUsers[selectedAccount]?.[selectedProperty] || 0,
      });
    }
    return filtered;
  }, [selectedAccount, selectedProperty, consolidatedRealtimeUsers, realtimeUsers]);

  const accountOptions = Object.keys(realtimeUsers || {});
  const propertyOptions = selectedAccount !== "Todas"
    ? Object.keys(realtimeUsers[selectedAccount] || {})
    : [];

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <h1>Gestão GA</h1>
        <div className="dashboard-user">
          <span>{userEmail}</span>
          <button onClick={handleLogout}>Sair</button>
        </div>
      </div>

      <div className="dashboard-filters">
        <div className="filter-group">
          <label>Conta GA</label>
          <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)}>
            <option value="Todas">Todas</option>
            {accountOptions.map((acc) => (
              <option key={acc} value={acc}>{acc}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Propriedade</label>
          {selectedAccount !== "Todas" && (
            <select value={selectedProperty} onChange={(e) => setSelectedProperty(e.target.value)}>
              <option value="Todas">Todas</option>
              {propertyOptions.map((prop) => (
                <option key={prop} value={prop}>{prop}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading ? (

        <div className="dashboard-loading2">
          <svg
            className="spinner"
            width="48"
            height="48"
            viewBox="0 0 44 44"
            xmlns="http://www.w3.org/2000/svg"
            stroke="#4f46e5"
          >
            <g fill="none" fillRule="evenodd" strokeWidth="4">
              <circle cx="22" cy="22" r="20" strokeOpacity=".3" />
              <path d="M42 22c0-11.046-8.954-20-20-20">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 22 22"
                  to="360 22 22"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
            </g>
          </svg>
        </div>

      ) : (
        <div className="dashboard-grid">
          <div className="card">
            <h2>ActiveUsers (Realtime)</h2>
            <Bar
              data={{
                labels: Array.isArray(filteredData)
                  ? filteredData.map((item) => `${item.account} - ${item.property}`)
                  : ["Todos os Sites/Blogs"],
                datasets: [
                  {
                    label: "Usuários Ativos (Realtime)",
                    data: Array.isArray(filteredData) ? filteredData.map((item) => item.users) : [filteredData],
                    backgroundColor: "rgba(75, 192, 192, 0.6)",
                  },
                ],
              }}
              options={{ responsive: true }}
            />
          </div>

          <div className="card">
            <h2>TopFivePages (Realtime)</h2>
            <Bar
              data={{
                labels: topPagesRealtime.filter((p) => p.host === selectedHost).map((p) => p.pagePath),
                datasets: [
                  {
                    label: "Visualizações",
                    data: topPagesRealtime.filter((p) => p.host === selectedHost).map((p) => p.views),
                    backgroundColor: "#10b981",
                  },
                ],
              }}
              options={{ responsive: true, indexAxis: "y" }}
            />
          </div>

          <div className="card wide">
            <h2>ActiveUsers (Period)</h2>
            <Line
              data={{
                labels: activeUsersPeriod.filter((d) => d.host === selectedHost).map((d) => d.period),
                datasets: [
                  {
                    label: "Usuários Ativos",
                    data: activeUsersPeriod.filter((d) => d.host === selectedHost).map((d) => d.activeUsers),
                    backgroundColor: "#6366f1",
                    borderColor: "#4f46e5",
                    fill: true,
                  },
                ],
              }}
              options={{ responsive: true }}
            />
          </div>

          <div className="card wide">
            <h2>TopFivePages (Period)</h2>
            <Bar
              data={{
                labels: topPagesPeriod.filter((p) => p.host === selectedHost).map((p) => p.pagePath),
                datasets: [
                  {
                    label: "Visualizações",
                    data: topPagesPeriod.filter((p) => p.host === selectedHost).map((p) => p.views),
                    backgroundColor: "#f59e0b",
                  },
                ],
              }}
              options={{ responsive: true, indexAxis: "y" }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
