// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyBDRtUbsu1mh_AVmjwR-bsu73uMbx5Huos",
  authDomain: "chat-app-a9cce.firebaseapp.com",
  projectId: "chat-app-a9cce",
  storageBucket: "chat-app-a9cce.appspot.com",
  messagingSenderId: "973866125494",
  appId: "1:973866125494:web:9909ebf682098f6afa3e17",
  measurementId: "G-J34GJ2HP59"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
