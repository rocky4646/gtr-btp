// ════════════════════════════════════════════════════════════════════════════
//  GTR PRO — App.js avec Firebase Firestore & Authentication
//  ► Collez vos clés Firebase dans le bloc FIREBASE CONFIG ci-dessous
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";

// ─── FIREBASE IMPORTS ────────────────────────────────────────────────────────
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

// ─── 🔥 FIREBASE CONFIG — COLLEZ VOS CLÉS ICI ────────────────────────────────
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT_ID.appspot.com",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID",
};
// ─────────────────────────────────────────────────────────────────────────────

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// ─── UTILITAIRES ────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("fr-MA", {
    style: "decimal",
    minimumFractionDigits: 0,
  }).format(n) + " MAD";

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

// ─── MINI CHARTS (SVG natif) ─────────────────────────────────────────────────
function BarChart({ data, color = "#3b82f6" }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <svg viewBox={`0 0 ${data.length * 36} 80`} style={{ width: "100%", height: 80 }}>
      {data.map((d, i) => {
        const h = (d.value / max) * 60;
        const x = i * 36 + 4;
        return (
          <g key={i}>
            <rect x={x} y={80 - h - 16} width={28} height={h} rx={4} fill={color} opacity={0.85} />
            <text x={x + 14} y={78} textAnchor="middle" fontSize={8} fill="#94a3b8">
              {d.label}
            </text>
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
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={13} fontWeight="700" fill="white">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

// ─── COMPOSANTS UI ───────────────────────────────────────────────────────────
function Card({ children, style = {}, onClick, className = "" }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: "16px",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Badge({ statut }) {
  const c = STATUT_CONFIG[statut] || STATUT_CONFIG.en_cours;
  return (
    <span
      style={{
        background: c.bg,
        color: c.color,
        borderRadius: 999,
        padding: "2px 10px",
        fontSize: 11,
        fontWeight: 600,
        border: `1px solid ${c.color}40`,
      }}
    >
      {c.label}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color = "#3b82f6", onClick }) {
  return (
    <Card onClick={onClick} style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>
            {label}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "white", letterSpacing: -0.5 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{sub}</div>}
        </div>
        <div
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: `${color}20`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          width: "100%", boxSizing: "border-box",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10, padding: "10px 14px", color: "white", fontSize: 14,
          outline: "none", fontFamily: "inherit",
          ...props.style,
        }}
      />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {label}
        </label>
      )}
      <select
        {...props}
        style={{
          width: "100%", boxSizing: "border-box",
          background: "#1e293b", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10, padding: "10px 14px", color: "white", fontSize: 14,
          outline: "none", fontFamily: "inherit", appearance: "none",
          ...props.style,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
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
  const sizes = {
    sm: { padding: "6px 14px", fontSize: 12 },
    md: { padding: "10px 20px", fontSize: 14 },
    lg: { padding: "14px 28px", fontSize: 15 },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variants[variant], ...sizes[size],
        borderRadius: 10, fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6,
        transition: "all 0.2s", opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520,
          maxHeight: "90vh", overflowY: "auto", padding: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "white" }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#94a3b8", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 18 }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {label}
        </label>
      )}
      <textarea
        {...props}
        style={{
          width: "100%", boxSizing: "border-box",
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10, padding: "10px 14px", color: "white", fontSize: 14,
          outline: "none", fontFamily: "inherit", resize: "vertical", minHeight: 80,
          ...props.style,
        }}
      />
    </div>
  );
}

// ─── TOAST NOTIFICATION ──────────────────────────────────────────────────────
function Toast({ msg, onHide }) {
  useEffect(() => {
    const t = setTimeout(onHide, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      style={{
        position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
        background: "#1e293b", border: "1px solid #3b82f6", color: "white",
        padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600,
        zIndex: 9999, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      ✓ {msg}
    </div>
  );
}

// ─── SPINNER DE CHARGEMENT ────────────────────────────────────────────────────
function Loader({ text = "Chargement..." }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, gap: 16 }}>
      <div
        style={{
          width: 40, height: 40, border: "3px solid rgba(59,130,246,0.2)",
          borderTop: "3px solid #3b82f6", borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ color: "#64748b", fontSize: 13 }}>{text}</div>
    </div>
  );
}

// ─── PAGE LOGIN (avec Firebase Auth) ─────────────────────────────────────────
function LoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !pass) { setErr("Veuillez remplir tous les champs"); return; }
    setLoading(true);
    setErr("");
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
      const msgs = {
        "auth/user-not-found": "Aucun compte avec cet email",
        "auth/wrong-password": "Mot de passe incorrect",
        "auth/invalid-email": "Email invalide",
        "auth/too-many-requests": "Trop de tentatives. Réessayez plus tard",
        "auth/invalid-credential": "Email ou mot de passe incorrect",
      };
      setErr(msgs[e.code] || "Erreur de connexion. Vérifiez vos identifiants.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#0a0f1e 0%,#0f172a 60%,#0c1830 100%)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              width: 72, height: 72, borderRadius: 20,
              background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, marginBottom: 16,
              boxShadow: "0 16px 48px rgba(59,130,246,0.3)",
            }}
          >
            🏗️
          </div>
          <h1 style={{ color: "white", fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
            GTR <span style={{ color: "#3b82f6" }}>Pro</span>
          </h1>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>
            Gestion Travaux Publics · Maroc
          </p>
        </div>
        <Card style={{ padding: 28 }}>
          <h2 style={{ color: "white", fontSize: 18, fontWeight: 700, margin: "0 0 24px" }}>
            Connexion
          </h2>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@entreprise.ma"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <Input
            label="Mot de passe"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          {err && <p style={{ color: "#ef4444", fontSize: 12, margin: "-6px 0 14px" }}>{err}</p>}
          <Btn
            onClick={handleLogin}
            disabled={loading}
            style={{ width: "100%", justifyContent: "center" }}
            size="lg"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </Btn>
          <p style={{ color: "#475569", fontSize: 11, textAlign: "center", marginTop: 16 }}>
            Connectez-vous avec votre compte Firebase Auth
          </p>
        </Card>
      </div>
    </div>
  );
}

// ─── PAGE DASHBOARD ───────────────────────────────────────────────────────────
function Dashboard({ chantiers, depenses, navigate }) {
  const totalBudget = chantiers.reduce((s, c) => s + (c.budget || 0), 0);
  const totalDep = chantiers.reduce((s, c) => s + (c.depenses || 0), 0);
  const recettes = chantiers
    .filter((c) => c.statut === "termine")
    .reduce((s, c) => s + (c.budget || 0), 0);
  const depTerminees = depenses
    .filter((d) => chantiers.find((c) => c.id === d.chantier && c.statut === "termine"))
    .reduce((s, d) => s + (d.montant || 0), 0);
  const benefice = recettes - depTerminees;
  const actifs = chantiers.filter((c) => c.statut === "en_cours").length;
  const retards = chantiers.filter((c) => c.statut === "en_retard").length;

  const barData = chantiers.slice(0, 5).map((c) => ({
    label: c.nom?.split(" ")[0]?.substring(0, 6) || "—",
    value: c.depenses || 0,
  }));

  return (
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ padding: "16px 20px 0", marginBottom: 20 }}>
        <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>Vue d'ensemble</p>
        <h2 style={{ color: "white", fontSize: 22, fontWeight: 800, margin: "4px 0 0", letterSpacing: -0.5 }}>
          Tableau de bord
        </h2>
      </div>

      {retards > 0 && (
        <div
          style={{
            margin: "0 16px 16px",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
          }}
        >
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 13 }}>
              {retards} chantier(s) en retard
            </div>
            <div style={{ color: "#94a3b8", fontSize: 11 }}>
              Vérifiez le planning et prenez des mesures correctives
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 16px", marginBottom: 16 }}>
        <StatCard icon="🏗️" label="Chantiers actifs" value={actifs} sub={`${chantiers.length} au total`} color="#3b82f6" onClick={() => navigate("chantiers")} />
        <StatCard icon="💰" label="Dépenses totales" value={fmtShort(totalDep)} sub={`Budget: ${fmtShort(totalBudget)}`} color="#f59e0b" onClick={() => navigate("depenses")} />
        <StatCard icon="✅" label="Recettes" value={fmtShort(recettes)} sub="Chantiers terminés" color="#22c55e" />
        <StatCard icon="📊" label="Bénéfice" value={fmtShort(benefice)} sub="Net estimé" color="#8b5cf6" />
      </div>

      {barData.length > 0 && (
        <div style={{ padding: "0 16px", marginBottom: 16 }}>
          <Card>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
              Dépenses par chantier
            </div>
            <BarChart data={barData} color="#3b82f6" />
          </Card>
        </div>
      )}

      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
            Chantiers actifs
          </span>
          <Btn variant="ghost" size="sm" onClick={() => navigate("chantiers")}>
            Voir tout →
          </Btn>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {chantiers
            .filter((c) => c.statut !== "termine")
            .map((c) => (
              <Card key={c.id} onClick={() => navigate("chantiers")} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ color: "white", fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{c.nom}</div>
                    <div style={{ color: "#64748b", fontSize: 11 }}>📍 {c.localisation} · {c.client}</div>
                  </div>
                  <Badge statut={c.statut} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <DonutChart
                    value={c.depenses || 0}
                    total={c.budget || 1}
                    color={c.statut === "en_retard" ? "#ef4444" : "#3b82f6"}
                    size={48}
                  />
                  <div>
                    <div style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{fmt(c.depenses || 0)}</div>
                    <div style={{ color: "#64748b", fontSize: 11 }}>sur {fmt(c.budget || 0)}</div>
                  </div>
                  <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 600 }}>👷 {c.ouvriers || 0}</div>
                    <div style={{ color: "#64748b", fontSize: 11 }}>ouvriers</div>
                  </div>
                </div>
              </Card>
            ))}
          {chantiers.filter((c) => c.statut !== "termine").length === 0 && (
            <div style={{ textAlign: "center", color: "#475569", padding: 40 }}>
              Aucun chantier actif
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE CHANTIERS ───────────────────────────────────────────────────────────
function Chantiers({ chantiers, toast }) {
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nom: "", client: "", localisation: "", budget: "",
    debut: today(), fin: "", statut: "en_cours", ouvriers: 0,
  });
  const [search, setSearch] = useState("");

  const filtered = chantiers.filter(
    (c) =>
      c.nom?.toLowerCase().includes(search.toLowerCase()) ||
      c.client?.toLowerCase().includes(search.toLowerCase()) ||
      c.localisation?.toLowerCase().includes(search.toLowerCase())
  );

  const save = async () => {
    if (!form.nom || !form.client || !form.budget) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "chantiers"), {
        ...form,
        budget: parseFloat(form.budget) || 0,
        depenses: 0,
        ouvriers: parseInt(form.ouvriers) || 0,
        createdAt: serverTimestamp(),
      });
      setModal(false);
      setForm({ nom: "", client: "", localisation: "", budget: "", debut: today(), fin: "", statut: "en_cours", ouvriers: 0 });
      toast("Chantier ajouté avec succès");
    } catch (e) {
      toast("Erreur : " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    try {
      await deleteDoc(doc(db, "chantiers", id));
      toast("Chantier supprimé");
    } catch (e) {
      toast("Erreur suppression");
    }
  };

  return (
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ padding: "16px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>{chantiers.length} chantiers</p>
          <h2 style={{ color: "white", fontSize: 22, fontWeight: 800, margin: "4px 0 0" }}>Chantiers</h2>
        </div>
        <Btn onClick={() => setModal(true)}>+ Nouveau</Btn>
      </div>

      <div style={{ padding: "0 16px 12px" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Rechercher..."
          style={{
            width: "100%", boxSizing: "border-box",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10, padding: "10px 14px", color: "white", fontSize: 14,
            outline: "none", fontFamily: "inherit",
          }}
        />
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((c) => {
          const pct = c.budget ? Math.min((c.depenses || 0) / c.budget, 1) : 0;
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
                  <span style={{ color: pct > 1 ? "#ef4444" : "white", fontSize: 12, fontWeight: 700 }}>
                    {Math.round(pct * 100)}%
                  </span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 999 }}>
                  <div
                    style={{
                      height: "100%", width: `${Math.min(pct * 100, 100)}%`,
                      background: pct > 1 ? "#ef4444" : pct > 0.8 ? "#f59e0b" : "#22c55e",
                      borderRadius: 999, transition: "width 0.5s",
                    }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ color: "#94a3b8", fontSize: 11 }}>{fmt(c.depenses || 0)} dépensés</span>
                  <span style={{ color: "#64748b", fontSize: 11 }}>Budget: {fmt(c.budget || 0)}</span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ color: "#64748b", fontSize: 11 }}>
                  📅 {c.debut} → {c.fin || "…"} · 👷 {c.ouvriers || 0} ouvriers
                </div>
                <Btn variant="danger" size="sm" onClick={() => del(c.id)}>🗑</Btn>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "#475569", padding: 40 }}>
            Aucun chantier trouvé
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Nouveau chantier">
        <Input label="Nom du chantier" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} placeholder="Ex: Route Provinciale RP-..." />
        <Input label="Client / Maître d'ouvrage" value={form.client} onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))} placeholder="Ex: Direction Régionale TP" />
        <Input label="Localisation" value={form.localisation} onChange={(e) => setForm((f) => ({ ...f, localisation: e.target.value }))} placeholder="Ex: Casablanca" />
        <Input label="Budget (MAD)" type="number" value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} placeholder="Ex: 2500000" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Input label="Date début" type="date" value={form.debut} onChange={(e) => setForm((f) => ({ ...f, debut: e.target.value }))} />
          <Input label="Date fin" type="date" value={form.fin} onChange={(e) => setForm((f) => ({ ...f, fin: e.target.value }))} />
        </div>
        <Select
          label="Statut"
          value={form.statut}
          onChange={(e) => setForm((f) => ({ ...f, statut: e.target.value }))}
          options={[
            { value: "en_cours", label: "En cours" },
            { value: "en_retard", label: "En retard" },
            { value: "termine", label: "Terminé" },
          ]}
        />
        <Btn onClick={save} disabled={saving} style={{ width: "100%", justifyContent: "center" }} size="lg">
          {saving ? "Enregistrement..." : "💾 Enregistrer"}
        </Btn>
      </Modal>
    </div>
  );
}

// ─── PAGE ÉQUIPES ─────────────────────────────────────────────────────────────
function Equipes({ employes, chantiers, toast }) {
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nom: "", role: "Maçon", tel: "", chantier: "" });

  const roles = ["Chef de chantier", "Conducteur d'engins", "Maçon", "Électricien", "Plombier", "Ferrailleur", "Coffreur", "Chauffeur", "Manœuvre"];

  const save = async () => {
    if (!form.nom) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "employes"), {
        ...form,
        chantier: form.chantier || null,
        createdAt: serverTimestamp(),
      });
      setModal(false);
      setForm({ nom: "", role: "Maçon", tel: "", chantier: "" });
      toast("Employé ajouté");
    } catch (e) {
      toast("Erreur : " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    try {
      await deleteDoc(doc(db, "employes", id));
      toast("Employé supprimé");
    } catch (e) {
      toast("Erreur suppression");
    }
  };

  return (
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ padding: "16px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>{employes.length} employés</p>
          <h2 style={{ color: "white", fontSize: 22, fontWeight: 800, margin: "4px 0 0" }}>Équipes</h2>
        </div>
        <Btn onClick={() => setModal(true)}>+ Ajouter</Btn>
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {employes.map((e) => {
          const chantier = chantiers.find((c) => c.id === e.chantier);
          return (
            <Card key={e.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, flexShrink: 0,
                  }}
                >
                  👷
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{e.nom}</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>{e.role}</div>
                  {chantier && (
                    <div style={{ color: "#3b82f6", fontSize: 11, marginTop: 2 }}>
                      📍 {chantier.nom?.substring(0, 30)}...
                    </div>
                  )}
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
        {employes.length === 0 && (
          <div style={{ textAlign: "center", color: "#475569", padding: 40 }}>
            Aucun employé enregistré
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Nouvel employé">
        <Input label="Nom complet" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} placeholder="Prénom Nom" />
        <Select
          label="Rôle"
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          options={roles.map((r) => ({ value: r, label: r }))}
        />
        <Input label="Téléphone" type="tel" value={form.tel} onChange={(e) => setForm((f) => ({ ...f, tel: e.target.value }))} placeholder="0661234567" />
        <Select
          label="Chantier affecté"
          value={form.chantier}
          onChange={(e) => setForm((f) => ({ ...f, chantier: e.target.value }))}
          options={[
            { value: "", label: "— Non affecté —" },
            ...chantiers.map((c) => ({ value: c.id, label: c.nom })),
          ]}
        />
        <Btn onClick={save} disabled={saving} style={{ width: "100%", justifyContent: "center" }} size="lg">
          {saving ? "Enregistrement..." : "💾 Enregistrer"}
        </Btn>
      </Modal>
    </div>
  );
}

// ─── PAGE RAPPORT TERRAIN ─────────────────────────────────────────────────────
function RapportTerrain({ rapports, chantiers, toast }) {
  const [form, setForm] = useState({
    chantier: chantiers[0]?.id || "",
    date: today(),
    ouvriers: "",
    heures: "",
    commentaire: "",
  });
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  const chantier = chantiers.find((c) => c.id === form.chantier);

  useEffect(() => {
    if (!form.chantier && chantiers.length > 0) {
      setForm((f) => ({ ...f, chantier: chantiers[0].id }));
    }
  }, [chantiers]);

  const submitRapport = async () => {
    if (!form.chantier || !form.ouvriers) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "rapports"), {
        ...form,
        ouvriers: parseInt(form.ouvriers) || 0,
        heures: parseFloat(form.heures) || 0,
        createdAt: serverTimestamp(),
      });
      if (chantier) {
        await updateDoc(doc(db, "chantiers", form.chantier), {
          ouvriers: parseInt(form.ouvriers) || 0,
        });
      }
      setSent(true);
      toast("Rapport enregistré !");
      setTimeout(() => setSent(false), 3000);
    } catch (e) {
      toast("Erreur : " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const msgWhatsApp = chantier
    ? encodeURIComponent(
        `📋 *RAPPORT CHANTIER*\n` +
        `🏗️ ${chantier.nom}\n` +
        `📍 ${chantier.localisation}\n` +
        `📅 Date : ${form.date}\n\n` +
        `👷 Ouvriers : ${form.ouvriers || 0}\n` +
        `⏱ Heures travaillées : ${form.heures || 0}h\n\n` +
        `📝 ${form.commentaire || "Aucun commentaire"}\n\n` +
        `_Envoyé via GTR Pro_`
      )
    : "";

  return (
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ padding: "16px 20px 16px" }}>
        <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>Saisie rapide</p>
        <h2 style={{ color: "white", fontSize: 22, fontWeight: 800, margin: "4px 0 0" }}>Rapport terrain</h2>
      </div>
      <div style={{ padding: "0 16px" }}>
        <Card>
          <Select
            label="Chantier"
            value={form.chantier}
            onChange={(e) => setForm((f) => ({ ...f, chantier: e.target.value }))}
            options={chantiers.map((c) => ({ value: c.id, label: c.nom }))}
          />
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Nb ouvriers" type="number" value={form.ouvriers} onChange={(e) => setForm((f) => ({ ...f, ouvriers: e.target.value }))} placeholder="0" />
            <Input label="Heures" type="number" value={form.heures} onChange={(e) => setForm((f) => ({ ...f, heures: e.target.value }))} placeholder="8" />
          </div>
          <Textarea
            label="Commentaires / Travaux effectués"
            value={form.commentaire}
            onChange={(e) => setForm((f) => ({ ...f, commentaire: e.target.value }))}
            placeholder="Décrire les travaux du jour..."
          />
          <div
            style={{ border: "2px dashed rgba(255,255,255,0.12)", borderRadius: 12, padding: "20px", textAlign: "center", marginBottom: 16, cursor: "pointer" }}
            onClick={() => toast("Upload photos — connectez Firebase Storage")}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>📸</div>
            <div style={{ color: "#64748b", fontSize: 13 }}>Ajouter des photos</div>
            <div style={{ color: "#475569", fontSize: 11 }}>Appuyer pour ouvrir l'appareil photo</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn
              onClick={submitRapport}
              disabled={saving}
              style={{ flex: 1, justifyContent: "center" }}
              variant={sent ? "success" : "primary"}
            >
              {sent ? "✓ Enregistré" : saving ? "Envoi..." : "💾 Enregistrer"}
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
            <div style={{ color: "#25d366", fontSize: 12, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
              📱 Aperçu WhatsApp
            </div>
            <pre style={{ color: "#e2e8f0", fontSize: 12, margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", lineHeight: 1.6 }}>
              {`📋 RAPPORT CHANTIER\n🏗️ ${chantier.nom}\n📍 ${chantier.localisation}\n📅 ${form.date}\n\n👷 Ouvriers : ${form.ouvriers || 0}\n⏱ Heures : ${form.heures || 0}h\n\n📝 ${form.commentaire || "..."}`}
            </pre>
          </Card>
        )}

        <div style={{ marginTop: 20 }}>
          <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            Rapports récents
          </div>
          {rapports
            .slice()
            .sort((a, b) => (b.date > a.date ? 1 : -1))
            .slice(0, 5)
            .map((r) => {
              const ch = chantiers.find((c) => c.id === r.chantier);
              return (
                <Card key={r.id} style={{ marginBottom: 10 }}>
                  <div style={{ color: "white", fontWeight: 600, fontSize: 13 }}>{ch?.nom || "Chantier"}</div>
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                    📅 {r.date} · 👷 {r.ouvriers} ouvriers · ⏱ {r.heures}h
                  </div>
                  {r.commentaire && <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>{r.commentaire}</div>}
                </Card>
              );
            })}
          {rapports.length === 0 && (
            <div style={{ textAlign: "center", color: "#475569", padding: 20 }}>Aucun rapport pour l'instant</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE DÉPENSES ────────────────────────────────────────────────────────────
function Depenses({ depenses, chantiers, toast }) {
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    chantier: chantiers[0]?.id || "",
    type: "materiaux",
    libelle: "",
    montant: "",
    date: today(),
  });

  useEffect(() => {
    if (!form.chantier && chantiers.length > 0) {
      setForm((f) => ({ ...f, chantier: chantiers[0].id }));
    }
  }, [chantiers]);

  const total = depenses.reduce((s, d) => s + (d.montant || 0), 0);

  const byType = Object.keys(TYPE_DEP)
    .map((k) => ({
      type: k,
      total: depenses.filter((d) => d.type === k).reduce((s, d) => s + (d.montant || 0), 0),
    }))
    .filter((t) => t.total > 0);

  const save = async () => {
    if (!form.libelle || !form.montant) return;
    setSaving(true);
    const montant = parseFloat(form.montant) || 0;
    try {
      await addDoc(collection(db, "depenses"), {
        ...form,
        montant,
        createdAt: serverTimestamp(),
      });
      const chantier = chantiers.find((c) => c.id === form.chantier);
      if (chantier) {
        await updateDoc(doc(db, "chantiers", form.chantier), {
          depenses: (chantier.depenses || 0) + montant,
        });
      }
      setModal(false);
      setForm({ chantier: chantiers[0]?.id || "", type: "materiaux", libelle: "", montant: "", date: today() });
      toast("Dépense enregistrée");
    } catch (e) {
      toast("Erreur : " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    const dep = depenses.find((d) => d.id === id);
    try {
      await deleteDoc(doc(db, "depenses", id));
      if (dep) {
        const chantier = chantiers.find((c) => c.id === dep.chantier);
        if (chantier) {
          await updateDoc(doc(db, "chantiers", dep.chantier), {
            depenses: Math.max(0, (chantier.depenses || 0) - (dep.montant || 0)),
          });
        }
      }
      toast("Dépense supprimée");
    } catch (e) {
      toast("Erreur suppression");
    }
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

      {byType.length > 0 && (
        <div style={{ padding: "0 16px 16px" }}>
          <Card>
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
              Répartition par type
            </div>
            {byType.map((t) => (
              <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>{TYPE_DEP[t.type].icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "#cbd5e1", fontSize: 12 }}>{TYPE_DEP[t.type].label}</span>
                    <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>{fmt(t.total)}</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 999 }}>
                    <div style={{ height: "100%", width: `${total ? (t.total / total) * 100 : 0}%`, background: "#3b82f6", borderRadius: 999 }} />
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {depenses
          .slice()
          .sort((a, b) => (b.date > a.date ? 1 : -1))
          .map((d) => {
            const chantier = chantiers.find((c) => c.id === d.chantier);
            return (
              <Card key={d.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flex: 1 }}>
                    <span style={{ fontSize: 24 }}>{TYPE_DEP[d.type]?.icon || "📦"}</span>
                    <div>
                      <div style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{d.libelle}</div>
                      <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>📅 {d.date}</div>
                      {chantier && (
                        <div style={{ color: "#3b82f6", fontSize: 11, marginTop: 2 }}>
                          {chantier.nom?.substring(0, 30)}...
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                    <span style={{ color: "#f59e0b", fontWeight: 800, fontSize: 15 }}>{fmt(d.montant || 0)}</span>
                    <Btn variant="danger" size="sm" onClick={() => del(d.id)}>🗑</Btn>
                  </div>
                </div>
              </Card>
            );
          })}
        {depenses.length === 0 && (
          <div style={{ textAlign: "center", color: "#475569", padding: 40 }}>Aucune dépense enregistrée</div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Nouvelle dépense">
        <Select
          label="Chantier"
          value={form.chantier}
          onChange={(e) => setForm((f) => ({ ...f, chantier: e.target.value }))}
          options={chantiers.map((c) => ({ value: c.id, label: c.nom }))}
        />
        <Select
          label="Type de dépense"
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          options={Object.entries(TYPE_DEP).map(([k, v]) => ({ value: k, label: `${v.icon} ${v.label}` }))}
        />
        <Input label="Description" value={form.libelle} onChange={(e) => setForm((f) => ({ ...f, libelle: e.target.value }))} placeholder="Ex: Agrégats concassés" />
        <Input label="Montant (MAD)" type="number" value={form.montant} onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))} placeholder="Ex: 15000" />
        <Input label="Date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
        <Btn onClick={save} disabled={saving} style={{ width: "100%", justifyContent: "center" }} size="lg">
          {saving ? "Enregistrement..." : "💾 Enregistrer"}
        </Btn>
      </Modal>
    </div>
  );
}

// ─── PAGE DEVIS ───────────────────────────────────────────────────────────────
function Devis({ toast }) {
  const [lignes, setLignes] = useState([{ desc: "", qte: 1, pu: 0 }]);
  const [form, setForm] = useState({
    client: "",
    ref: `DEV-${Date.now().toString().slice(-6)}`,
    date: today(),
    validite: 30,
    tva: 20,
  });

  const addLigne = () => setLignes((l) => [...l, { desc: "", qte: 1, pu: 0 }]);
  const delLigne = (i) => setLignes((l) => l.filter((_, idx) => idx !== i));
  const updLigne = (i, k, v) => setLignes((l) => l.map((li, idx) => (idx === i ? { ...li, [k]: v } : li)));

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
      ${lignes.map((l) => `<tr><td>${l.desc}</td><td>${l.qte}</td><td>${parseFloat(l.pu).toLocaleString("fr-MA")}</td><td>${((l.qte || 0) * (l.pu || 0)).toLocaleString("fr-MA")}</td></tr>`).join("")}
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
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
            Informations générales
          </div>
          <Input label="Réf. devis" value={form.ref} onChange={(e) => setForm((f) => ({ ...f, ref: e.target.value }))} />
          <Input label="Client / Maître d'ouvrage" value={form.client} onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))} placeholder="Nom du client" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            <Input label="Validité (jours)" type="number" value={form.validite} onChange={(e) => setForm((f) => ({ ...f, validite: e.target.value }))} />
          </div>
          <Input label="TVA (%)" type="number" value={form.tva} onChange={(e) => setForm((f) => ({ ...f, tva: e.target.value }))} />
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
              <Input label="Description" value={l.desc} onChange={(e) => updLigne(i, "desc", e.target.value)} placeholder="Ex: Terrassement général" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Input label="Quantité" type="number" value={l.qte} onChange={(e) => updLigne(i, "qte", e.target.value)} />
                <Input label="Prix unitaire (MAD)" type="number" value={l.pu} onChange={(e) => updLigne(i, "pu", e.target.value)} />
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
  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (e) {
      toast("Erreur de déconnexion");
    }
  };

  return (
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ padding: "16px 20px 16px" }}>
        <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>Compte & configuration</p>
        <h2 style={{ color: "white", fontSize: 22, fontWeight: 800, margin: "4px 0 0" }}>Paramètres</h2>
      </div>
      <div style={{ padding: "0 16px" }}>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
              👤
            </div>
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 16 }}>{user?.displayName || user?.email?.split("@")[0] || "Utilisateur"}</div>
              <div style={{ color: "#64748b", fontSize: 13 }}>{user?.email}</div>
              <div style={{ color: "#3b82f6", fontSize: 12, marginTop: 2 }}>🔑 Connecté via Firebase Auth</div>
            </div>
          </div>
        </Card>

        <Card style={{ marginBottom: 16, background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            🔥 Firebase — Connecté
          </div>
          <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.8 }}>
            Vos données sont synchronisées en temps réel avec Firestore.
            Authentication active · Données persistées dans le cloud.
          </div>
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            📋 Structure Firestore
          </div>
          <pre style={{ color: "#94a3b8", fontSize: 10, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
{`/chantiers/{id}
  nom, client, localisation
  budget, depenses (MAD)
  debut, fin, statut, ouvriers

/employes/{id}
  nom, role, tel, chantier (id)

/depenses/{id}
  chantier (id), type, libelle
  montant, date

/rapports/{id}
  chantier (id), date, ouvriers
  heures, commentaire`}
          </pre>
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            ⚙️ Intégrations
          </div>
          {[
            { icon: "🔥", label: "Firebase Firestore", desc: "Base de données temps réel", ok: true },
            { icon: "🔐", label: "Firebase Auth", desc: "Authentification sécurisée", ok: true },
            { icon: "📱", label: "WhatsApp Business", desc: "Rapports automatisés", ok: true },
            { icon: "📤", label: "Export PDF", desc: "Devis et rapports", ok: true },
            { icon: "📊", label: "Google Sheets", desc: "Export automatique", ok: false },
            { icon: "📸", label: "Firebase Storage", desc: "Photos de chantier", ok: false },
          ].map((i) => (
            <div key={i.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 20 }}>{i.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{i.label}</div>
                <div style={{ color: "#64748b", fontSize: 11 }}>{i.desc}</div>
              </div>
              <span
                style={{
                  fontSize: 11, padding: "3px 8px", borderRadius: 999,
                  background: i.ok ? "rgba(34,197,94,0.15)" : "rgba(100,116,139,0.15)",
                  color: i.ok ? "#22c55e" : "#64748b", fontWeight: 600,
                }}
              >
                {i.ok ? "✓ Actif" : "Config."}
              </span>
            </div>
          ))}
        </Card>

        <Btn variant="danger" onClick={handleLogout} style={{ width: "100%", justifyContent: "center" }} size="lg">
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
  const [authLoading, setAuthLoading] = useState(true);

  const [chantiers, setChantiers] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [rapports, setRapports] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [page, setPage] = useState("dashboard");
  const [toastMsg, setToastMsg] = useState("");
  const toast = (msg) => setToastMsg(msg);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setChantiers([]);
      setEmployes([]);
      setDepenses([]);
      setRapports([]);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    let resolved = 0;
    const total = 4;
    const checkDone = () => { resolved++; if (resolved >= total) setDataLoading(false); };
    const toList = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const unsubChantiers = onSnapshot(
      query(collection(db, "chantiers"), orderBy("createdAt", "desc")),
      (snap) => { setChantiers(toList(snap)); checkDone(); },
      () => checkDone()
    );
    const unsubEmployes = onSnapshot(
      query(collection(db, "employes"), orderBy("createdAt", "desc")),
      (snap) => { setEmployes(toList(snap)); checkDone(); },
      () => checkDone()
    );
    const unsubDepenses = onSnapshot(
      query(collection(db, "depenses"), orderBy("createdAt", "desc")),
      (snap) => { setDepenses(toList(snap)); checkDone(); },
      () => checkDone()
    );
    const unsubRapports = onSnapshot(
      query(collection(db, "rapports"), orderBy("createdAt", "desc")),
      (snap) => { setRapports(toList(snap)); checkDone(); },
      () => checkDone()
    );

    return () => {
      unsubChantiers();
      unsubEmployes();
      unsubDepenses();
      unsubRapports();
    };
  }, [user]);

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader text="Vérification de la session..." />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const renderPage = () => {
    if (dataLoading) return <Loader text="Synchronisation Firestore..." />;
    switch (page) {
      case "dashboard": return <Dashboard chantiers={chantiers} depenses={depenses} navigate={setPage} />;
      case "chantiers": return <Chantiers chantiers={chantiers} toast={toast} />;
      case "equipes": return <Equipes employes={employes} chantiers={chantiers} toast={toast} />;
      case "terrain": return <RapportTerrain rapports={rapports} chantiers={chantiers} toast={toast} />;
      case "depenses": return <Depenses depenses={depenses} chantiers={chantiers} toast={toast} />;
      case "devis": return <Devis toast={toast} />;
      case "params": return <Parametres user={user} onLogout={() => setUser(null)} toast={toast} />;
      default: return null;
    }
  };

  return (
    <div
      style={{
        background: "#0a0f1e", minHeight: "100vh",
        fontFamily: "'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif",
        maxWidth: 520, margin: "0 auto", position: "relative",
      }}
    >
      <div
        style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(10,15,30,0.95)", backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "12px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}
          >
            🏗️
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 800, fontSize: 16, letterSpacing: -0.3 }}>
              GTR <span style={{ color: "#3b82f6" }}>Pro</span>
            </div>
            <div style={{ color: "#475569", fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>
              Travaux Publics · Maroc
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} title="Firestore connecté" />
          <div style={{ color: "#64748b", fontSize: 12 }}>
            {user.displayName?.split(" ")[0] || user.email?.split("@")[0]}
          </div>
        </div>
      </div>

      <div style={{ paddingBottom: 80 }}>{renderPage()}</div>

      <div
        style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 520,
          background: "rgba(10,15,30,0.97)", backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "8px 4px", display: "flex", justifyContent: "space-around", zIndex: 100,
        }}
      >
        {NAV_ITEMS.map((n) => (
          <button
            key={n.id}
            onClick={() => setPage(n.id)}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              background: "none", border: "none", cursor: "pointer", padding: "6px 4px",
              borderRadius: 10, transition: "all 0.2s",
              color: page === n.id ? "#3b82f6" : "#475569",
            }}
          >
            <span style={{ fontSize: page === n.id ? 22 : 18, transition: "all 0.2s" }}>{n.icon}</span>
            <span style={{ fontSize: 9, fontWeight: page === n.id ? 700 : 500 }}>{n.label}</span>
            {page === n.id && (
              <div style={{ width: 20, height: 2, background: "#3b82f6", borderRadius: 999, marginTop: -2 }} />
            )}
          </button>
        ))}
      </div>

      {toastMsg && <Toast msg={toastMsg} onHide={() => setToastMsg("")} />}
    </div>
  );
}
