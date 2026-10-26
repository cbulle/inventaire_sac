import { useState } from 'react';
import { doc, setDoc } from "firebase/firestore";
import { db } from '../firebase';
import { getEmplacements } from '../emplacements';

// Liste des sacs ; un appui sur un sac déplie ses emplacements
export default function CategorySacManager({ caserne, config, produits }) {
  const [openSac, setOpenSac] = useState(config.sacs[0] ?? null);
  const [newSac, setNewSac] = useState('');
  const [newPlace, setNewPlace] = useState('');

  // mergeFields remplace ces champs en entier (sinon un sac supprimé resterait dans la map)
  const saveConfig = (sacs, emplacements) =>
    setDoc(doc(db, "config", caserne), { sacs, emplacements }, { mergeFields: ['sacs', 'emplacements'] });

  // Map complète : les sacs encore sur la liste commune reçoivent leur propre copie
  const fullMap = () => Object.fromEntries(config.sacs.map(s => [s, [...getEmplacements(config, s)]]));

  const countIn = (sac, place) =>
    produits.filter(p => p.sac === sac && (place === undefined || p.categorie === place)).length;

  const addSac = async (e) => {
    e.preventDefault();
    const value = newSac.trim();
    if (!value || config.sacs.includes(value)) return;
    await saveConfig([...config.sacs, value], { ...fullMap(), [value]: [] });
    setNewSac('');
    setOpenSac(value);
  };

  const deleteSac = async (sac) => {
    const used = countIn(sac);
    const warning = used ? `\n${used} produit(s) y sont rangés : ils resteront visibles dans « Tous ».` : '';
    if (!window.confirm(`Supprimer le sac « ${sac} » et ses emplacements ?${warning}`)) return;
    const map = fullMap();
    delete map[sac];
    await saveConfig(config.sacs.filter(s => s !== sac), map);
  };

  const addPlace = async (e) => {
    e.preventDefault();
    const value = newPlace.trim();
    const list = getEmplacements(config, openSac);
    if (!value || list.includes(value)) return;
    await saveConfig(config.sacs, { ...fullMap(), [openSac]: [...list, value] });
    setNewPlace('');
  };

  const deletePlace = async (place) => {
    const used = countIn(openSac, place);
    const warning = used ? `\n${used} produit(s) y sont rangés : ils resteront dans le sac.` : '';
    if (!window.confirm(`Supprimer l'emplacement « ${place} » de ${openSac} ?${warning}`)) return;
    await saveConfig(config.sacs, { ...fullMap(), [openSac]: getEmplacements(config, openSac).filter(p => p !== place) });
  };

  return (
    <div>
      <ul className="sac-list">
        {config.sacs.map(sac => {
          const places = getEmplacements(config, sac);
          const isOpen = openSac === sac;
          return (
            <li key={sac} className={isOpen ? 'is-open' : ''}>
              <div className="sac-row">
                <button className="sac-toggle" onClick={() => { setOpenSac(isOpen ? null : sac); setNewPlace(''); }} aria-expanded={isOpen}>
                  <span className="material-icons">{isOpen ? 'expand_more' : 'chevron_right'}</span>
                  <strong>{sac}</strong>
                  <small>{places.length} emplacement{places.length > 1 ? 's' : ''}</small>
                </button>
                <button className="icon-btn" onClick={() => deleteSac(sac)} aria-label={`Supprimer ${sac}`}>
                  <span className="material-icons">delete_outline</span>
                </button>
              </div>

              {isOpen && (
                <div className="place-panel">
                  <ul className="config-list">
                    {places.map(place => (
                      <li key={place}>
                        <span>{place}</span>
                        <button onClick={() => deletePlace(place)} aria-label={`Supprimer ${place}`}>
                          <span className="material-icons">delete_outline</span>
                        </button>
                      </li>
                    ))}
                    {places.length === 0 && <li className="hint">Aucun emplacement : ajoutez-en un ci-dessous.</li>}
                  </ul>
                  <form className="config-add" onSubmit={addPlace}>
                    <input value={newPlace} onChange={e => setNewPlace(e.target.value)} placeholder="Nouvel emplacement" />
                    <button type="submit" className="btn btn-primary" disabled={!newPlace.trim()} aria-label="Ajouter l'emplacement">
                      <span className="material-icons">add</span>
                    </button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <form className="config-add" onSubmit={addSac}>
        <input value={newSac} onChange={e => setNewSac(e.target.value)} placeholder="Nouveau sac" />
        <button type="submit" className="btn btn-primary" disabled={!newSac.trim()}>
          <span className="material-icons">add</span> Sac
        </button>
      </form>
    </div>
  );
}
