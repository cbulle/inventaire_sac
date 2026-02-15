import React, { useState, useEffect } from 'react';
import { db, CATEGORIES } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";

export default function StockTable() {
  const [produits, setProduits] = useState([]);
  const [filter, setFilter] = useState('Toutes');

  useEffect(() => {
    const baseQuery = collection(db, "produits");
    const q = filter === 'Toutes' ? baseQuery : query(baseQuery, where("categorie", "==", filter));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProduits(data.sort((a, b) => a.nom.localeCompare(b.nom)));
    });
    return () => unsubscribe();
  }, [filter]);

  const handleUpdate = async (id, field, value) => {
    const docRef = doc(db, "produits", id);
    await updateDoc(docRef, { [field]: value, dateModification: new Date().toISOString() });
  };

  return (
    <div>
      {/* Filtres */}
      <div style={{ marginBottom: '15px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px', scrollbarWidth: 'none' }}>
        {['Toutes', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{ 
            padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            background: filter === cat ? '#2563eb' : '#e2e8f0', color: filter === cat ? 'white' : '#475569', fontWeight: '500'
          }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Tableau responsive avec scroll horizontal */}
      <div style={{ overflowX: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', minWidth: '800px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '12px', textAlign: 'left', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px' }}>Nom</th>
              <th style={{ padding: '12px' }}>Catégorie</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Qté (Réel / Attendu)</th>
              <th style={{ padding: '12px' }}>Péremption</th>
              <th style={{ padding: '12px' }}>Remarques</th>
              <th style={{ padding: '12px', width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {produits.map(p => {
              // Vérifie si le stock est bas
              const isLowStock = (p.quantite || 0) < (p.quantiteDemandee || 1);
              
              return (
                <tr key={p.id} style={{ borderTop: '1px solid #f1f5f9', background: isLowStock ? '#fff1f2' : 'white' }}>
                  
                  {/* NOM */}
                  <td style={{ padding: '8px' }}>
                    <input type="text" value={p.nom} onChange={e => handleUpdate(p.id, 'nom', e.target.value)} style={inputTransparent} />
                  </td>

                  {/* CATÉGORIE (Modifiable) */}
                  <td style={{ padding: '8px' }}>
                    <select value={p.categorie} onChange={e => handleUpdate(p.id, 'categorie', e.target.value)} style={{ ...inputTransparent, color: '#2563eb', fontWeight: 'bold' }}>
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </td>

                  {/* QUANTITÉ (Réel / Attendu) */}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                      <input 
                        type="number" value={p.quantite} 
                        onChange={e => handleUpdate(p.id, 'quantite', Number(e.target.value))} 
                        style={{ width: '40px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px' }} 
                      />
                      <span style={{ color: '#94a3b8' }}>/</span>
                      <input 
                        type="number" value={p.quantiteDemandee || 1} 
                        onChange={e => handleUpdate(p.id, 'quantiteDemandee', Number(e.target.value))} 
                        style={{ width: '40px', textAlign: 'center', background: 'transparent', border: 'none', color: '#64748b' }} 
                      />
                    </div>
                  </td>

                  {/* PÉREMPTION */}
                  <td style={{ padding: '8px' }}>
                    <input type="month" value={p.datePeremption} onChange={e => handleUpdate(p.id, 'datePeremption', e.target.value)} style={inputTransparent} />
                  </td>

                  {/* REMARQUES */}
                  <td style={{ padding: '8px' }}>
                    <input type="text" value={p.Remarques} onChange={e => handleUpdate(p.id, 'Remarques', e.target.value)} placeholder="..." style={{...inputTransparent, fontStyle: 'italic'}} />
                  </td>

                  {/* SUPPRIMER */}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <button onClick={() => deleteDoc(doc(db, "produits", p.id))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px' }}>🗑️</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputTransparent = { border: 'none', background: 'transparent', width: '100%', fontSize: '14px', padding: '4px', outline: 'none' };