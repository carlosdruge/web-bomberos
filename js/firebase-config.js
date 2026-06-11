// js/firebase-config.js

// 1. Importamos las funciones necesarias directamente desde los servidores de Google
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 2. Configuración de TU proyecto (Pega aquí tus datos de la consola de Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyBk0ACqwXuY4lcyCD6CbZrlL7s7uYfSWFs",
  authDomain: "bomberos-cubarral.firebaseapp.com",
  projectId: "bomberos-cubarral",
  storageBucket: "bomberos-cubarral.firebasestorage.app",
  messagingSenderId: "385992674973",
  appId: "1:385992674973:web:f758becbefb0dce4298e74"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };