import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBslyTxIzO6bm_TCF4Vk4TWzlz_gsHO9T8",
  authDomain: "driven-lore-440821-g0.firebaseapp.com",
  projectId: "driven-lore-440821-g0",
  storageBucket: "driven-lore-440821-g0.firebasestorage.app",
  messagingSenderId: "9227030920",
  appId: "1:9227030920:web:08a48e0522ec3f527eaa3d",
  measurementId: "G-2WQ84DV2C4"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Configure Google Provider
const googleProvider = new GoogleAuthProvider();
// Add Calendar API scope
googleProvider.addScope('https://www.googleapis.com/auth/calendar');
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Only initialize analytics if window is available (client-side)
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app, auth, googleProvider, analytics, db }; 