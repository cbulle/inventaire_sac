import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getTheme } from '../theme';

export default function CategorySacManager({ caserne, isDarkMode }) {
  const [categories, setCategories] = useState([]);
  const [sacs, setSacs] = useState([]);
  const [newVal, setNewVal] = useState('');
  const [activeTab, setActiveTab] = useState('sacs'); // 'sacs' ou 'categories'
  const colors = getTheme(isDarkMode);

  useEffect(() => {
    if (!caserne) return;
    getDoc(doc(db, "config", caserne)).then(d => {
      if(d.exists()) {
        setCategories(d.data().categories || []);
        setSacs(d.data().sacs || []);
      }
    });
  }, [caserne]);

  const handleAdd = async () => {
    if(!newVal.trim()) return;
    const isSac = activeTab === 'sacs';
    const updated = isSac ? [...sacs, newVal] : [...categories, newVal];
    
    await setDoc(doc(db, "config", caserne), {
      categories: isSac ? categories : updated,
      sacs: isSac ? updated : sacs
    }, { merge: true });

    if(isSac) setSacs(updated); else setCategories(updated);
    setNewVal('');
  };

  const handleDelete = async (item) => {
    if(!window.confirm(`Supprimer ${item} ?`)) return;
    const isSac = activeTab === 'sacs';
    const updated = (isSac ? sacs : categories).filter(i => i !== item);
    
    await setDoc(doc(db, "config", caserne), {
      categories: isSac ? categories : updated,
      sacs: isSac ? updated : sacs
    }, { merge: true });

    if(isSac) setSacs(updated); else setCategories(updated);
  };

  return (
    <div style={{background: colors.bg.primary, padding: 20, borderRadius: 16, border: `1px solid ${colors.border}`}}>
      <h3 style={{marginTop: 0, color: colors.text.primary}}>Configuration du materiel</h3>
      
      {/* Tabs */}
      <div style={{display:'flex', gap: 10, marginBottom: 15}}>
        <button onClick={() => setActiveTab('sacs')} style={{
          flex: 1, padding: 10, borderRadius: 8, border: 'none', cursor: 'pointer',
          background: activeTab === 'sacs' ? colors.brand.light : colors.bg.tertiary,
          color: activeTab === 'sacs' ? colors.brand.dark : colors.text.secondary, fontWeight: 'bold'
        }}>Sacs</button>
        <button onClick={() => setActiveTab('categories')} style={{
          flex: 1, padding: 10, borderRadius: 8, border: 'none', cursor: 'pointer',
          background: activeTab === 'categories' ? colors.brand.light : colors.bg.tertiary,
          color: activeTab === 'categories' ? colors.brand.dark : colors.text.secondary, fontWeight: 'bold'
        }}>Emplacement</button>
      </div>

      {/* Input */}
      <div style={{display:'flex', gap: 10, marginBottom: 15}}>
        <input 
          value={newVal} 
          onChange={e => setNewVal(e.target.value)} 
          placeholder={`Ajouter un(e) ${activeTab === 'sacs' ? 'Sac' : 'Catégorie'}...`}
          style={{
            flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${colors.border}`,
            background: colors.bg.secondary, color: colors.text.primary
          }}
        />
        <button onClick={handleAdd} style={{
          padding: '0 20px', borderRadius: 8, border: 'none', 
          background: colors.success, color: 'white', cursor: 'pointer', fontWeight:'bold'
        }}>Ajouter</button>
      </div>

      {/* Liste Chips */}
      <div style={{display:'flex', flexWrap:'wrap', gap: 8}}>
        {(activeTab === 'sacs' ? sacs : categories).map(item => (
          <div key={item} style={{
            padding: '6px 12px', borderRadius: 20, background: colors.bg.tertiary,
            color: colors.text.primary, fontSize: 13, display:'flex', alignItems:'center', gap: 8,
            border: `1px solid ${colors.border}`
          }}>
            {item}
            <span onClick={() => handleDelete(item)} style={{cursor:'pointer', color: colors.danger, fontWeight:'bold'}}>×</span>
          </div>
        ))}
      </div>
    </div>
  );
}