import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDYmaAmbl1DQ0AD6MxKTkB3jw_5tpVoPcw",
  authDomain: "major-project-7c803.firebaseapp.com",
  projectId: "major-project-7c803",
  storageBucket: "major-project-7c803.firebasestorage.app",
  messagingSenderId: "954150962307",
  appId: "1:954150962307:web:81e08300eb5505454c07b6",
  measurementId: "G-3L5SFGV21W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export { app };