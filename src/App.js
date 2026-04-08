import React, { useState, useEffect } from "react";
// Import Firebase
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy,
  doc,
  updateDoc 
} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";

// ─── CONFIGURATION FIREBASE ─────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCxZGuSNiAvUozBTw01_LWkCsegb-UwILM",
  authDomain: "amsan-gestion-app-afa2c.firebaseapp.com",
  projectId: "amsan-gestion-app-afa2c",
  storageBucket: "amsan-gestion-app-afa2c.firebasestorage.app",
  messagingSenderId: "671704851928",
  appId: "1:671704851928:web:9c84777a081e3c71a2bead",
  measurementId: "G-YKHQ1JF8E2"
};

// Initialisation
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ─── UTILITAIRES DE FORMATAGE ───────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("fr-MA", { style: "decimal" }).format(n) + " MAD";
const today = () => new Date().toISOString().split("T")[0];

const STATUT_CONFIG = {
  en_cours: { label: "En cours", color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  en_retard: { label: "En retard", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  termine: { label: "Terminé", color: "#64748b", bg: "rgba(100,116,139,0.15)" },
};

// ─── COMPOSANTS UI RÉUTILISABLES ────────────────────────────────────────────
function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 20, padding: "18px", marginBottom: 12, cursor: onClick ? "pointer" : "default", ...style
    }}>{children}</div>
  );
}

function Btn({ children, onClick, variant = "primary", style = {} }) {
  const bg = variant === "primary" ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" : "rgba(255,255,255,0.08)";
  if (variant === "whatsapp") style.background = "linear-gradient(135deg, #25d366, #128c7e)";
  return (
    <button onClick={onClick} style={{
      background: bg, color: "white", border: "none", padding: "12px 20px",
      borderRadius: 12, fontWeight: 700, cursor: "pointer", display: "flex", 
      alignItems: "center", justifyContent: "center", gap: 8, ...style
    }}>{children}</button>
  );
}

// ─── PAGES DE L'APPLICATION ─────────────────────────────────────────────────

function Dashboard({ chantiers, depenses }) {
  const totalBudget = chantiers.reduce((s, c) => s + (Number(c.budget) || 0), 0);
  const totalDep = chantiers.reduce((s, c) => s + (Number(c.depenses) || 0), 0);

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Tableau de bord</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card><div style={{ fontSize: 11, color: "#94a3b8" }}>CHANTIERS</div><div style={{ fontSize: 22, fontWeight: 800 }}>{chantiers.length}</div></Card>
        <Card><div style={{ fontSize: 11, color: "#94a3b8" }}>EN RETARD</div><div style={{ fontSize: 22, fontWeight: 800, color: "#ef4444" }}>{chantiers.filter(c=>c.statut==='en_retard').length}</div></Card>
      </div>
      <Card style={{ marginTop: 12 }}>
        <div style={{ fontSize: 11, color: "#94a3b8" }}>DÉPENSES TOTALES</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#f59e0b" }}>{fmt(totalDep)}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Sur un budget de {fmt(totalBudget)}</div>
      </Card>
    </div>
  );
}

function RapportTerrain({ chantiers }) {
  const [form, setForm] = useState({ chantierId: "", ouvriers: "", commentaire: "" });

  const shareWhatsApp = () => {
    const c = chantiers.find(i => i.id === form.chantierId);
    const msg = `*Rapport GTR PRO*%0A*Chantier:* ${c?.nom}%0A*Ouvriers:* ${form.ouvriers}%0A*Notes:* ${form.commentaire}`;
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleSave = async () => {
    if (!form.chantierId || !form.commentaire) return alert("Remplissez les champs");
    await addDoc(collection(db, "rapports"), { ...form, date: today() });
    alert("Rapport enregistré dans le Cloud !");
    setForm({ chantierId: "", ouvriers: "", commentaire: "" });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Rapport Terrain</h2>
      <Card>
        <select style={{ width: "100%", padding: 12, borderRadius: 10, background: "#1e293b", color: "white", marginBottom: 12 }}
          onChange={e => setForm({...form, chantierId: e.target.value})} value={form.chantierId}>
          <option value="">Choisir un chantier...</option>
          {chantiers.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <input type="number" placeholder="Nombre d'ouvriers" style={{ width: "100%", padding: 12, borderRadius: 10, background: "#1e293b", color: "white", marginBottom: 12, border: "none" }}
          value={form.ouvriers} onChange={e => setForm({...form, ouvriers: e.target.value})} />
        <textarea placeholder="Observations..." style={{ width: "100%", padding: 12, borderRadius: 10, background: "#1e293b", color: "white", marginBottom: 12, border: "none", minHeight: 100 }}
          value={form.commentaire} onChange={e => setForm({...form, commentaire: e.target.value})} />
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={handleSave} style={{ flex: 1 }}>Sauvegarder</Btn>
          <Btn onClick={shareWhatsApp} variant="whatsapp" style={{ flex: 1 }}>WhatsApp</Btn>
        </div>
      </Card>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [chantiers, setChantiers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ÉCOUTE DES DONNÉES EN TEMPS RÉEL
  useEffect(() => {
    const q = query(collection(db, "chantiers"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChantiers(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // GESTION AUTHENTIFICATION SIMPLIFIÉE POUR LE DÉBUT
  const login = () => setUser({ nom: "Admin GTR", role: "admin" });

  if (!user) return (
    <div style={{ height: "100vh", background: "#020617", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Card style={{ width: "100%", maxWidth: 350, textAlign: "center" }}>
        <h1 style={{ color: "#3b82f6" }}>GTR PRO</h1>
        <p style={{ color: "#64748b", marginBottom: 20 }}>Connexion sécurisée Cloud</p>
        <Btn onClick={login} style={{ width: "100%" }}>Se connecter au Cloud</Btn>
      </Card>
    </div>
  );

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "white", fontFamily: "sans-serif", maxWidth: 500, margin: "0 auto", paddingBottom: 80 }}>
      <div style={{ padding: "15px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 900 }}>GTR PRO</span>
        <span style={{ fontSize: 12, color: "#3b82f6" }}>Cloud Connecté ●</span>
      </div>

      {loading ? <div style={{ padding: 40, textAlign: "center" }}>Chargement...</div> : (
        <>
          {page === "dashboard" && <Dashboard chantiers={chantiers} />}
          {page === "terrain" && <RapportTerrain chantiers={chantiers} />}
          {page === "chantiers" && (
            <div style={{ padding: 20 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Chantiers</h2>
              {chantiers.map(c => (
                <Card key={c.id}>
                  <div style={{ fontWeight: 700 }}>{c.nom}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{c.localisation}</div>
                </Card>
              ))}
              <Btn onClick={async () => {
                const nom = prompt("Nom du nouveau chantier ?");
                if(nom) await addDoc(collection(db, "chantiers"), { nom, budget: 100000, depenses: 0, statut: "en_cours", localisation: "Maroc" });
              }} style={{ width: "100%", marginTop: 10 }}>+ Ajouter un chantier</Btn>
            </div>
          )}
        </>
      )}

      {/* NAVIGATION BASSE */}
      <div style={{ position: "fixed", bottom: 0, width: "100%", maxWidth: 500, background: "#0f172a", display: "flex", justifyContent: "space-around", padding: "10px 0" }}>
        <button onClick={() => setPage("dashboard")} style={{ background: "none", border: "none", color: page === "dashboard" ? "#3b82f6" : "#64748b" }}>📊</button>
        <button onClick={() => setPage("chantiers")} style={{ background: "none", border: "none", color: page === "chantiers" ? "#3b82f6" : "#64748b" }}>🏗️</button>
        <button onClick={() => setPage("terrain")} style={{ background: "none", border: "none", color: page === "terrain" ? "#3b82f6" : "#64748b" }}>📋</button>
      </div>
    </div>
  );
}
