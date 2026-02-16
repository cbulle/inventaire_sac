// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
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
export const db = getFirestore(app);

// VALEURS PAR DÉFAUT (utilisées si les données Firestore ne sont pas disponibles)
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

// Ces constantes seront remplacées par les données dynamiques chargées depuis Firestore
export const CATEGORIES = DEFAULT_CATEGORIES;
export const SACS = DEFAULT_SACS;
