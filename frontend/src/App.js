import React, { useContext } from "react";
import { AuthContext } from "./components/AuthContext"

function App() {
  const { user, loginWithGoogle } = useContext(AuthContext);

  if (!user) {
    return (
      <div>
        <h2>Login com Google</h2>
        <button onClick={loginWithGoogle}>Entrar com Google</button>
      </div>
    );
  }

  return <h2>Bem-vindo, {user}!</h2>;
}

export default App;
