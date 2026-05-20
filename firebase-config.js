// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCg1Ih-IbxcoPIhAc_7mzJF2bJ9WX0EMyw",
  authDomain: "mc-racking---test.firebaseapp.com",
  projectId: "mc-racking---test",
  storageBucket: "mc-racking---test.firebasestorage.app",
  messagingSenderId: "22203078980",
  appId: "1:22203078980:web:6547d2250dc75a8d895f11",
  measurementId: "G-43RX41YE28"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
