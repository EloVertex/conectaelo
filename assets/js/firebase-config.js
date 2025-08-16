// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAypB6YHEGKfT1Y5qI555zMFPtVIE35OJE",
  authDomain: "rumocerto-1e68a.firebaseapp.com",
  projectId: "rumocerto-1e68a",
  storageBucket: "rumocerto-1e68a.appspot.com",
  messagingSenderId: "270382127321",
  appId: "1:270382127321:web:972d0df1e1a78329e8c6c8",
  measurementId: "G-5NGFX267L3"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
