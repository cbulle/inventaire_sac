import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { getTheme } from '../theme';

export default function ProductForm({ caserne, onProductAdded, isDarkMode = false }) {
  const [categories, setCategories] = useState([]);
  const [sacs, setSacs] = useState([]);
  const [item, setItem] = useState({ 
    nom: '', 
    categorie: '', 
    sac: '',
    quantite: 1, 
    quantiteDemandee: 1,
    datePeremption: '', 
    datederniereCommande: '', 
    Remarques: '',
    commandeStatus: 'non-commande'
  });
  const [isOpen, setIsOpen] = useState(false);
  const colors = getTheme(isDarkMode);

  // Charger les sacs et catégories
  useEffect(() => {
    if (!caserne) return;

    const loadConfig = async () => {
      try {
        const configRef = doc(db, "config", caserne);
        const configDoc = await getDoc(configRef);

        if (configDoc.exists()) {
          const data = configDoc.data();
          setCategories(data.categories || []);
          setSacs(data.sacs || []);
          
          if (data.sacs.length > 0) {
            setItem(prev => ({ ...prev, sac: data.sacs[0] }));
          }
          if (data.categories.length > 0) {
            setItem(prev => ({ ...prev, categorie: data.categories[0] }));
          }
        }
      } catch (error) {
        console.error("Erreur chargement config:", error);
      }
    };

    loadConfig();
  }, [caserne]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item.nom) {
      alert("Veuillez entrer un nom de produit");
      return;
    }

    try {
      await addDoc(collection(db, "produits"), {
        ...item,
        caserne,
        dateModification: new Date().toISOString(),
        dateCreation: new Date().toISOString()
      });

      setItem({ 
        nom: '', 
        categorie: categories[0] || '', 
        sac: sacs[0] || '',
        quantite: 1, 
        quantiteDemandee: 1, 
        datePeremption: '', 
        datederniereCommande: '', 
        Remarques: '',
        commandeStatus: 'non-commande'
      });
      setIsOpen(false);
      alert("Produit ajouté !");
      
      if (onProductAdded) onProductAdded();
    } catch (error) {
      console.error("Erreur Firebase :", error);
      alert("Erreur lors de l'ajout du produit");
    }
  };

  const inputStyle = { 
    padding: '12px', 
    borderRadius: '8px', 
    border: `1px solid ${colors.border}`, 
    fontSize: '14px', 
    width: '100%', 
    boxSizing: 'border-box',
    backgroundColor: colors.bg.secondary,
    color: colors.text.primary,
    transition: 'all 0.2s ease'
  };

  return (
    <div style={{
      marginBottom: '20px',
      '@media (max-width: 768px)': {
        marginBottom: '15px'
      }
    }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '10px',
          border: 'none',
          background: isOpen ? colors.text.secondary : colors.brand.primary,
          color: 'white',
          fontWeight: 'bold',
          marginBottom: isOpen ? '15px' : '0',
          cursor: 'pointer',
          fontSize: '16px',
          transition: 'all 0.2s ease',
          minHeight: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '@media (max-width: 768px)': {
            padding: '12px',
            fontSize: '14px',
            minHeight: '44px'
          }
        }}
      >
        {isOpen ? "✖ Annuler" : "➕ Ajouter un article"}
      </button>

      {isOpen && (
        <div style={{
          background: colors.bg.primary,
          padding: '20px',
          borderRadius: '15px',
          boxShadow: `0 4px 12px ${colors.shadow}`,
          border: `1px solid ${colors.border}`,
          '@media (max-width: 768px)': {
            padding: '15px',
            borderRadius: '12px'
          }
        }}>
          <h3 style={{
            marginTop: 0,
            color: colors.text.primary,
            fontSize: '18px',
            '@media (max-width: 768px)': {
              fontSize: '16px'
            }
          }}>
            Nouveau produit
          </h3>
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>

            <div>
              <label style={{
                fontSize: '12px',
                color: colors.text.secondary,
                fontWeight: 'bold',
                marginBottom: '4px',
                display: 'block'
              }}>
                Sac
              </label>
              <select 
                value={item.sac} 
                onChange={e => setItem({...item, sac: e.target.value})} 
                style={{
                  ...inputStyle,
                  background: colors.brand.light,
                  color: colors.brand.dark,
                  fontWeight: 'bold'
                }}
                required
              >
                <option value="">-- Sélectionnez un sac --</option>
                {sacs.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div>
              <label style={{
                fontSize: '12px',
                color: colors.text.secondary,
                fontWeight: 'bold',
                marginBottom: '4px',
                display: 'block'
              }}>
                Nom du produit
              </label>
              <input 
                placeholder="Ex: Bandage stérile" 
                value={item.nom} 
                onChange={e => setItem({...item, nom: e.target.value})} 
                style={inputStyle}
                required 
              />
            </div>
            
            <div>
              <label style={{
                fontSize: '12px',
                color: colors.text.secondary,
                fontWeight: 'bold',
                marginBottom: '4px',
                display: 'block'
              }}>
                Catégorie
              </label>
              <select 
                value={item.categorie} 
                onChange={e => setItem({...item, categorie: e.target.value})} 
                style={inputStyle}
                required
              >
                <option value="">-- Sélectionnez une catégorie --</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* Ligne des quantités */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              '@media (max-width: 768px)': {
                gridTemplateColumns: '1fr 1fr',
                gap: '10px'
              }
            }}>
              <div>
                <label style={{
                  fontSize: '11px',
                  color: colors.text.secondary,
                  fontWeight: 'bold',
                  display: 'block',
                  marginBottom: '4px'
                }}>
                  Qty Réelle
                </label>
                <input 
                  type="number" 
                  value={item.quantite} 
                  onChange={e => setItem({...item, quantite: Number(e.target.value)})} 
                  style={inputStyle}
                  min="0"
                />
              </div>
              <div>
                <label style={{
                  fontSize: '11px',
                  color: colors.text.secondary,
                  fontWeight: 'bold',
                  display: 'block',
                  marginBottom: '4px'
                }}>
                  Qty Attendue
                </label>
                <input 
                  type="number" 
                  value={item.quantiteDemandee} 
                  onChange={e => setItem({...item, quantiteDemandee: Number(e.target.value)})} 
                  style={inputStyle}
                  min="1"
                />
              </div>
            </div>

            {/* Dates */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              '@media (max-width: 768px)': {
                gridTemplateColumns: '1fr 1fr',
                gap: '10px'
              }
            }}>
              <div>
                <label style={{
                  fontSize: '11px',
                  color: colors.text.secondary,
                  fontWeight: 'bold',
                  display: 'block',
                  marginBottom: '4px'
                }}>
                  Péremption
                </label>
                <input 
                  type="month" 
                  value={item.datePeremption} 
                  onChange={e => setItem({...item, datePeremption: e.target.value})} 
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{
                  fontSize: '11px',
                  color: colors.text.secondary,
                  fontWeight: 'bold',
                  display: 'block',
                  marginBottom: '4px'
                }}>
                  Dernière commande
                </label>
                <input 
                  type="date" 
                  value={item.datederniereCommande} 
                  onChange={e => setItem({...item, datederniereCommande: e.target.value})} 
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Status de commande */}
            <div>
              <label style={{
                fontSize: '12px',
                color: colors.text.secondary,
                fontWeight: 'bold',
                marginBottom: '4px',
                display: 'block'
              }}>
                Status de commande
              </label>
              <select 
                value={item.commandeStatus} 
                onChange={e => setItem({...item, commandeStatus: e.target.value})} 
                style={{
                  ...inputStyle,
                  color: colors.brand.primary,
                  fontWeight: 'bold'
                }}
              >
                <option value="non-commande">❌ Non commandé</option>
                <option value="commande">📦 En commande</option>
                <option value="recu">✅ Reçu</option>
              </select>
            </div>

            {/* Remarques */}
            <div>
              <label style={{
                fontSize: '12px',
                color: colors.text.secondary,
                fontWeight: 'bold',
                marginBottom: '4px',
                display: 'block'
              }}>
                Remarques
              </label>
              <input 
                placeholder="Notes supplémentaires..." 
                value={item.Remarques} 
                onChange={e => setItem({...item, Remarques: e.target.value})} 
                style={inputStyle}
              />
            </div>
            
            <button 
              type="submit" 
              style={{
                background: colors.success,
                color: 'white',
                border: 'none',
                padding: '14px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'all 0.2s ease',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '@media (max-width: 768px)': {
                  padding: '12px',
                  fontSize: '14px',
                  minHeight: '44px'
                }
              }}
            >
              ✓ Enregistrer
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
