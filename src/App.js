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

// ─── MINI CHART (SVG natif) ──────────────────────────────────────────────────
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
            <text x={x + 14} y={78} textAnchor="middle" fontSize={8} fill="#94a3b8">{d.label}</text>
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

// ─── COMPOSANTS UI ───────────────────────────────────────────────────────────
function Card({ children, style = {}, onClick, className = "" }) {
  return (
    <div onClick={onClick} className={className} style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      padding: "16px",
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.2s",
      ...style
    }}>
      {children}
    </div>
  );
}

function Badge({ statut }) {
  const c = STATUT_CONFIG[statut] || STATUT_CONFIG.en_cours;
  return (
    <span style={{ background: c.bg, color: c.color, borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 600, border: `1px solid ${c.color}40` }}>
      {c.label}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color = "#3b82f6", onClick }) {
  return (
    <Card onClick={onClick} style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "white", letterSpacing: -0.5 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{sub}</div>}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
      <input {...props} style={{
        width: "100%", boxSizing: "border-box",
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 10, padding: "10px 14px", color: "white", fontSize: 14,
        outline: "none", fontFamily: "inherit",
        ...props.style
      }} />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
      <select {...props} style={{
        width: "100%", boxSizing: "border-box",
        background: "#1e293b", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 10, padding: "10px 14px", color: "white", fontSize: 14,
        outline: "none", fontFamily: "inherit", appearance: "none",
        ...props.style
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", style = {}, disabled = false }) {
  const variants = {
    primary: { background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "white", border: "none" },
    danger: { background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" },
    ghost: { background: "rgba(255,255,255,0.06)", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.1)" },
    success: { background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", border: "none" },
    whatsapp: { background: "linear-gradient(135deg,#25d366,#128c7e)", color: "white", border: "none" },
  };
  const sizes = { sm: { padding: "6px 14px", fontSize: 12 }, md: { padding: "10px 20px", fontSize: 14 }, lg: { padding: "14px 28px", fontSize: 15 } };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...variants[variant], ...sizes[size],
      borderRadius: 10, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6,
      transition: "all 0.2s", opacity: disabled ? 0.5 : 1,
      ...style
    }}>
      {children}
    </button>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "white" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#94a3b8", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 18 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
      <textarea {...props} style={{
        width: "100%", boxSizing: "border-box",
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 10, padding: "10px 14px", color: "white", fontSize: 14,
        outline: "none", fontFamily: "inherit", resize: "vertical", minHeight: 80,
        ...props.style
      }} />
    </div>
  );
}

// ─── TOAST NOTIFICATION ──────────────────────────────────────────────────────
function Toast({ msg, onHide }) {
  useEffect(() => { const t = setTimeout(onHide, 3000); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "#1e293b", border: "1px solid #3b82f6", color: "white", padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
      ✓ {msg}
    </div>
  );
}

// ─── PAGE LOGIN ──────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("admin@gtr-btp.ma");
  const [pass, setPass] = useState("demo1234");
  const [err, setErr] = useState("");

  const handleLogin = () => {
    if (email && pass.length >= 6) onLogin({ email, role: "admin", nom: "Ahmed Benali" });
    else setErr("Email ou mot de passe incorrect");
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0a0f1e 0%,#0f172a 60%,#0c1830 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 16, boxShadow: "0 16px 48px rgba(59,130,246,0.3)" }}>
            🏗️
          </div>
          <h1 style={{ color: "white", fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>GTR <span style={{ color: "#3b82f6" }}>Pro</span></h1>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>Gestion Travaux Publics · Maroc</p>
        </div>
        <Card style={{ padding: 28 }}>
          <h2 style={{ color: "white", fontSize: 18, fontWeight: 700, margin: "0 0 24px" }}>Connexion</h2>
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@entreprise.ma" />
          <Input label="Mot de passe" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" />
          {err && <p style={{ color: "#ef4444", fontSize: 12, margin: "-6px 0 14px" }}>{err}</p>}
          <Btn onClick={handleLogin} style={{ width: "100%", justifyContent: "center" }} size="lg">Se connecter</Btn>
          <p style={{ color: "#475569", fontSize: 11, textAlign: "center", marginTop: 16 }}>
            Démo: admin@gtr-btp.ma / demo1234
          </p>
        </Card>
      </div>
    </div>
  );
}

// ─── PAGE DASHBOARD ──────────────────────────────────────────────────────────
function Dashboard({ data, navigate }) {
  const totalBudget = data.chantiers.reduce((s, c) => s + c.budget, 0);
  const totalDep = data.chantiers.reduce((s, c) => s + c.depenses, 0);
  const recettes = data.chantiers.filter(c => c.statut === "termine").reduce((s, c) => s + c.budget, 0);
  const benefice = recettes - data.depenses.filter(d => data.chantiers.find(c => c.id === d.chantier && c.statut === "termine")).reduce((s, d) => s + d.montant, 0);
  const actifs = data.chantiers.filter(c => c.statut === "en_cours").length;
  const retards = data.chantiers.filter(c => c.statut === "en_retard").length;

  const barData = data.chantiers.slice(0, 5).map(c => ({
    label: c.nom.split(" ")[0].substring(0, 6),
    value: c.depenses
  }));

  return (
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ padding: "16px 20px 0", marginBottom: 20 }}>
        <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>Vue d'ensemble</p>
        <h2 style={{ color: "white", fontSize: 22, fontWeight: 800, margin: "4px 0 0", letterSpacing: -0.5 }}>Tableau de bord</h2>
      </div>
      {retards > 0 && (
        <div style={{ margin: "0 16px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 13 }}>{retards} chantier(s) en retard</div>
            <div style={{ color: "#94a3b8", fontSize: 11 }}>Vérifiez le planning et prenez des mesures correctives</div>
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 16px", marginBottom: 16 }}>
        <StatCard icon="🏗️" label="Chantiers actifs" value={actifs} sub={`${data.chantiers.length} au total`} color="#3b82f6" onClick={() => navigate("chantiers")} />
        <StatCard icon="💰" label="Dépenses totales" value={fmtShort(totalDep)} sub={`Budget: ${fmtShort(totalBudget)}`} color="#f59e0b" onClick={() => navigate("depenses")} />
        <StatCard icon="✅" label="Recettes" value={fmtShort(recettes)} sub="Chantiers terminés" color="#22c55e" />
        <StatCard icon="📊" label="Bénéfice" value={fmtShort(benefice)} sub="Net estimé" color="#8b5cf6" />
      </div>
      <div style={{ padding: "0 16px", marginBottom: 16 }}>
        <Card>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Dépenses par chantier</div>
          <BarChart data={barData} color="#3b82f6" />
        </Card>
      </div>
      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Chantiers actifs</span>
          <Btn variant="ghost" size="sm" onClick={() => navigate("chantiers")}>Voir tout →</Btn>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.chantiers.filter(c => c.statut !== "termine").map(c => (
            <Card key={c.id} onClick={() => navigate("chantiers")} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ color: "white", fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{c.nom}</div>
                  <div style={{ color: "#64748b", fontSize: 11 }}>📍 {c.localisation} · {c.client}</div>
                </div>
                <Badge statut={c.statut} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <DonutChart value={c.depenses} total={c.budget} color={c.statut === "en_retard" ? "#ef4444" : "#3b82f6"} size={48} />
                <div>
                  <div style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{fmt(c.depenses)}</div>
                  <div style={{ color: "#64748b", fontSize: 11 }}>sur {fmt(c.budget)}</div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 600 }}>👷 {c.ouvriers}</div>
                  <div style={{ color: "#64748b", fontSize: 11 }}>ouvriers</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE CHANTIERS ───────────────────────────────────────────────────────────
function Chantiers({ data, setData, toast }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nom: "", client: "", localisation: "", budget: "", debut: today(), fin: "", statut: "en_cours", ouvriers: 0 });
  const [search, setSearch] = useState("");

  const filtered = data.chantiers.filter(c =>
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.client.toLowerCase().includes(search.toLowerCase()) ||
    c.localisation.toLowerCase().includes(search.toLowerCase())
  );

  const save = () => {
    if (!form.nom || !form.client || !form.budget) return;
    const nouveau = { ...form, id: Date.now(), budget: parseFloat(form.budget) || 0, depenses: 0 };
    setData(d => ({ ...d, chantiers: [...d.chantiers, nouveau] }));
    setModal(false);
    setForm({ nom: "", client: "", localisation: "", budget: "", debut: today(), fin: "", statut: "en_cours", ouvriers: 0 });
    toast("Chantier ajouté avec succès");
  };

  const del = (id) => {
    setData(d => ({ ...d, chantiers: d.chantiers.filter(c => c.id !== id) }));
    toast("Chantier supprimé");
  };

  return (
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ padding: "16px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>{data.chantiers.length} chantiers</p>
          <h2 style={{ color: "white", fontSize: 22, fontWeight: 800, margin: "4px 0 0" }}>Chantiers</h2>
        </div>
        <Btn onClick={() => setModal(true)}>+ Nouveau</Btn>
      </div>
      <div style={{ padding: "0 16px 12px" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher..." style={{
          width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px",
          color: "white", fontSize: 14, outline: "none", fontFamily: "inherit"
        }} />
      </div>
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(c => {
          const pct = c.budget ? Math.min(c.depenses / c.budget, 1) : 0;
          return (
            <Card key={c.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                  <div style={{ color: "white", fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{c.nom}</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>👤 {c.client}</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>📍 {c.localisation}</div>
                </div>
                <Badge statut={c.statut} />
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#94a3b8", fontSize: 12 }}>Budget consommé</span>
                  <span style={{ color: pct > 1 ? "#ef4444" : "white", fontSize: 12, fontWeight: 700 }}>{Math.round(pct * 100)}%</span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 999 }}>
                  <div style={{ height: "100%", width: `${Math.min(pct * 100, 100)}%`, background: pct > 1 ? "#ef4444" : pct > 0.8 ? "#f59e0b" : "#22c55e", borderRadius: 999, transition: "width 0.5s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ color: "#94a3b8", fontSize: 11 }}>{fmt(c.depenses)} dépensés</span>
                  <span style={{ color: "#64748b", fontSize: 11 }}>Budget: {fmt(c.budget)}</span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ color: "#64748b", fontSize: 11 }}>
                  📅 {c.debut} → {c.fin || "…"} · 👷 {c.ouvriers} ouvriers
                </div>
                <Btn variant="danger" size="sm" onClick={() => del(c.id)}>🗑</Btn>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "#475569", padding: 40 }}>Aucun chantier trouvé</div>
        )}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Nouveau chantier">
        <Input label="Nom du chantier" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Ex: Route Provinciale RP-..." />
        <Input label="Client / Maître d'ouvrage" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} placeholder="Ex: Direction Régionale TP" />
        <Input label="Localisation" value={form.localisation} onChange={e => setForm(f => ({ ...f, localisation: e.target.value }))} placeholder="Ex: Casablanca" />
        <Input label="Budget (MAD)" type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="Ex: 2500000" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Input label="Date début" type="date" value={form.debut} onChange={e => setForm(f => ({ ...f, debut: e.target.value }))} />
          <Input label="Date fin" type="date" value={form.fin} onChange={e => setForm(f => ({ ...f, fin: e.target.value }))} />
        </div>
        <Select label="Statut" value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
          options={[{ value: "en_cours", label: "En cours" }, { value: "en_retard", label: "En retard" }, { value: "termine", label: "Terminé" }]} />
        <Btn onClick={save} style={{ width: "100%", justifyContent: "center" }} size="lg">💾 Enregistrer</Btn>
      </Modal>
    </div>
  );
}

// ─── PAGE ÉQUIPES ─────────────────────────────────────────────────────────────
function Equipes({ data, setData, toast }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nom: "", role: "Maçon", tel: "", chantier: "" });

  const save = () => {
    if (!form.nom) return;
    setData(d => ({ ...d, employes: [...d.employes, { ...form, id: Date.now(), chantier: parseInt(form.chantier) || null }] }));
    setModal(false);
    setForm({ nom: "", role: "Maçon", tel: "", chantier: "" });
    toast("Employé ajouté");
  };

  const del = (id) => { setData(d => ({ ...d, employes: d.employes.filter(e => e.id !== id) })); toast("Employé supprimé"); };

  const roles = ["Chef de chantier", "Conducteur d'engins", "Maçon", "Électricien", "Plombier", "Ferrailleur", "Coffreur", "Chauffeur", "Manœuvre"];

  return (
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ padding: "16px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>{data.employes.length} employés</p>
          <h2 style={{ color: "white", fontSize: 22, fontWeight: 800, margin: "4px 0 0" }}>Équipes</h2>
        </div>
        <Btn onClick={() => setModal(true)}>+ Ajouter</Btn>
      </div>
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {data.employes.map(e => {
          const chantier = data.chantiers.find(c => c.id === e.chantier);
          return (
            <Card key={e.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  👷
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{e.nom}</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>{e.role}</div>
                  {chantier && <div style={{ color: "#3b82f6", fontSize: 11, marginTop: 2 }}>📍 {chantier.nom.substring(0, 30)}...</div>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {e.tel && (
                    <a href={`https://wa.me/212${e.tel.replace(/^0/, "")}`} target="_blank" rel="noreferrer">
                      <Btn variant="whatsapp" size="sm">📱</Btn>
                    </a>
                  )}
                  <Btn variant="danger" size="sm" onClick={() => del(e.id)}>🗑</Btn>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Nouvel employé">
        <Input label="Nom complet" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Prénom Nom" />
        <Select label="Rôle" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
          options={roles.map(r => ({ value: r, label: r }))} />
        <Input label="Téléphone" type="tel" value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} placeholder="0661234567" />
        <Select label="Chantier affecté" value={form.chantier} onChange={e => setForm(f => ({ ...f, chantier: e.target.value }))}
          options={[{ value: "", label: "— Non affecté —" }, ...data.chantiers.map(c => ({ value: c.id, label: c.nom }))]} />
        <Btn onClick={save} style={{ width: "100%", justifyContent: "center" }} size="lg">💾 Enregistrer</Btn>
      </Modal>
    </div>
  );
}

// ─── PAGE RAPPORT TERRAIN ─────────────────────────────────────────────────────
function RapportTerrain({ data, setData, toast }) {
  const [form, setForm] = useState({ chantier: data.chantiers[0]?.id || "", date: today(), ouvriers: "", heures: "", commentaire: "" });
  const [sent, setSent] = useState(false);

  const chantier = data.chantiers.find(c => c.id === parseInt(form.chantier));

  const submitRapport = () => {
    if (!form.chantier || !form.ouvriers) return;
    const rapport = { ...form, id: Date.now(), chantier: parseInt(form.chantier) };
    setData(d => ({ ...d, rapports: [...d.rapports, rapport] }));
    setSent(true);
    toast("Rapport enregistré !");
    setTimeout(() => setSent(false), 3000);
  };

  const msgWhatsApp = chantier ? encodeURIComponent(
    `📋 *RAPPORT CHANTIER*\n` +
    `🏗️ ${chantier.nom}\n` +
    `📍 ${chantier.localisation}\n` +
    `📅 Date : ${form.date}\n\n` +
    `👷 Ouvriers : ${form.ouvriers || 0}\n` +
    `⏱ Heures travaillées : ${form.heures || 0}h\n\n` +
    `📝 ${form.commentaire || "Aucun commentaire"}\n\n` +
    `_Envoyé via GTR Pro_`
  ) : "";

  return (
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ padding: "16px 20px 16px" }}>
        <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>Saisie rapide</p>
        <h2 style={{ color: "white", fontSize: 22, fontWeight: 800, margin: "4px 0 0" }}>Rapport terrain</h2>
      </div>
      <div style={{ padding: "0 16px" }}>
        <Card>
          <Select label="Chantier" value={form.chantier} onChange={e => setForm(f => ({ ...f, chantier: e.target.value }))}
            options={data.chantiers.map(c => ({ value: c.id, label: c.nom }))} />
          <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Nb ouvriers" type="number" value={form.ouvriers} onChange={e => setForm(f => ({ ...f, ouvriers: e.target.value }))} placeholder="0" />
            <Input label="Heures" type="number" value={form.heures} onChange={e => setForm(f => ({ ...f, heures: e.target.value }))} placeholder="8" />
          </div>
          <Textarea label="Commentaires / Travaux effectués" value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))} placeholder="Décrire les travaux du jour..." />
          <div style={{ border: "2px dashed rgba(255,255,255,0.12)", borderRadius: 12, padding: "20px", textAlign: "center", marginBottom: 16, cursor: "pointer" }}
            onClick={() => toast("Upload photos — fonctionnel avec Firebase Storage")}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📸</div>
            <div style={{ color: "#64748b", fontSize: 13 }}>Ajouter des photos</div>
            <div style={{ color: "#475569", fontSize: 11 }}>Appuyer pour ouvrir l'appareil photo</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={submitRapport} style={{ flex: 1, justifyContent: "center" }} variant={sent ? "success" : "primary"}>
              {sent ? "✓ Enregistré" : "💾 Enregistrer"}
            </Btn>
            {chantier && (
              <a href={`https://wa.me/?text=${msgWhatsApp}`} target="_blank" rel="noreferrer" style={{ display: "flex" }}>
                <Btn variant="whatsapp" style={{ flex: 1, whiteSpace: "nowrap" }}>📱 WhatsApp</Btn>
              </a>
            )}
          </div>
        </Card>
        {chantier && (
          <Card style={{ marginTop: 16, background: "rgba(37,211,102,0.05)", border: "1px solid rgba(37,211,102,0.2)" }}>
            <div style={{ color: "#25d366", fontSize: 12, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>📱 Aperçu WhatsApp</div>
            <pre style={{ color: "#e2e8f0", fontSize: 12, margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", lineHeight: 1.6 }}>
              {`📋 RAPPORT CHANTIER\n🏗️ ${chantier.nom}\n📍 ${chantier.localisation}\n📅 ${form.date}\n\n👷 Ouvriers : ${form.ouvriers || 0}\n⏱ Heures : ${form.heures || 0}h\n\n📝 ${form.commentaire || "..."}`}
            </pre>
          </Card>
        )}
        <div style={{ marginTop: 20 }}>
          <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Rapports récents</div>
          {data.rapports.slice(-5).reverse().map(r => {
            const ch = data.chantiers.find(c => c.id === r.chantier);
            return (
              <Card key={r.id} style={{ marginBottom: 10 }}>
                <div style={{ color: "white", fontWeight: 600, fontSize: 13 }}>{ch?.nom || "Chantier"}</div>
                <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>📅 {r.date} · 👷 {r.ouvriers} ouvriers · ⏱ {r.heures}h</div>
                {r.commentaire && <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>{r.commentaire}</div>}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE DÉPENSES ─────────────────────────────────────────────────────────────
function Depenses({ data, setData, toast }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ chantier: data.chantiers[0]?.id || "", type: "materiaux", libelle: "", montant: "", date: today() });

  const total = data.depenses.reduce((s, d) => s + d.montant, 0);

  const byType = Object.keys(TYPE_DEP).map(k => ({
    type: k,
    total: data.depenses.filter(d => d.type === k).reduce((s, d) => s + d.montant, 0)
  })).filter(t => t.total > 0);

  const save = () => {
    if (!form.libelle || !form.montant) return;
    const dep = { ...form, id: Date.now(), chantier: parseInt(form.chantier), montant: parseFloat(form.montant) };
    setData(d => ({
      ...d,
      depenses: [...d.depenses, dep],
      chantiers: d.chantiers.map(c => c.id === dep.chantier ? { ...c, depenses: c.depenses + dep.montant } : c)
    }));
    setModal(false);
    setForm({ chantier: data.chantiers[0]?.id || "", type: "materiaux", libelle: "", montant: "", date: today() });
    toast("Dépense enregistrée");
  };

  const del = (id) => {
    const dep = data.depenses.find(d => d.id === id);
    setData(d => ({
      ...d,
      depenses: d.depenses.filter(d => d.id !== id),
      chantiers: d.chantiers.map(c => c.id === dep?.chantier ? { ...c, depenses: Math.max(0, c.depenses - (dep?.montant || 0)) } : c)
    }));
    toast("Dépense supprimée");
  };

  return (
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ padding: "16px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>Total: {fmt(total)}</p>
          <h2 style={{ color: "white", fontSize: 22, fontWeight: 800, margin: "4px 0 0" }}>Dépenses</h2>
        </div>
        <Btn onClick={() => setModal(true)}>+ Ajouter</Btn>
      </div>
      <div style={{ padding: "0 16px 16px" }}>
        <Card>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Répartition par type</div>
          {byType.map(t => (
            <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>{TYPE_DEP[t.type].icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#cbd5e1", fontSize: 12 }}>{TYPE_DEP[t.type].label}</span>
                  <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>{fmt(t.total)}</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 999 }}>
                  <div style={{ height: "100%", width: `${(t.total / total) * 100}%`, background: "#3b82f6", borderRadius: 999 }} />
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {data.depenses.slice().reverse().map(d => {
          const chantier = data.chantiers.find(c => c.id === d.chantier);
          return (
            <Card key={d.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flex: 1 }}>
                  <span style={{ fontSize: 24 }}>{TYPE_DEP[d.type]?.icon || "📦"}</span>
                  <div>
                    <div style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{d.libelle}</div>
                    <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>📅 {d.date}</div>
                    {chantier && <div style={{ color: "#3b82f6", fontSize: 11, marginTop: 2 }}>{chantier.nom.substring(0, 30)}...</div>}
                  </div>
                </div>
                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                  <span style={{ color: "#f59e0b", fontWeight: 800, fontSize: 15 }}>{fmt(d.montant)}</span>
                  <Btn variant="danger" size="sm" onClick={() => del(d.id)}>🗑</Btn>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Nouvelle dépense">
        <Select label="Chantier" value={form.chantier} onChange={e => setForm(f => ({ ...f, chantier: e.target.value }))}
          options={data.chantiers.map(c => ({ value: c.id, label: c.nom }))} />
        <Select label="Type de dépense" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
          options={Object.entries(TYPE_DEP).map(([k, v]) => ({ value: k, label: `${v.icon} ${v.label}` }))} />
        <Input label="Description" value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Ex: Agrégats concassés" />
        <Input label="Montant (MAD)" type="number" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} placeholder="Ex: 15000" />
        <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        <Btn onClick={save} style={{ width: "100%", justifyContent: "center" }} size="lg">💾 Enregistrer</Btn>
      </Modal>
    </div>
  );
}

// ─── PAGE DEVIS ───────────────────────────────────────────────────────────────
function Devis({ data, toast }) {
  const [lignes, setLignes] = useState([{ desc: "", qte: 1, pu: 0 }]);
  const [form, setForm] = useState({ client: "", ref: `DEV-${Date.now().toString().slice(-6)}`, date: today(), validite: 30, tva: 20 });
  const [preview, setPreview] = useState(false);

  const addLigne = () => setLignes(l => [...l, { desc: "", qte: 1, pu: 0 }]);
  const delLigne = (i) => setLignes(l => l.filter((_, idx) => idx !== i));
  const updLigne = (i, k, v) => setLignes(l => l.map((li, idx) => idx === i ? { ...li, [k]: v } : li));

  const ht = lignes.reduce((s, l) => s + (parseFloat(l.qte) || 0) * (parseFloat(l.pu) || 0), 0);
  const tva = ht * (parseFloat(form.tva) || 0) / 100;
  const ttc = ht + tva;

  const printDevis = () => {
    const win = window.open("", "_blank");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Devis ${form.ref}</title>
    <style>
      body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; color: #222; font-size: 13px; }
      h1 { color: #1d4ed8; } .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th { background: #1d4ed8; color: white; padding: 8px 12px; text-align: left; }
      td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
      .total-row td { font-weight: bold; background: #f1f5f9; }
      .ttc td { background: #1d4ed8; color: white; font-size: 16px; }
      .footer { margin-top: 40px; font-size: 11px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 20px; }
    </style></head><body>
    <div class="header">
      <div><h1>🏗️ GTR PRO BTP</h1><p>Maroc · Travaux Publics & Bâtiment</p></div>
      <div style="text-align:right"><h2>DEVIS N° ${form.ref}</h2><p>Date: ${form.date}<br>Valable ${form.validite} jours</p></div>
    </div>
    <div style="background:#f8fafc;padding:16px;border-radius:8px;margin-bottom:24px">
      <strong>Client:</strong> ${form.client || "—"}
    </div>
    <table>
      <tr><th>Description</th><th>Qté</th><th>Prix unit. (MAD)</th><th>Total HT (MAD)</th></tr>
      ${lignes.map(l => `<tr><td>${l.desc}</td><td>${l.qte}</td><td>${parseFloat(l.pu).toLocaleString("fr-MA")}</td><td>${((l.qte || 0) * (l.pu || 0)).toLocaleString("fr-MA")}</td></tr>`).join("")}
      <tr class="total-row"><td colspan="3">Total HT</td><td>${ht.toLocaleString("fr-MA")} MAD</td></tr>
      <tr class="total-row"><td colspan="3">TVA (${form.tva}%)</td><td>${tva.toLocaleString("fr-MA")} MAD</td></tr>
      <tr class="ttc"><td colspan="3"><strong>TOTAL TTC</strong></td><td><strong>${ttc.toLocaleString("fr-MA")} MAD</strong></td></tr>
    </table>
    <div class="footer">Ce devis est valable ${form.validite} jours à compter de sa date d'émission. Arrêté à la somme de ${ttc.toLocaleString("fr-MA")} Dirhams TTC.<br>Modalités de paiement: 30% à la commande, 40% à mi-avancement, 30% à la réception.<br><br>Signature et cachet de l'entreprise: ___________________________</div>
    </body></html>`;
    win.document.write(html);
    win.document.close();
    win.print();
    toast("Devis prêt pour impression / PDF");
  };

  return (
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ padding: "16px 20px 16px" }}>
        <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>Génération PDF</p>
        <h2 style={{ color: "white", fontSize: 22, fontWeight: 800, margin: "4px 0 0" }}>Devis</h2>
      </div>
      <div style={{ padding: "0 16px" }}>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Informations générales</div>
          <Input label="Réf. devis" value={form.ref} onChange={e => setForm(f => ({ ...f, ref: e.target.value }))} />
          <Input label="Client / Maître d'ouvrage" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} placeholder="Nom du client" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <Input label="Validité (jours)" type="number" value={form.validite} onChange={e => setForm(f => ({ ...f, validite: e.target.value }))} />
          </div>
          <Input label="TVA (%)" type="number" value={form.tva} onChange={e => setForm(f => ({ ...f, tva: e.target.value }))} />
        </Card>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Prestations</div>
            <Btn variant="ghost" size="sm" onClick={addLigne}>+ Ligne</Btn>
          </div>
          {lignes.map((l, i) => (
            <div key={i} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>Ligne {i + 1}</span>
                {lignes.length > 1 && <Btn variant="danger" size="sm" onClick={() => delLigne(i)}>✕</Btn>}
              </div>
              <Input label="Description" value={l.desc} onChange={e => updLigne(i, "desc", e.target.value)} placeholder="Ex: Terrassement général" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Input label="Quantité" type="number" value={l.qte} onChange={e => updLigne(i, "qte", e.target.value)} />
                <Input label="Prix unitaire (MAD)" type="number" value={l.pu} onChange={e => updLigne(i, "pu", e.target.value)} />
              </div>
              <div style={{ textAlign: "right", color: "#f59e0b", fontWeight: 700, fontSize: 14 }}>
                = {fmt((parseFloat(l.qte) || 0) * (parseFloat(l.pu) || 0))}
              </div>
            </div>
          ))}
          <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#94a3b8", fontSize: 13 }}>Total HT</span>
              <span style={{ color: "white", fontWeight: 600 }}>{fmt(ht)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#94a3b8", fontSize: 13 }}>TVA ({form.tva}%)</span>
              <span style={{ color: "white", fontWeight: 600 }}>{fmt(tva)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 10 }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 16 }}>TOTAL TTC</span>
              <span style={{ color: "#3b82f6", fontWeight: 800, fontSize: 18 }}>{fmt(ttc)}</span>
            </div>
          </div>
        </Card>
        <Btn onClick={printDevis} style={{ width: "100%", justifyContent: "center" }} size="lg">
          🖨️ Générer & Imprimer le devis PDF
        </Btn>
      </div>
    </div>
  );
}

// ─── PAGE PARAMÈTRES ──────────────────────────────────────────────────────────
function Parametres({ user, onLogout, toast }) {
  return (
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ padding: "16px 20px 16px" }}>
        <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>Compte & configuration</p>
        <h2 style={{ color: "white", fontSize: 22, fontWeight: 800, margin: "4px 0 0" }}>Paramètres</h2>
      </div>
      <div style={{ padding: "0 16px" }}>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👤</div>
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 16 }}>{user?.nom || "Utilisateur"}</div>
              <div style={{ color: "#64748b", fontSize: 13 }}>{user?.email}</div>
              <div style={{ color: "#3b82f6", fontSize: 12, marginTop: 2 }}>🔑 Administrateur</div>
            </div>
          </div>
        </Card>
        <Card style={{ marginBottom: 16, background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.2)" }}>
          <div style={{ color: "#f59e0b", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>🔥 Firebase (Backend)</div>
          <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.8 }}>
            Pour connecter votre vraie base de données Firebase:<br />
            <code style={{ background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4, fontSize: 11, color: "#f59e0b" }}>
              firebase init → firestore + auth + storage
            </code>
          </div>
        </Card>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>📋 Schéma Firestore</div>
          <pre style={{ color: "#94a3b8", fontSize: 10, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
{`/chantiers/{id}
  nom, client, localisation
  budget, depenses (MAD)
  debut, fin, statut, ouvriers

/employes/{id}
  nom, role, tel, chantierId

/depenses/{id}
  chantierId, type, libelle
  montant, date

/rapports/{id}
  chantierId, date, ouvriers
  heures, commentaire, photos[]`}
          </pre>
        </Card>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>⚙️ Intégrations disponibles</div>
          {[
            { icon: "📊", label: "Google Sheets", desc: "Export automatique des données", ok: false },
            { icon: "📱", label: "WhatsApp Business", desc: "Rapports automatisés", ok: true },
            { icon: "🔥", label: "Firebase Firestore", desc: "Base de données temps réel", ok: false },
            { icon: "📤", label: "Export PDF", desc: "Devis et rapports", ok: true },
          ].map(i => (
            <div key={i.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 20 }}>{i.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{i.label}</div>
                <div style={{ color: "#64748b", fontSize: 11 }}>{i.desc}</div>
              </div>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 999, background: i.ok ? "rgba(34,197,94,0.15)" : "rgba(100,116,139,0.15)", color: i.ok ? "#22c55e" : "#64748b", fontWeight: 600 }}>
                {i.ok ? "✓ Actif" : "Config."}
              </span>
            </div>
          ))}
        </Card>
        <Btn variant="danger" onClick={onLogout} style={{ width: "100%", justifyContent: "center" }} size="lg">
          🚪 Déconnexion
        </Btn>
      </div>
    </div>
  );
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "chantiers", icon: "🏗️", label: "Chantiers" },
  { id: "equipes", icon: "👷", label: "Équipes" },
  { id: "terrain", icon: "📋", label: "Terrain" },
  { id: "depenses", icon: "💰", label: "Dépenses" },
  { id: "devis", icon: "📄", label: "Devis" },
  { id: "params", icon: "⚙️", label: "Compte" },
];

// ─── APP PRINCIPALE ───────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  // ── SAUVEGARDE AUTOMATIQUE localStorage ──────────────────────────────────
  // Au démarrage : charger les données sauvegardées, sinon utiliser SAMPLE_DATA
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("gtr_pro_data");
      return saved ? JSON.parse(saved) : SAMPLE_DATA;
    } catch {
      return SAMPLE_DATA;
    }
  });

  // À chaque modification de data : sauvegarder automatiquement sur le téléphone
  useEffect(() => {
    try {
      localStorage.setItem("gtr_pro_data", JSON.stringify(data));
    } catch {
      // Stockage plein ou indisponible — silencieux
    }
  }, [data]);
  // ─────────────────────────────────────────────────────────────────────────

  const [toastMsg, setToastMsg] = useState("");

  const toast = (msg) => { setToastMsg(msg); };

  if (!user) return <LoginPage onLogin={setUser} />;

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard data={data} navigate={setPage} />;
      case "chantiers": return <Chantiers data={data} setData={setData} toast={toast} />;
      case "equipes": return <Equipes data={data} setData={setData} toast={toast} />;
      case "terrain": return <RapportTerrain data={data} setData={setData} toast={toast} />;
      case "depenses": return <Depenses data={data} setData={setData} toast={toast} />;
      case "devis": return <Devis data={data} toast={toast} />;
      case "params": return <Parametres user={user} onLogout={() => setUser(null)} toast={toast} />;
      default: return null;
    }
  };

  return (
    <div style={{ background: "#0a0f1e", minHeight: "100vh", fontFamily: "'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif", maxWidth: 520, margin: "0 auto", position: "relative" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,15,30,0.95)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏗️</div>
          <div>
            <div style={{ color: "white", fontWeight: 800, fontSize: 16, letterSpacing: -0.3 }}>GTR <span style={{ color: "#3b82f6" }}>Pro</span></div>
            <div style={{ color: "#475569", fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>Travaux Publics · Maroc</div>
          </div>
        </div>
        <div style={{ color: "#64748b", fontSize: 12 }}>{user.nom?.split(" ")[0]}</div>
      </div>
      <div style={{ paddingBottom: 80 }}>
        {renderPage()}
      </div>
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 520, background: "rgba(10,15,30,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "8px 4px", display: "flex", justifyContent: "space-around", zIndex: 100 }}>
        {NAV_ITEMS.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            background: "none", border: "none", cursor: "pointer", padding: "6px 4px",
            borderRadius: 10, transition: "all 0.2s",
            color: page === n.id ? "#3b82f6" : "#475569"
          }}>
            <span style={{ fontSize: page === n.id ? 22 : 18, transition: "all 0.2s" }}>{n.icon}</span>
            <span style={{ fontSize: 9, fontWeight: page === n.id ? 700 : 500 }}>{n.label}</span>
            {page === n.id && <div style={{ width: 20, height: 2, background: "#3b82f6", borderRadius: 999, marginTop: -2 }} />}
          </button>
        ))}
      </div>
      {toastMsg && <Toast msg={toastMsg} onHide={() => setToastMsg("")} />}
    </div>
  );
}
