import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from './firebase';
import { getTheme } from './theme';
import './App.css';
import 'material-icons/iconfont/material-icons.css';

// Components
import CategorySacManager from './components/CategorySacManager';
import ProductForm from './components/ProductForm';
import StockTable from './components/StockTable';
import { generatePDF } from './utils/pdfGenerator';

function App() {
  const [user, setUser] = useState(null);
  const [caserne, setCaserne] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [produits, setProduits] = useState([]);
  
  // Login States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const colors = getTheme(isDarkMode);

  // Theme Sync
  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode);
    document.body.style.backgroundColor = colors.bg.secondary;
    document.body.style.color = colors.text.primary;
  }, [isDarkMode, colors]);

  // Auth & Data Logic (Inchangée pour la stabilité)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setCaserne(userDoc.data().caserne);
          setUser(currentUser);
        } else {
          alert("Compte non configuré pour une caserne.");
          await signOut(auth);
        }
      } else {
        setUser(null);
        setCaserne(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!caserne) return;
    const q = query(collection(db, "produits"), where("caserne", "==", caserne));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProduits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [caserne]);

  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password).catch(() => setLoginError("Identifiants invalides"));
  };

  if (loading) return <div style={{display:'flex', justifyContent:'center', padding:50, color: colors.text.secondary}}>Chargement...</div>;

  // --- LOGIN SCREEN ---
  if (!user) {
    return (
      <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background: colors.bg.secondary}}>
        <div style={{background: colors.bg.primary, padding: 40, borderRadius: 24, boxShadow: colors.shadow, maxWidth: 350, width:'90%'}}>
          <div style={{fontSize: 40, textAlign:'center', marginBottom: 10}}>🚒</div>
          <h2 style={{textAlign:'center', color: colors.text.primary, margin: '0 0 20px 0'}}>Gestion Stock</h2>
          <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap: 15}}>
            <input 
              type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}
              style={{padding: 12, borderRadius: 12, border: `1px solid ${colors.border}`, background: colors.bg.tertiary, color: colors.text.primary}}
            />
            <input 
              type="password" placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)}
              style={{padding: 12, borderRadius: 12, border: `1px solid ${colors.border}`, background: colors.bg.tertiary, color: colors.text.primary}}
            />
            <button type="submit" style={{padding: 12, borderRadius: 12, border:'none', background: colors.brand.primary, color:'white', fontWeight:'bold', cursor:'pointer'}}>
              Se connecter
            </button>
            {loginError && <p style={{color: colors.danger, textAlign:'center', fontSize: 13}}>{loginError}</p>}
          </form>
        </div>
      </div>
    );
  }

  // --- DASHBOARD STATS ---
  const stockBas = produits.filter(p => (p.quantite || 0) < (p.quantiteDemandee || 1)).length;
  const enCommande = produits.filter(p => p.commandeStatus === 'commande').length;

  return (
    <div style={{maxWidth: 1200, margin: '0 auto', padding: '0 0 80px 0'}}>
      
      {/* HEADER */}
      <header style={{
        background: colors.bg.primary, padding: '15px 20px', 
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: colors.shadowSmall, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h1 style={{margin:0, fontSize: '1.2rem', fontWeight: 800, color: colors.text.primary}}>
            <span style={{color: colors.brand.primary}}>Stock</span>
          </h1>
          <div style={{fontSize: '0.8rem', color: colors.text.secondary}}>📍 {caserne}</div>
        </div>
        
        <div style={{display:'flex', gap: 10}}>
          <button onClick={() => signOut(auth)} style={{background: colors.bg.tertiary, border:'none', borderRadius: '50%', width:35, height:35, cursor:'pointer'}}>
            <i class="material-icons">logout</i>
          </button>
        </div>
      </header>

      <div style={{padding: 20}}>
        {/* STATS CARDS */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 15, marginBottom: 25}}>
          <StatCard icon="⚠️" label="Stock Critique" value={stockBas} color={colors.danger} colors={colors} />
          <StatCard icon="🚚" label="En Commande" value={enCommande} color={colors.warning} colors={colors} />
        </div>

        {/* ACTIONS BAR */}
        <div style={{display:'flex', gap: 10, marginBottom: 20, overflowX: 'auto'}} className="hide-scrollbar">
          <ActionButton icon={<span className="material-icons">edit_square</span>}  label="Configuration" onClick={() => setShowConfig(!showConfig)} colors={colors} />
          <ActionButton icon={<span className="material-icons">picture_as_pdf</span>} label="Export PDF" onClick={() => generatePDF(produits)} colors={colors} />
        </div>

        {/* CONFIG SECTION */}
        {showConfig && (
          <div style={{marginBottom: 20, animation: 'fadeIn 0.3s'}}>
            <CategorySacManager caserne={caserne} isDarkMode={isDarkMode} />
          </div>
        )}

        {/* MAIN LIST */}
        <StockTable caserne={caserne} produits={produits} isDarkMode={isDarkMode} />
      </div>

      {/* MODALS & PANELS */}
      <ProductForm caserne={caserne} isDarkMode={isDarkMode} />
    </div>
  );
}

// Sub-components pour le Dashboard
const StatCard = ({ icon, label, value, color, colors }) => (
  <div style={{background: colors.bg.primary, padding: 15, borderRadius: 16, boxShadow: colors.shadowSmall, border: `1px solid ${colors.border}`}}>
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
      <div style={{fontSize: 24}}>{icon}</div>
      <div style={{fontSize: 24, fontWeight: 700, color: color}}>{value}</div>
    </div>
    <div style={{fontSize: 13, color: colors.text.secondary, marginTop: 5, fontWeight: 500}}>{label}</div>
  </div>
);

const ActionButton = ({ icon, label, onClick, colors }) => (
  <button onClick={onClick} style={{
    display:'flex', alignItems:'center', gap: 8, padding: '8px 16px', borderRadius: 50,
    background: colors.bg.primary, border: `1px solid ${colors.border}`, color: colors.text.primary,
    cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 500, boxShadow: colors.shadowSmall
  }}>
    <span>{icon}</span> {label}
  </button>
);

export default App;