import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB3yTx8gruEk5MVK-VyplY5TxDFJ9ZiV8g",
  authDomain: "icep-ntu.firebaseapp.com",
  databaseURL: "https://icep-ntu-default-rtdb.firebaseio.com",
  projectId: "icep-ntu",
  storageBucket: "icep-ntu.firebasestorage.app",
  messagingSenderId: "769119810586",
  appId: "1:769119810586:web:5773324ac6d3cc27460da3",
  measurementId: "G-ZWSXGTMS3B"
};

const app = initializeApp(firebaseConfig);
let analytics;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.warn("Firebase Analytics failed to initialize:", e);
}
const database = getDatabase(app);
const auth = getAuth(app);

export { app, analytics, database, auth };
