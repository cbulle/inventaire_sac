import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from './firebase';

import CategorySacManager from './components/CategorySacManager';
import ProductForm from './components/ProductForm';
import StockTable from './components/StockTable';
import NotificationPanel from './components/NotificationPanel';
import { generatePDF } from './utils/pdfGenerator';
import { getTheme } from './theme';

function App() {
  const [user, setUser] = useState(null);
  const [caserne, setCaserne] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true'
  );
  const [produits, setProduits] = useState([]);
  
  // États pour le formulaire de connexion
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const colors = getTheme(isDarkMode);

  // Charger les préférences du mode sombre
  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode);
    document.body.style.backgroundColor = colors.bg.secondary;
    document.body.style.color = colors.text.primary;
  }, [isDarkMode, colors]);

  // Authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setCaserne(userDoc.data().caserne);
          setUser(currentUser);
        } else {
          alert("Erreur: Aucun profil assigné à ce compte. Contactez le développeur.");
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

  // Charger les produits pour les notifications et export
  useEffect(() => {
    if (!caserne) return;

    const q = query(
      collection(db, "produits"),
      where("caserne", "==", caserne)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProduits(data);
    });

    return () => unsubscribe();
  }, [caserne]);

  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .catch(err => setLoginError("Email ou mot de passe incorrect"));
  };

  const handleExportPDF = () => {
    if (produits.length === 0) {
      alert("Aucun produit à exporter");
      return;
    }
    generatePDF(produits);
    setShowMobileMenu(false);
  };

  if (loading) return (
    <div style={{
      padding: 20,
      textAlign: 'center',
      backgroundColor: colors.bg.secondary,
      color: colors.text.primary,
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      Chargement...
    </div>
  );

  // PAGE DE CONNEXION
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: colors.bg.secondary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '300px',
          width: '100%',
          padding: '30px',
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          boxShadow: `0 4px 12px ${colors.shadow}`,
          backgroundColor: colors.bg.primary
        }}>
          <h2 style={{
            textAlign: 'center',
            color: colors.text.primary,
            marginBottom: '30px',
            fontSize: '24px'
          }}>
            🚒 Connexion
          </h2>
          <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              style={{
                padding:'12px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                fontSize: '14px',
                backgroundColor: colors.bg.secondary,
                color: colors.text.primary
              }} 
              required
            />
            <input 
              type="password" 
              placeholder="Mot de passe" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              style={{
                padding:'12px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                fontSize: '14px',
                backgroundColor: colors.bg.secondary,
                color: colors.text.primary
              }} 
              required
            />
            <button 
              type="submit" 
              style={{
                padding:'12px',
                background: colors.brand.primary,
                color:'white', 
                border:'none', 
                borderRadius:'8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Se connecter
            </button>
            {loginError && <p style={{color: colors.danger, fontSize:'13px', margin: '5px 0', textAlign: 'center'}}>{loginError}</p>}
          </form>
        </div>
      </div>
    );
  }

  // ÉCRAN PRINCIPAL
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.bg.secondary,
      color: colors.text.primary,
      transition: 'all 0.3s ease'
    }}>
      {/* HEADER */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px',
        backgroundColor: colors.bg.primary,
        borderBottom: `2px solid ${colors.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: `0 2px 8px ${colors.shadow}`,
        flexWrap: 'wrap',
        gap: '10px',
        '@media (max-width: 768px)': {
          padding: '12px'
        }
      }}>
        <div>
          <h1 style={{
            margin: '0 0 5px 0',
            color: colors.text.primary,
            fontSize: '20px',
            '@media (max-width: 768px)': {
              fontSize: '18px'
            }
          }}>
            📦 Stock : {caserne}
          </h1>
          <small style={{color: colors.text.secondary, fontSize: '12px'}}>
            Connecté : {user.email}
          </small>
        </div>

        {/* BOUTONS DESKTOP */}
        <div style={{
          display: 'flex',
          gap: '10px',
          '@media (max-width: 768px)': {
            display: 'none'
          }
        }}>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              background: colors.bg.secondary,
              border: `1px solid ${colors.border}`,
              color: colors.text.primary,
              padding:'8px 12px',
              borderRadius:'6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title={isDarkMode ? "Mode clair" : "Mode sombre"}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>

          <button 
            onClick={handleExportPDF}
            style={{
              background: colors.success,
              color:'white',
              border:'none',
              padding:'8px 12px',
              borderRadius:'6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Exporter en PDF"
          >
            📄 PDF
          </button>

          <button 
            onClick={() => setShowConfig(!showConfig)}
            style={{
              background: showConfig ? colors.brand.primary : colors.bg.secondary,
              color: showConfig ? 'white' : colors.text.primary,
              border: `1px solid ${colors.brand.primary}`,
              padding:'8px 12px',
              borderRadius:'6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {showConfig ? '✕ Config' : '⚙️ Config'}
          </button>

          <button 
            onClick={() => signOut(auth)}
            style={{
              background: colors.danger,
              color:'white',
              border:'none',
              padding:'8px 12px',
              borderRadius:'6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Déconnexion
          </button>
        </div>

        {/* BOUTON HAMBURGER MOBILE */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          style={{
            display: 'none',
            '@media (max-width: 768px)': {
              display: 'block'
            },
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: colors.text.primary,
            padding: '8px'
          }}
        >
          {showMobileMenu ? '✕' : '☰'}
        </button>
      </header>

      {/* MENU MOBILE */}
      {showMobileMenu && (
        <div style={{
          display: 'none',
          '@media (max-width: 768px)': {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '15px',
            backgroundColor: colors.bg.primary,
            borderBottom: `2px solid ${colors.border}`,
            position: 'sticky',
            top: '70px',
            zIndex: 99
          }
        }}>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              width: '100%',
              padding: '12px',
              background: colors.bg.secondary,
              color: colors.text.primary,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isDarkMode ? '☀️ Mode clair' : '🌙 Mode sombre'}
          </button>

          <button 
            onClick={handleExportPDF}
            style={{
              width: '100%',
              padding: '12px',
              background: colors.success,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📄 Exporter en PDF
          </button>

          <button 
            onClick={() => {
              setShowConfig(!showConfig);
              setShowMobileMenu(false);
            }}
            style={{
              width: '100%',
              padding: '12px',
              background: colors.brand.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ⚙️ Configuration
          </button>

          <button 
            onClick={() => signOut(auth)}
            style={{
              width: '100%',
              padding: '12px',
              background: colors.danger,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Déconnexion
          </button>
        </div>
      )}

      {/* CONTENU PRINCIPAL */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '20px',
        '@media (max-width: 768px)': {
          padding: '15px'
        }
      }}>
        
        {/* SECTION CONFIGURATION */}
        {showConfig && caserne && (
          <div style={{
            marginBottom: '20px',
            '@media (max-width: 768px)': {
              marginBottom: '15px'
            }
          }}>
            <CategorySacManager caserne={caserne} isDarkMode={isDarkMode} />
          </div>
        )}

        {/* SECTION PRODUITS */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          '@media (max-width: 768px)': {
            gap: '15px'
          }
        }}>
          <ProductForm caserne={caserne} isDarkMode={isDarkMode} />
          
          <hr style={{
            margin: '0',
            border: 'none',
            borderTop: `1px solid ${colors.border}`
          }} />
          
          <StockTable 
            caserne={caserne} 
            isDarkMode={isDarkMode}
            produits={produits}
          />
        </div>
      </div>

      {/* PANNEAU DE NOTIFICATIONS */}
      <NotificationPanel 
        isDarkMode={isDarkMode} 
        produits={produits}
        userEmail={user.email}
        caserne={caserne}
      />
    </div>
  );
}

export default App;
