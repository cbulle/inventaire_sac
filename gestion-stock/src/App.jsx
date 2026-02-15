import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; // Pour lire le profil utilisateur
import { auth, db } from './firebase';



import ProductForm from './components/ProductForm';
import StockTable from './components/StockTable';
import { generatePDF } from './utils/pdfGenerator';

function App() {
  const [user, setUser] = useState(null);
  const [caserne, setCaserne] = useState(null); // La caserne de l'utilisateur
  const [loading, setLoading] = useState(true);
  
  // États pour le formulaire de connexion
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // 1. L'utilisateur est connecté, on récupère sa fiche pour connaître sa caserne
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setCaserne(userDoc.data().caserne); // "Caserne Servas"
          setUser(currentUser);
        } else {
          alert("Erreur: Aucun profil assigné à ce compte. Contactez le développeur.");
          await signOut(auth); // On le déconnecte par sécurité
        }
      } else {
        setUser(null);
        setCaserne(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
    

  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .catch(err => setLoginError("Email ou mot de passe incorrect"));
  };

  if (loading) return <div style={{padding:20}}>Chargement...</div>;

  // Si pas connecté : Afficher le formulaire de login
  if (!user) {
    return (
      <div style={{maxWidth: '300px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px'}}>
        <h2>🚒 Connexion</h2>
        <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:'10px'}}>
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{padding:8}} />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)} style={{padding:8}} />
          <button type="submit" style={{padding:10, background:'#2563eb', color:'white', border:'none', borderRadius:4}}>Se connecter</button>
          {loginError && <p style={{color:'red'}}>{loginError}</p>}
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
           <h1 style={{margin: 0}}>📦 Stock : {caserne}</h1>
           <small style={{color: '#666'}}>Connecté : {user.email}</small>
        </div>
        <div style={{display:'flex', gap:'10px'}}>
            <button onClick={() => signOut(auth)} style={{background: '#64748b', color:'white', border:'none', padding:'8px 12px', borderRadius:'6px'}}>Déconnexion</button>
        </div>
      </header>
      
      {/* On passe la caserne en "props" pour que les composants sachent où écrire/lire */}
      <ProductForm caserne={caserne} />
      <hr style={{ margin: '30px 0', border: '0', borderTop: '1px solid #e2e8f0' }} />
      <StockTable caserne={caserne} />
    </div>

    
  );


}

export default App;