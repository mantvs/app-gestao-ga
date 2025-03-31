import React, { useContext } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthContext } from "./components/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AuthSuccess from "./pages/AuthSuccess";

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={user ? <Home /> : <Login />} />
      <Route path="/home" element={user ? <Home /> : <Login />} />
      <Route path="/auth-success" element={<AuthSuccess />} />
    </Routes>
  );
}

export default App;
