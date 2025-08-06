const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG;
const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function handleRedirect() {
  const path = window.location.pathname.slice(1);

  // Skip if on login/expired pages or no code
  if (!path || path === "login" || path === "expired") return;

  try {
    const {
      data: { session },
    } = await client.auth.getSession();

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/redirect?code=${path}`,
      {
        headers: session
          ? {
              Authorization: `Bearer ${session.access_token}`,
            }
          : {},
      },
    );

    const data = await response.json();

    if (data.redirect) {
      window.location.href = data.redirect;
    } else if (data.requiresAuth) {
      localStorage.setItem("redirect_code", path);
      window.location.href = "/login.html";
    } else if (data.expired) {
      window.location.href = "/expired.html";
    }
  } catch (err) {
    console.error("Redirect error:", err);
    window.location.href = "/expired.html";
  }
}

async function handleEmailLogin() {
  const email = document.getElementById("email").value;
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });

  if (!error) {
    alert("Check your email for the login link!");
  }
}

async function handleGoogleLogin() {
  await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });
}

// Auth state listener
client.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN") {
    const redirectCode = localStorage.getItem("redirect_code");
    if (redirectCode) {
      localStorage.removeItem("redirect_code");
      window.location.href = `/${redirectCode}`;
    }
  }
});

// Initialize
handleRedirect();
