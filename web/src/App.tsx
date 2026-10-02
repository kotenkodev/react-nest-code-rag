import { useEffect, useState } from "react";
import Workspace from "./components/Workspace";
import Login from "./components/Login";

export default function App() {
  const [email, setEmail] = useState(() => localStorage.getItem("email") || "");

  useEffect(() => {
    if (email) localStorage.setItem("email", email);
    else localStorage.removeItem("email");
  }, [email]);

  return email ? (
    <Workspace email={email} onLogout={() => setEmail("")} />
  ) : (
    <Login onLogin={setEmail} />
  );
}
