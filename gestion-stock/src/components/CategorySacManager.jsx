import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getTheme } from '../theme';

export default function CategorySacManager({ caserne, onUpdate, isDarkMode = false }) {
  const [categories, setCategories] = useState([]);
  const [sacs, setSacs] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newSac, setNewSac] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSacForm, setShowSacForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const colors = getTheme(isDarkMode);

  // Charger les données depuis Firestore
  useEffect(() => {
    if (!caserne) return;

    const loadData = async () => {
      try {
        const configRef = doc(db, "config", caserne);
        const configDoc = await getDoc(configRef);

        if (configDoc.exists()) {
          const data = configDoc.data();
          setCategories(data.categories || []);
          setSacs(data.sacs || []);
        } else {
          const defaultData = {
            categories: ["Pochette Haute ext", "Pochette Basse ext", "Poche divers"],
            sacs: ["Sac 1", "Sac 2", "Sac 3"]
          };
          await setDoc(configRef, defaultData);
          setCategories(defaultData.categories);
          setSacs(defaultData.sacs);
        }
      } catch (error) {
        console.error("Erreur chargement config:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [caserne]);

  // Sauvegarder dans Firestore
  const saveToFirestore = async (newCategories, newSacs) => {
    try {
      const configRef = doc(db, "config", caserne);
      await setDoc(configRef, {
        categories: newCategories,
        sacs: newSacs,
        dateModification: new Date().toISOString()
      });
      if (onUpdate) onUpdate(newCategories, newSacs);
    } catch (error) {
      console.error("Erreur sauvegarde config:", error);
      alert("Erreur lors de la sauvegarde");
    }
  };

  // Ajouter une catégorie
  const addCategory = async () => {
    if (!newCategory.trim()) {
      alert("Veuillez entrer un nom de catégorie");
      return;
    }
    if (categories.includes(newCategory)) {
      alert("Cette catégorie existe déjà");
      return;
    }
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    await saveToFirestore(updatedCategories, sacs);
    setNewCategory('');
    setShowCategoryForm(false);
  };

  // Supprimer une catégorie
  const deleteCategory = async (cat) => {
    if (window.confirm(`Supprimer la catégorie "${cat}" ?`)) {
      const updatedCategories = categories.filter(c => c !== cat);
      setCategories(updatedCategories);
      await saveToFirestore(updatedCategories, sacs);
    }
  };

  // Ajouter un sac
  const addSac = async () => {
    if (!newSac.trim()) {
      alert("Veuillez entrer un nom de sac");
      return;
    }
    if (sacs.includes(newSac)) {
      alert("Ce sac existe déjà");
      return;
    }
    const updatedSacs = [...sacs, newSac];
    setSacs(updatedSacs);
    await saveToFirestore(categories, updatedSacs);
    setNewSac('');
    setShowSacForm(false);
  };

  // Supprimer un sac
  const deleteSac = async (sac) => {
    if (window.confirm(`Supprimer le sac "${sac}" ?`)) {
      const updatedSacs = sacs.filter(s => s !== sac);
      setSacs(updatedSacs);
      await saveToFirestore(categories, updatedSacs);
    }
  };

  if (loading) return (
    <div style={{
      padding: '20px',
      textAlign: 'center',
      color: colors.text.secondary
    }}>
      Chargement de la configuration...
    </div>
  );

  const inputStyle = {
    padding: '10px',
    borderRadius: '6px',
    border: `1px solid ${colors.border}`,
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: colors.bg.secondary,
    color: colors.text.primary
  };

  const btnStyle = (variant = 'primary') => {
    const variants = {
      primary: {
        background: colors.brand.primary,
        color: 'white'
      },
      danger: {
        background: colors.danger,
        color: 'white'
      },
      success: {
        background: colors.success,
        color: 'white'
      },
      secondary: {
        background: colors.bg.tertiary,
        color: colors.text.primary
      }
    };

    return {
      padding: '8px 12px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '13px',
      transition: 'all 0.2s ease',
      minHeight: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...variants[variant]
    };
  };

  return (
    <div style={{
      background: colors.bg.primary,
      padding: '20px',
      borderRadius: '10px',
      border: `2px solid ${colors.brand.primary}`,
      boxShadow: `0 4px 12px ${colors.shadow}`,
      '@media (max-width: 768px)': {
        padding: '15px'
      }
    }}>
      <h3 style={{
        margin: '0 0 20px 0',
        color: colors.brand.primary,
        fontSize: '18px',
        '@media (max-width: 768px)': {
          fontSize: '16px'
        }
      }}>
        ⚙️ Configuration des Sacs et Catégories
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        '@media (max-width: 768px)': {
          gridTemplateColumns: '1fr',
          gap: '15px'
        }
      }}>
        {/* Section SACS */}
        <div>
          <h4 style={{
            margin: '0 0 12px 0',
            color: colors.text.primary,
            fontSize: '14px'
          }}>
            🎒 Sacs ({sacs.length})
          </h4>
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '12px'
          }}>
            {sacs.map(sac => (
              <div
                key={sac}
                style={{
                  background: colors.bg.secondary,
                  padding: '8px 12px',
                  borderRadius: '20px',
                  border: `2px solid ${colors.brand.primary}`,
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  fontSize: '13px',
                  color: colors.text.primary
                }}
              >
                <span>{sac}</span>
                <button
                  onClick={() => deleteSac(sac)}
                  style={{
                    ...btnStyle('danger'),
                    padding: '2px 6px',
                    fontSize: '12px',
                    minHeight: 'auto'
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {!showSacForm && (
            <button
              onClick={() => setShowSacForm(true)}
              style={{
                ...btnStyle('primary'),
                width: '100%'
              }}
            >
              ➕ Ajouter un sac
            </button>
          )}

          {showSacForm && (
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '10px',
              flexDirection: 'column',
              '@media (min-width: 768px)': {
                flexDirection: 'row'
              }
            }}>
              <input
                type="text"
                placeholder="Nom du sac"
                value={newSac}
                onChange={e => setNewSac(e.target.value)}
                style={{
                  ...inputStyle,
                  flex: 1,
                  minHeight: '44px'
                }}
                onKeyPress={e => e.key === 'Enter' && addSac()}
              />
              <button
                onClick={addSac}
                style={{
                  ...btnStyle('success'),
                  flex: '0 0 auto',
                  minWidth: '100px'
                }}
              >
                Ajouter
              </button>
              <button
                onClick={() => {
                  setShowSacForm(false);
                  setNewSac('');
                }}
                style={{
                  ...btnStyle('secondary'),
                  flex: '0 0 auto',
                  minWidth: '100px'
                }}
              >
                Annuler
              </button>
            </div>
          )}
        </div>

        {/* Section CATÉGORIES */}
        <div>
          <h4 style={{
            margin: '0 0 12px 0',
            color: colors.text.primary,
            fontSize: '14px'
          }}>
            📂 Catégories ({categories.length})
          </h4>
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '12px'
          }}>
            {categories.map(cat => (
              <div
                key={cat}
                style={{
                  background: colors.bg.secondary,
                  padding: '8px 12px',
                  borderRadius: '20px',
                  border: `2px solid #7c3aed`,
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  fontSize: '13px',
                  color: colors.text.primary
                }}
              >
                <span>{cat}</span>
                <button
                  onClick={() => deleteCategory(cat)}
                  style={{
                    ...btnStyle('danger'),
                    padding: '2px 6px',
                    fontSize: '12px',
                    minHeight: 'auto'
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {!showCategoryForm && (
            <button
              onClick={() => setShowCategoryForm(true)}
              style={{
                ...btnStyle('primary'),
                width: '100%'
              }}
            >
              ➕ Ajouter une catégorie
            </button>
          )}

          {showCategoryForm && (
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '10px',
              flexDirection: 'column',
              '@media (min-width: 768px)': {
                flexDirection: 'row'
              }
            }}>
              <input
                type="text"
                placeholder="Nom de la catégorie"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                style={{
                  ...inputStyle,
                  flex: 1,
                  minHeight: '44px'
                }}
                onKeyPress={e => e.key === 'Enter' && addCategory()}
              />
              <button
                onClick={addCategory}
                style={{
                  ...btnStyle('success'),
                  flex: '0 0 auto',
                  minWidth: '100px'
                }}
              >
                Ajouter
              </button>
              <button
                onClick={() => {
                  setShowCategoryForm(false);
                  setNewCategory('');
                }}
                style={{
                  ...btnStyle('secondary'),
                  flex: '0 0 auto',
                  minWidth: '100px'
                }}
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
