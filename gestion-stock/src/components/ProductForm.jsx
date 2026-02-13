import React, { useState } from 'react';
import { db, CATEGORIES } from '../db';

export default function ProductForm() {
  const [item, setItem] = useState({ 
    nom: '', 
    categorie: CATEGORIES[0], 
    quantite: 1, 
    datePeremption: '',
    datedernièreCommande: '',
    Remarques: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item.nom) return;

    const now = new Date().toISOString();
    
    await db.produits.add({
      ...item,
      dateModification: now
    });

    // Reset complet
    setItem({ nom: '', categorie: CATEGORIES[0], quantite: 1, datePeremption: '', datedernièreCommande: '', Remarques: '' });
  };

  return (
    <div style={{ background: '#f0f4f8', padding: '20px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <h3 style={{ marginTop: 0 }}>➕ Nouveau Produit</h3>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <input placeholder="Nom du produit" value={item.nom} onChange={e => setItem({...item, nom: e.target.value})} required />
        
        <select value={item.categorie} onChange={e => setItem({...item, categorie: e.target.value})}>
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        <input type="number" placeholder="Qté" value={item.quantite} onChange={e => setItem({...item, quantite: Number(e.target.value)})} />
        
        <div>
        <label style={{fontSize: '11px', display: 'block'}}>Péremption (Mois/Année)</label>
        <input 
          type="month" 
          value={item.datePeremption} 
          onChange={e => setItem({...item, datePeremption: e.target.value})} 
        />
      </div>

        <div>
          <label style={{fontSize: '11px', display: 'block'}}>Dernière commande</label>
          <input type="date" value={item.datedernièreCommande} onChange={e => setItem({...item, datedernièreCommande: e.target.value})} />
        </div>

        <input placeholder="Remarques (ex: marque, taille...)" value={item.Remarques} onChange={e => setItem({...item, Remarques: e.target.value})} />
        
        <button type="submit" style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Enregistrer</button>
      </form>
    </div>
  );
}