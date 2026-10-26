import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBene0gWYJ1_q9aFtzPFrAlSLLSUN_W9eU",
  authDomain: "stock-sac-sssm.firebaseapp.com",
  projectId: "stock-sac-sssm",
  storageBucket: "stock-sac-sssm.firebasestorage.app",
  messagingSenderId: "459654328981",
  appId: "1:459654328981:web:4f86d905beff8ffdd2a19c"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Cache local : l'app marche hors réseau (camion, sous-sol) et réduit les lectures facturées
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

// Valeurs utilisées tant que la caserne n'a pas encore de configuration dans Firestore
export const DEFAULT_CATEGORIES = [
  "Pochette Haute ext",
  "Pochette Basse ext",
  "Poche divers",
  "Poches latérales int",
  "Pochette bleue (O2)",
  "Pochette verte (reserve solutés)",
  "Pochette jaune (ampouliers)",
  "Pochette rouge (reserve)",
  "Pochette vvp"
];

export const DEFAULT_SACS = ["Sac 1", "Sac 2", "Sac 3"];
