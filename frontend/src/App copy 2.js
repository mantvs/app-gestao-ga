import React, { useContext } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthContext } from "./components/AuthContext";
import Home from "./pages/Home";
import Accounts from "./pages/Accounts";
import NotFound from "./pages/NotFound";


function App() {
  const { user, loginWithGoogle } = useContext(AuthContext);


  const router = createBrowserRouter([
    { path: "/", element: <Home /> }, // Home acessível após login
    { path: "/accounts", element: <Accounts /> }, // Página de contas
    { path: "*", element: <NotFound /> }, // Rota para páginas não encontradas
  ]);


  if (!user) {
    return (
      <div style={loginStyles.container}>
        <h2 style={loginStyles.title}>Login com Google</h2>
        <button onClick={loginWithGoogle} style={loginStyles.button}>
          Entrar com Google
        </button>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

const loginStyles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#F7F7F7",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    marginBottom: "20px",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "#FFF",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
  },
};

export default App;
