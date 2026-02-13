import Dexie from 'dexie';

export const db = new Dexie('StockDB');
db.version(1).stores({
  produits: '++id, nom, categorie, datePeremption,datedernièreCommande, Remarques, dateModification'
});

export const CATEGORIES = ["Sac rouge", "Pochette du haut", "Pochette du bas", "Pochette bleu", "Interieur sac"];