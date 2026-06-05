import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:3001";

export default function Dashboard() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { token, logout } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { navigate("/"); return; }
    fetchInvoices();
  }, [token]);

  const fetchInvoices = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(data);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/"); };

  const totalPaid = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + parseFloat(i.amount_usdc || 0), 0);
  const totalPending = invoices.filter(i => i.status === "pending").reduce((sum, i) => sum + parseFloat(i.amount_usdc || 0), 0);
  const totalOverdue = invoices.filter(i => i.status === "overdue").reduce((sum, i) => sum + parseFloat(i.amount_usdc || 0), 0);

  const statusColor = { paid: "#16a34a", pending: "#1d4ed8", overdue: "#dc2626", cancelled: "#888" };
  const statusBg = { paid: "#dcfce7", pending: "#dbeafe", overdue: "#fee2e2", cancelled: "#f5f5f5" };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#fafaf9", minHeight: "100vh", color: "#111" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Instrument+Serif:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .inv-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 1.5rem; border-bottom: 1px solid #f0f0f0; transition: background 0.15s; cursor: pointer; }
        .inv-row:last-child { border-bottom: none; }
        .inv-row:hover { background: #f8f8f8; }
        .pill { font-size: 11px; padding: 3px 10px; border-radius: 100px; font-weight: 500; }
        .btn-primary { background: #111; color: #fff; border: none; padding: 10px 20px; border-radius: 100px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.3s; }
        .btn-primary:hover { background: #1a6bff; }
        .nav-link { font-size: 14px; color: #666; text-decoration: none; transition: color 0.2s; cursor: pointer; }
        .nav-link:hover { color: #111; }
      `}</style>

      {/* Navbar */}
      <nav style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid #f0f0f0", padding: "0 2.5rem", height: "62px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 0 rgba(0,0,0,0.04)" }}>
        <div style={{ fontFamily: "Instrument Serif, serif", fontSize: "22px", letterSpacing: "-0.5px", cursor: "pointer" }} onClick={() => navigate("/")}>
          Pave<span style={{ color: "#1a6bff" }}>.</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <span className="nav-link" onClick={() => navigate("/invoices/new")}>New invoice</span>
          <span style={{ fontSize: "13px", color: "#aaa" }}>{address?.slice(0,6)}...{address?.slice(-4)}</span>
          <span className="nav-link" onClick={handleLogout}>Sign out</span>
        </div>
      </nav>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2.5rem 2rem" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: "32px", fontWeight: 400, letterSpacing: "-0.5px", marginBottom: "4px" }}>Dashboard</h1>
            <p style={{ fontSize: "14px", color: "#999" }}>Manage your invoices and payments</p>
          </div>
          <button className="btn-primary" onClick={() => navigate("/invoices/new")}>
            + New invoice
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", marginBottom: "2rem" }}>
          {[
            { label: "Total paid", value: `$${totalPaid.toFixed(2)}`, color: "#16a34a", bg: "#f0fdf4" },
            { label: "Pending", value: `$${totalPending.toFixed(2)}`, color: "#1d4ed8", bg: "#eff6ff" },
            { label: "Overdue", value: `$${totalOverdue.toFixed(2)}`, color: "#dc2626", bg: "#fef2f2" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: "14px", padding: "1.25rem 1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "6px" }}>{s.label}</p>
              <p style={{ fontFamily: "Instrument Serif, serif", fontSize: "28px", color: s.color, letterSpacing: "-0.5px" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Invoice list */}
        <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", borderBottom: "1px solid #f0f0f0" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 500 }}>Invoices</h2>
            <span style={{ fontSize: "13px", color: "#aaa" }}>{invoices.length} total</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 1.5rem", borderBottom: "1px solid #f5f5f5", background: "#fafafa" }}>
            {["Client", "Amount", "Due date", "Status", ""].map((h) => (
              <span key={h} style={{ fontSize: "10.5px", color: "#bbb", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#aaa", fontSize: "14px" }}>Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div style={{ padding: "4rem", textAlign: "center" }}>
              <p style={{ fontSize: "15px", color: "#aaa", marginBottom: "1rem" }}>No invoices yet</p>
              <button className="btn-primary" onClick={() => navigate("/invoices/new")}>Create your first invoice</button>
            </div>
          ) : (
            invoices.map((inv) => (
              <div key={inv.id} className="inv-row" onClick={() => navigate(`/invoices/${inv.id}`)}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "180px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 600, color: "#1d4ed8" }}>
                    {inv.client_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 500 }}>{inv.client_name}</p>
                    <p style={{ fontSize: "11px", color: "#aaa" }}>{inv.client_email}</p>
                  </div>
                </div>
                <span style={{ fontSize: "13px", fontWeight: 500 }}>${parseFloat(inv.amount_usdc).toFixed(2)} USDC</span>
                <span style={{ fontSize: "12px", color: "#888" }}>{new Date(inv.due_date).toLocaleDateString()}</span>
                <span className="pill" style={{ background: statusBg[inv.status], color: statusColor[inv.status] }}>
                  {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                </span>
                <span style={{ fontSize: "12px", color: "#bbb" }}>→</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
