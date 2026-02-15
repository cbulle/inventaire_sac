import React, { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged } from "firebase/auth"; // Import auth
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from './firebase'; // Import auth depuis notre fichier

import ProductForm from './components/ProductForm';
import StockTable from './components/StockTable';
import { generatePDF } from './utils/pdfGenerator';

function App() {
  const [allProduits, setAllProduits] = useState([]);
  const [user, setUser] = useState(null); // Pour savoir si on est connecté
  const [loading, setLoading] = useState(true);

  // 1. Gestion de la connexion silencieuse
  useEffect(() => {
    // Tente de connecter l'utilisateur anonymement dès le lancement
    signInAnonymously(auth).catch((error) => {
      console.error("Erreur de connexion anonyme :", error);
    });

    // Surveille l'état de la connexion
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log("Connecté anonymement ! ID:", currentUser.uid);
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false); // Fini de charger
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Gestion des données (seulement si connecté)
  useEffect(() => {
    if (!user) return; // Si pas connecté, on ne charge pas les données

    const unsubscribeSnapshot = onSnapshot(collection(db, "produits"), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllProduits(docs);
    });

    return () => unsubscribeSnapshot();
  }, [user]); // Se relance quand l'utilisateur est confirmé

  // Affichage pendant le chargement de la "clé"
  if (loading) {
    return <div style={{padding: '20px', textAlign: 'center'}}>🔐 Connexion sécurisée au stock...</div>;
  }

  // Affichage principal
  return (
    <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{margin: 0}}>Stock Secours</h1>
        <button 
          onClick={() => generatePDF(allProduits)} 
          style={{ background: '#059669', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          📥 PDF
        </button>
      </header>
      
      <ProductForm />
      
      <hr style={{ margin: '30px 0', border: '0', borderTop: '1px solid #e2e8f0' }} />
      
      <StockTable />
    </div>
  );
}

export default App;