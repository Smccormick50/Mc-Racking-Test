// Firebase configuration for the Mc Racking TEST site.
// Project: Mc Racking - Test

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
const auth = firebase.auth();

async function ensureSignedIn() {
  if (auth.currentUser) return auth.currentUser;
  const result = await auth.signInAnonymously();
  console.log("Signed in test user UID:", result.user.uid);
  return result.user;
}
