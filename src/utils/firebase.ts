import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCVV4ARLnzy58K7q5ZvJcB0CWFcD8uy1Uc",
  authDomain: "civicq-7a733.firebaseapp.com",
  projectId: "civicq-7a733",
  storageBucket: "civicq-7a733.firebasestorage.app",
  messagingSenderId: "339776614674",
  appId: "1:339776614674:web:a1833136bfb81c62c1c3cb",
  measurementId: "G-B0LJMYVQ66"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

