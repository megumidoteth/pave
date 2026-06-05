import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";

const API_URL = "http://localhost:3001";

const PAYMENT_PROCESSOR_ADDRESS = "0x911EbE92393aEa9509FD6C47e015da95e3562B65";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

const PAYMENT_PROCESSOR_ABI = [
  "function payInvoice(uint256 invoiceId) external"
];

const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
];

export default function PayInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/invoices/${id}`);
      setInvoice(data);
      if (data.status === "paid") setPaid(true);
    } catch (err) {
      setError("Invoice not found");
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask to pay this invoice");
      return;
    }
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setWalletAddress(accounts[0]);
  };

  const handlePay = async () => {
    if (!walletAddress) {
      await connectWallet();
      return;
    }

    try {
      setPaying(true);
      setError("");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const processor = new ethers.Contract(PAYMENT_PROCESSOR_ADDRESS, PAYMENT_PROCESSOR_ABI, signer);

      const amountUSDC = ethers.parseUnits(invoice.amount_usdc.toString(), 6);

      // Step 1 — Check balance
      // const balance = await usdc.balanceOf(walletAddress);
      // if (balance < amountUSDC) {
      //  setError("Insufficient USDC balance");
      //  return;
      //}

      // Step 2 — Approve USDC spending
      console.log("Approving USDC...");
      const approveTx = await usdc.approve(PAYMENT_PROCESSOR_ADDRESS, amountUSDC);
      await approveTx.wait();
      console.log("USDC approved");

      // Step 3 — Pay invoice
      console.log("Paying invoice...");
      const payTx = await processor.payInvoice(invoice.chain_invoice_id);
      const receipt = await payTx.wait();
      console.log("Payment confirmed:", receipt.hash);

      setTxHash(receipt.hash);
      setPaid(true);

    } catch (err) {
      console.error("Payment failed:", err);
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#fafaf9", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#aaa", fontSize: "14px" }}>Loading invoice...</p>
    </div>
  );

  if (error && !invoice) return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#fafaf9", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#dc2626", fontSize: "14px" }}>{error}</p>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#fafaf9", minHeight: "100vh", color: "#111" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Instrument+Serif:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-pay { background: #111; color: #fff; border: none; padding: 14px 28px; border-radius: 100px; font-size: 15px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.3s, transform 0.2s; width: 100%; }
        .btn-pay:hover { background: #1a6bff; transform: translateY(-1px); }
        .btn-pay:disabled { background: #ccc; cursor: not-allowed; transform: none; }
      `}</style>

      {/* Navbar */}
      <nav style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid #f0f0f0", padding: "0 2.5rem", height: "62px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "Instrument Serif, serif", fontSize: "22px", letterSpacing: "-0.5px", cursor: "pointer" }} onClick={() => navigate("/")}>
          Pave<span style={{ color: "#1a6bff" }}>.</span>
        </div>
      </nav>

      <div style={{ maxWidth: "480px", margin: "3rem auto", padding: "0 2rem" }}>

        {paid ? (
          /* Payment success */
          <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: "20px", padding: "2.5rem 2rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", textAlign: "center" }}>
            <div style={{ width: "60px", height: "60px", background: "#f0fdf4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", fontSize: "24px" }}>✓</div>
            <h2 style={{ fontFamily: "Instrument Serif, serif", fontSize: "26px", fontWeight: 400, letterSpacing: "-0.5px", marginBottom: "8px" }}>Payment confirmed</h2>
            <p style={{ fontSize: "14px", color: "#888", marginBottom: "1.5rem" }}>Your payment has been settled instantly on Arc.</p>
            {txHash && (
              <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" rel="noreferrer" style={{ display: "inline-block", background: "#f5f5f5", color: "#555", padding: "10px 20px", borderRadius: "100px", fontSize: "13px", textDecoration: "none", marginBottom: "1.5rem" }}>
                View on Arc Explorer →
              </a>
            )}
            <p style={{ fontSize: "12px", color: "#bbb" }}>Powered by Pave · Settled on Arc blockchain</p>
          </div>
        ) : (
          /* Payment form */
          <div>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "13px", color: "#aaa", marginBottom: "4px" }}>Invoice from</p>
              <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: "26px", fontWeight: 400, letterSpacing: "-0.5px" }}>{invoice?.business_name || invoice?.seller_address?.slice(0,6) + "..." + invoice?.seller_address?.slice(-4)}</h1>
            </div>

            <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: "20px", padding: "2rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", marginBottom: "1rem" }}>

              {/* Amount */}
              <div style={{ textAlign: "center", padding: "1.5rem 0", borderBottom: "1px solid #f0f0f0", marginBottom: "1.5rem" }}>
                <p style={{ fontSize: "13px", color: "#aaa", marginBottom: "6px" }}>Amount due</p>
                <p style={{ fontFamily: "Instrument Serif, serif", fontSize: "42px", fontWeight: 400, letterSpacing: "-1px", color: "#0a0a0a" }}>
                  ${parseFloat(invoice?.amount_usdc || 0).toFixed(2)}
                  <span style={{ fontSize: "16px", color: "#aaa", marginLeft: "6px" }}>USDC</span>
                </p>
              </div>

              {/* Details */}
              <div style={{ marginBottom: "1.5rem" }}>
                {[
                  { label: "Client", value: invoice?.client_name },
                  { label: "Due date", value: new Date(invoice?.due_date).toLocaleDateString() },
                  { label: "Status", value: invoice?.status?.charAt(0).toUpperCase() + invoice?.status?.slice(1) },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 2 ? "1px solid #f5f5f5" : "none" }}>
                    <span style={{ fontSize: "13px", color: "#888" }}>{row.label}</span>
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Fee breakdown */}
              <div style={{ background: "#f8faff", border: "1px solid #e0e9ff", borderRadius: "12px", padding: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", color: "#666" }}>Invoice amount</span>
                  <span style={{ fontSize: "13px" }}>${parseFloat(invoice?.amount_usdc || 0).toFixed(2)} USDC</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "#666" }}>Network fee</span>
                  <span style={{ fontSize: "13px", color: "#888" }}>~$0.01 USDC</span>
                </div>
              </div>

              {walletAddress && (
                <div style={{ background: "#f5f5f5", borderRadius: "10px", padding: "8px 14px", marginBottom: "1rem", fontSize: "13px", color: "#666", textAlign: "center" }}>
                  Connected: {walletAddress.slice(0,6)}...{walletAddress.slice(-4)}
                </div>
              )}

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px 14px", marginBottom: "1rem", fontSize: "13px", color: "#dc2626" }}>
                  {error}
                </div>
              )}

              <button className="btn-pay" onClick={handlePay} disabled={paying}>
                {paying ? "Processing payment..." : walletAddress ? `Pay $${parseFloat(invoice?.amount_usdc || 0).toFixed(2)} USDC →` : "Connect wallet to pay →"}
              </button>

              <p style={{ fontSize: "12px", color: "#bbb", textAlign: "center", marginTop: "1rem" }}>
                Secured by Arc blockchain · Settled in under 1 second
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
