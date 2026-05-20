const firebaseConfig = {
  apiKey: "AIzaSyCg1Ih-IbxcoPIhAc_7mzJF2bJ9WX0EMyw",
  authDomain: "mc-racking---test.firebaseapp.com",
  projectId: "mc-racking---test",
  storageBucket: "mc-racking---test.firebasestorage.app",
  messagingSenderId: "22203078980",
  appId: "1:22203078980:web:6547d2250dc75a8d895f11",
  measurementId: "G-43RX41YE28"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

async function ensureSignedIn() {
  if (!firebase.auth().currentUser) {
    await firebase.auth().signInAnonymously();
  }
}
