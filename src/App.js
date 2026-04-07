import { useState, useEffect, useRef } from "react";

// ─── DONNÉES EXEMPLE ────────────────────────────────────────────────────────
const SAMPLE_DATA = {
  chantiers: [
    { id: 1, nom: "Route Provinciale RP-5006", client: "Direction Régionale TP", localisation: "Settat", budget: 2800000, depenses: 1240000, debut: "2025-01-15", fin: "2025-08-30", statut: "en_cours", ouvriers: 18 },
    { id: 2, nom: "Réhabilitation RN-11", client: "Ministère de l'Équipement", localisation: "Kénitra", budget: 5500000, depenses: 5620000, debut: "2024-09-01", fin: "2025-03-31", statut: "en_retard", ouvriers: 32 },
    { id: 3, nom: "Réseau AEP Douar Lhajeb", client: "ONEE", localisation: "Khémisset", budget: 780000, depenses: 780000, debut: "2024-06-01", fin: "2024-12-20", statut: "termine", ouvriers: 0 },
    { id: 4, nom: "VRD Lotissement Horizon", client: "Samir Bennani", localisation: "Temara", budget: 1200000, depenses: 340000, debut: "2025-02-10", fin: "2025-09-15", statut: "en_cours", ouvriers: 12 },
  ],
  employes: [
    { id: 1, nom: "Hassan Moufid", role: "Chef de chantier", tel: "0661234567", chantier: 1 },
    { id: 2, nom: "Rachid Ouyahia", role: "Conducteur d'engins", tel: "0672345678", chantier: 1 },
    { id: 3, nom: "Youssef Amrani", role: "Maçon", tel: "0683456789", chantier: 4 },
    { id: 4, nom: "Khalid Benjelloun", role: "Chef de chantier", tel: "0694567890", chantier: 2 },
    { id: 5, nom: "Omar Tahiri", role: "Électricien", tel: "0615678901", chantier: 4 },
  ],
  depenses: [
    { id: 1, chantier: 1, type: "materiaux", libelle: "Agrégats concassés", montant: 85000, date: "2025-03-15" },
    { id: 2, chantier: 1, type: "transport", libelle: "Location camion benne", montant: 12000, date: "2025-03-18" },
    { id: 3, chantier: 2, type: "main_oeuvre", libelle: "Salaires mars", montant: 220000, date: "2025-03-31" },
    { id: 4, chantier: 4, type: "materiaux", libelle: "Béton prêt à l'emploi", montant: 45000, date: "2025-03-20" },
    { id: 5, chantier: 1, type: "materiaux", libelle: "Enrobé bitumineux", montant: 180000, date: "2025-03-22" },
  ],
  rapports: [
    { id: 1, chantier: 1, date: "2025-04-05", ouvriers: 18, heures: 8, commentaire: "Pose de la couche de base km 3-4", photos: [] },
    { id: 2, chantier: 4, date: "2025-04-05", ouvriers: 10, heures: 7, commentaire: "Coffrage des regards", photos: [] },
  ]
};

// ─── UTILITAIRES ────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("fr-MA", { style: "decimal", minimumFractionDigits: 0 }).format(n) + " MAD";
const fmtShort = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M MAD";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K MAD";
  return n + " MAD";
};
const today = () => new Date().toISOString().split("T")[0];

const STATUT_CONFIG = {
  en_cours: { label: "En cours", color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  en_retard: { label: "En retard", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  termine: { label: "Terminé", color: "#64748b", bg: "rgba(100,116,139,0.15)" },
};

const TYPE_DEP = {
  materiaux: { label: "Matériaux", icon: "🧱" },
  transport: { label: "Transport", icon: "🚛" },
  main_oeuvre: { label: "Main d'œuvre", icon: "👷" },
  equipement: { label: "Équipement", icon: "⚙️" },
  autre: { label: "Autre", icon: "📦" },
};

// ─── COMPOSANTS GRAPHIQUES (SVG) ───────────────────────────────────────────
function BarChart({ data, color = "#3b82f6" }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <svg viewBox={`0 0 ${data.length * 36} 80`} style={{ width: "100%", height: 80 }}>
      {data.map((d, i) => {
        const h = (d.value / max) * 60;
        const x = i * 36 + 4;
        return (
          <g key={i}>
            <rect x={x} y={80 - h - 16} width={28} height={h} rx={4} fill={color} opacity={0.85} />
            <text x={x + 14} y={78} textAnchor="middle" fontSize={8} fill="#94a3b8" fontWeight="500">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ value, total, color = "#3b82f6", size = 80 }) {
  const pct = total ? value / total : 0;
  const r = 30, cx = 40, cy = 40;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s ease" }} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={13} fontWeight="700" fill="white">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

// ─── COMPOSANTS UI ATOMIQUES ────────────────────────────────────────────────
function Card({ children, style = {}, onClick, className = "" }) {
  return (
    <div onClick={onClick} className={className} style={{
      background: "rgba(255,255,255,0.04)", backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "18px",
      cursor: onClick ? "pointer" : "default", transition: "all 0.2s", ...style
    }}>{children}</div>
  );
}

function Badge({ statut }) {
  const c = STATUT_CONFIG[statut] || STATUT_CONFIG.en_cours;
  return (
    <span style={{ 
      background: c.bg, color: c.color, borderRadius: 10, padding: "4px 10px", 
      fontSize: 11, fontWeight: 700, border: `1px solid ${c.color}30`,
      textTransform: "uppercase", letterSpacing: 0.5
    }}>
      {c.label}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color = "#3b82f6", onClick }) {
  return (
    <Card onClick={onClick} style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "white", letterSpacing: -0.5 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, fontWeight: 500 }}>{sub}</div>}
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, border: `1px solid ${color}20` }}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {label && <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
      <input {...props} style={{
        width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12, padding: "12px 16px", color: "white", fontSize: 15, outline: "none", fontFamily: "inherit",
        transition: "border-color 0.2s", ...props.style
      }} />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {label && <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
      <div style={{ position: "relative" }}>
        <select {...props} style={{
          width: "100%", boxSizing: "border-box", background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12, padding: "12px 16px", color: "white", fontSize: 15, outline: "none", fontFamily: "inherit",
          appearance: "none", ...props.style
        }}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94a3b8" }}>▾</div>
      </div>
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {label && <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
      <textarea {...props} style={{
        width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12, padding: "12px 16px", color: "white", fontSize: 15, outline: "none", fontFamily: "inherit",
        resize: "vertical", minHeight: 100, ...props.style
      }} />
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", style = {}, disabled = false }) {
  const variants = {
    primary: { background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", color: "white", border: "none", boxShadow: "0 4px 12px rgba(59,130,246,0.3)" },
    secondary: { background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.1)" },
    danger: { background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" },
    ghost: { background: "transparent", color: "#94a3b8", border: "none" },
    whatsapp: { background: "linear-gradient(135deg, #25d366, #128c7e)", color: "white", border: "none" },
    success: { background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", border: "none" }
  };
  const sizes = {
    sm: { padding: "8px 14px", fontSize: 12 },
    md: { padding: "12px 20px", fontSize: 14 },
    lg: { padding: "16px 28px", fontSize: 16 }
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...variants[variant], ...sizes[size], borderRadius: 12, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "inherit", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, 
      transition: "all 0.2s", opacity: disabled ? 0.6 : 1, ...style
    }}>{children}</button>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.85)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto", padding: "24px 24px 40px 24px", boxShadow: "0 -10px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ width: 40, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, margin: "0 auto 20px auto" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "white", letterSpacing: -0.5 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#94a3b8", borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toast({ msg, onHide }) {
  useEffect(() => { const t = setTimeout(onHide, 3000); return () => clearTimeout(t); }, [onHide]);
  return (
    <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: "#1e293b", border: "1px solid #3b82f6", color: "white", padding: "12px 24px", borderRadius: 16, fontSize: 14, fontWeight: 600, zIndex: 9999, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ color: "#22c55e", fontSize: 18 }}>✓</span> {msg}
    </div>
  );
}

// ─── PAGES ──────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("admin@gtr-btp.ma");
  const [pass, setPass] = useState("demo1234");
  return (
    <div style={{ minHeight: "100vh", background: "#020617", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏗️</div>
          <h1 style={{ color: "white", fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: -1 }}>GTR <span style={{ color: "#3b82f6" }}>PRO</span></h1>
          <p style={{ color: "#64748b", marginTop: 8, fontWeight: 500 }}>Gestion de Travaux & Chantiers</p>
        </div>
        <Card style={{ padding: 30 }}>
          <Input label="Email Professionnel" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="Mot de passe" type="password" value={pass} onChange={e => setPass(e.target.value)} />
          <Btn onClick={() => onLogin({ email, role: "admin", nom: "Ahmed Benali" })} style={{ width: "100%", marginTop: 10 }} size="lg">Se connecter</Btn>
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <a href="#" style={{ color: "#3b82f6", fontSize: 13, textDecoration: "none", fontWeight: 600 }}>Identifiants oubliés ?</a>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Dashboard({ data, navigate }) {
  const totalBudget = data.chantiers.reduce((s, c) => s + c.budget, 0);
  const totalDep = data.chantiers.reduce((s, c) => s + c.depenses, 0);
  const actifs = data.chantiers.filter(c => c.statut === "en_cours").length;
  const retard = data.chantiers.filter(c => c.statut === "en_retard").length;

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: "white", fontSize: 24, fontWeight: 800, margin: "0 0 4px 0", letterSpacing: -0.5 }}>Tableau de bord</h2>
        <p style={{ color: "#64748b", margin: 0, fontSize: 14, fontWeight: 500 }}>Résumé de vos activités au {today()}</p>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <StatCard icon="🏗️" label="Chantiers Actifs" value={actifs} color="#3b82f6" onClick={() => navigate("chantiers")} />
        <StatCard icon="⚠️" label="En Retard" value={retard} color="#ef4444" onClick={() => navigate("chantiers")} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <StatCard icon="💰" label="Dépenses Totales" value={fmtShort(totalDep)} sub={`Sur ${fmtShort(totalBudget)} de budget global`} color="#f59e0b" onClick={() => navigate("depenses")} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "20px 10px" }}>
          <DonutChart value={totalDep} total={totalBudget} color="#3b82f6" />
          <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, marginTop: 12, textTransform: "uppercase" }}>Consommation Budget</div>
        </Card>
        <Card style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, marginBottom: 12, textTransform: "uppercase" }}>Répartition Dépenses</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(TYPE_DEP).slice(0, 3).map(([key, cfg]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12 }}>{cfg.icon}</span>
                <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${Math.random() * 60 + 20}%`, background: "#3b82f6", borderRadius: 2, opacity: 0.7 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ color: "white", fontSize: 14, fontWeight: 700 }}>Dépenses par Projet</div>
          <div style={{ color: "#3b82f6", fontSize: 12, fontWeight: 600 }}>Voir tout</div>
        </div>
        <BarChart data={data.chantiers.slice(0, 5).map(c => ({ label: c.nom.substring(0, 6), value: c.depenses }))} />
      </Card>
    </div>
  );
}

function Chantiers({ data, setData, toast }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nom: "", client: "", localisation: "", budget: "", debut: today(), fin: "", statut: "en_cours", ouvriers: 0 });
  
  const handleAdd = () => {
    if (!form.nom || !form.budget) return;
    const newC = { ...form, id: Date.now(), budget: parseFloat(form.budget), depenses: 0, ouvriers: parseInt(form.ouvriers) || 0 };
    setData(prev => ({ ...prev, chantiers: [newC, ...prev.chantiers] }));
    setModal(false);
    toast("Nouveau chantier ajouté avec succès");
    setForm({ nom: "", client: "", localisation: "", budget: "", debut: today(), fin: "", statut: "en_cours", ouvriers: 0 });
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: "white", fontSize: 24, fontWeight: 800, margin: 0 }}>Chantiers</h2>
        <Btn onClick={() => setModal(true)} size="sm">+ Nouveau</Btn>
      </div>

      {data.chantiers.map(c => (
        <Card key={c.id} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{c.nom}</div>
              <div style={{ color: "#64748b", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 14 }}>📍</span> {c.localisation}
              </div>
            </div>
            <Badge statut={c.statut} />
          </div>
          
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Budget</div>
              <div style={{ color: "white", fontSize: 14, fontWeight: 700 }}>{fmtShort(c.budget)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Dépenses</div>
              <div style={{ color: c.depenses > c.budget ? "#ef4444" : "#3b82f6", fontSize: 14, fontWeight: 700 }}>{fmtShort(c.depenses)}</div>
            </div>
          </div>

          <div style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500 }}>Progression financière</div>
            <div style={{ color: "white", fontSize: 12, fontWeight: 700 }}>{Math.round((c.depenses / c.budget) * 100)}%</div>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ 
              height: "100%", 
              width: `${Math.min((c.depenses / c.budget) * 100, 100)}%`, 
              background: c.depenses > c.budget ? "#ef4444" : "linear-gradient(90deg, #3b82f6, #60a5fa)",
              borderRadius: 3,
              transition: "width 1s ease-out"
            }} />
          </div>
        </Card>
      ))}

      <Modal open={modal} onClose={() => setModal(false)} title="Nouveau Chantier">
        <Input label="Nom du projet" placeholder="ex: Construction Villa..." value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
        <Input label="Client" placeholder="Nom du client" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} />
        <Input label="Localisation" placeholder="Ville, quartier..." value={form.localisation} onChange={e => setForm({ ...form, localisation: e.target.value })} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Budget (MAD)" type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
          <Input label="Effectif prévu" type="number" value={form.ouvriers} onChange={e => setForm({ ...form, ouvriers: e.target.value })} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Date Début" type="date" value={form.debut} onChange={e => setForm({ ...form, debut: e.target.value })} />
          <Input label="Date Fin Prévue" type="date" value={form.fin} onChange={e => setForm({ ...form, fin: e.target.value })} />
        </div>
        <Btn onClick={handleAdd} style={{ width: "100%", marginTop: 10 }}>Créer le chantier</Btn>
      </Modal>
    </div>
  );
}

function Equipes({ data, setData, toast }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nom: "", role: "Ouvrier Spécialisé", tel: "", chantier: data.chantiers[0]?.id || "" });

  const handleAdd = () => {
    if (!form.nom) return;
    setData(prev => ({ ...prev, employes: [{ ...form, id: Date.now() }, ...prev.employes] }));
    setModal(false);
    toast("Employé ajouté à l'effectif");
    setForm({ nom: "", role: "Ouvrier Spécialisé", tel: "", chantier: data.chantiers[0]?.id || "" });
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: "white", fontSize: 24, fontWeight: 800, margin: 0 }}>Équipes</h2>
        <Btn onClick={() => setModal(true)} size="sm">+ Ajouter</Btn>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
        {["Tous", "Chantier 1", "Chantier 2", "Administration"].map((f, i) => (
          <div key={f} style={{ 
            padding: "8px 16px", borderRadius: 10, background: i === 0 ? "#3b82f6" : "rgba(255,255,255,0.05)",
            color: i === 0 ? "white" : "#94a3b8", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", border: i === 0 ? "none" : "1px solid rgba(255,255,255,0.08)"
          }}>{f}</div>
        ))}
      </div>

      {data.employes.map(e => (
        <Card key={e.id} style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, background: "linear-gradient(135deg, #1e293b, #0f172a)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", fontWeight: 800, border: "1px solid rgba(59,130,246,0.3)" }}>
              {e.nom.charAt(0)}
            </div>
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 15 }}>{e.nom}</div>
              <div style={{ color: "#64748b", fontSize: 12, fontWeight: 500 }}>{e.role}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href={`tel:${e.tel}`} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>📞</a>
            <a href={`https://wa.me/212${e.tel?.substring(1)}`} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(37,211,102,0.1)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>💬</a>
          </div>
        </Card>
      ))}

      <Modal open={modal} onClose={() => setModal(false)} title="Nouvel Employé">
        <Input label="Nom Complet" placeholder="Prénom et Nom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
        <Select label="Poste / Rôle" value={form.role} options={[
          { value: "Chef de chantier", label: "Chef de chantier" },
          { value: "Conducteur d'engins", label: "Conducteur d'engins" },
          { value: "Maçon", label: "Maçon" },
          { value: "Électricien", label: "Électricien" },
          { value: "Ouvrier Spécialisé", label: "Ouvrier Spécialisé" },
          { value: "Aide Maçon", label: "Aide Maçon" },
        ]} onChange={e => setForm({ ...form, role: e.target.value })} />
        <Input label="Téléphone" placeholder="06..." value={form.tel} onChange={e => setForm({ ...form, tel: e.target.value })} />
        <Select label="Assigner au chantier" value={form.chantier} options={data.chantiers.map(c => ({ value: c.id, label: c.nom }))} onChange={e => setForm({ ...form, chantier: e.target.value })} />
        <Btn onClick={handleAdd} style={{ width: "100%", marginTop: 10 }}>Ajouter à l'équipe</Btn>
      </Modal>
    </div>
  );
}

function RapportTerrain({ data, setData, toast }) {
  const [form, setForm] = useState({ chantier: data.chantiers[0]?.id || "", date: today(), ouvriers: "", heures: 8, commentaire: "" });

  const handleSend = () => {
    if (!form.commentaire) return;
    setData(prev => ({ ...prev, rapports: [{ ...form, id: Date.now() }, ...prev.rapports] }));
    toast("Rapport journalier enregistré et transmis");
    setForm({ ...form, commentaire: "", ouvriers: "" });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ color: "white", fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Rapport Journalier</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <Select label="Chantier concerné" value={form.chantier} options={data.chantiers.map(c => ({ value: c.id, label: c.nom }))} onChange={e => setForm({ ...form, chantier: e.target.value })} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <Input label="Effectif présent" type="number" placeholder="Nombre" value={form.ouvriers} onChange={e => setForm({ ...form, ouvriers: e.target.value })} />
        </div>
        <Textarea label="Travaux effectués & Observations" placeholder="Décrivez l'avancement, les problèmes rencontrés, météo..." value={form.commentaire} onChange={e => setForm({ ...form, commentaire: e.target.value })} />
        
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 12, height: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 12, cursor: "pointer" }}>
            <span style={{ fontSize: 24, marginBottom: 4 }}>📸</span> Ajouter Photos
          </div>
          <div style={{ flex: 1, border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 12, height: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 12, cursor: "pointer" }}>
            <span style={{ fontSize: 24, marginBottom: 4 }}>🎤</span> Note Vocale
          </div>
        </div>
        
        <Btn onClick={handleSend} style={{ width: "100%" }} size="lg">Enregistrer le Rapport</Btn>
      </Card>

      <h3 style={{ color: "white", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Historique Récent</h3>
      {data.rapports.slice(0, 3).map(r => (
        <Card key={r.id} style={{ marginBottom: 12, background: "rgba(255,255,255,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ color: "#3b82f6", fontWeight: 700, fontSize: 13 }}>{data.chantiers.find(c => c.id == r.chantier)?.nom}</div>
            <div style={{ color: "#64748b", fontSize: 12 }}>{r.date}</div>
          </div>
          <div style={{ color: "#cbd5e1", fontSize: 14, lineHeight: "1.5" }}>{r.commentaire}</div>
        </Card>
      ))}
    </div>
  );
}

function Depenses({ data, setData, toast }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ chantier: data.chantiers[0]?.id || "", libelle: "", montant: "", type: "materiaux", date: today() });

  const handleAdd = () => {
    if (!form.montant || !form.libelle) return;
    const m = parseFloat(form.montant);
    setData(prev => ({
      ...prev,
      depenses: [{ ...form, id: Date.now(), montant: m }, ...prev.depenses],
      chantiers: prev.chantiers.map(c => c.id == form.chantier ? { ...c, depenses: c.depenses + m } : c)
    }));
    setModal(false);
    toast("Dépense enregistrée et débitée du budget");
    setForm({ chantier: data.chantiers[0]?.id || "", libelle: "", montant: "", type: "materiaux", date: today() });
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: "white", fontSize: 24, fontWeight: 800, margin: 0 }}>Dépenses</h2>
        <Btn onClick={() => setModal(true)} size="sm">+ Saisir</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <Card style={{ textAlign: "center", padding: "16px" }}>
          <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>CE MOIS</div>
          <div style={{ color: "white", fontSize: 18, fontWeight: 800 }}>84.500 MAD</div>
        </Card>
        <Card style={{ textAlign: "center", padding: "16px" }}>
          <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>EN ATTENTE</div>
          <div style={{ color: "#f59e0b", fontSize: 18, fontWeight: 800 }}>12.300 MAD</div>
        </Card>
      </div>

      {data.depenses.map(d => (
        <Card key={d.id} style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
            {TYPE_DEP[d.type]?.icon || "📦"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "white", fontWeight: 700, fontSize: 15 }}>{d.libelle}</div>
            <div style={{ color: "#64748b", fontSize: 12 }}>{data.chantiers.find(c => c.id == d.chantier)?.nom}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "white", fontWeight: 800, fontSize: 15 }}>{fmt(d.montant)}</div>
            <div style={{ color: "#64748b", fontSize: 11 }}>{d.date}</div>
          </div>
        </Card>
      ))}

      <Modal open={modal} onClose={() => setModal(false)} title="Nouvelle Dépense">
        <Select label="Chantier" value={form.chantier} options={data.chantiers.map(c => ({ value: c.id, label: c.nom }))} onChange={e => setForm({ ...form, chantier: e.target.value })} />
        <Input label="Libellé de la dépense" placeholder="ex: Achat ciment, Location..." value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Montant (MAD)" type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} />
          <Select label="Type" value={form.type} options={Object.entries(TYPE_DEP).map(([k, v]) => ({ value: k, label: v.label }))} onChange={e => setForm({ ...form, type: e.target.value })} />
        </div>
        <Input label="Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        <div style={{ marginBottom: 20, border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 12, padding: 16, textAlign: "center", color: "#64748b", fontSize: 13, cursor: "pointer" }}>
          📁 Joindre facture / reçu (Photo)
        </div>
        <Btn onClick={handleAdd} style={{ width: "100%" }}>Valider la dépense</Btn>
      </Modal>
    </div>
  );
}

function Parametres({ user, onLogout }) {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ color: "white", fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Mon Compte</h2>
      
      <Card style={{ textAlign: "center", padding: "30px 20px", marginBottom: 20 }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", margin: "0 auto 16px auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: "white", fontWeight: 900, border: "4px solid rgba(255,255,255,0.1)" }}>
          {user.nom.charAt(0)}
        </div>
        <div style={{ color: "white", fontSize: 20, fontWeight: 800 }}>{user.nom}</div>
        <div style={{ color: "#64748b", fontSize: 14, fontWeight: 500, marginTop: 4 }}>Gérant · SARL AU</div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Btn variant="secondary" style={{ justifyContent: "flex-start", padding: "16px 20px" }}>🏢 Informations Entreprise</Btn>
        <Btn variant="secondary" style={{ justifyContent: "flex-start", padding: "16px 20px" }}>📄 Modèles de Devis/Factures</Btn>
        <Btn variant="secondary" style={{ justifyContent: "flex-start", padding: "16px 20px" }}>🔒 Sécurité & Accès</Btn>
        <Btn variant="danger" onClick={onLogout} style={{ justifyContent: "flex-start", padding: "16px 20px", marginTop: 10 }}>🚪 Se déconnecter</Btn>
      </div>

      <div style={{ textAlign: "center", marginTop: 40, color: "#475569", fontSize: 12, fontWeight: 500 }}>
        GTR PRO v1.2.0<br/>Développé pour les PME du BTP au Maroc
      </div>
    </div>
  );
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", icon: "📊", label: "Tableau" },
  { id: "chantiers", icon: "🏗️", label: "Chantiers" },
  { id: "equipes", icon: "👷", label: "Équipes" },
  { id: "terrain", icon: "📋", label: "Terrain" },
  { id: "depenses", icon: "💰", label: "Dépenses" },
  { id: "params", icon: "⚙️", label: "Compte" },
];

// ─── APP PRINCIPALE ──────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [toastMsg, setToastMsg] = useState("");

  // --- LOGIQUE DE SAUVEGARDE (Local Storage) ---
  const [data, setData] = useState(() => {
    // On essaie de récupérer les données sauvegardées au chargement
    const saved = localStorage.getItem("GTR_PRO_DATA_V1");
    return saved ? JSON.parse(saved) : SAMPLE_DATA;
  });

  // À chaque fois que 'data' change, on sauvegarde automatiquement
  useEffect(() => {
    localStorage.setItem("GTR_PRO_DATA_V1", JSON.stringify(data));
  }, [data]);
  // --------------------------------------------

  const showToast = (msg) => {
    setToastMsg(msg);
  };

  if (!user) return <LoginPage onLogin={setUser} />;

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard data={data} navigate={setPage} />;
      case "chantiers": return <Chantiers data={data} setData={setData} toast={showToast} />;
      case "equipes": return <Equipes data={data} setData={setData} toast={showToast} />;
      case "terrain": return <RapportTerrain data={data} setData={setData} toast={showToast} />;
      case "depenses": return <Depenses data={data} setData={setData} toast={showToast} />;
      case "params": return <Parametres user={user} onLogout={() => setUser(null)} />;
      default: return null;
    }
  };

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "#f8fafc", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 520, margin: "0 auto", position: "relative", boxShadow: "0 0 100px rgba(0,0,0,0.5)" }}>
      
      {/* Top Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(2,6,23,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, background: "#3b82f6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏗️</div>
          <div>
            <div style={{ color: "white", fontWeight: 900, fontSize: 14, lineHeight: 1, letterSpacing: -0.5 }}>GTR <span style={{ color: "#3b82f6" }}>PRO</span></div>
            <div style={{ color: "#64748b", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Travaux Publics · Maroc</div>
          </div>
        </div>
        <div style={{ color: "#64748b", fontSize: 12 }}>{user.nom?.split(" ")[0]}</div>
      </div>

      {/* Contenu */}
      <div style={{ paddingBottom: 80 }}>
        {renderPage()}
      </div>

      {/* Navigation bottom */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 520, background: "rgba(10,15,30,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "8px 4px", display: "flex", justifyContent: "space-around", zIndex: 100 }}>
        {NAV_ITEMS.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            background: "none", border: "none", cursor: "pointer", padding: "6px 4px",
            borderRadius: 10, transition: "all 0.2s",
            color: page === n.id ? "#3b82f6" : "#475569"
          }}>
            <span style={{ fontSize: page === n.id ? 22 : 18, transition: "all 0.2s" }}>{n.icon}</span>
            <span style={{ fontSize: 10, fontWeight: page === n.id ? 700 : 500 }}>{n.label}</span>
          </button>
        ))}
      </div>

      {toastMsg && <Toast msg={toastMsg} onHide={() => setToastMsg("")} />}
    </div>
  );
}
