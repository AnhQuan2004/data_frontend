// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBd1yYs5yJGS7vl1jT-b1Lsv306GSNoiGA",
  authDomain: "data-research-tea.firebaseapp.com",
  projectId: "data-research-tea",
  storageBucket: "data-research-tea.firebasestorage.app",
  messagingSenderId: "333447370108",
  appId: "1:333447370108:web:b33dadf245ed765e8a80f9",
  measurementId: "G-C3KBGD45LN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };