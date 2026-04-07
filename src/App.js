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
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16, padding: "16px", cursor: onClick ? "pointer" : "default",
      transition: "all 0.2s", ...style
    }}>{children}</div>
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
        width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 10, padding: "10px 14px", color: "white", fontSize: 14, outline: "none", fontFamily: "inherit", ...props.style
      }} />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
      <select {...props} style={{
        width: "100%", boxSizing: "border-box", background: "#1e293b", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 10, padding: "10px 14px", color: "white", fontSize: 14, outline: "none", fontFamily: "inherit", appearance: "none", ...props.style
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
      ...variants[variant], ...sizes[size], borderRadius: 10, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.2s", opacity: disabled ? 0.5 : 1, ...style
    }}>{children}</button>
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
        width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 10, padding: "10px 14px", color: "white", fontSize: 14, outline: "none", fontFamily: "inherit", resize: "vertical", minHeight: 80, ...props.style
      }} />
    </div>
  );
}

function Toast({ msg, onHide }) {
  useEffect(() => { const t = setTimeout(onHide, 3000); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "#1e293b", border: "1px solid #3b82f6", color: "white", padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
      ✓ {msg}
    </div>
  );
}

// ─── PAGES COMPOSANTS ────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("admin@gtr-btp.ma");
  const [pass, setPass] = useState("demo1234");
  const handleLogin = () => onLogin({ email, role: "admin", nom: "Ahmed Benali" });
  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div style={{ fontSize: 50, marginBottom: 20 }}>🏗️</div>
        <Card><h2 style={{ color: "white", marginBottom: 20 }}>Connexion GTR Pro</h2>
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="Mot de passe" type="password" value={pass} onChange={e => setPass(e.target.value)} />
          <Btn onClick={handleLogin} style={{ width: "100%", justifyContent: "center" }} size="lg">Se connecter</Btn>
        </Card>
      </div>
    </div>
  );
}

function Dashboard({ data, navigate }) {
  const totalDep = data.chantiers.reduce((s, c) => s + c.depenses, 0);
  const actifs = data.chantiers.filter(c => c.statut === "en_cours").length;
  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "white", marginBottom: 20 }}>Tableau de bord</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <StatCard icon="🏗️" label="Actifs" value={actifs} color="#3b82f6" onClick={() => navigate("chantiers")} />
        <StatCard icon="💰" label="Dépenses" value={fmtShort(totalDep)} color="#f59e0b" onClick={() => navigate("depenses")} />
      </div>
      <Card><div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 10 }}>DÉPENSES PAR PROJET</div>
        <BarChart data={data.chantiers.slice(0, 5).map(c => ({ label: c.nom.substring(0, 5), value: c.depenses }))} />
      </Card>
    </div>
  );
}

function Chantiers({ data, setData, toast }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nom: "", client: "", localisation: "", budget: "", debut: today(), fin: "", statut: "en_cours", ouvriers: 0 });
  const save = () => {
    setData(d => ({ ...d, chantiers: [...d.chantiers, { ...form, id: Date.now(), budget: parseFloat(form.budget), depenses: 0 }] }));
    setModal(false); toast("Chantier ajouté");
  };
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ color: "white", margin: 0 }}>Chantiers</h2>
        <Btn onClick={() => setModal(true)}>+ Nouveau</Btn>
      </div>
      {data.chantiers.map(c => (
        <Card key={c.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: "bold", color: "white" }}>{c.nom}</div>
            <Badge statut={c.statut} />
          </div>
          <div style={{ color: "#64748b", fontSize: 12, marginTop: 5 }}>📍 {c.localisation} · 👤 {c.client}</div>
          <div style={{ marginTop: 10, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 5 }}>
            <div style={{ height: "100%", width: `${Math.min((c.depenses/c.budget)*100, 100)}%`, background: "#3b82f6", borderRadius: 5 }} />
          </div>
        </Card>
      ))}
      <Modal open={modal} onClose={() => setModal(false)} title="Nouveau chantier">
        <Input label="Nom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
        <Input label="Client" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} />
        <Input label="Budget (MAD)" type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
        <Btn onClick={save} style={{ width: "100%", justifyContent: "center" }}>Enregistrer</Btn>
      </Modal>
    </div>
  );
}

function Equipes({ data, setData, toast }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nom: "", role: "Maçon", tel: "", chantier: "" });
  const save = () => {
    setData(d => ({ ...d, employes: [...d.employes, { ...form, id: Date.now() }] }));
    setModal(false); toast("Employé ajouté");
  };
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ color: "white", margin: 0 }}>Équipes</h2>
        <Btn onClick={() => setModal(true)}>+ Ajouter</Btn>
      </div>
      {data.employes.map(e => (
        <Card key={e.id} style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ color: "white", fontWeight: "bold" }}>{e.nom}</div><div style={{ color: "#64748b", fontSize: 12 }}>{e.role}</div></div>
          {e.tel && <a href={`https://wa.me/212${e.tel.substring(1)}`}><Btn variant="whatsapp" size="sm">WhatsApp</Btn></a>}
        </Card>
      ))}
      <Modal open={modal} onClose={() => setModal(false)} title="Nouvel employé">
        <Input label="Nom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
        <Input label="Tél" value={form.tel} onChange={e => setForm({ ...form, tel: e.target.value })} />
        <Btn onClick={save} style={{ width: "100%", justifyContent: "center" }}>Enregistrer</Btn>
      </Modal>
    </div>
  );
}

function RapportTerrain({ data, setData, toast }) {
  const [form, setForm] = useState({ chantier: data.chantiers[0]?.id || "", date: today(), ouvriers: "", commentaire: "" });
  const save = () => {
    setData(d => ({ ...d, rapports: [...d.rapports, { ...form, id: Date.now() }] }));
    toast("Rapport envoyé");
  };
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ color: "white", marginBottom: 20 }}>Rapport Terrain</h2>
      <Card>
        <Select label="Chantier" value={form.chantier} options={data.chantiers.map(c => ({ value: c.id, label: c.nom }))} onChange={e => setForm({ ...form, chantier: e.target.value })} />
        <Input label="Ouvriers présents" type="number" value={form.ouvriers} onChange={e => setForm({ ...form, ouvriers: e.target.value })} />
        <Textarea label="Notes" value={form.commentaire} onChange={e => setForm({ ...form, commentaire: e.target.value })} />
        <Btn onClick={save} style={{ width: "100%", justifyContent: "center" }}>Envoyer le rapport</Btn>
      </Card>
    </div>
  );
}

function Depenses({ data, setData, toast }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ chantier: data.chantiers[0]?.id || "", libelle: "", montant: "", type: "materiaux", date: today() });
  const save = () => {
    const m = parseFloat(form.montant);
    setData(d => ({
      ...d,
      depenses: [...d.depenses, { ...form, id: Date.now(), montant: m }],
      chantiers: d.chantiers.map(c => c.id == form.chantier ? { ...c, depenses: c.depenses + m } : c)
    }));
    setModal(false); toast("Dépense enregistrée");
  };
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ color: "white", margin: 0 }}>Dépenses</h2>
        <Btn onClick={() => setModal(true)}>+ Ajouter</Btn>
      </div>
      {data.depenses.slice().reverse().map(d => (
        <Card key={d.id} style={{ marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
          <div><div style={{ color: "white" }}>{d.libelle}</div><div style={{ color: "#64748b", fontSize: 11 }}>{d.date}</div></div>
          <div style={{ color: "#f59e0b", fontWeight: "bold" }}>{fmt(d.montant)}</div>
        </Card>
      ))}
      <Modal open={modal} onClose={() => setModal(false)} title="Nouvelle dépense">
        <Select label="Chantier" options={data.chantiers.map(c => ({ value: c.id, label: c.nom }))} onChange={e => setForm({ ...form, chantier: e.target.value })} />
        <Input label="Libellé" value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} />
        <Input label="Montant" type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} />
        <Btn onClick={save} style={{ width: "100%", justifyContent: "center" }}>Enregistrer</Btn>
      </Modal>
    </div>
  );
}

function Devis({ toast }) {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ color: "white", marginBottom: 20 }}>Devis</h2>
      <Card><p style={{ color: "#94a3b8" }}>Module de génération de devis PDF.</p>
        <Btn onClick={() => toast("Impression en cours...")}>Générer Devis Test</Btn>
      </Card>
    </div>
  );
}

function Parametres({ onLogout }) {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ color: "white", marginBottom: 20 }}>Paramètres</h2>
      <Card>
        <p style={{ color: "white" }}>Version: 1.0.0 Pro</p>
        <Btn variant="danger" onClick={onLogout} style={{ width: "100%", justifyContent: "center" }}>Se déconnecter</Btn>
      </Card>
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

// ─── APP PRINCIPALE (AVEC SAUVEGARDE) ─────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [toastMsg, setToastMsg] = useState("");

  // CHARGEMENT DE LA MÉMOIRE LOCALE
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem("GTR_PRO_DATA_V1");
    return saved ? JSON.parse(saved) : SAMPLE_DATA;
  });

  // ENREGISTREMENT AUTOMATIQUE DANS LA MÉMOIRE
  useEffect(() => {
    localStorage.setItem("GTR_PRO_DATA_V1", JSON.stringify(data));
  }, [data]);

  const toast = (msg) => { setToastMsg(msg); };

  if (!user) return <LoginPage onLogin={setUser} />;

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard data={data} navigate={setPage} />;
      case "chantiers": return <Chantiers data={data} setData={setData} toast={toast} />;
      case "equipes": return <Equipes data={data} setData={setData} toast={toast} />;
      case "terrain": return <RapportTerrain data={data} setData={setData} toast={toast} />;
      case "depenses": return <Depenses data={data} setData={setData} toast={toast} />;
      case "devis": return <Devis toast={toast} />;
      case "params": return <Parametres onLogout={() => setUser(null)} />;
      default: return null;
    }
  };

  return (
    <div style={{ background: "#0a0f1e", minHeight: "100vh", fontFamily: "sans-serif", maxWidth: 520, margin: "0 auto", position: "relative" }}>
      {/* Top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,15,30,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 20px", display: "flex", justifyContent: "space-between" }}>
        <div style={{ color: "white", fontWeight: "bold" }}>GTR <span style={{ color: "#3b82f6" }}>Pro</span></div>
        <div style={{ color: "#64748b", fontSize: 12 }}>{user.nom}</div>
      </div>

      <div style={{ paddingBottom: 80 }}>{renderPage()}</div>

      {/* Navigation bottom */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 520, background: "rgba(10,15,30,0.97)", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "8px 0", display: "flex", justifyContent: "space-around", zIndex: 100 }}>
        {NAV_ITEMS.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{
            background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center",
            color: page === n.id ? "#3b82f6" : "#475569"
          }}>
            <span style={{ fontSize: 20 }}>{n.icon}</span>
            <span style={{ fontSize: 9 }}>{n.label}</span>
          </button>
        ))}
      </div>
      {toastMsg && <Toast msg={toastMsg} onHide={() => setToastMsg("")} />}
    </div>
  );
}
