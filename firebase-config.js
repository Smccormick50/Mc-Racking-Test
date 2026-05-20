// Firebase configuration for the Mc Racking TEST site.
// Replace the placeholder values below with the Web App config from your
// Firebase project named: Mc Racking-Test.
// Firebase Console → Project settings → General → Your apps → Web app config.

const firebaseConfig = {
  apiKey: "PASTE_TEST_API_KEY_HERE",
  authDomain: "PASTE_TEST_AUTH_DOMAIN_HERE",
  projectId: "PASTE_TEST_PROJECT_ID_HERE",
  storageBucket: "PASTE_TEST_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_TEST_MESSAGING_SENDER_ID_HERE",
  appId: "PASTE_TEST_APP_ID_HERE"
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
