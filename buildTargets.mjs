import fs from "node:fs/promises";
import path from "node:path";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gppxvrknlnqzlzhcmstw.supabase.co";
const SERVICE_ROLE_KEY = "SB_PUBLISHABLE_KEY_IZ_ENV_ILI_.ENV"; // samo u ovoj skripti
const BUCKET = "artworks";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function main() {
  const outDir = path.join(process.cwd(), "tmp", "targets");
  await fs.mkdir(outDir, { recursive: true });

  console.log("→ Čitam artworks...");
  const { data: artworks, error } = await supabase
    .from("artworks")
    .select("id, image_path, title, category, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Greška pri čitanju artworks:", error);
    process.exit(1);
  }

  console.log(`Nađeno ${artworks.length} radova.`);
  for (const art of artworks) {
    if (!art.image_path) continue;

    console.log(`→ Skidam ${art.id} (${art.image_path})`);

    const { data, error: signedUrlError } = await supabase
      .storage
      .from(BUCKET)
      .createSignedUrl(art.image_path, 60 * 10); // 10 min

    if (signedUrlError) {
      console.error("Greška signed URL:", signedUrlError);
      continue;
    }

    const res = await fetch(data.signedUrl);
    if (!res.ok) {
      console.error("Greška download slike:", res.status, await res.text());
      continue;
    }

    const arrayBuffer = await res.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const ext = path.extname(art.image_path) || ".jpg";
    const fileName = `${art.id}${ext}`;
    const targetPath = path.join(outDir, fileName);

    await fs.writeFile(targetPath, fileBuffer);
    console.log(`  ✔ spremljeno u ${targetPath}`);
  }

  console.log("Gotovo – slike su u tmp/targets/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
