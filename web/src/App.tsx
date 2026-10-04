import Workspace from "./components/Workspace";
import Login from "./components/Login";
import { useAuthStore } from "./store/store";

export default function App() {
  const { email, setEmail, clearEmail } = useAuthStore();

  return email ? (
    <Workspace email={email} onLogout={clearEmail} />
  ) : (
    <Login onLogin={setEmail} />
  );
}
