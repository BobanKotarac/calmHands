import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBGxx94ITrGwHcZ3vdiSHk4Jkxm7FVkL5w",
  authDomain: "calmhands-42b13.firebaseapp.com",
  projectId: "calmhands-42b13",
  storageBucket: "calmhands-42b13.firebasestorage.app",
  messagingSenderId: "415583334724",
  appId: "1:415583334724:web:d5dda1a50f7e233b48a711"
};

export const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
