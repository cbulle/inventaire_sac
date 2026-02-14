import React, { useState, useEffect } from 'react';
import { db, CATEGORIES } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";

export default function StockTable() {
  const [produits, setProduits] = useState([]);
  const [filter, setFilter] = useState('Toutes');

  useEffect(() => {
    const baseQuery = collection(db, "produits");
    const q = filter === 'Toutes' 
      ? baseQuery 
      : query(baseQuery, where("categorie", "==", filter));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setProduits(data.sort((a, b) => a.nom.localeCompare(b.nom)));
    });

    return () => unsubscribe();
  }, [filter]);

  const handleUpdate = async (id, field, value) => {
    const docRef = doc(db, "produits", id);
    await updateDoc(docRef, {
      [field]: value,
      dateModification: new Date().toISOString()
    });
  };

  const formatDateJJMM = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const formatPeremption = (dateStr) => {
    if (!dateStr) return "-";
    const [year, month] = dateStr.split('-');
    return `${month}/${year}`;
  };

  return (
    <div>
      {/* Barre de filtres stylisée pour le pouce */}
      <div style={{ 
        marginBottom: '20px', 
        display: 'flex', 
        gap: '8px', 
        overflowX: 'auto', 
        paddingBottom: '10px',
        scrollbarWidth: 'none' // Cache la scrollbar sur Firefox
      }}>
        {['Toutes', ...CATEGORIES].map(cat => (
          <button 
            key={cat} 
            onClick={() => setFilter(cat)} 
            style={{ 
              padding: '8px 16px', 
              borderRadius: '20px', 
              border: 'none', 
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              backgroundColor: filter === cat ? '#2563eb' : '#e2e8f0',
              color: filter === cat ? 'white' : '#475569',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Liste de Cartes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {produits.map(p => (
          <div key={p.id} style={{
            background: 'white',
            borderRadius: '15px',
            padding: '15px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            borderLeft: `5px solid ${filter === 'Toutes' ? '#2563eb' : '#10b981'}`
          }}>
            
            {/* Ligne 1 : Titre et Quantité */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <input 
                type="text" 
                value={p.nom} 
                onChange={e => handleUpdate(p.id, 'nom', e.target.value)} 
                style={{ ...inputStyle, fontSize: '16px', fontWeight: 'bold', width: '60%' }} 
              />
              <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '8px', padding: '2px 8px' }}>
                <button onClick={() => handleUpdate(p.id, 'quantite', p.quantite - 1)} style={qtyBtn}>-</button>
                <span style={{ margin: '0 10px', fontWeight: 'bold' }}>{p.quantite}</span>
                <button onClick={() => handleUpdate(p.id, 'quantite', p.quantite + 1)} style={qtyBtn}>+</button>
              </div>
            </div>

            {/* Ligne 2 : Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Péremption</label>
                <input 
                  type="month" 
                  value={p.datePeremption} 
                  onChange={e => handleUpdate(p.id, 'datePeremption', e.target.value)} 
                  style={{ border: 'none', background: 'none', color: '#2563eb', fontWeight: '600', padding: 0 }} 
                />
                <div style={{fontWeight: 'bold'}}>{formatPeremption(p.datePeremption)}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Dern. Commande</label>
                <input 
                  type="date" 
                  value={p.datedernièreCommande} 
                  onChange={e => handleUpdate(p.id, 'datedernièreCommande', e.target.value)} 
                  style={{ border: 'none', background: 'none', fontWeight: '600', padding: 0 }} 
                />
              </div>
            </div>

            {/* Ligne 3 : Remarques */}
            <div style={{ marginBottom: '10px' }}>
              <input 
                type="text" 
                placeholder="Ajouter une remarque..." 
                value={p.Remarques} 
                onChange={e => handleUpdate(p.id, 'Remarques', e.target.value)} 
                style={{ ...inputStyle, fontStyle: 'italic', color: '#475569' }} 
              />
            </div>

            {/* Ligne 4 : Footer (Modif + Poubelle) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '10px', fontSize: '10px', color: '#94a3b8' }}>
              <span>Mis à jour le {formatDateJJMM(p.dateModification)}</span>
              <button 
                onClick={() => deleteDoc(doc(db, "produits", p.id))} 
                style={{ border: 'none', background: '#fee2e2', color: '#ef4444', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = { border: 'none', padding: '5px', background: 'transparent', width: '100%', outline: 'none' };
const qtyBtn = { border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', padding: '0 5px', color: '#2563eb', fontWeight: 'bold' };