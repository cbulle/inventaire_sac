import { useMemo, useState } from 'react';
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from '../firebase';
import { STATUS, STATUS_ORDER, ALL_SACS, getStatus, expiryLabel, isExpired, isLowStock } from '../status';
import { getEmplacements, allEmplacements, emplacementFor } from '../emplacements';
import Sheet, { Stepper } from './Sheet';

const SUMMARY = ['perime', 'manquant', 'bientot', 'commande'];
const NEEDS_ACTION = ['perime', 'manquant'];

const save = (id, fields) =>
  updateDoc(doc(db, "produits", id), { ...fields, dateModification: new Date().toISOString() });

// Enregistre un champ texte quand on quitte la case (une seule écriture, pas une par lettre)
const saveOnBlur = (p, field) => (e) => {
  if (e.target.value !== (p[field] ?? '')) save(p.id, { [field]: e.target.value });
};

const SORTS = {
  nom: (a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'),
  sac: (a, b, c) => c.sacs.indexOf(a.sac) - c.sacs.indexOf(b.sac),
  categorie: (a, b, c) => c.places.indexOf(a.categorie) - c.places.indexOf(b.categorie),
  peremption: (a, b) => (a.datePeremption || '9999-99').localeCompare(b.datePeremption || '9999-99'),
  statut: (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
};

export default function StockList({ produits, config, sac, setSac, place, setPlace, statusFilter, setStatusFilter }) {
  const [search, setSearch] = useState('');
  const [receiving, setReceiving] = useState(null);
  const [sortBy, setSortBy] = useState('nom');
  const [sortAsc, setSortAsc] = useState(true);

  const activeSac = sac === ALL_SACS || config.sacs.includes(sac) ? sac : ALL_SACS;

  const withStatus = useMemo(
    () => produits.map(p => ({ ...p, status: getStatus(p) })),
    [produits]
  );

  // Emplacements proposés : ceux du sac affiché, ou de tous les sacs
  const places = activeSac === ALL_SACS ? allEmplacements(config) : getEmplacements(config, activeSac);
  const activePlace = places.includes(place) ? place : null;

  const inSac = withStatus.filter(p =>
    (activeSac === ALL_SACS || p.sac === activeSac) && (!activePlace || p.categorie === activePlace)
  );

  const counts = {};
  inSac.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });

  // Sacs qui ont au moins un produit à traiter (pastille rouge sur l'onglet)
  const sacsAlert = new Set(withStatus.filter(p => NEEDS_ACTION.includes(p.status)).map(p => p.sac));

  const term = search.trim().toLowerCase();
  const rows = inSac
    .filter(p =>
      (!statusFilter || p.status === statusFilter) &&
      (!term || p.nom?.toLowerCase().includes(term) || p.Remarques?.toLowerCase().includes(term))
    )
    .sort((a, b) => {
      const r = SORTS[sortBy](a, b, { sacs: config.sacs, places: allEmplacements(config) }) || SORTS.nom(a, b);
      return sortAsc ? r : -r;
    });

  const handleSort = (key) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(true); }
  };

  const handleDelete = (p) => {
    if (window.confirm(`Supprimer « ${p.nom} » définitivement ?`)) deleteDoc(doc(db, "produits", p.id));
  };

  const allOk = SUMMARY.every(s => !counts[s]);
  const showSac = activeSac === ALL_SACS;

  const sortTh = (k, children, className) => (
    <th className={className}>
      <button onClick={() => handleSort(k)} className={sortBy === k ? 'is-sorted' : ''}>
        {children}
        {sortBy === k && <span className="material-icons">{sortAsc ? 'arrow_downward' : 'arrow_upward'}</span>}
      </button>
    </th>
  );

  return (
    <main className="content">
      {/* SACS */}
      <nav className="sac-tabs" aria-label="Sacs">
        {[ALL_SACS, ...config.sacs].map(s => (
          <button
            key={s}
            className={`sac-tab ${activeSac === s ? 'is-active' : ''}`}
            onClick={() => { setSac(s); setPlace(null); }}
          >
            {s === ALL_SACS ? 'Tous' : s}
            {s !== ALL_SACS && sacsAlert.has(s) && <span className="dot" aria-label="à traiter" />}
          </button>
        ))}
      </nav>

      {/* EMPLACEMENTS DU SAC */}
      {places.length > 0 && (
        <nav className="place-tabs" aria-label="Emplacements">
          {[null, ...places].map(pl => (
            <button
              key={pl ?? '__all__'}
              className={`place-tab ${activePlace === pl ? 'is-active' : ''}`}
              onClick={() => setPlace(pl)}
            >
              {pl ?? 'Tous les emplacements'}
            </button>
          ))}
        </nav>
      )}

      {/* RÉSUMÉ PAR STATUT (cliquer = filtrer) */}
      {allOk ? (
        <div className="all-ok">
          <span className="material-icons">verified</span>
          Tout est en ordre{activePlace ? ` dans ${activePlace}` : activeSac !== ALL_SACS ? ` dans ${activeSac}` : ''}
        </div>
      ) : (
        <div className="summary">
          {SUMMARY.map(s => (
            <button
              key={s}
              className={`tile st-${s} ${statusFilter === s ? 'is-active' : ''} ${counts[s] ? '' : 'is-empty'}`}
              onClick={() => setStatusFilter(statusFilter === s ? null : s)}
              aria-pressed={statusFilter === s}
            >
              <span className="tile-count">{counts[s] || 0}</span>
              <span className="tile-label">
                <span className="material-icons">{STATUS[s].icon}</span>
                {STATUS[s].plural}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* RECHERCHE */}
      <div className="search">
        <span className="material-icons">search</span>
        <input
          type="search"
          placeholder="Rechercher un produit"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} aria-label="Effacer">
            <span className="material-icons">close</span>
          </button>
        )}
      </div>

      {statusFilter && (
        <div className="filter-chip">
          Affichage : <strong>{STATUS[statusFilter]?.plural}</strong>
          <button onClick={() => setStatusFilter(null)}>Tout voir</button>
        </div>
      )}

      {/* TABLEAU (défilement horizontal sur téléphone, colonne Produit fixe) */}
      <div className="table-wrap">
        <table className="stock-table">
          <thead>
            <tr>
              {sortTh('nom', 'Produit', 'col-name')}
              {sortTh('statut', 'Statut')}
              <th className="col-center">Qté (réel / requis)</th>
              {sortTh('peremption', 'Péremption')}
              {sortTh('categorie', 'Emplacement')}
              {showSac && sortTh('sac', 'Sac')}
              <th>Remarques</th>
              <th aria-label="Supprimer"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(p => {
              const st = STATUS[p.status];
              return (
                <tr key={p.id} className={`st-${p.status}`}>
                  <td className="col-name">
                    <textarea
                      key={p.nom} defaultValue={p.nom} rows={1}
                      onBlur={saveOnBlur(p, 'nom')}
                    />
                  </td>
                  <td>
                    <div className="status-cell">
                      <span className="badge">
                        <span className="material-icons">{st.icon}</span>{st.label}
                      </span>
                      {['perime', 'manquant', 'bientot'].includes(p.status) && (
                        <button className="row-action" onClick={() => save(p.id, { commandeStatus: 'commande' })}>
                          Commander
                        </button>
                      )}
                      {p.status === 'commande' && (
                        <button className="row-action is-receive" onClick={() => setReceiving(p)}>
                          Reçu
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="col-center">
                    <div className="qty">
                      <button onClick={() => save(p.id, { quantite: Math.max(0, (Number(p.quantite) || 0) - 1) })} aria-label="Retirer un">
                        <span className="material-icons">remove</span>
                      </button>
                      <span className={isLowStock(p) ? 'is-low' : ''}>
                        <strong>{p.quantite ?? 0}</strong>
                        {' / '}
                        <input
                          key={p.quantiteDemandee} type="number" inputMode="numeric" min={1}
                          defaultValue={p.quantiteDemandee ?? 1} aria-label="Quantité requise"
                          onBlur={e => Number(e.target.value) !== Number(p.quantiteDemandee ?? 1) &&
                            save(p.id, { quantiteDemandee: Math.max(1, Number(e.target.value) || 1) })}
                        />
                      </span>
                      <button onClick={() => save(p.id, { quantite: (Number(p.quantite) || 0) + 1 })} aria-label="Ajouter un">
                        <span className="material-icons">add</span>
                      </button>
                    </div>
                  </td>
                  <td>
                    <input
                      type="month" value={p.datePeremption || ''}
                      className={p.status === 'perime' || p.status === 'bientot' ? 'is-alert' : ''}
                      onChange={e => save(p.id, { datePeremption: e.target.value })}
                    />
                  </td>
                  <td>
                    <select value={p.categorie || ''} onChange={e => save(p.id, { categorie: e.target.value })}>
                      {!getEmplacements(config, p.sac).includes(p.categorie) && <option value={p.categorie || ''}>{p.categorie || '--'}</option>}
                      {getEmplacements(config, p.sac).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  {showSac && (
                    <td>
                      <select value={p.sac || ''} onChange={e => save(p.id, { sac: e.target.value, categorie: emplacementFor(config, e.target.value, p.categorie) })}>
                        {!config.sacs.includes(p.sac) && <option value={p.sac || ''}>{p.sac || '--'}</option>}
                        {config.sacs.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  )}
                  <td>
                    <textarea
                      key={p.Remarques} defaultValue={p.Remarques || ''} rows={1} placeholder="…"
                      onBlur={saveOnBlur(p, 'Remarques')}
                    />
                  </td>
                  <td>
                    <button className="row-delete" onClick={() => handleDelete(p)} aria-label="Supprimer" title="Supprimer">
                      <span className="material-icons">delete</span>
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="empty">
                  {produits.length === 0
                    ? <>Aucun produit pour l'instant. Appuyez sur <strong>+ Ajouter</strong> pour commencer.</>
                    : term ? <>Aucun produit trouvé pour « {search} ».</> : <>Aucun produit ici.</>}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {receiving && <ReceiveSheet p={receiving} onClose={() => setReceiving(null)} />}
    </main>
  );
}

function ReceiveSheet({ p, onClose }) {
  const [quantite, setQuantite] = useState(p.quantiteDemandee || 1);
  const [datePeremption, setDatePeremption] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await save(p.id, {
      commandeStatus: 'recu',
      quantite: Number(quantite) || 0,
      ...(datePeremption ? { datePeremption } : {})
    });
    onClose();
  };

  return (
    <Sheet title={`Réception : ${p.nom}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <span>Quantité totale dans le sac</span>
          <Stepper value={quantite} onChange={setQuantite} label="Quantité" />
        </div>
        <label className="field">
          <span>Nouvelle date de péremption</span>
          <input type="month" value={datePeremption} onChange={e => setDatePeremption(e.target.value)} required={isExpired(p.datePeremption)} />
          <small>Laisser vide pour garder la date actuelle{p.datePeremption ? ` (${expiryLabel(p.datePeremption)})` : ''}.</small>
        </label>
        <button type="submit" className="btn btn-success btn-block">
          <span className="material-icons">check</span> Valider la réception
        </button>
      </form>
    </Sheet>
  );
}
