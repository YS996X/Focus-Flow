import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

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
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Only initialize analytics if window is available (client-side)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app; 