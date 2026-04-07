import React, { useState, useEffect } from "react";

// ─── CONFIGURATION ET FORMATAGE ─────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("fr-MA").format(n) + " MAD";

const STATUT_CONFIG = {
  en_cours: { label: "En cours", color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  en_retard: { label: "En retard", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  termine: { label: "Terminé", color: "#64748b", bg: "rgba(100,116,139,0.15)" },
};

// ─── COMPOSANTS UI RÉUTILISABLES ─────────────────────────────────────────────
const Card = ({ children, onClick, style = {} }) => (
  <div onClick={onClick} style={{
    background: "#1e293b", borderRadius: 16, padding: 16, marginBottom: 12,
    border: "1px solid rgba(255,255,255,0.05)", cursor: onClick ? "pointer" : "default", ...style
  }}>{children}</div>
);

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 15 }}>
    <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 5, fontWeight: "bold" }}>{label}</label>
    <input {...props} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "white", boxSizing: "border-box" }} />
  </div>
);

// ─── APPLICATION PRINCIPALE ─────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState({
    chantiers: [],
    depenses: [],
  });

  // 1. Charger les données sauvegardées sur le téléphone au démarrage
  useEffect(() => {
    const saved = localStorage.getItem("GTR_BTP_DATA");
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Erreur de chargement");
      }
    }
  }, []);

  // 2. Sauvegarder automatiquement dès qu'on ajoute quelque chose
  useEffect(() => {
    localStorage.setItem("GTR_BTP_DATA", JSON.stringify(data));
  }, [data]);

  // Fonction pour ajouter un chantier
  const addChantier = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const nouveau = {
      id: Date.now(),
      nom: formData.get("nom"),
      client: formData.get("client"),
      budget: Number(formData.get("budget")),
      statut: "en_cours"
    };
    setData({ ...data, chantiers: [nouveau, ...data.chantiers] });
    setPage("chantiers");
  };

  return (
    <div style={{ background: "#0a0f1e", minHeight: "100vh", color: "white", fontFamily: "sans-serif", maxWidth: 500, margin: "0 auto" }}>
      
      {/* BARRE DE TITRE */}
      <div style={{ padding: "20px 16px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#0a0f1e", zIndex: 10 }}>
        <h1 style={{ fontSize: 20, margin: 0, fontWeight: "800" }}>GTR <span style={{ color: "#3b82f6" }}>PRO</span></h1>
        <div style={{ fontSize: 10, background: "#3b82f6", padding: "4px 10px", borderRadius: 20, fontWeight: "bold" }}>MAROC</div>
      </div>

      {/* CONTENU SELON LA PAGE */}
      <div style={{ padding: 16, paddingBottom: 100 }}>
        
        {page === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 25 }}>
              <Card style={{ borderLeft: "4px solid #3b82f6" }}>
                <div style={{ fontSize: 28, fontWeight: "bold" }}>{data.chantiers.length}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: "bold" }}>CHANTIERS</div>
              </Card>
              <Card style={{ borderLeft: "4px solid #22c55e" }}>
                <div style={{ fontSize: 16, fontWeight: "bold", color: "#22c55e", marginTop: 8 }}>
                  {data.chantiers.reduce((acc, c) => acc + c.budget, 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: "bold" }}>BUDGET TOTAL (MAD)</div>
              </Card>
            </div>

            <h3 style={{ fontSize: 14, color: "#94a3b8", marginBottom: 15 }}>RÉCAPITULATIF RÉCENT</h3>
            {data.chantiers.slice(0, 3).map(c => (
              <Card key={c.id} onClick={() => setPage("chantiers")}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontWeight: "bold" }}>{c.nom}</span>
                  <span style={{ fontSize: 10, color: STATUT_CONFIG[c.statut].color }}>● {STATUT_CONFIG[c.statut].label}</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Client: {c.client}</div>
              </Card>
            ))}
            {data.chantiers.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🏗️</div>
                <p>Bienvenue !<br/>Commencez par ajouter un chantier.</p>
              </div>
            )}
          </div>
        )}

        {page === "chantiers" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, margin: 0 }}>Mes Chantiers</h2>
              <button onClick={() => setPage("nouveau")} style={{ background: "#3b82f6", color: "white", border: "none", padding: "10px 16px", borderRadius: 10, fontWeight: "bold" }}>+ Ajouter</button>
            </div>
            {data.chantiers.map(c => (
              <Card key={c.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: 15 }}>{c.nom}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{c.client}</div>
                  </div>
                  <div style={{ background: STATUT_CONFIG[c.statut].bg, color: STATUT_CONFIG[c.statut].color, padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: "bold" }}>
                    {STATUT_CONFIG[c.statut].label}
                  </div>
                </div>
                <div style={{ marginTop: 15, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 13 }}>
                  <span style={{ color: "#64748b" }}>Budget :</span> <span style={{ fontWeight: "bold" }}>{fmt(c.budget)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {page === "nouveau" && (
          <form onSubmit={addChantier}>
            <h2 style={{ fontSize: 18, marginBottom: 20 }}>Nouveau Chantier</h2>
            <Input label="Nom du Projet / Chantier" name="nom" placeholder="Ex: Route Nationale N1" required />
            <Input label="Maître d'ouvrage / Client" name="client" placeholder="Ex: Commune de Settat" required />
            <Input label="Budget prévisionnel (MAD)" name="budget" type="number" placeholder="Ex: 500000" required />
            
            <button type="submit" style={{ width: "100%", background: "#3b82f6", color: "white", border: "none", padding: 16, borderRadius: 12, fontWeight: "bold", fontSize: 15, marginTop: 10 }}>
              ENREGISTRER LE CHANTIER
            </button>
            <button type="button" onClick={() => setPage("dashboard")} style={{ width: "100%", background: "none", color: "#64748b", border: "none", marginTop: 15, fontSize: 14 }}>
              Annuler
            </button>
          </form>
        )}
      </div>

      {/* NAVIGATION DU BAS */}
      <div style={{ position: "fixed", bottom: 0, width: "100%", maxWidth: 500, background: "#0f172a", borderTop: "1px solid #1e293b", display: "flex", padding: "12px 0", boxShadow: "0 -4px 10px rgba(0,0,0,0.3)" }}>
        <button onClick={() => setPage("dashboard")} style={{ flex: 1, background: "none", border: "none", color: page === "dashboard" ? "#3b82f6" : "#475569", transition: "0.2s" }}>
          <div style={{ fontSize: 20 }}>📊</div>
          <div style={{ fontSize: 10, fontWeight: "bold", marginTop: 4 }}>DASHBOARD</div>
        </button>
        <button onClick={() => setPage("chantiers")} style={{ flex: 1, background: "none", border: "none", color: page === "chantiers" ? "#3b82f6" : "#475569", transition: "0.2s" }}>
          <div style={{ fontSize: 20 }}>🏗️</div>
          <div style={{ fontSize: 10, fontWeight: "bold", marginTop: 4 }}>CHANTIERS</div>
        </button>
      </div>
    </div>
  );
}
