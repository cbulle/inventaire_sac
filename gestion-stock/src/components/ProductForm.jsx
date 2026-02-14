import React, { useState } from 'react';
import { db, CATEGORIES } from '../firebase';
import { collection, addDoc } from "firebase/firestore";

export default function ProductForm() {
  const [item, setItem] = useState({ 
    nom: '', 
    categorie: CATEGORIES[0], 
    quantite: 1, 
    datePeremption: '', // Stockera "YYYY-MM"
    datedernièreCommande: '', 
    Remarques: '' 
  });

  // État pour afficher ou masquer le formulaire sur mobile
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item.nom) return;

    try {
      await addDoc(collection(db, "produits"), {
        ...item,
        dateModification: new Date().toISOString()
      });

      setItem({ nom: '', categorie: CATEGORIES[0], quantite: 1, datePeremption: '', datedernièreCommande: '', Remarques: '' });
      setIsOpen(false); // On ferme le formulaire après l'ajout
      alert("Produit ajouté !");
    } catch (error) {
      console.error("Erreur Firebase :", error);
    }
  };

  // Styles communs pour les inputs mobiles
  const inputStyle = {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '16px', // Évite le zoom automatique forcé sur iPhone
    width: '100%',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Bouton pour alterner l'affichage du formulaire */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', 
          padding: '12px', 
          borderRadius: '10px', 
          border: 'none', 
          background: isOpen ? '#64748b' : '#2563eb', 
          color: 'white', 
          fontWeight: 'bold',
          marginBottom: isOpen ? '15px' : '0',
          cursor: 'pointer'
        }}
      >
        {isOpen ? "❌ Annuler" : "➕ Ajouter un article"}
      </button>

      {isOpen && (
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#1e293b' }}>Nouveau produit</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <input 
              placeholder="Nom de l'objet" 
              value={item.nom} 
              onChange={e => setItem({...item, nom: e.target.value})} 
              style={inputStyle}
              required 
            />
            
            <select 
              value={item.categorie} 
              onChange={e => setItem({...item, categorie: e.target.value})}
              style={inputStyle}
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{fontSize: '11px', color: '#64748b', fontWeight: 'bold'}}>Quantité</label>
                <input 
                  type="number" 
                  value={item.quantite} 
                  onChange={e => setItem({...item, quantite: Number(e.target.value)})} 
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{fontSize: '11px', color: '#64748b', fontWeight: 'bold'}}>Péremption</label>
                <input 
                  type="month" 
                  value={item.datePeremption} 
                  onChange={e => setItem({...item, datePeremption: e.target.value})} 
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={{fontSize: '11px', color: '#64748b', fontWeight: 'bold'}}>Dernière commande</label>
              <input 
                type="date" 
                value={item.datedernièreCommande} 
                onChange={e => setItem({...item, datedernièreCommande: e.target.value})} 
                style={inputStyle}
              />
            </div>

            <input 
              placeholder="Remarques (ex: taille, couleur...)" 
              value={item.Remarques} 
              onChange={e => setItem({...item, Remarques: e.target.value})} 
              style={inputStyle}
            />
            
            <button type="submit" style={{ 
              background: '#10b981', 
              color: 'white', 
              border: 'none', 
              padding: '15px', 
              borderRadius: '10px', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              fontSize: '16px',
              marginTop: '5px'
            }}>
              Enregistrer dans le sac
            </button>
          </form>
        </div>
      )}
    </div>
  );
}