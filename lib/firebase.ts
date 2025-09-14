import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "REDACTED_FOR_OPENSOURCE",
  authDomain: "driven-lore-440821-g0.firebaseapp.com",
  projectId: "driven-lore-440821-g0",
  storageBucket: "driven-lore-440821-g0.firebasestorage.app",
  messagingSenderId: "9227030920",
  appId: "1:9227030920:web:08a48e0522ec3f527eaa3d",
  measurementId: "G-2WQ84DV2C4"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/calendar');
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export { app, auth, googleProvider, analytics, db };