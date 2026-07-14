import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC8f8C2aXf-HnvZu52QmbvX4VawN2-YH2s",
  authDomain: "gen-lang-client-0021509828.firebaseapp.com",
  projectId: "gen-lang-client-0021509828",
  storageBucket: "gen-lang-client-0021509828.firebasestorage.app",
  messagingSenderId: "216100958963",
  appId: "1:216100958963:web:33f1d3a0f6011dfdb77d86"
};

const app = initializeApp(firebaseConfig);

// Connect to the specific named Firestore database provisioned for this applet
const db = getFirestore(app, "ai-studio-d9ab3847-2a75-4375-9ac3-0dd4ae5e2a1c");

export { db };
