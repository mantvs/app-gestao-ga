import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import "./Dashboard.css";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, 
} from 'chart.js';
import { useContext } from "react";
import { AuthContext } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Dashboard = () => {

  // Variáveis de estado da sessão 
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

// Variáveis de estado para os filtros

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("Todas");
  const [selectedProperty, setSelectedProperty] = useState("Todas");

// Variáveis de estado dos gráficos

  const [realtimeUsers, setRealtimeUsers] = useState({});
  const [consolidatedRealtimeUsers, setConsolidatedRealtimeUsers] = useState(0);
  const [topPagesRealtime, setTopPagesRealtime] = useState([]);
  const [consolidatedTopPagesRealtime, setConsolidatedTopPagesRealtime] = useState([]);
  const [traffic, setTraffic] = useState({});
  const [consolidatedTraffic, setConsolidatedTraffic] = useState([]);
  const [topPages, setTopPages] = useState({});
  const [consolidatedTopPages, setConsolidatedTopPages] = useState([]);

  // Obtenção dos dados das contas GA via Backend

  useEffect(() => {
    if (!user) {
      // Redireciona para login se não estiver autenticado
      navigate("/login");
    }

    if (!user || !token) return;

    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const email = user;
        setUserEmail(email);
        const accountsRes = await axios.get("http://localhost:8000/api/ga/accounts_ga", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAccounts(accountsRes.data);
        await fetchData(email, token, true); // Fetch dados consolidados e individuais
      } catch (err) {
        console.error("Erro ao buscar dados iniciais:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [navigate, user, token]);

  // Obtenção dos dados dos gráficos via Backend 

  const fetchData = async (email, token, showLoading = false) => {
    try {
      if (showLoading) setLoading(true);

      const res = await axios.get(`http://localhost:8000/api/ga/data_ga?email=${email}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const {
        consolidatedRealtimeUsers,
        realtimeUsers,
        consolidatedRealtimeTopPages,
        realtimeTopPages,
        traffic,
        consolidatedTraffic,
        topPages,
        consolidatedTopPages,
      } = res.data;
      
      setConsolidatedRealtimeUsers(consolidatedRealtimeUsers || 0);
      setRealtimeUsers(realtimeUsers || {});
      setConsolidatedTopPagesRealtime(consolidatedRealtimeTopPages || []);
      setTopPagesRealtime(realtimeTopPages || {});
      setTraffic(traffic || {});
      setConsolidatedTraffic(consolidatedTraffic || []);
      setTopPages(topPages || {});
      setConsolidatedTopPages(consolidatedTopPages || []);
      
    } catch (err) {
      console.error("Erro ao buscar dados do GA:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Recarregamento automático da tela

  useEffect(() => {
    if (!user || !token) return;

    const interval = setInterval(() => {      
      if (user) {
        fetchData(user, token, false);
      }
    }, 30000); // 30 segundos
  
    return () => clearInterval(interval); // limpa o intervalo ao desmontar
  }, [user, token]);

  // Filtragem ActivesUsers (Reatime)

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

  // Filtragem TopFivePages (Realtime)

  const filteredTopPagesRealtime = useMemo(() => {
    if (selectedAccount === "Todas" && selectedProperty === "Todas") {
      return consolidatedTopPagesRealtime;
    }
  
    const accountData = topPagesRealtime[selectedAccount] || {};
    const propertyData = accountData[selectedProperty] || [];
  
    return propertyData;
  }, [selectedAccount, selectedProperty, consolidatedTopPagesRealtime, topPagesRealtime]);

  // Filtragem ActivesUsers (Period)
  
  const filteredTraffic = useMemo(() => {
    if (selectedAccount === "Todas" && selectedProperty === "Todas") {
      return consolidatedTraffic.map((value, index) => ({
        period: ["Hoje", "Ultimos 7 dias", "Ultimos 30 dias", "Últimos 6 meses"][index],
        activeUsers: value,
      }));
    }
  
    const accountData = traffic[selectedAccount] || {};
    const propertyData = accountData[selectedProperty] || [];
  
    return propertyData;
  }, [selectedAccount, selectedProperty, traffic, consolidatedTraffic]);
  
  // Filtragem TopFivePages (Period) 

  const filteredTopPages = useMemo(() => {
    if (selectedAccount === "Todas" && selectedProperty === "Todas") {
      return consolidatedTopPages;
    }
  
    const accountData = topPages[selectedAccount] || {};
    const propertyData = accountData[selectedProperty] || [];
  
    return propertyData;
  }, [selectedAccount, selectedProperty, consolidatedTopPages, topPages]); 
  
   return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <h1>Gestão GA</h1>
        <div className="dashboard-user">
          <span>{userEmail}</span>
          <button onClick={logout}>Sair</button>
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
          <label>Propriedade (Site/Blog)</label>
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
                    label: "Usuários Ativos (Em tempo real)",
                    data: Array.isArray(filteredData) ? filteredData.map((item) => item.users) : [filteredData],
                    backgroundColor: "rgb(37, 112, 253)",
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
                labels: filteredTopPagesRealtime.map((p) => p.pagePath),
                datasets: [
                  {
                    label: "Páginas/Posts (Em tempo real)",
                    data: filteredTopPagesRealtime.map((p) => p.views),
                    backgroundColor: "rgb(37, 112, 253)",
                  },
                ],
              }}
              options={{ responsive: true, indexAxis: "y" }}
            />
          </div>

          <div className="card wide">
            <h2>ActiveUsers (Period)</h2>
            <Bar
              data={{
                labels: filteredTraffic.map((item) => item.period),
                datasets: [
                  {
                    label: "Usuários Ativos",
                    data: filteredTraffic.map((item) => item.activeUsers),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderRadius: 6,
                  },
                ],
              }}
              options={{ responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) => `${context.raw} usuários`,
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 },
                  },
                }, }}
            />
          </div>

          <div className="card wide">
            <h2>TopFivePages (Period)</h2>
            <Bar
              data={{
                labels: filteredTopPages.map((p) => p.pagePath),
                datasets: [
                  {
                    label: "Páginas/Posts (Mês atual)",
                    data: filteredTopPages.map((p) => p.views),
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
