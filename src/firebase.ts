import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const getEnv = (key: string) => {
  const value = import.meta.env[key];
  if (!value) return undefined;
  // Remove quotes and whitespace if user pasted them incorrectly in Netlify
  return value.replace(/['"]+/g, '').trim();
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID'),
};

// Log detailed status to browser console for debugging
console.log('Firebase Configuration Status (Netlify/Local):');
Object.entries(firebaseConfig).forEach(([key, value]) => {
  if (value) {
    console.log(`- ${key}: ✅ Detectada (Tamanho: ${value.length})`);
  } else {
    console.warn(`- ${key}: ❌ AUSENTE! Verifique o nome no Netlify`);
  }
});

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, getEnv('VITE_FIREBASE_FIRESTORE_DATABASE_ID') || 'ai-studio-775a853d-0b18-43b4-aa26-5e1b6298d1ff');
export const auth = getAuth(app);
