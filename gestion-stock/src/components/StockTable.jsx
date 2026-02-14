import React, { useState, useEffect } from 'react';
import { db, CATEGORIES } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";

export default function StockTable() {
  const [produits, setProduits] = useState([]);
  const [filter, setFilter] = useState('Toutes');

  // Écoute en temps réel de Firebase
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
      // Optionnel : trier par nom
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
      <div style={{ marginBottom: '15px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        {['Toutes', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} 
            style={{ 
              padding: '6px 12px', borderRadius: '15px', border: 'none', cursor: 'pointer',
              background: filter === cat ? '#2563eb' : '#e2e8f0',
              color: filter === cat ? 'white' : '#475569'
            }}>
            {cat}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table width="100%" style={{ borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
              <th style={{padding: '10px'}}>Nom</th>
              <th>Qté</th>
              <th>Péremption</th>
              <th>Dern. Commande</th>
              <th>Remarques</th>
              <th>Modifié le</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {produits.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td><input type="text" value={p.nom} onChange={e => handleUpdate(p.id, 'nom', e.target.value)} style={inputStyle} /></td>
                <td><input type="number" value={p.quantite} onChange={e => handleUpdate(p.id, 'quantite', Number(e.target.value))} style={{width: '40px'}} /></td>
                
                {/* Péremption formatée MM/AAAA */}
                <td>
                  <input type="month" value={p.datePeremption} onChange={e => handleUpdate(p.id, 'datePeremption', e.target.value)} style={{border: 'none', fontSize: '11px'}} />
                  <div style={{fontSize: '10px', color: '#2563eb'}}>{formatPeremption(p.datePeremption)}</div>
                </td>

                <td><input type="date" value={p.datedernièreCommande} onChange={e => handleUpdate(p.id, 'datedernièreCommande', e.target.value)} style={{fontSize: '11px', border: 'none'}} /></td>
                
                <td><input type="text" value={p.Remarques} onChange={e => handleUpdate(p.id, 'Remarques', e.target.value)} style={inputStyle} /></td>
                
                <td style={{color: '#64748b'}}>{formatDateJJMM(p.dateModification)}</td>
                
                <td>
                  <button onClick={() => deleteDoc(doc(db, "produits", p.id))} style={{border: 'none', background: 'none', cursor: 'pointer'}}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle = { width: '90%', border: 'none', padding: '5px', background: 'transparent' };