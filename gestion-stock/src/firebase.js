// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
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

export const auth = getAuth(app); // <--- AJOUT IMPORTANT
export const db = getFirestore(app);

export const CATEGORIES = ["Pochette Haute ext", "Pochette Basse ext","Poche divers", "Poches latérales int", "Pochette bleue (O2)", "Pochette verte (reserve solutés)", "Pochette jaune (ampouliers)", "Pochette rouge (reserve)", "Pochette vvp"];