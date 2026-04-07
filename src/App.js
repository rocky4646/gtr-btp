import { useState, useEffect, useRef } from "react";

// ─── UTILITAIRES ─────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("fr-MA", { style: "decimal", minimumFractionDigits: 0 }).format(n) + " MAD";

const STATUT_CONFIG = {
  en_cours: { label: "En cours", color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  en_retard: { label: "En retard", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  termine: { label: "Terminé", color: "#64748b", bg: "rgba(100,116,139,0.15)" },
};

// ─── COMPOSANTS UI MODERNES ──────────────────────────────────────────────────
const Card = ({ children, onClick, style = {} }) => (
  <div onClick={onClick} style={{
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: 20, marginBottom: 15, cursor: onClick ? "pointer" : "default", ...style
  }}>{children}</div>
);

// ─── APPLICATION PRINCIPALE ─────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState({
    chantiers: [],
    depenses: [],
    ouvriers: []
  });

  // RÉCUPÉRATION DES DONNÉES
  useEffect(() => {
    const saved = localStorage.getItem("GTR_PRO_FINAL");
    if (saved) setData(JSON.parse(saved));
  }, []);

  // SAUVEGARDE AUTOMATIQUE
  useEffect(() => {
    localStorage.setItem("GTR_PRO_FINAL", JSON.stringify(data));
  }, [data]);

  const renderDashboard = () => (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 25 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: 0, fontWeight: 800 }}>Tableau de bord</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>Gestion TP · Maroc</p>
        </div>
        <div style={{ width: 45, height: 45, borderRadius: 12, background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏗️</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 25 }}>
        <Card style={{ textAlign: 'center', borderBottom: "4px solid #3b82f6" }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{data.chantiers.length}</div>
          <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: "bold" }}>PROJETS</div>
        </Card>
        <Card style={{ textAlign: 'center', borderBottom: "4px solid #f59e0b" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#f59e0b", marginTop: 8 }}>{data.chantiers.reduce((acc, c) => acc + (Number(c.budget) || 0), 0).toLocaleString()}</div>
          <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: "bold" }}>BUDGET GLOBAL</div>
        </Card>
      </div>

      <h3 style={{ fontSize: 12, color: "#475569", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 15 }}>Chantiers Actifs</h3>
      {data.chantiers.map(c => (
        <Card key={c.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{c.nom}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>📍 {c.localisation || "Maroc"}</div>
            </div>
            <div style={{ background: STATUT_CONFIG[c.statut || "en_cours"].bg, color: STATUT_CONFIG[c.statut || "en_cours"].color, padding: "4px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700 }}>
              {STATUT_CONFIG[c.statut || "en_cours"].label}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderForm = () => (
    <div style={{ padding: 20 }}>
      <h2>Nouveau Chantier</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <input placeholder="Nom du projet" id="nom" style={{ padding: 15, borderRadius: 10, border: "1px solid #1e293b", background: "#0f172a", color: "white" }} />
        <input placeholder="Localisation (ex: Settat)" id="loc" style={{ padding: 15, borderRadius: 10, border: "1px solid #1e293b", background: "#0f172a", color: "white" }} />
        <input placeholder="Budget (MAD)" id="bud" type="number" style={{ padding: 15, borderRadius: 10, border: "1px solid #1e293b", background: "#0f172a", color: "white" }} />
        <button 
          onClick={() => {
            const n = {
              id: Date.now(),
              nom: document.getElementById('nom').value,
              localisation: document.getElementById('loc').value,
              budget: document.getElementById('bud').value,
              statut: "en_cours"
            };
            setData({...data, chantiers: [...data.chantiers, n]});
            setPage("dashboard");
          }}
          style={{ background: "#3b82f6", color: "white", padding: 15, borderRadius: 10, border: "none", fontWeight: "bold" }}
        >
          CRÉER LE CHANTIER
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ background: "#0a0f1e", minHeight: "100vh", color: "white", fontFamily: "'Inter', sans-serif", maxWidth: 500, margin: "0 auto" }}>
      {page === "dashboard" ? renderDashboard() : renderForm()}
      
      <div style={{ position: "fixed", bottom: 0, width: "100%", maxWidth: 500, background: "rgba(15,23,42,0.9)", backdropFilter: "blur(10px)", display: "flex", padding: "15px 0", borderTop: "1px solid #1e293b" }}>
        <button onClick={() => setPage("dashboard")} style={{ flex: 1, background: "none", border: "none", color: page === "dashboard" ? "#3b82f6" : "#475569" }}>📊<br/>Dash</button>
        <button onClick={() => setPage("nouveau")} style={{ flex: 1, background: "none", border: "none", color: page === "nouveau" ? "#3b82f6" : "#475569" }}>🏗️<br/>Ajouter</button>
      </div>
    </div>
  );
}
