// 1) OVO PROMIJENI NA SVOJE
const supabaseUrl = 'https://gppxvrknlnqzlzhcmstw.supabase.co';
const supabaseAnonKey = 'sb_publishable_mnjwFbje0KmPYbUGnw-DRA_6V24GF0n';

// 2) Inicijalizacija Supabase klijenta
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

const logEl = document.getElementById('log');
const log = (msg) => {
  logEl.textContent += msg + '\n';
};

async function filesToImages(files) {
  const images = [];
  for (const file of files) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await new Promise((res, rej) => {
      img.onload = () => res();
      img.onerror = rej;
    });
    images.push(img);
  }
  return images;
}

async function generateAndUpload() {
  const input = document.getElementById('files');
  const files = Array.from(input.files);
  if (!files.length) {
    alert('Odaberi barem jednu sliku.');
    return;
  }

  log('Pretvaram fajlove u slike...');
  const images = await filesToImages(files);

  log('Pokrećem MindAR compiler...');
  const compiler = new window.MINDAR.Compiler();
  await compiler.compileImageTargets(images, (progress) => {
    log('Progress: ' + Math.round(progress * 100) + '%');
  });

  log('Exportam .mind buffer...');
  const buffer = await compiler.exportData(); // ArrayBuffer [web:204]

  const blob = new Blob([buffer], { type: 'application/octet-stream' });

  // Put unutar bucketa (možeš promijeniti kasnije)
  const path = 'targets/street-ar.mind';

  log('Uploadam u Supabase Storage...');
  const { data, error } = await supabase.storage
    .from('mind-files') // IME BUCKETA KOJI SI STVORIO [web:213]
    .upload(path, blob, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'application/octet-stream',
    });

  if (error) {
    console.error(error);
    log('Greška pri uploadu: ' + error.message);
    return;
  }

  log('Upload OK, dohvaćam public URL...');
  const { data: publicData } = supabase.storage
    .from('mind-files')
    .getPublicUrl(path); // [web:213][web:216]

  log('Public URL: ' + publicData.publicUrl);
  alert('Gotovo! .mind file: ' + publicData.publicUrl);
}

document.getElementById('generate').addEventListener('click', () => {
  generateAndUpload().catch((e) => {
    console.error(e);
    log('Fatal error: ' + e.message);
  });
});
