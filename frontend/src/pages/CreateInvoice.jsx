import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import { ethers } from "ethers";
import axios from "axios";

const API_URL = "http://localhost:3001";

const INVOICE_REGISTRY_ADDRESS = "0xE3eBd4242b023e1DfdC931D82e57a9036D344d7c";
const INVOICE_REGISTRY_ABI = [
  "function createInvoice(uint256 amountUSDC, uint256 dueDate, string calldata invoiceRef) external returns (uint256)"
];

export default function CreateInvoice() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    description: "",
    amount: "",
    dueDate: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.clientName || !form.amount || !form.dueDate) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      // Connect to Arc via MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const registry = new ethers.Contract(
        INVOICE_REGISTRY_ADDRESS,
        INVOICE_REGISTRY_ABI,
        signer
      );

      // Convert amount to USDC units (6 decimals)
      const amountUSDC = ethers.parseUnits(form.amount, 6);

      // Convert due date to unix timestamp
      const dueDate = Math.floor(new Date(form.dueDate).getTime() / 1000);

      // Create invoice reference
      const invoiceRef = `INV-${Date.now()}`;

      // Call smart contract
      console.log("Creating invoice on Arc...");
      const tx = await registry.createInvoice(amountUSDC, dueDate, invoiceRef);
      console.log("Transaction sent:", tx.hash);

      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      // Get the invoice ID from the event
      const iface = new ethers.Interface(INVOICE_REGISTRY_ABI);
      let chainInvoiceId = null;

      // Parse events from receipt logs
      for (const log of receipt.logs) {
        try {
          const parsed = new ethers.Interface([
            "event InvoiceCreated(uint256 indexed id, address indexed seller, uint256 amountUSDC, uint256 dueDate, string invoiceRef)"
          ]).parseLog(log);
          if (parsed) {
            chainInvoiceId = parsed.args.id.toString();
            break;
          }
        } catch (e) {}
      }

      // Save to backend database
      await axios.post(`${API_URL}/api/invoices`, {
        chainInvoiceId,
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        lineItems: [{ description: form.description, amount: form.amount }],
        amountUsdc: form.amount,
        dueDate: form.dueDate,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Invoice saved to database");
      navigate("/dashboard");

    } catch (err) {
      console.error("Failed to create invoice:", err);
      setError(err.message || "Failed to create invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#fafaf9", minHeight: "100vh", color: "#111" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Instrument+Serif:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .input { width: 100%; padding: 11px 14px; border: 1.5px solid #e8e8e8; border-radius: 10px; font-size: 14px; font-family: 'DM Sans', sans-serif; color: #111; background: #fff; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .input:focus { border-color: #1a6bff; box-shadow: 0 0 0 3px rgba(26,107,255,0.08); }
        .label { font-size: 13px; font-weight: 500; color: #444; margin-bottom: 6px; display: block; }
        .btn-primary { background: #111; color: #fff; border: none; padding: 13px 28px; border-radius: 100px; font-size: 15px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.3s, transform 0.2s; width: 100%; }
        .btn-primary:hover { background: #1a6bff; transform: translateY(-1px); }
        .btn-primary:disabled { background: #ccc; cursor: not-allowed; transform: none; }
        .nav-link { font-size: 14px; color: #666; text-decoration: none; cursor: pointer; transition: color 0.2s; }
        .nav-link:hover { color: #111; }
      `}</style>

      {/* Navbar */}
      <nav style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid #f0f0f0", padding: "0 2.5rem", height: "62px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: "Instrument Serif, serif", fontSize: "22px", letterSpacing: "-0.5px", cursor: "pointer" }} onClick={() => navigate("/")}>
          Pave<span style={{ color: "#1a6bff" }}>.</span>
        </div>
        <span className="nav-link" onClick={() => navigate("/dashboard")}>← Back to dashboard</span>
      </nav>

      <div style={{ maxWidth: "560px", margin: "3rem auto", padding: "0 2rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: "32px", fontWeight: 400, letterSpacing: "-0.5px", marginBottom: "6px" }}>New invoice</h1>
          <p style={{ fontSize: "14px", color: "#999" }}>Fill in the details below to create an onchain invoice.</p>
        </div>

        <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: "20px", padding: "2rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <form onSubmit={handleSubmit}>

            {/* Client info */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label className="label">Client name *</label>
              <input className="input" name="clientName" placeholder="Acme Corp" value={form.clientName} onChange={handleChange} required />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label className="label">Client email</label>
              <input className="input" name="clientEmail" type="email" placeholder="client@company.com" value={form.clientEmail} onChange={handleChange} />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label className="label">Description</label>
              <input className="input" name="description" placeholder="Website redesign, Monthly retainer..." value={form.description} onChange={handleChange} />
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid #f0f0f0", margin: "1.5rem 0" }} />

            <div style={{ marginBottom: "1.25rem" }}>
              <label className="label">Amount (USDC) *</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "14px" }}>$</span>
                <input className="input" name="amount" type="number" placeholder="0.00" min="0.01" step="0.01" value={form.amount} onChange={handleChange} style={{ paddingLeft: "28px" }} required />
              </div>
            </div>

            <div style={{ marginBottom: "1.75rem" }}>
              <label className="label">Due date *</label>
              <input className="input" name="dueDate" type="date" value={form.dueDate} onChange={handleChange} min={new Date().toISOString().split("T")[0]} required />
            </div>

            {/* Summary */}
            {form.amount && (
              <div style={{ background: "#f8faff", border: "1px solid #e0e9ff", borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", color: "#666" }}>Invoice amount</span>
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>${parseFloat(form.amount || 0).toFixed(2)} USDC</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", color: "#666" }}>Platform fee (0.5%)</span>
                  <span style={{ fontSize: "13px", color: "#888" }}>-${(parseFloat(form.amount || 0) * 0.005).toFixed(2)} USDC</span>
                </div>
                <div style={{ borderTop: "1px solid #e0e9ff", paddingTop: "8px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>You receive</span>
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#16a34a" }}>${(parseFloat(form.amount || 0) * 0.995).toFixed(2)} USDC</span>
                </div>
              </div>
            )}

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px 14px", marginBottom: "1rem", fontSize: "13px", color: "#dc2626" }}>
                {error}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Creating invoice on Arc..." : "Create invoice →"}
            </button>

            <p style={{ fontSize: "12px", color: "#bbb", textAlign: "center", marginTop: "1rem" }}>
              This will open MetaMask to confirm the transaction on Arc testnet
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
