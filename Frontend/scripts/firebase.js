// ============================================================
//  FLOAST — firebase.js
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyC6CsAdyhbZlTYyLZbafycioFJ5kpcdQCY",
  authDomain:        "domi-71b22.firebaseapp.com",
  projectId:         "domi-71b22",
  storageBucket:     "domi-71b22.firebasestorage.app",
  messagingSenderId: "838673815667",
  appId:             "1:838673815667:web:e23d38689c9dfaf5bf3206",
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

export { auth, db };