// Notifications de péremption 100 % locales : aucune Cloud Function ni serveur,
// donc compatible avec le plan gratuit Firebase (Spark).
// La page dépose la liste des dates dans le Cache Storage ; le service worker
// (public/notif-sw.js) la lit pour notifier, à l'ouverture de l'app et en arrière-plan
// quand le navigateur le permet (Periodic Background Sync, Chrome Android, app installée).

const CACHE = 'stock-notif';
const DATA_URL = '/__notif/data';
const PREF_KEY = 'notifEnabled';
const SYNC_TAG = 'check-peremptions';

export const notifSupported = () =>
  'Notification' in window && 'serviceWorker' in navigator && 'caches' in window;

export const notifPermission = () => (notifSupported() ? Notification.permission : 'unsupported');

export const notifEnabled = () =>
  notifSupported() && localStorage.getItem(PREF_KEY) === 'true' && Notification.permission === 'granted';

const writeData = async (data) => {
  const cache = await caches.open(CACHE);
  await cache.put(DATA_URL, new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }));
};

const readData = async () => {
  const cache = await caches.open(CACHE);
  const res = await cache.match(DATA_URL);
  return res ? res.json() : { items: [] };
};

export async function enableNotifications() {
  if (!notifSupported()) return false;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;
  localStorage.setItem(PREF_KEY, 'true');
  const reg = await navigator.serviceWorker.ready;
  try {
    if ('periodicSync' in reg) await reg.periodicSync.register(SYNC_TAG, { minInterval: 12 * 60 * 60 * 1000 });
  } catch {
    // Non autorisé : la vérification se fera à chaque ouverture de l'app
  }
  return true;
}

export async function disableNotifications() {
  localStorage.setItem(PREF_KEY, 'false');
  if (!notifSupported()) return;
  await writeData({ ...(await readData()), enabled: false });
  try {
    const reg = await navigator.serviceWorker.ready;
    if ('periodicSync' in reg) await reg.periodicSync.unregister(SYNC_TAG);
  } catch {
    // ignoré
  }
}

// Met à jour les données du service worker et lui demande de notifier les nouvelles péremptions
export async function syncNotifications(produits) {
  if (!notifSupported()) return;
  const items = produits
    .filter(p => p.datePeremption)
    .map(p => ({ id: p.id, nom: p.nom, sac: p.sac, date: p.datePeremption }));
  const enabled = notifEnabled();
  await writeData({ enabled, items });
  if (!enabled) return;
  const reg = await navigator.serviceWorker.ready;
  reg.active?.postMessage(SYNC_TAG);
}
