import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from './firebase'; // Assurez-vous que le fichier s'appelle bien firebase.js
import { getTheme } from './theme';
import './App.css';
import 'material-icons/iconfont/material-icons.css';

// Components
import CategorySacManager from './components/CategorySacManager';
import ProductForm from './components/ProductForm';
import StockTable from './components/StockTable';
import { generatePDF } from './utils/pdfGenerator';

function App() {
  const [triggerAction, setTriggerAction] = useState(null);
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

  // Auth & Data Logic
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCaserne(userData.caserne);

            const q = query(
              collection(db, "produits"),
              where("caserne", "==", userData.caserne)
            );

            const unsubProduits = onSnapshot(q, (snapshot) => {
              const prods = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
              setProduits(prods);
              setLoading(false);
            }, (error) => {
              console.error("Erreur de lecture des produits:", error);
              setLoading(false);
            });

            return () => unsubProduits();
          } else {
            console.error("Aucun document utilisateur trouvé dans Firestore.");
            alert("Erreur : Votre compte n'est pas lié à une caserne.");
            await signOut(auth);
            setLoading(false);
          }
        } catch (error) {
          console.error("Erreur de permission (profil utilisateur):", error);
          setLoading(false);
        }
      } else {
        setUser(null);
        setCaserne(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password).catch(() => setLoginError("Identifiants invalides"));
  };

  const toggleFilter = (type) => {
    setTriggerAction(prev => prev === type ? null : type);
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
            <i className="material-icons">logout</i>
          </button>
        </div>
      </header>

      <div style={{padding: 20}}>
        
        {/* BOUTONS DE FILTRAGE (Remplacent les anciennes StatCards) */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 15, marginBottom: 25}}>
          <FilterToggleButton 
            active={triggerAction === 'peremption'}
            onClick={() => toggleFilter('peremption')}
            label={triggerAction === 'peremption' ? "Masquer Péremptions" : "Afficher Péremptions"}
            icon="warning"
            activeColor={colors.danger}
            colors={colors}
          />
          <FilterToggleButton 
            active={triggerAction === 'commande'}
            onClick={() => toggleFilter('commande')}
            label={triggerAction === 'commande' ? "Masquer Commandes" : "Afficher Commandes"}
            icon="local_shipping"
            activeColor={colors.warning}
            colors={colors}
          />
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
        <StockTable 
          caserne={caserne} 
          produits={produits} 
          isDarkMode={isDarkMode} 
          externalTrigger={triggerAction}
          setExternalTrigger={setTriggerAction}
        />
      </div>

      {/* MODAL D'AJOUT DE PRODUIT (Le bouton '+' flottant apparaîtra grâce à ce composant) */}
      <ProductForm caserne={caserne} isDarkMode={isDarkMode} />
    </div>
  );
}

// Sous-composant pour les boutons de filtrage (Remplace StatCard)
const FilterToggleButton = ({ active, onClick, label, icon, activeColor, colors }) => (
  <button 
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      padding: '16px',
      borderRadius: 16,
      border: `2px solid ${active ? activeColor : colors.border}`,
      background: active ? activeColor : colors.bg.primary,
      color: active ? '#fff' : colors.text.primary,
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: '14px',
      transition: 'all 0.2s ease',
      boxShadow: active ? '0 4px 12px rgba(0,0,0,0.15)' : colors.shadowSmall,
    }}
  >
    <span className="material-icons" style={{fontSize: 22}}>{icon}</span>
    <span>{label}</span>
  </button>
);

// Sous-composant pour les petits boutons d'action (Config, Export PDF)
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