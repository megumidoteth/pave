import { useAccount, useSignMessage } from "wagmi";
import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:3001";

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [token, setToken] = useState(localStorage.getItem("pave_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!address) return;
    try {
      setLoading(true);

      // Step 1 — get nonce
      const { data: { message } } = await axios.get(`${API_URL}/api/auth/nonce/${address}`);

      // Step 2 — sign message with wallet
      const signature = await signMessageAsync({ message });

      // Step 3 — verify signature and get token
      const { data } = await axios.post(`${API_URL}/api/auth/verify`, {
        address,
        message,
        signature,
      });

      localStorage.setItem("pave_token", data.token);
      setToken(data.token);
      setUser(data.user);

      return data;
    } catch (err) {
      console.error("Login failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("pave_token");
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (!isConnected) {
      logout();
    }
  }, [isConnected]);

  return { login, logout, token, user, loading, isAuthenticated: !!token };
}
