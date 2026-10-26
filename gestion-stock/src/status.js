// Statut d'un produit, calculé à partir de sa date, de sa quantité et de sa commande.
// Ordre = priorité d'affichage (le plus urgent en premier).

export const SOON_MONTHS = 2; // "Bientôt périmé" = dans les 2 prochains mois

export const STATUS = {
  perime:   { label: 'Périmé',         plural: 'Périmés',   icon: 'event_busy' },
  manquant: { label: 'Manquant',       plural: 'Manquants', icon: 'production_quantity_limits' },
  bientot:  { label: 'Bientôt périmé', plural: 'Bientôt',   icon: 'schedule' },
  commande: { label: 'Commandé',       plural: 'Commandés', icon: 'local_shipping' },
  ok:       { label: 'OK',             plural: 'OK',        icon: 'check_circle' },
};

export const STATUS_ORDER = Object.keys(STATUS);

// Nombre de mois entre aujourd'hui et la date "AAAA-MM" (0 = ce mois-ci, négatif = passé)
export function monthsUntil(dateStr, now = new Date()) {
  if (!dateStr) return null;
  const [y, m] = dateStr.split('-').map(Number);
  if (!y || !m) return null;
  return (y - now.getFullYear()) * 12 + (m - (now.getMonth() + 1));
}

// Périmé dès le mois de la date (il faut le remplacer avant la fin du mois)
export const isExpired = (dateStr) => {
  const n = monthsUntil(dateStr);
  return n !== null && n <= 0;
};

export const isLowStock = (p) => (Number(p.quantite) || 0) < (Number(p.quantiteDemandee) || 1);

export function getStatus(p) {
  if (p.commandeStatus === 'commande') return 'commande';
  if (isExpired(p.datePeremption)) return 'perime';
  if (isLowStock(p)) return 'manquant';
  const n = monthsUntil(p.datePeremption);
  if (n !== null && n <= SOON_MONTHS) return 'bientot';
  return 'ok';
}

// "03/2027 · dans 2 mois"
export function expiryLabel(dateStr) {
  const n = monthsUntil(dateStr);
  if (n === null) return null;
  const [y, m] = dateStr.split('-');
  const date = `${m}/${y}`;
  if (n === 0) return `${date} · ce mois-ci`;
  if (n < 0) return `${date} · depuis ${-n} mois`;
  if (n <= 12) return `${date} · dans ${n} mois`;
  return date;
}

export const ALL_SACS = '__tous__';
