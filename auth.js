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

// Dohvati nickname iz submitter_profiles za trenutnog usera
async function fetchProfileNickname() {
  const user = await ensureAnonAuth();
  if (!user) return null;

  const { data, error } = await supabaseClient
    .from("submitter_profiles")
    .select("nickname")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("fetchProfileNickname error", error);
    return null;
  }

  return data?.nickname || null;
}

// Glavni helper: pobrini se da user ima jedinstveni nickname
async function ensureNickname() {
  // 1) probaj iz localStorage
  let name = getStoredUsername();
  if (name) return name;

  // 2) probaj iz Supabase profila za ovog usera
  const profileNick = await fetchProfileNickname();
  if (profileNick) {
    setStoredUsername(profileNick);
    return profileNick;
  }

  // 3) ako nema profila, traži novi nadimak
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

    // provjera: koristi li taj nadimak NETKO DRUGI
    const { data: taken, error } = await supabaseClient
      .from("submitter_profiles")
      .select("owner_id")
      .eq("nickname", candidate)
      .maybeSingle();

    if (error) {
      console.error("check nickname error", error);
      alert("Dogodila se greška pri provjeri imena. Pokušaj ponovo.");
      continue;
    }

    if (taken && taken.owner_id !== user.id) {
      // netko DRUGI već ima to ime → ne dopuštamo
      alert("To korisničko ime već koristi netko drugi. Odaberi drugo.");
      continue;
    }

    // ako postoji zapis s ovim owner_id i ovim nicknameom, ne radimo novi insert
    if (!taken) {
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
    }

    setStoredUsername(candidate);
    return candidate;
  }
}
