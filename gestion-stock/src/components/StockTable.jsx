import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import SearchBar from './SearchBar';
import { getTheme } from '../theme';

export default function StockTable({ caserne, isDarkMode, produits: initialProduits = [] }) {
  const [produits, setProduits] = useState(initialProduits);
  const [categories, setCategories] = useState([]);
  const [sacs, setSacs] = useState([]);
  const [currentSac, setCurrentSac] = useState('');
  const [filter, setFilter] = useState('Toutes');
  const [sortBy, setSortBy] = useState('nom');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCommandePanel, setShowCommandePanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Nouveaux états pour la modale de réception de commande
  const [receivingItem, setReceivingItem] = useState(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [newPeremption, setNewPeremption] = useState('');

  const colors = getTheme(isDarkMode);

  // Charger la configuration
  useEffect(() => {
    if (!caserne) return;

    const configRef = doc(db, "config", caserne);
    const unsubscribe = onSnapshot(configRef, (configDoc) => {
      if (configDoc.exists()) {
        const data = configDoc.data();
        setCategories(data.categories || []);
        setSacs(data.sacs || []);
        if (data.sacs && data.sacs.length > 0 && !currentSac) {
          setCurrentSac(data.sacs[0]);
        }
      }
    }, error => console.error("Erreur snapshot config:", error));

    return () => unsubscribe();
  }, [caserne]);

  // Charger les produits
  useEffect(() => {
    if (initialProduits.length > 0) {
      setProduits(initialProduits);
      return;
    }

    if (!caserne || !currentSac) return;

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
  }, [caserne, currentSac, initialProduits]);

  // Mise à jour Firestore
  const handleUpdate = async (id, field, value) => {
    const docRef = doc(db, "produits", id);
    await updateDoc(docRef, { [field]: value, dateModification: new Date().toISOString() });
  };

  // Validation de la réception de commande depuis la modale
  const handleConfirmReceive = async (e) => {
    e.preventDefault();
    if (!receivingItem) return;

    const docRef = doc(db, "produits", receivingItem.id);
    await updateDoc(docRef, {
      commandeStatus: 'recu',
      quantite: Number(newQuantity),
      datePeremption: newPeremption,
      dateModification: new Date().toISOString()
    });

    setReceivingItem(null); // Ferme la modale
  };

  // Logique de tri
  const handleSort = (criteria) => {
    if (sortBy === criteria) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(criteria);
      setSortOrder('asc');
    }
  };

  // Filtrer par catégorie et recherche
  const productsByCategory = () => {
    return produits.filter(p => 
      (filter === 'Toutes' || p.categorie === filter) &&
      (p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       p.Remarques?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // Trier les produits
  const getSortedProduits = () => {
    const filtered = productsByCategory();

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

  // Vérifier si un produit est périmé (mois actuel ou passé)
  const isProductExpired = (dateStr) => {
    if (!dateStr) return false;
    const [year, month] = dateStr.split('-');
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    return parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) <= currentMonth);
  };

  // Produits à commander
  const getProductsToOrder = () => {
    const grouped = {};
    const productsNeedingOrder = produits.filter(p => {
      const isLowStock = (p.quantite || 0) < (p.quantiteDemandee || 1);
      const isExpired = isProductExpired(p.datePeremption);
      
      // Si le stock est bas OU que c'est périmé, et que ce n'est pas déjà reçu
      return (isLowStock || isExpired) && p.commandeStatus !== 'recu';
    });

    productsNeedingOrder.forEach(p => {
      const status = p.commandeStatus || 'non-commande';
      if (!grouped[status]) grouped[status] = [];
      grouped[status].push(p);
    });

    return grouped;
  };

  const formatMonthYear = (dateStr) => {
    if (!dateStr) return 'N/A';
    const [year, month] = dateStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  // Style partagé pour les inputs de la modale
  const inputStyle = {
    width: '100%', padding: '12px', borderRadius: '8px',
    border: `1px solid ${colors.border}`, background: colors.bg.secondary,
    color: colors.text.primary, boxSizing: 'border-box', fontSize: '14px', marginBottom: '15px'
  };

  return (
    <div>
      {/* BARRE DE RECHERCHE */}
      <div style={{ marginBottom: '20px', '@media (max-width: 768px)': { marginBottom: '15px' } }}>
        <SearchBar onSearch={setSearchTerm} isDarkMode={isDarkMode} placeholder="Rechercher un produit..." />
      </div>

      {/* ONGLET SACS */}
      <div style={{
        display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: `2px solid ${colors.border}`,
        paddingBottom: '10px', overflowX: 'auto', scrollbarWidth: 'none'
      }}>
        {sacs.map(sac => (
          <button 
            key={sac} onClick={() => setCurrentSac(sac)}
            style={{
              padding: '10px 16px', border: 'none',
              background: currentSac === sac ? colors.brand.primary : 'transparent',
              color: currentSac === sac ? 'white' : colors.text.secondary,
              borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap',
              fontSize: '14px', transition: 'all 0.2s ease'
            }}
          >
            {sac}
          </button>
        ))}
      </div>

      {/* BARRE D'OUTILS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
        {/* Filtres Catégories */}
        <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '5px', scrollbarWidth: 'none', flex: '1 1 auto', minWidth: '0' }}>
          {['Toutes', ...categories].map(cat => (
            <button 
              key={cat} onClick={() => setFilter(cat)} 
              style={{
                padding: '6px 12px', borderRadius: '15px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                background: filter === cat ? colors.brand.primary : colors.bg.tertiary,
                color: filter === cat ? 'white' : colors.text.secondary,
                fontSize: '12px', fontWeight: filter === cat ? 'bold' : 'normal', transition: 'all 0.2s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Boutons d'actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ display: 'flex', background: colors.bg.tertiary, borderRadius: '8px', padding: '2px', gap: '2px' }}>
            <button onClick={() => handleSort('nom')} 
              style={{ border: 'none', background: sortBy === 'nom' ? colors.bg.primary : 'transparent', color: sortBy === 'nom' ? colors.brand.primary : colors.text.secondary, padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: sortBy === 'nom' ? 'bold' : 'normal', fontSize: '12px' }} title="Trier par nom">Abc</button>
            <button onClick={() => handleSort('peremption')} 
              style={{ border: 'none', background: sortBy === 'peremption' ? colors.bg.primary : 'transparent', color: sortBy === 'peremption' ? colors.brand.primary : colors.text.secondary, padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: sortBy === 'peremption' ? 'bold' : 'normal', fontSize: '12px' }} title="Trier par péremption"><i className="material-icons">date_range</i></button>
          </div>

          <button onClick={() => setShowSidebar(!showSidebar)}
            style={{ background: showSidebar ? colors.danger : colors.bg.primary, border: `1px solid ${colors.danger}`, color: showSidebar ? 'white' : colors.danger, padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', whiteSpace: 'nowrap', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Afficher/masquer les péremptions">
            {showSidebar ? 'Fermer' : '⚠️'}
          </button>

          <button onClick={() => setShowCommandePanel(!showCommandePanel)}
            style={{ background: showCommandePanel ? colors.warning : colors.bg.primary, border: `1px solid ${colors.warning}`, color: showCommandePanel ? 'white' : colors.warning, padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', whiteSpace: 'nowrap', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Afficher/masquer les commandes">
            {showCommandePanel ? 'Fermer' : '📦'}
          </button>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr', gap: '20px',
        '@media (min-width: 1200px)': { gridTemplateColumns: showSidebar || showCommandePanel ? '1fr 300px' : '1fr' }
      }}>
        
        {/* TABLEAU */}
        <div style={{ overflowX: 'auto', borderRadius: '10px', boxShadow: `0 2px 8px ${colors.shadow}`, backgroundColor: colors.bg.primary }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: colors.bg.tertiary, color: colors.text.secondary, fontSize: '11px', textAlign: 'left', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px', minWidth: '150px' }}>Nom {sortBy === 'nom' && (sortOrder === 'asc' ? '↓' : '↑')}</th>
                <th style={{ padding: '12px', minWidth: '100px' }}>Catégorie</th>
                <th style={{ padding: '12px', textAlign: 'center', minWidth: '90px' }}>Qty (R/A)</th>
                <th style={{ padding: '12px', minWidth: '120px' }}>Péremption {sortBy === 'peremption' && (sortOrder === 'asc' ? '↓' : '↑')}</th>
                <th style={{ padding: '12px', minWidth: '100px' }}>Commande</th>
                <th style={{ padding: '12px', minWidth: '200px' }}>Remarques</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {getSortedProduits().map(p => {
                const isLowStock = (p.quantite || 0) < (p.quantiteDemandee || 1);
                const isExpired = isProductExpired(p.datePeremption);
                let effectiveStatus = p.commandeStatus || 'non-commande';
                
                const commandeStatusColor = {
                  'recu': isDarkMode ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                  'commande': isDarkMode ? 'rgba(251, 191, 36, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                  'non-commande': isDarkMode ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)'
                };
                
                return (
                  <tr key={p.id} style={{
                      borderTop: `1px solid ${colors.border}`,
                      background: (isLowStock || isExpired) && effectiveStatus !== 'recu' ? commandeStatusColor[effectiveStatus] : colors.bg.primary,
                      transition: 'all 0.2s ease'
                    }}>
                    <td style={{ padding: '10px' }}>
                      <textarea 
                        value={p.nom} onChange={e => handleUpdate(p.id, 'nom', e.target.value)} 
                        rows={1}
                        style={{
                          border: 'none', background: 'transparent', width: '100%', fontSize: '13px',
                          padding: '4px', outline: 'none', color: colors.text.primary,
                          resize: 'vertical', minHeight: '30px', fontFamily: 'inherit', overflow: 'hidden'
                        }}
                      />
                    </td>
                    <td style={{ padding: '10px' }}>
                      <select value={p.categorie} onChange={e => handleUpdate(p.id, 'categorie', e.target.value)} 
                        style={{ border: 'none', background: 'transparent', color: colors.brand.primary, fontWeight: 'bold', fontSize: '12px', width: '100%' }}>
                        <option value="">--</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                        <input type="number" value={p.quantite} onChange={e => handleUpdate(p.id, 'quantite', Number(e.target.value))} 
                          style={{ width: '35px', textAlign: 'center', fontWeight: 'bold', border: `1px solid ${colors.border}`, borderRadius: '4px', padding: '4px 2px', fontSize: '12px', backgroundColor: colors.bg.secondary, color: colors.text.primary }} />
                        <span style={{ color: colors.text.light }}>/</span>
                        <input type="number" value={p.quantiteDemandee || 1} onChange={e => handleUpdate(p.id, 'quantiteDemandee', Number(e.target.value))} 
                          style={{ width: '35px', textAlign: 'center', border: 'none', background: 'transparent', color: colors.text.light, fontWeight: 'bold', fontSize: '12px' }} />
                      </div>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <input type="month" value={p.datePeremption} onChange={e => handleUpdate(p.id, 'datePeremption', e.target.value)} 
                        style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '12px', padding: '4px', color: isExpired ? colors.danger : colors.text.primary, fontWeight: isExpired ? 'bold' : 'normal' }} />
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <select value={effectiveStatus} onChange={e => handleUpdate(p.id, 'commandeStatus', e.target.value)} 
                        style={{ border: 'none', background: 'transparent', color: colors.brand.primary, fontWeight: 'bold', fontSize: '11px', padding: '2px', width: '100%' }}>
                        <option value="non-commande">A commander</option>
                        <option value="commande">En commande</option>
                        <option value="recu">Reçu</option>
                      </select>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <textarea 
                        value={p.Remarques} onChange={e => handleUpdate(p.id, 'Remarques', e.target.value)} 
                        placeholder="..." rows={1}
                        style={{
                          border: 'none', background: 'transparent', width: '100%', fontSize: '12px',
                          padding: '4px', fontStyle: 'italic', color: colors.text.primary,
                          resize: 'vertical', minHeight: '30px', fontFamily: 'inherit'
                        }}
                      />
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <button onClick={() => deleteDoc(doc(db, "produits", p.id))} 
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', padding: '6px', borderRadius: '6px', transition: 'all 0.2s ease', color: colors.danger }} title="Supprimer">
                        <i className="material-icons">delete</i>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {getSortedProduits().length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: colors.text.secondary }}>
                    {searchTerm ? `Aucun produit trouvé pour "${searchTerm}"` : 'Aucun produit dans ce sac pour cette catégorie.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* SIDEBARS - RESPONSIVE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', '@media (min-width: 1200px)': { display: showSidebar || showCommandePanel ? 'flex' : 'none' } }}>
          
          {/* SIDEBAR PÉREMPTION */}
          {showSidebar && (
            <div style={{ backgroundColor: colors.bg.primary, padding: '15px', borderRadius: '10px', boxShadow: `0 2px 8px ${colors.shadow}`, border: `2px solid ${colors.danger}`, maxHeight: '600px', overflowY: 'auto' }}>
              <h4 style={{ marginTop: 0, color: colors.danger, borderBottom: `1px solid ${colors.border}`, paddingBottom: '10px' }}>⚠️ Contrôle Péremption</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {Object.keys(produits.reduce((acc, p) => {
                  if (p.datePeremption) {
                    const key = p.datePeremption;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(p);
                  }
                  return acc;
                }, {})).sort().map(date => (
                  <div key={date}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: isProductExpired(date) ? colors.danger : colors.text.secondary, marginBottom: '5px' }}>
                      {formatMonthYear(date)} {isProductExpired(date) && "(Périmé)"}
                    </div>
                    {produits.filter(p => p.datePeremption === date).map(p => (
                      <div key={p.id} style={{ fontSize: '13px', padding: '8px', background: isDarkMode ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{p.nom}</span>
                        <span style={{ fontWeight: 'bold', color: colors.danger }}>{p.quantite}x</span>
                      </div>
                    ))}
                  </div>
                ))}
                {produits.filter(p => p.datePeremption).length === 0 && (
                  <div style={{ color: colors.success, fontSize: '13px', textAlign: 'center', padding: '20px' }}>Aucune date de péremption définie !</div>
                )}
              </div>
            </div>
          )}

          {/* SIDEBAR COMMANDES */}
          {showCommandePanel && (
            <div style={{ backgroundColor: colors.bg.primary, padding: '15px', borderRadius: '10px', boxShadow: `0 2px 8px ${colors.shadow}`, border: `2px solid ${colors.warning}`, maxHeight: '600px', overflowY: 'auto' }}>
              <h4 style={{ marginTop: 0, color: colors.warning, borderBottom: `1px solid ${colors.border}`, paddingBottom: '10px' }}>📦 Commandes en cours</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {(() => {
                  const productsToOrder = getProductsToOrder();
                  const hasData = Object.keys(productsToOrder).some(status => productsToOrder[status].length > 0);

                  if (!hasData) {
                    return (
                      <div style={{ color: colors.success, fontSize: '13px', textAlign: 'center', padding: '20px' }}>Tout est à jour ! ✅</div>
                    );
                  }

                  const statusConfig = {
                    'non-commande': { color: colors.danger, bg: isDarkMode ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)', icon: '❌', label: 'À commander' },
                    'commande': { color: colors.warning, bg: isDarkMode ? 'rgba(251, 191, 36, 0.15)' : 'rgba(245, 158, 11, 0.1)', icon: '📦', label: 'En commande' }
                  };

                  return Object.keys(productsToOrder).map(status => (
                    <div key={status}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: statusConfig[status]?.color, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {statusConfig[status]?.icon} {statusConfig[status]?.label} ({productsToOrder[status].length})
                      </div>
                      {productsToOrder[status].map(p => {
                        const isExpired = isProductExpired(p.datePeremption);
                        return (
                          <div key={p.id} style={{ fontSize: '12px', padding: '10px', background: statusConfig[status]?.bg, borderRadius: '6px', marginBottom: '8px', border: `1px solid ${statusConfig[status]?.color}` }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{p.nom} {isExpired && '⚠️ (Périmé)'}</div>
                            <div style={{ fontSize: '11px', color: colors.text.secondary }}>Stock: {p.quantite} / {p.quantiteDemandee}</div>
                            <div style={{ fontSize: '11px', color: colors.text.secondary }}>Catégorie: {p.categorie}</div>
                            
                            {/* Bouton Commander */}
                            {status === 'non-commande' && (
                              <button onClick={() => handleUpdate(p.id, 'commandeStatus', 'commande')}
                                style={{ marginTop: '8px', padding: '6px 12px', background: colors.brand.primary, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', width: '100%', fontWeight: 'bold' }}>
                                Commander
                              </button>
                            )}
                            
                            {/* Bouton Commande Reçue qui ouvre la modale */}
                            {status === 'commande' && (
                              <button onClick={() => {
                                setReceivingItem(p);
                                // On pré-remplit la quantité avec la quantité demandée (qui est le but de la commande)
                                setNewQuantity(p.quantiteDemandee || 1);
                                setNewPeremption(''); // On vide pour forcer l'utilisateur à vérifier la nouvelle date
                              }}
                                style={{ marginTop: '8px', padding: '6px 12px', background: colors.success, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', width: '100%', fontWeight: 'bold' }}>
                                Commande reçue
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALE DE RÉCEPTION DE COMMANDE */}
      {receivingItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(3px)',
          zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: colors.bg.primary, padding: '25px', borderRadius: '16px',
            width: '90%', maxWidth: '400px', boxShadow: `0 10px 25px ${colors.shadow}`
          }}>
            <h3 style={{ marginTop: 0, color: colors.text.primary, marginBottom: '20px' }}>
              📦 Réception : {receivingItem.nom}
            </h3>
            
            <form onSubmit={handleConfirmReceive}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: colors.text.secondary, textTransform: 'uppercase' }}>
                  Nouvelle quantité totale en stock
                </label>
                <input 
                  type="number" 
                  value={newQuantity} 
                  onChange={(e) => setNewQuantity(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: colors.text.secondary, textTransform: 'uppercase' }}>
                  Nouvelle date de péremption
                </label>
                <input 
                  type="month" 
                  value={newPeremption} 
                  onChange={(e) => setNewPeremption(e.target.value)}
                  style={inputStyle}
                  // Le champ "required" ici force l'utilisateur à entrer la date du nouveau lot
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setReceivingItem(null)}
                  style={{
                    padding: '10px 15px', borderRadius: '8px', border: 'none',
                    background: colors.bg.tertiary, color: colors.text.primary, cursor: 'pointer', fontWeight: 'bold'
                  }}
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  style={{
                    padding: '10px 15px', borderRadius: '8px', border: 'none',
                    background: colors.success, color: 'white', cursor: 'pointer', fontWeight: 'bold'
                  }}
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}