import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuaGHSPlBppcHcJR91_Z0nUHf0QuCJghg",
    authDomain: "school-attendance-15bc4.firebaseapp.com",
    databaseURL: "https://school-attendance-15bc4-default-rtdb.firebaseio.com",
    projectId: "school-attendance-15bc4",
    storageBucket: "school-attendance-15bc4.firebasestorage.app",
    messagingSenderId: "640457218670",
    appId: "1:640457218670:web:7fae80cae408c7acfc647f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
