// ============================================
// js/firebase.js - ПОДКЛЮЧЕНИЕ К FIREBASE
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc,
    query,
    orderBy,
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCQJDfF4qcFrpYxipDRGjaardvDYXbK_8E",
    authDomain: "porosity-calculator.firebaseapp.com",
    projectId: "porosity-calculator",
    storageBucket: "porosity-calculator.firebasestorage.app",
    messagingSenderId: "32731868697",
    appId: "1:32731868697:web:9393a2f7c038d4c4ec0488"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const compoundsCollection = collection(db, 'compounds');
const profilesCollection = collection(db, 'profiles');

// Экспортируем ВСЕ что нужно
export {
    db,
    compoundsCollection,
    profilesCollection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    collection  // ← ЭТО БЫЛО ПРОПУЩЕНО
};

console.log('✅ Firebase подключен!');