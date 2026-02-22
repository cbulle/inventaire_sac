import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { getTheme } from '../theme';

export default function ProductForm({ caserne, isDarkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [sacs, setSacs] = useState([]);
  const colors = getTheme(isDarkMode);
  
  const [item, setItem] = useState({ 
    nom: '', categorie: '', sac: '',
    quantite: 1, quantiteDemandee: 1,
    datePeremption: '', commandeStatus: 'non-commande', Remarques: ''
  });

  useEffect(() => {
    if (!caserne) return;
    getDoc(doc(db, "config", caserne)).then(snap => {
      if(snap.exists()) {
        const d = snap.data();
        setCategories(d.categories || []);
        setSacs(d.sacs || []);
        // Pré-remplir avec les premières valeurs pour éviter les champs vides
        if(d.sacs?.length) setItem(i => ({...i, sac: d.sacs[0]}));
        if(d.categories?.length) setItem(i => ({...i, categorie: d.categories[0]}));
      }
    });
  }, [caserne]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  // On force la caserne provenant des props, l'utilisateur ne peut pas la changer
  const productData = {
    ...item,
    caserne: caserne, 
    createdAt: new Date()
  };
  await addDoc(collection(db, "produits"), productData);    setIsOpen(false);
    setItem(prev => ({...prev, nom: '', quantite: 1, Remarques: ''})); 
  };

  // Styles communs pour les inputs
  const inputStyle = {
    width: '100%', padding: '12px', borderRadius: '10px',
    border: `1px solid ${colors.border}`, background: colors.bg.secondary,
    color: colors.text.primary, boxSizing: 'border-box', fontSize: '14px', marginBottom: 15
  };

  const labelStyle = {
    display:'block', marginBottom: 5, fontSize: 12, fontWeight: 600, color: colors.text.secondary, textTransform:'uppercase'
  };

  return (
    <>
      {/* BOUTON FLOTTANT (FAB) */}
      <button 
        className="fab-btn"
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: 30, right: 30,
          width: 60, height: 60, borderRadius: 30,
          background: colors.brand.primary, color: 'white',
          border: 'none', boxShadow: colors.shadow,
          fontSize: 30, cursor: 'pointer', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        +
      </button>

      {/* MODALE */}
      {isOpen && (
        <div className="modal-overlay" 
             onClick={() => setIsOpen(false)}
             style={{
               position:'fixed', top:0, left:0, right:0, bottom:0,
               background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
               zIndex: 1100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
             }}>
             
          {/* Contenu de la modale (Style 'Sheet' sur mobile, centré sur desktop) */}
          <div className="modal-content"
               onClick={e => e.stopPropagation()}
               style={{
                 background: colors.bg.primary, width: '100%', maxWidth: 500,
                 borderRadius: '20px 20px 0 0', padding: 25,
                 maxHeight: '90vh', overflowY: 'auto',
                 '@media (min-width: 768px)': { borderRadius: 20, marginBottom: 20 }
               }}>
            
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20}}>
              <h2 style={{margin:0, color: colors.text.primary}}> Nouveau Produit</h2>
              <button onClick={() => setIsOpen(false)} style={{background:'none', border:'none', fontSize: 24, cursor:'pointer', color: colors.text.secondary}}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 15}}>
                <div>
                  <label style={labelStyle}>Sac / Emplacement</label>
                  <select style={inputStyle} value={item.sac} onChange={e => setItem({...item, sac: e.target.value})}>
                    {sacs.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                   <label style={labelStyle}>Emplacement</label>
                   <select style={inputStyle} value={item.categorie} onChange={e => setItem({...item, categorie: e.target.value})}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <label style={labelStyle}>Nom du produit</label>
              <input style={inputStyle} placeholder="Ex: Pansements compressifs" value={item.nom} onChange={e => setItem({...item, nom: e.target.value})} required />

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 15}}>
                <div>
                  <label style={labelStyle}>Quantité Actuelle</label>
                  <input type="number" style={inputStyle} value={item.quantite} onChange={e => setItem({...item, quantite: Number(e.target.value)})} />
                </div>
                <div>
                  <label style={labelStyle}>Quantité Requise</label>
                  <input type="number" style={inputStyle} value={item.quantiteDemandee} onChange={e => setItem({...item, quantiteDemandee: Number(e.target.value)})} />
                </div>
              </div>

              <label style={labelStyle}>Date de Péremption (Optionnel)</label>
              <input type="month" style={inputStyle} value={item.datePeremption} onChange={e => setItem({...item, datePeremption: e.target.value})} />

              <button type="submit" style={{
                width: '100%', padding: 15, borderRadius: 12,
                background: colors.brand.primary, color: 'white',
                border: 'none', fontWeight: 'bold', fontSize: 16, cursor: 'pointer', marginTop: 10
              }}>
                Ajouter au stock
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}