# Stock Sac

Application (PWA) de suivi du stock des sacs de secours, sur Firebase (plan gratuit Spark).

## Commandes

```bash
npm install
npm run dev      # développement
npm run build    # production dans dist/
firebase deploy  # mise en ligne (Hosting)
```

## Statuts des produits

| Couleur | Statut | Signification |
|---|---|---|
| Rouge | Périmé | La date de péremption est atteinte (mois en cours ou passé) |
| Orange | Manquant | Quantité présente < quantité requise |
| Jaune | Bientôt périmé | Péremption dans les 2 prochains mois |
| Bleu | Commandé | En attente de livraison |
| Vert | OK | Rien à faire |

## Notifications de péremption

Une notification par produit dont la date est atteinte, activable/désactivable via la cloche en haut de l'écran.
Elles sont générées localement par le service worker (`public/notif-sw.js`) : aucune Cloud Function, donc pas besoin du plan Blaze.

- Vérification à chaque ouverture de l'app.
- En arrière-plan (app fermée) : seulement sur Android/Chrome avec l'app installée sur l'écran d'accueil (Periodic Background Sync, environ 1 à 2 fois par jour, à la discrétion du navigateur).
- iPhone : iOS 16.4 minimum et app ajoutée à l'écran d'accueil ; les alertes arrivent à l'ouverture de l'app.
