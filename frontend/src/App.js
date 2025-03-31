import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./components/AuthContext";
import Home from "./pages/Home";

function App() {
  const { user, loginWithGoogle } = useContext(AuthContext);

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? <Navigate to="/home" /> : (
            <div>
              <h2>Login com Google</h2>
              <button onClick={loginWithGoogle}>Entrar com Google</button>
            </div>
          )
        }
      />
      <Route path="/home" element={user ? <Home /> : <Navigate to="/" />} />
    </Routes>
  );
}

export default App;
