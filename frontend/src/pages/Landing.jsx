import { useNavigate } from "react-router-dom";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

export default function Landing() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { login } = useAuth();

  const handleConnect = async () => {
    if (isConnected) {
      await login();
      navigate("/dashboard");
    } else {
    connect({ connector: injected() });
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#ffffff", color: "#111", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=Instrument+Serif:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1); }
        .reveal.visible { opacity: 1; transform: none; }
        .d1 { transition-delay: 0.1s; } .d2 { transition-delay: 0.2s; } .d3 { transition-delay: 0.3s; } .d4 { transition-delay: 0.45s; }

        .nav-link { font-size: 14px; color: #666; text-decoration: none; transition: color 0.3s; }
        .nav-link:hover { color: #111; }

        .btn-primary {
          background: #111; color: #fff;
          border: none; padding: 11px 22px;
          border-radius: 100px; font-size: 14px; font-weight: 500;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: background 0.3s, transform 0.2s, box-shadow 0.3s;
          letter-spacing: -0.2px;
        }
        
        .btn-primary:hover { background: #111; }

        .btn-outline {
          background: transparent; color: #111;
          border: 1.5px solid #111; padding: 11px 22px;
          border-radius: 100px; font-size: 14px; font-weight: 400;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: border-color 0.4s ease, color 0.4s ease, transform 0.2s;
        }
        .btn-outline:hover { background-color: #1a6bff; border-color: #1a6bff; color: #ffffff; transform: translateY(-0.5px); }

        .invoice-row { display: flex; align-items: center; justify-content: space-between; padding: 13px 0; border-bottom: 1px solid #f0f0f0; }
        .invoice-row:last-child { border-bottom: none; }
        .invoice-row:hover { background: #fafafa; }

        .pill { font-size: 11px; padding: 3px 10px; border-radius: 100px; font-weight: 500; }
        .pill-paid { background: #dcfce7; color: #16a34a; }
        .pill-pending { background: #dbeafe; color: #1d4ed8; }
        .pill-overdue { background: #fee2e2; color: #dc2626; }

        .feat-card {
          background: #fff;
          border: 1px solid #ebebeb;
          border-radius: 16px; padding: 1.75rem;
          box-shadow: 0 4px 20px rgba(65, 0, 0, 0.10), 0 1px 4px rgba(0,0,0,0.06);
          transition: box-shadow 0.3s, transform 0.3s;
        }
        .feat-card:hover { box-shadow: 0 16px 48px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-3px); }

        .stat-card {
          background: #fff; border: 1px solid #ebebeb;
          border-radius: 16px; padding: 1.5rem; text-align: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06);
          transition: box-shadow 0.3s, transform 0.3s;
        }
        .stat-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.1); transform: translateY(-2px); }

        .section-tag { display: inline-block; background: #eff6ff; color: #1d4ed8; font-size: 12px; font-weight: 500; padding: 4px 12px; border-radius: 100px; margin-bottom: 1rem; letter-spacing: 0.02em; border: 1px solid #bfdbfe; }

        .step-num { font-family: 'Instrument Serif', serif; font-size: 52px; font-weight: 400; color: #1a6bff; letter-spacing: -2px; margin-bottom: 1rem; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid #f0f0f0",
        padding: "0 2.5rem", height: "62px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 1px 0 rgba(0,0,0,0.04)"
      }}>
        <div style={{ fontFamily: "Instrument Serif, serif", fontSize: "22px", letterSpacing: "-0.5px", color: "#0a0a0a" }}>
          Pave<span style={{ color: "#1a6bff" }}>.</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <a href="#features" className="nav-link">Features</a>
          <a href="#how" className="nav-link">How it works</a>
          <a href="#pricing" className="nav-link">Pricing</a>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-outline" style={{ padding: "8px 18px" }} onClick={handleConnect}>
            {isConnected ? `${address?.slice(0,6)}...${address?.slice(-4)}` : "Sign in"}
          </button>
          <button className="btn-primary" style={{ padding: "8px 18px" }} onClick={handleConnect}>
            {isConnected ? "Dashboard →" : "Get started"}
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: "relative", minHeight: "92vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "5rem 2rem 3rem", overflow: "hidden", background: "#fff" }}>

        {/* Blue blob glow behind text — exactly like the image */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -75%)",
          width: "680px", height: "620px",
          background: "radial-gradient(ellipse at 45% 45%, #1a6bff 0%, #4a9eff 30%, #a8c8ff 60%, rgba(200,220,255,0.3) 75%, rgba(255,255,255,0) 85%)",
          borderRadius: "50%",
          filter: "blur(48px)",
          opacity: 0.28,
          pointerEvents: "none",
          zIndex: 0,
        }} />
        {/* Secondary softer glow */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-44%, -72%)",
          width: "420px", height: "380px",
          background: "radial-gradient(ellipse at center, #3b82f6 0%, #93c5fd 50%, rgba(255,255,255,0) 75%)",
          borderRadius: "50%",
          filter: "blur(60px)",
          opacity: 0.18,
          pointerEvents: "none",
          zIndex: 0,
        }} />

        {/* Hero content */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: "680px" }}>

          <h1 className="reveal d1" style={{
            fontFamily: "Instrument Serif, serif",
            fontSize: "clamp(42px, 6.5vw, 72px)",
            fontWeight: 400, lineHeight: 1.08,
            letterSpacing: "-1.5px", color: "#0a0a0a",
            marginBottom: "1.5rem"
          }}>
            Invoice your clients.<br />
            <em style={{ fontStyle: "italic", color: "#1a6bff" }}>Get paid in seconds.</em>
          </h1>

          <p className="reveal d2" style={{
            fontSize: "17px", color: "#666",
            maxWidth: "420px",
            margin: "0 auto 2.5rem", lineHeight: 1.7, fontWeight: 300
          }}>
            Onchain invoicing for modern businesses. Send, track, and collect payments in USDC — settled instantly on Arc.
          </p>

          <div className="reveal d3" style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={handleConnect}>
              Create your first invoice
            </button>
            <button className="btn-outline">
              ▶ See how it works
            </button>
          </div>
        </div>

        {/* Product mockup */}
        <div className="reveal d4" style={{
          position: "relative", zIndex: 1,
          marginTop: "4rem", width: "100%", maxWidth: "820px",
          background: "#fff",
          border: "1px solid #e8e8e8",
          borderRadius: "20px", overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.06), 0 1px 0 rgba(0,0,0,0.04)"
        }}>
          {/* Topbar */}
          <div style={{ background: "#f5f5f5", borderBottom: "1px solid #ebebeb", padding: "12px 20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f57" }} />
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#febc2e" }} />
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28c840" }} />
            <span style={{ flex: 1, textAlign: "center", fontSize: "12px", color: "#aaa" }}>app.pave.so/dashboard</span>
          </div>

          {/* Stats row */}
          <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "4px" }}>Total invoiced</p>
              <p style={{ fontSize: "26px", fontWeight: 500, letterSpacing: "-0.5px", color: "#0a0a0a" }}>$48,200 <span style={{ fontSize: "13px", fontWeight: 400, color: "#16a34a" }}>↑ 12%</span></p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              {[
                { label: "Paid", value: "$32,400", color: "#16a34a", bg: "#f0fdf4" },
                { label: "Pending", value: "$12,800", color: "#1d4ed8", bg: "#eff6ff" },
                { label: "Overdue", value: "$3,000", color: "#dc2626", bg: "#fef2f2" },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: "center", padding: "10px 16px", background: s.bg, borderRadius: "10px", border: "1px solid #f0f0f0" }}>
                  <p style={{ fontSize: "11px", color: "#aaa", marginBottom: "3px" }}>{s.label}</p>
                  <p style={{ fontSize: "15px", fontWeight: 500, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Invoice list */}
          <div style={{ padding: "0 2rem 0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 8px", borderBottom: "1px solid #f5f5f5" }}>
              {["Client", "Amount", "Due date", "Status"].map((h) => (
                <span key={h} style={{ fontSize: "10.5px", color: "#bbb", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
              ))}
            </div>
            {[
              { client: "Acme Corp", desc: "Website redesign", amount: "$3,200", date: "Jun 15", status: "paid" },
              { client: "Nexus Ltd", desc: "Monthly retainer", amount: "$1,500", date: "Jun 20", status: "pending" },
              { client: "Brightfield", desc: "Logo package", amount: "$800", date: "Jun 01", status: "overdue" },
              { client: "Kova Studios", desc: "Brand strategy", amount: "$5,000", date: "Jun 28", status: "paid" },
            ].map((inv, i) => (
              <div key={i} className="invoice-row">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "180px" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `hsl(${i * 60 + 200}, 70%, 92%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, color: `hsl(${i * 60 + 200}, 60%, 35%)` }}>{inv.client[0]}</div>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 500, color: "#111" }}>{inv.client}</p>
                    <p style={{ fontSize: "11px", color: "#aaa" }}>{inv.desc}</p>
                  </div>
                </div>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "#111" }}>{inv.amount} USDC</span>
                <span style={{ fontSize: "12px", color: "#888" }}>{inv.date}</span>
                <span className={`pill pill-${inv.status}`}>{inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: "2rem 2.5rem 4rem", background: "#fafaf9" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", maxWidth: "820px", margin: "0 auto" }}>
          {[
            { value: "< 1s", label: "Settlement time", sub: "Faster than any bank" },
            { value: "0.5%", label: "Platform fee", sub: "No hidden charges" },
            { value: "100%", label: "USDC native", sub: "No volatile tokens" },
          ].map((s, i) => (
            <div key={i} className={`reveal d${i+1} stat-card`}>
              <p style={{ fontFamily: "Instrument Serif, serif", fontSize: "38px", color: "#1a6bff", letterSpacing: "-1px", marginBottom: "6px" }}>{s.value}</p>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#111", marginBottom: "4px" }}>{s.label}</p>
              <p style={{ fontSize: "12px", color: "#999" }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "5rem 2.5rem", background: "#fff" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: "3rem" }}>
            
            <h2 style={{ fontFamily: "Instrument Serif, serif", fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 400, letterSpacing: "-1px", lineHeight: 1.15, color: "#0a0a0a" }}>
              Pave is built for businesses that<br /><em style={{ fontStyle: "italic", color: "#1a6bff" }}>can't afford to wait.</em>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "14px" }}>
            {[
              { icon: "⚡", title: "Sub-second settlement", desc: "Arc confirms every payment in under 1 second. Your money moves at the speed of the internet, not banks." },
              { icon: "🔒", title: "Permanent onchain records", desc: "Every invoice and payment lives on Arc forever. No disputes, no 'I never received it'." },
              { icon: "🌍", title: "Cross-border from day one", desc: "Invoice anyone with a wallet, anywhere. No SWIFT. No FX loss. No 3-5 business day nonsense." },
              { icon: "💵", title: "Predictable USDC fees", desc: "Gas is paid in USDC on Arc. No ETH volatility. You always know exactly what a transaction costs." },
            ].map((f, i) => (
              <div key={i} className={`reveal d${i%2+1} feat-card`}>
                <div style={{ fontSize: "22px", marginBottom: "12px" }}>{f.icon}</div>
                <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#0a0a0a", marginBottom: "8px" }}>{f.title}</h3>
                <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: "5rem 2.5rem", background: "#fafaf9" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span className="section-tag">How it works</span>
            <h2 style={{ fontFamily: "Instrument Serif, serif", fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 400, letterSpacing: "-1px", color: "#0a0a0a" }}>
              Three steps to getting paid.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
            {[
              { step: "01", title: "Create your invoice", desc: "Fill in client details, line items, and due date. Takes under 2 minutes." },
              { step: "02", title: "Share the link", desc: "Client gets an email with a one-click payment page. No account needed." },
              { step: "03", title: "Get paid instantly", desc: "Client pays in USDC. Funds in your wallet in under a second." },
            ].map((s, i) => (
              <div key={i} className={`reveal d${i+1}`} style={{ textAlign: "center", padding: "2rem 1rem", background: "#fff", borderRadius: "16px", border: "1px solid #ebebeb", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <p className="step-num">{s.step}</p>
                <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#0a0a0a", marginBottom: "8px" }}>{s.title}</h3>
                <p style={{ fontSize: "13px", color: "#504d4d", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "3rem 2.5rem 5rem", background: "#fff" }}>
        <div className="reveal" style={{
          maxWidth: "820px", margin: "0 auto",
          background: "#0f0f0f",
          border: "1px solid #222",
          borderRadius: "24px", padding: "4rem 3rem",
          textAlign: "center", position: "relative", overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.15)"
        }}>
          {/* Glow inside CTA */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-60%)", width: "500px", height: "350px", background: "radial-gradient(ellipse, rgba(26,107,255,0.25) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(20px)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "100px", padding: "5px 12px", fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "1.5rem" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#6DEAAA" }} />
              Built on Arc L1 · Powered by USDC
            </div>
            <h2 style={{ fontFamily: "Instrument Serif, serif", fontSize: "clamp(30px, 4vw, 48px)", fontWeight: 400, letterSpacing: "-1px", marginBottom: "1rem", lineHeight: 1.15, color: "#fff" }}>
              Start getting paid<br /><em style={{ fontStyle: "italic", color: "#7dc4ff" }}>the right way.</em>
            </h2>
            <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", marginBottom: "2rem", maxWidth: "360px", margin: "0 auto 2rem", lineHeight: 1.65, fontWeight: 300 }}>
              Connect your wallet and create your first invoice in under 2 minutes.
            </p>
            <button style={{ background: "#fff", color: "#111", border: "none", padding: "13px 28px", borderRadius: "100px", fontSize: "15px", fontWeight: 500, cursor: "pointer", fontFamily: "DM Sans, sans-serif", transition: "transform 0.2s, box-shadow 0.2s" }}
              onClick={handleConnect}
              onMouseEnter={e => { e.target.style.transform = "translateY(-1px)"; e.target.style.boxShadow = "0 8px 24px rgba(255,255,255,0.15)"; }}
              onMouseLeave={e => { e.target.style.transform = "none"; e.target.style.boxShadow = "none"; }}>
              {isConnected ? "Go to dashboard →" : "Connect wallet to start"}
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #f0f0f0", padding: "1.5rem 2.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
        <div style={{ fontFamily: "Instrument Serif, serif", fontSize: "18px", color: "#0a0a0a" }}>
          Pave<span style={{ color: "#1a6bff" }}>.</span>
        </div>
        <p style={{ fontSize: "12px", color: "#bbb" }}>© 2026 Pave. Built on Arc blockchain.</p>
        <div style={{ display: "flex", gap: "20px" }}>
          {["Terms", "Privacy", "Docs"].map((l) => (
            <a key={l} href="#" style={{ fontSize: "13px", color: "#999", textDecoration: "none" }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}