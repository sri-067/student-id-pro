import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  // restore auth on refresh
  useEffect(() => {
    const saved = localStorage.getItem("auth");
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed.user);
      setToken(parsed.token);
    }
  }, []);

  async function login(email, password) {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/login`, {
        email,
        password,
      });

      setUser(res.data.user);
      setToken(res.data.token);

      localStorage.setItem(
        "auth",
        JSON.stringify({
          user: res.data.user,
          token: res.data.token,
        })
      );

      return true;
    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
      return false;
    } finally {
      // 🔥 THIS WAS MISSING / NOT RUNNING
      setLoading(false);
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth");
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
