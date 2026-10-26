import { useState } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from '../firebase';
import { STATUS, getStatus } from '../status';
import { getEmplacements, emplacementFor } from '../emplacements';
import Sheet, { Stepper } from './Sheet';

// Ajout (product = {}) ou modification d'un produit. Une seule écriture Firestore à l'enregistrement.
export default function ProductSheet({ product, caserne, config, defaultSac, defaultPlace, onClose }) {
  const isNew = !product.id;
  const [item, setItem] = useState(() => {
    const sac = product.sac ?? (config.sacs.includes(defaultSac) ? defaultSac : config.sacs[0]);
    return {
      nom: product.nom ?? '',
      sac,
      categorie: product.categorie ?? emplacementFor(config, sac, defaultPlace),
      quantite: product.quantite ?? 1,
      quantiteDemandee: product.quantiteDemandee ?? 1,
      datePeremption: product.datePeremption ?? '',
      Remarques: product.Remarques ?? '',
      commandeStatus: product.commandeStatus ?? 'non-commande',
    };
  });
  const [busy, setBusy] = useState(false);

  const set = (field) => (value) => setItem(i => ({ ...i, [field]: value }));
  const status = getStatus(item);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const data = {
      ...item,
      nom: item.nom.trim(),
      quantite: Number(item.quantite) || 0,
      quantiteDemandee: Number(item.quantiteDemandee) || 1,
      dateModification: new Date().toISOString(),
    };
    try {
      if (isNew) await addDoc(collection(db, "produits"), { ...data, caserne, createdAt: new Date() });
      else await updateDoc(doc(db, "produits", product.id), data);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Enregistrement impossible. Vérifiez la connexion.");
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Supprimer « ${product.nom} » définitivement ?`)) return;
    await deleteDoc(doc(db, "produits", product.id));
    onClose();
  };

  const withCurrent = (list, value) => (value && !list.includes(value) ? [...list, value] : list);

  return (
    <Sheet
      title={isNew ? 'Nouveau produit' : 'Modifier le produit'}
      onClose={onClose}
      footer={
        <>
          {!isNew && (
            <button type="button" className="btn btn-danger-ghost" onClick={handleDelete} aria-label="Supprimer">
              <span className="material-icons">delete</span>
            </button>
          )}
          <button type="submit" form="product-form" className="btn btn-primary btn-grow" disabled={busy}>
            <span className="material-icons">check</span>
            {isNew ? 'Ajouter' : 'Enregistrer'}
          </button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit}>
        {!isNew && (
          <div className={`status-banner st-${status}`}>
            <span className="material-icons">{STATUS[status].icon}</span>
            {STATUS[status].label}
          </div>
        )}

        <label className="field">
          <span>Nom du produit</span>
          <input
            value={item.nom} onChange={e => set('nom')(e.target.value)}
            placeholder="Ex : Pansements compressifs" required autoFocus={isNew}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Sac</span>
            <select value={item.sac} onChange={e => setItem(i => ({ ...i, sac: e.target.value, categorie: emplacementFor(config, e.target.value, i.categorie) }))}>
              {withCurrent(config.sacs, item.sac).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Emplacement</span>
            <select value={item.categorie} onChange={e => set('categorie')(e.target.value)}>
              {withCurrent(getEmplacements(config, item.sac), item.categorie).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>

        <div className="field-row">
          <div className="field">
            <span>Quantité présente</span>
            <Stepper value={item.quantite} onChange={set('quantite')} label="Quantité présente" />
          </div>
          <div className="field">
            <span>Quantité requise</span>
            <Stepper value={item.quantiteDemandee} onChange={set('quantiteDemandee')} min={1} label="Quantité requise" />
          </div>
        </div>

        <label className="field">
          <span>Date de péremption</span>
          <div className="input-with-action">
            <input type="month" value={item.datePeremption} onChange={e => set('datePeremption')(e.target.value)} />
            {item.datePeremption && (
              <button type="button" onClick={() => set('datePeremption')('')} aria-label="Pas de date">
                <span className="material-icons">close</span>
              </button>
            )}
          </div>
          <small>Facultatif. Le produit passe en « Périmé » dès ce mois-là.</small>
        </label>

        <label className="field">
          <span>Remarques</span>
          <textarea rows={2} value={item.Remarques} onChange={e => set('Remarques')(e.target.value)} placeholder="Facultatif" />
        </label>

        {!isNew && (
          <label className="switch-row">
            <span>
              <strong>Commandé</strong>
              <small>En attente de livraison</small>
            </span>
            <input
              type="checkbox" className="switch"
              checked={item.commandeStatus === 'commande'}
              onChange={e => set('commandeStatus')(e.target.checked ? 'commande' : 'recu')}
            />
          </label>
        )}
      </form>
    </Sheet>
  );
}
