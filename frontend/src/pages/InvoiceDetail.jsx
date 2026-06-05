import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";

const API_URL = "http://localhost:3001";

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoice(data);
    } catch (err) {
      setError("Invoice not found");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this invoice?")) return;
    try {
      setCancelling(true);
      await axios.patch(`${API_URL}/api/invoices/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate("/dashboard");
    } catch (err) {
      setError("Failed to cancel invoice");
    } finally {
      setCancelling(false);
    }
  };

  const paymentUrl = `${window.location.origin}/pay/${id}`;

  const statusColor = { paid: "#16a34a", pending: "#1d4ed8", overdue: "#dc2626", cancelled: "#888" };
  const statusBg = { paid: "#dcfce7", pending: "#dbeafe", overdue: "#fee2e2", cancelled: "#f5f5f5" };

  if (loading) return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#fafaf9", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#aaa", fontSize: "14px" }}>Loading...</p>
    </div>
  );

  if (error) return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#fafaf9", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#dc2626", fontSize: "14px" }}>{error}</p>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#fafaf9", minHeight: "100vh", color: "#111" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Instrument+Serif:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { background: #111; color: #fff; border: none; padding: 10px 20px; border-radius: 100px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.3s; }
        .btn-primary:hover { background: #1a6bff; }
        .btn-danger { background: transparent; color: #dc2626; border: 1.5px solid #fecaca; padding: 10px 20px; border-radius: 100px; font-size: 14px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.3s; }
        .btn-danger:hover { background: #fef2f2; }
        .copy-btn { background: #f5f5f5; color: #555; border: none; padding: 8px 14px; border-radius: 8px; font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.2s; }
        .copy-btn:hover { background: #ebebeb; }
        .nav-link { font-size: 14px; color: #666; cursor: pointer; transition: color 0.2s; }
        .nav-link:hover { color: #111; }
      `}</style>

      {/* Navbar */}
      <nav style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid #f0f0f0", padding: "0 2.5rem", height: "62px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: "Instrument Serif, serif", fontSize: "22px", letterSpacing: "-0.5px", cursor: "pointer" }} onClick={() => navigate("/")}>
          Pave<span style={{ color: "#1a6bff" }}>.</span>
        </div>
        <span className="nav-link" onClick={() => navigate("/dashboard")}>← Back to dashboard</span>
      </nav>

      <div style={{ maxWidth: "600px", margin: "3rem auto", padding: "0 2rem" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: "32px", fontWeight: 400, letterSpacing: "-0.5px", marginBottom: "6px" }}>Invoice detail</h1>
            <p style={{ fontSize: "13px", color: "#aaa" }}>ID: {invoice?.id?.slice(0, 8)}...</p>
          </div>
          <span style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "100px", fontWeight: 500, background: statusBg[invoice?.status], color: statusColor[invoice?.status] }}>
            {invoice?.status?.charAt(0).toUpperCase() + invoice?.status?.slice(1)}
          </span>
        </div>

        {/* Main card */}
        <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: "20px", padding: "2rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", marginBottom: "1rem" }}>

          {/* Amount */}
          <div style={{ textAlign: "center", padding: "1.5rem 0", borderBottom: "1px solid #f0f0f0", marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "13px", color: "#aaa", marginBottom: "6px" }}>Amount</p>
            <p style={{ fontFamily: "Instrument Serif, serif", fontSize: "42px", fontWeight: 400, letterSpacing: "-1px" }}>
              ${parseFloat(invoice?.amount_usdc || 0).toFixed(2)}
              <span style={{ fontSize: "16px", color: "#aaa", marginLeft: "6px" }}>USDC</span>
            </p>
          </div>

          {/* Details */}
          <div style={{ marginBottom: "1.5rem" }}>
            {[
              { label: "Client", value: invoice?.client_name },
              { label: "Email", value: invoice?.client_email || "—" },
              { label: "Due date", value: new Date(invoice?.due_date).toLocaleDateString() },
              { label: "Created", value: new Date(invoice?.created_at).toLocaleDateString() },
              { label: "Chain ID", value: invoice?.chain_invoice_id !== null ? `#${invoice?.chain_invoice_id}` : "—" },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                <span style={{ fontSize: "13px", color: "#888" }}>{row.label}</span>
                <span style={{ fontSize: "13px", fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
            {invoice?.tx_hash && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                <span style={{ fontSize: "13px", color: "#888" }}>Transaction</span>
                <a href={`https://testnet.arcscan.app/tx/${invoice.tx_hash}`} target="_blank" rel="noreferrer" style={{ fontSize: "13px", color: "#1a6bff", textDecoration: "none" }}>
                  View on Arc Explorer →
                </a>
              </div>
            )}
          </div>

          {/* Payment link */}
          {invoice?.status === "pending" && (
            <div style={{ background: "#f8faff", border: "1px solid #e0e9ff", borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "12px", color: "#666", marginBottom: "8px", fontWeight: 500 }}>Payment link — share with your client</p>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <p style={{ fontSize: "12px", color: "#1a6bff", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{paymentUrl}</p>
                <button className="copy-btn" onClick={() => { navigator.clipboard.writeText(paymentUrl); alert("Link copied!"); }}>
                  Copy
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          {invoice?.status === "pending" && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => navigate(`/pay/${id}`)}>
                Preview payment page →
              </button>
              <button className="btn-danger" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? "Cancelling..." : "Cancel"}
              </button>
            </div>
          )}

          {invoice?.status === "paid" && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "1rem", textAlign: "center" }}>
              <p style={{ fontSize: "14px", color: "#16a34a", fontWeight: 500 }}>✓ Paid and settled on Arc</p>
              {invoice?.paid_at && <p style={{ fontSize: "12px", color: "#86efac", marginTop: "4px" }}>Paid on {new Date(invoice.paid_at).toLocaleDateString()}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
