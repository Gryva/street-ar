// auth.js

const SUPABASE_URL = "https://gppxvrknlnqzlzhcmstw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_mnjwFbje0KmPYbUGnw-DRA_6V24GF0n";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// vrati uvijek usera (anon ako treba)
async function ensureAnonAuth() {
  const {
    data: { session }
  } = await supabaseClient.auth.getSession();
  if (session?.user) return session.user;

  const { data, error } = await supabaseClient.auth.signInAnonymously();
  if (error) {
    console.error("Anon auth error:", error);
    return null;
  }
  return data.user;
}

/* ==== nickname helperi ==== */

const USERNAME_KEY = "street-ar-submit-name";

function getStoredUsername() {
  try {
    const v = localStorage.getItem(USERNAME_KEY);
    return v && v.trim() ? v.trim() : null;
  } catch (e) {
    console.error("getStoredUsername error", e);
    return null;
  }
}

function setStoredUsername(name) {
  try {
    if (name && name.trim()) {
      localStorage.setItem(USERNAME_KEY, name.trim());
    }
  } catch (e) {
    console.error("setStoredUsername error", e);
  }
}

// Glavni helper: osiguraj da user ima neki nickname
async function ensureNickname() {
  // 1) iz localStorage
  let name = getStoredUsername();
  if (name) return name;

  // 2) iz submitter_profiles za ovog usera
  const user = await ensureAnonAuth();
  if (!user) {
    alert("Greška pri prijavi korisnika.");
    return null;
  }

  const { data: profile, error } = await supabaseClient
    .from("submitter_profiles")
    .select("nickname")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!error && profile?.nickname) {
    setStoredUsername(profile.nickname);
    return profile.nickname;
  }

  // 3) nema profila -> pitaj usera i SPREMI (bez globalne provjere duplikata)
  while (true) {
    const input = prompt(
      "Kako želiš da te potpisujemo uz tvoje radove? (nadimak ili ime)",
      ""
    );
    if (input === null) {
      // Cancel
      return null;
    }

    const candidate = input.trim();
    if (!candidate) continue;

    const { error: insertError } = await supabaseClient
      .from("submitter_profiles")
      .insert({
        owner_id: user.id,
        nickname: candidate
      });

    if (insertError) {
      console.error("insert nickname error", insertError);
      alert("Ne mogu spremiti korisničko ime. Pokušaj ponovo.");
      continue;
    }

    setStoredUsername(candidate);
    return candidate;
  }
}
