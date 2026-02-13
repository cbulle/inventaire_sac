import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, CATEGORIES } from '../db';

export default function StockTable() {
  const [filter, setFilter] = useState('Toutes');
  
  const produits = useLiveQuery(async () => {
    let query = filter === 'Toutes' ? db.produits : db.produits.where('categorie').equals(filter);
    return await query.toArray();
  }, [filter]);

  const handleUpdate = (id, field, value) => {
    db.produits.update(id, {
      [field]: value,
      dateModification: new Date().toISOString()
    });
  };

  // Format JJ/MM/AAAA
  const formatDateFull = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR');
  };

  // Format MM/AAAA (pour la péremption)
  const formatMonthYear = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { month: '2-digit', year: 'numeric' });
  };

  if (!produits) return <p>Chargement...</p>;

  return (
    <div>
      <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['Toutes', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} 
            style={{ 
              padding: '8px 15px', borderRadius: '20px', border: 'none', cursor: 'pointer', 
              background: filter === cat ? '#2563eb' : '#e2e8f0', 
              color: filter === cat ? 'white' : '#475569' 
            }}>
            {cat}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table width="100%" style={{ borderCollapse: 'collapse', background: 'white', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{padding: '12px'}}>Nom</th>
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
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td><input type="text" value={p.nom} onChange={e => handleUpdate(p.id, 'nom', e.target.value)} style={inputStyle} /></td>
                <td><input type="number" value={p.quantite} onChange={e => handleUpdate(p.id, 'quantite', Number(e.target.value))} style={{width: '45px', border: 'none'}} /></td>
                
                {/* Date péremption (Input date mais affichage formaté possible ou juste input) */}
                <td><input type="date" value={p.datePeremption} onChange={e => handleUpdate(p.id, 'datePeremption', e.target.value)} style={{fontSize: '11px'}} />
                    <div style={{fontSize: '10px', color: '#2563eb'}}>{formatMonthYear(p.datePeremption)}</div>
                </td>

                <td><input type="date" value={p.datedernièreCommande} onChange={e => handleUpdate(p.id, 'datedernièreCommande', e.target.value)} style={{fontSize: '11px'}} /></td>
                
                <td><input type="text" value={p.Remarques} onChange={e => handleUpdate(p.id, 'Remarques', e.target.value)} style={inputStyle} /></td>
                
                <td style={{color: '#64748b'}}>{formatDateFull(p.dateModification)}</td>
                
                <td><button onClick={() => db.produits.delete(p.id)} style={{border: 'none', background: 'none', cursor: 'pointer'}}>🗑️</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle = { width: '95%', border: 'none', padding: '5px', background: 'transparent' };