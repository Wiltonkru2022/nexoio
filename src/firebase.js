import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { getFirestore } from "firebase/firestore";

// Configuração do seu app Nexoio obtida no console do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDP8DCw-vlDO2jwdjfZM70xG2ySsqKcBQ4",
  authDomain: "nexoio-4b7ae.firebaseapp.com",
  projectId: "nexoio-4b7ae",
  storageBucket: "nexoio-4b7ae.firebasestorage.app",
  messagingSenderId: "273966611131",
  appId: "1:273966611131:web:3fdc67193836cd7195079e",
  measurementId: "G-59PCPBZCZH"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa os serviços que vamos usar e os exporta para o resto do sistema
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "southamerica-east1");
