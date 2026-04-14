import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const getEnv = (key: string) => {
  const value = import.meta.env[key];
  if (!value) return undefined;
  // Remove quotes and whitespace if user pasted them incorrectly in Netlify
  return value.replace(/['"]+/g, '').trim();
};

/**
 * FIREBASE SECURITY NOTE:
 * These configuration values are public and exposed in the frontend bundle.
 * This is normal for Firebase. Security is NOT enforced by hiding these keys,
 * but through Firestore Security Rules and App Check.
 * 
 * Ensure your firestore.rules are strict and restrict access properly.
 */
const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID'),
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, getEnv('VITE_FIREBASE_FIRESTORE_DATABASE_ID') || 'ai-studio-775a853d-0b18-43b4-aa26-5e1b6298d1ff');
export const auth = getAuth(app);
