import React, { useState, useEffect } from 'react';
import { db, CATEGORIES, SACS } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";

export default function StockTable({ caserne }) {
  const [produits, setProduits] = useState([]);
  
  // --- ÉTATS DE FILTRES ---
  const [currentSac, setCurrentSac] = useState(SACS[0]); // Le sac sélectionné
  const [filter, setFilter] = useState('Toutes'); // La catégorie sélectionnée
  
  // --- ÉTATS DE TRI ET D'INTERFACE (Ceux qui manquaient !) ---
  const [sortBy, setSortBy] = useState('nom'); // 'nom', 'peremption', 'modif'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' ou 'desc'
  const [showSidebar, setShowSidebar] = useState(false); // Sidebar contrôle

  // 1. CHARGEMENT DES DONNÉES (Filtré par Caserne ET par Sac)
  useEffect(() => {
    if (!caserne) return;

    const q = query(
      collection(db, "produits"),
      where("caserne", "==", caserne),
      where("sac", "==", currentSac)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProduits(data);
    });

    return () => unsubscribe();
  }, [caserne, currentSac]); // On recharge si la caserne ou le sac change

  // 2. MISE À JOUR FIRESTORE
  const handleUpdate = async (id, field, value) => {
    const docRef = doc(db, "produits", id);
    await updateDoc(docRef, { [field]: value, dateModification: new Date().toISOString() });
  };

  // 3. LOGIQUE DE TRI
  const handleSort = (criteria) => {
    if (sortBy === criteria) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(criteria);
      setSortOrder('asc');
    }
  };

  const getSortedProduits = () => {
    // D'abord on filtre par catégorie (Pochette, etc.)
    const filtered = productosByCategory();

    // Ensuite on trie
    return [...filtered].sort((a, b) => {
      let valA = a[sortBy === 'peremption' ? 'datePeremption' : sortBy === 'modif' ? 'dateModification' : 'nom'];
      let valB = b[sortBy === 'peremption' ? 'datePeremption' : sortBy === 'modif' ? 'dateModification' : 'nom'];

      if (!valA) valA = '9999-99';
      if (!valB) valB = '9999-99';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const productosByCategory = () => {
    return produits.filter(p => filter === 'Toutes' || p.categorie === filter);
  };

  // 4. LOGIQUE SIDEBAR (Péremptions)
  const getExpiringProducts = () => {
    const grouped = {};
    produits.forEach(p => {
      if (p.datePeremption) {
        const key = p.datePeremption; 
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(p);
      }
    });
    return Object.keys(grouped).sort().map(date => ({
      date,
      products: grouped[date]
    }));
  };
  
  const formatMonthYear = (dateStr) => {
    const [year, month] = dateStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  return (
    <div>
      {/* --- ONGLET SACS --- */}
      <div style={{display:'flex', gap:'10px', marginBottom:'20px', borderBottom:'2px solid #e2e8f0', paddingBottom:'10px', overflowX:'auto'}}>
        {SACS.map(sac => (
            <button 
                key={sac} 
                onClick={() => setCurrentSac(sac)}
                style={{
                    padding:'10px 20px', 
                    border:'none', 
                    background: currentSac === sac ? '#1e40af' : 'transparent',
                    color: currentSac === sac ? 'white' : '#64748b',
                    borderRadius:'8px',
                    fontWeight:'bold',
                    cursor:'pointer',
                    whiteSpace: 'nowrap'
                }}
            >
                🎒 {sac}
            </button>
        ))}
      </div>

      {/* --- BARRE D'OUTILS (Catégories + Tris + Sidebar) --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
        
        {/* Filtres Catégories */}
        <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '5px', scrollbarWidth: 'none', maxWidth: '100%' }}>
          {['Toutes', ...CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{ 
              padding: '6px 12px', borderRadius: '15px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              background: filter === cat ? '#2563eb' : '#e2e8f0', color: filter === cat ? 'white' : '#475569', fontSize: '12px'
            }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Boutons d'actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '2px' }}>
            <button onClick={() => handleSort('nom')} style={sortBtnStyle(sortBy === 'nom')}>Abc</button>
            <button onClick={() => handleSort('peremption')} style={sortBtnStyle(sortBy === 'peremption')}>📅</button>
            <button onClick={() => handleSort('modif')} style={sortBtnStyle(sortBy === 'modif')}>🕒</button>
          </div>

          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            style={{ 
              background: showSidebar ? '#ef4444' : '#fff', border: '1px solid #ef4444', color: showSidebar ? 'white' : '#ef4444',
              padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            {showSidebar ? 'Fermer' : '⚠️'}
          </button>
        </div>
      </div>

      {/* --- CONTENU PRINCIPAL --- */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        
        {/* TABLEAU */}
        <div style={{ flex: 1, overflowX: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', background: 'white' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '11px', textAlign: 'left', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px' }}>Nom {sortBy === 'nom' && (sortOrder === 'asc' ? '↓' : '↑')}</th>
                <th style={{ padding: '10px' }}>Catégorie</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Qté (R/A)</th>
                <th style={{ padding: '10px' }}>Péremption {sortBy === 'peremption' && (sortOrder === 'asc' ? '↓' : '↑')}</th>
                <th style={{ padding: '10px' }}>Remarques</th>
                <th style={{ padding: '10px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {getSortedProduits().map(p => {
                const isLowStock = (p.quantite || 0) < (p.quantiteDemandee || 1);
                return (
                  <tr key={p.id} style={{ borderTop: '1px solid #f1f5f9', background: isLowStock ? '#fff1f2' : 'white' }}>
                    <td style={{ padding: '8px' }}>
                      <input type="text" value={p.nom} onChange={e => handleUpdate(p.id, 'nom', e.target.value)} style={inputTransparent} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select value={p.categorie} onChange={e => handleUpdate(p.id, 'categorie', e.target.value)} style={{ ...inputTransparent, color: '#2563eb', fontWeight: 'bold', fontSize: '12px' }}>
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                        <input type="number" value={p.quantite} onChange={e => handleUpdate(p.id, 'quantite', Number(e.target.value))} style={qtyInput} />
                        <span style={{ color: '#cbd5e1' }}>/</span>
                        <input type="number" value={p.quantiteDemandee || 1} onChange={e => handleUpdate(p.id, 'quantiteDemandee', Number(e.target.value))} style={{...qtyInput, color: '#94a3b8', border: 'none'}} />
                      </div>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input type="month" value={p.datePeremption} onChange={e => handleUpdate(p.id, 'datePeremption', e.target.value)} style={inputTransparent} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input type="text" value={p.Remarques} onChange={e => handleUpdate(p.id, 'Remarques', e.target.value)} placeholder="..." style={{...inputTransparent, fontStyle: 'italic'}} />
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button onClick={() => deleteDoc(doc(db, "produits", p.id))} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
              {getSortedProduits().length === 0 && (
                  <tr>
                      <td colSpan="6" style={{textAlign:'center', padding:'20px', color:'#94a3b8'}}>Aucun produit dans ce sac pour cette catégorie.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* SIDEBAR */}
        {showSidebar && (
          <div style={{ 
            width: '280px', 
            background: 'white', 
            padding: '15px', 
            borderRadius: '10px', 
            boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
            border: '2px solid #fee2e2',
            height: 'fit-content'
          }}>
            <h4 style={{ marginTop: 0, color: '#b91c1c', borderBottom: '1px solid #fee2e2', paddingBottom: '10px' }}>⚠️ Contrôle Péremption</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {getExpiringProducts().map(group => (
                <div key={group.date}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>
                    {formatMonthYear(group.date)}
                  </div>
                  {group.products.map(p => (
                    <div key={p.id} style={{ 
                      fontSize: '13px', padding: '8px', background: '#fef2f2', borderRadius: '6px', marginBottom: '5px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <span>{p.nom}</span>
                      <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{p.quantite}x</span>
                    </div>
                  ))}
                </div>
              ))}
              {getExpiringProducts().length === 0 && <div style={{color: '#10b981', fontSize: '13px'}}>Rien à signaler ! ✅</div>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// STYLES
const inputTransparent = { border: 'none', background: 'transparent', width: '100%', fontSize: '13px', padding: '4px', outline: 'none' };
const qtyInput = { width: '30px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px', fontSize: '12px' };
const sortBtnStyle = (isActive) => ({
  border: 'none', background: isActive ? 'white' : 'transparent', 
  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
  padding: '5px 10px', borderRadius: '6px', cursor: 'pointer',
  fontWeight: isActive ? 'bold' : 'normal', color: isActive ? '#2563eb' : '#64748b'
});