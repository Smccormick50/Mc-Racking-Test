// Sign-in only. New accounts are created by admin in Firebase Console.

function qs(id) { return document.getElementById(id); }

function showError(msg) { qs("authError").textContent = msg; }

async function handleSubmit(e) {
  e.preventDefault();
  const email = qs("authEmail").value.trim();
  const password = qs("authPassword").value;
  const btn = qs("authSubmit");
  btn.disabled = true;
  btn.textContent = "Signing in...";
  showError("");
  try {
    await auth.signInWithEmailAndPassword(email, password);
    window.location.href = "index.html";
  } catch (err) {
    console.error("Sign-in error:", err);
    showError(friendlyError(err));
    btn.disabled = false;
    btn.textContent = "Sign In";
  }
}

function friendlyError(err) {
  const code = (err && err.code) || "";
  const map = {
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/user-not-found": "No account with that email. Contact your administrator.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/too-many-requests": "Too many failed attempts. Wait a few minutes and try again.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/user-disabled": "This account has been disabled. Contact your administrator."
  };
  return map[code] || (err && err.message) || "Sign-in failed.";
}

document.addEventListener("DOMContentLoaded", async () => {
  // If already signed in, skip the form
  const user = await waitForAuthReady();
  if (user) {
    window.location.href = "index.html";
    return;
  }
  qs("authForm").addEventListener("submit", handleSubmit);
});
