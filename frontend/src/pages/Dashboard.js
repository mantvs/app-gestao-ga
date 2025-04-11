import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Line } from "react-chartjs-2";
import "chart.js/auto";
import "./Dashboard.css";

const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [properties, setProperties] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedHost, setSelectedHost] = useState("");
  const [hosts, setHosts] = useState([]);
  const [topPagesRealtime, setTopPagesRealtime] = useState([]);
  const [activeUsersPeriod, setActiveUsersPeriod] = useState([]);
  const [topPagesPeriod, setTopPagesPeriod] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [consolidatedRealtimeUsers, setConsolidatedRealtimeUsers] = useState(0);
  const [realtimeUsers, setRealtimeUsers] = useState({});

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

        const propertiesData = accountsRes.data || [];

        console.log(propertiesData);

        // Extrair contas únicas
        const uniqueAccounts = [];
        const seenAccounts = new Set();

        propertiesData.forEach((item) => {
          if (!seenAccounts.has(item.account_id)) {
            seenAccounts.add(item.account_id);
            uniqueAccounts.push({
              account_id: item.account_id,
              display_name: item.display_name,
            });
          }
        });

        console.log(uniqueAccounts);

        // Extrair hosts únicos
        const uniqueHosts = [];
        const seenHosts = new Set();

        propertiesData.forEach((item) => {
          const host = item.display_name
           || "N/A"; 
          if (!seenHosts.has(host)) {
            seenHosts.add(host);
            uniqueHosts.push({ display_name: host });
          }
        });

        console.log(uniqueHosts);

        setAccounts(uniqueAccounts);
        setProperties(propertiesData);
        setHosts(uniqueHosts);
        setSelectedAccount("Todas");
        setSelectedProperty("Todas");
        setSelectedHost("Todos");

      } catch (err) {
        console.error("Erro ao buscar dados iniciais:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const fetchGAData = async (email) => {

    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:8000/api/ga/data_ga?email=${email}`, { 
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        }
      );

      const { realtimeUsers, consolidatedRealtimeUsers, top_pages_realtime, active_users_period, top_pages_period } = res.data;

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

  const handlePropertyChange = (e) => {
    const propId = e.target.value;
    setSelectedProperty(propId);
    fetchGAData(userEmail, propId);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("email");
    window.location.href = "/login";
  };

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
            {(Array.isArray(accounts) ? accounts : []).map((acc, index) => (
              <option key={`${acc.account_id}-${index}`} value={acc.account_id}>
                {acc.display_name}
            </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Propriedade</label>
          <select value={selectedProperty} onChange={handlePropertyChange}>
            <option value="Todas">Todas</option>
            {(Array.isArray(properties) ? properties : [])
              .filter((p) => selectedAccount === "Todas" || p.account_id === selectedAccount)
              .map((prop, index) => (
                <option key={`${prop.property_id}-${index}`} value={prop.property_id}>
                  {prop.property_id}
                </option>
              ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Site</label>
          <select value={selectedHost} onChange={(e) => setSelectedHost(e.target.value)}>
            <option value="Todos">Todos</option>
            {(Array.isArray(hosts) ? hosts : [])
              .map((host, index) => (
              <option key={`${host.display_name}-${index}`} value={host.display_name}>
                {host.display_name}
              </option>
             ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-loading">Carregando dados...</div>
      ) : (
        <div className="dashboard-grid">
          <div className="card">
            <h2>ActiveUsers (Realtime)</h2>
            <Bar
              data={{
                labels:
                  selectedAccount === "Todas" &&
                  selectedProperty === "Todas" &&
                  selectedHost === "Todos"
                    ? ["Total Consolidado"]
                    : Object.keys(realtimeUsers || {}),
                datasets: [
                  {
                    label: "Usuários Ativos",
                    data:
                      selectedAccount === "Todas" &&
                      selectedProperty === "Todas" &&
                      selectedHost === "Todos"
                        ? [consolidatedRealtimeUsers]
                        : Object.values(realtimeUsers || {}),
                    backgroundColor: "#3b82f6",
                  },
                ],
              }}
              options={{
                indexAxis: "y",
                responsive: true,
                plugins: {
                  legend: { display: false },
                  title: { display: true, text: "Active Users (Realtime)" },
                },
              }}
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
              options={{
                responsive: true,
                indexAxis: "y",
              }}
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
              options={{
                responsive: true,
                indexAxis: "y",
              }}
            />
          </div>
      </div>
      )    
      }

    </div>
    
    
  ); 
};

export default Dashboard;
