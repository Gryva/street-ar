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

// samo pročitaj nickname (ne pita usera)
async function getNickname() {
  // 1) iz localStorage
  let name = getStoredUsername();
  if (name) return name;

  // 2) iz submitter_profiles za ovog usera
  const user = await ensureAnonAuth();
  if (!user) return null;

  const { data: profile, error } = await supabaseClient
    .from("submitter_profiles")
    .select("nickname")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!error && profile?.nickname) {
    setStoredUsername(profile.nickname);
    return profile.nickname;
  }

  return null;
}

// Glavni helper: osiguraj da user ima neki nickname (ako nema, pitaj)
async function ensureNickname() {
  const existing = await getNickname();
  if (existing) return existing;

  const user = await ensureAnonAuth();
  if (!user) {
    alert("Greška pri prijavi korisnika.");
    return null;
  }

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

    // NEMA globalne provjere duplikata: svaki user ima svoj red po owner_id
    const { error: upsertError } = await supabaseClient
      .from("submitter_profiles")
      .upsert(
        {
          owner_id: user.id,
          nickname: candidate
        },
        { onConflict: "owner_id" } // ako već postoji red za ovog usera, samo update
      );

    if (upsertError) {
      console.error("save nickname error", upsertError);
      alert("Ne mogu spremiti korisničko ime. Pokušaj ponovo.");
      continue;
    }

    setStoredUsername(candidate);
    return candidate;
  }
}

// Ručno promijeni nadimak (pozivaš iz UI-a – nije obavezno)
async function changeNickname() {
  const user = await ensureAnonAuth();
  if (!user) {
    alert("Greška pri prijavi korisnika.");
    return null;
  }

  const current = (await getNickname()) || "";

  const input = prompt(
    "Upiši novo korisničko ime / nadimak:",
    current
  );
  if (input === null) return null;

  const candidate = input.trim();
  if (!candidate) {
    alert("Korisničko ime ne može biti prazno.");
    return null;
  }

  const { error } = await supabaseClient
    .from("submitter_profiles")
    .upsert(
      {
        owner_id: user.id,
        nickname: candidate
      },
      { onConflict: "owner_id" }
    );

  if (error) {
    console.error("changeNickname error", error);
    alert("Ne mogu spremiti novo korisničko ime. Pokušaj ponovo.");
    return null;
  }

  setStoredUsername(candidate);
  return candidate;
}
