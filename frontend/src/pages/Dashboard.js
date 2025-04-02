// src/pages/Dashboard.js
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Line, Bar } from "react-chartjs-2";
import "chart.js/auto";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchAnalyticsData();
  }, [user]);

  const fetchAnalyticsData = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/ga/data_ga", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAnalyticsData(response.data);
    } catch (error) {
      console.error("Erro ao buscar dados do GA:", error);
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>Dashboard</h2>
        <button onClick={() => navigate("/accounts")}>Gerenciar Contas</button>
      </aside>
      <main className="content">
        <h1>Google Analytics - Visão Geral</h1>
        {analyticsData ? (
          <>
            <div className="chart-container">
              <h3>Visitas ao site</h3>
              <Line data={analyticsData.visitsChart} />
            </div>
            <div className="chart-container">
              <h3>Páginas mais acessadas</h3>
              <Bar data={analyticsData.topPagesChart} />
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Página</th>
                  <th>Visualizações</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.topPages.map((page, index) => (
                  <tr key={index}>
                    <td>{page.path}</td>
                    <td>{page.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p>Carregando dados...</p>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
