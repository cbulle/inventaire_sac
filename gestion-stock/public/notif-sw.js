// Chargé par le service worker généré (vite.config.js > workbox.importScripts).
// Une notification par produit dont la date de péremption est atteinte, une seule fois par date.

const NOTIF_CACHE = 'stock-notif';
const NOTIF_DATA = '/__notif/data';
const NOTIF_SENT = '/__notif/sent';
const NOTIF_TAG = 'check-peremptions';

function notifIsExpired(dateStr) {
  const [y, m] = String(dateStr).split('-').map(Number);
  if (!y || !m) return false;
  const now = new Date();
  return y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth() + 1);
}

async function checkPeremptions() {
  const cache = await caches.open(NOTIF_CACHE);
  const res = await cache.match(NOTIF_DATA);
  if (!res) return;
  const { enabled, items = [] } = await res.json();
  if (!enabled || Notification.permission !== 'granted') return;

  const sentRes = await cache.match(NOTIF_SENT);
  const sent = new Set(sentRes ? await sentRes.json() : []);
  const stillExpired = [];

  for (const item of items.filter(i => notifIsExpired(i.date))) {
    const key = `${item.id}:${item.date}`;
    stillExpired.push(key);
    if (sent.has(key)) continue;
    const [y, m] = item.date.split('-');
    await self.registration.showNotification(`Périmé : ${item.nom || 'produit'}`, {
      body: `${item.sac ? item.sac + ' — ' : ''}date ${m}/${y}. À remplacer.`,
      tag: key,
      icon: 'sac.png',
      data: { url: './?statut=perime' },
    });
  }

  // On ne garde que les produits encore périmés : une nouvelle date réarme la notification
  await cache.put(NOTIF_SENT, new Response(JSON.stringify(stillExpired)));
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === NOTIF_TAG) event.waitUntil(checkPeremptions());
});

self.addEventListener('message', (event) => {
  if (event.data === NOTIF_TAG) event.waitUntil(checkPeremptions());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const client = list[0];
      if (client) {
        client.postMessage({ type: 'show-status', status: 'perime' });
        return client.focus();
      }
      return self.clients.openWindow(event.notification.data?.url || './');
    })
  );
});
