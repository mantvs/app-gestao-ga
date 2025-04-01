import React, { useContext } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthContext } from "./components/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AuthSuccess from "./pages/AuthSuccess";
import Accounts from "./pages/Accounts";
import AuthSuccessGA from "./pages/AuthSuccessGa";

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={user ? <Home /> : <Login />} />
      <Route path="/home" element={user ? <Home /> : <Login />} />
      <Route path="/accounts" element={user ? <Accounts /> : <Login />} />
      <Route path="/auth-success" element={<AuthSuccess />} />
      <Route path="/auth-success-ga" element={<AuthSuccessGA />} />
    </Routes>
  );
}

export default App;
