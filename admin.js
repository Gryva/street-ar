(() => {
  // 1) Tvoji Supabase podaci
  const supabaseUrl = 'https://gppxvrknlnqzlzhcmstw.supabase.co';
  const supabaseAnonKey = 'sb_publishable_mnjwFbje0KmPYbUGnw-DRA_6V24GF0n';

  // 2) Inic Supabase klijenta
  const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

  const logEl = document.getElementById('log');
  const urlsEl = document.getElementById('urls');

  const log = (msg) => {
    logEl.textContent += msg + '\n';
  };

  async function uploadFiles() {
    const input = document.getElementById('files');
    const files = Array.from(input.files);

    if (!files.length) {
      alert('Odaberi barem jednu sliku.');
      return;
    }

    log('Krećem s uploadom ' + files.length + ' fajlova...');

    for (const file of files) {
      const timestamp = Date.now();
      const safeName = file.name.replace(/\s+/g, '_');
      const path = `targets-images/${timestamp}_${safeName}`;

      log(`→ Uploadam: ${file.name} → ${path}`);

      const { error } = await supabase.storage
        .from('mind-files') // ime bucketa u Supabase [web:211]
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        log(`   ❌ Greška za ${file.name}: ${error.message}`);
        continue;
      }

      const { data } = supabase.storage
        .from('mind-files')
        .getPublicUrl(path); // [web:211][web:244]

      const publicUrl = data.publicUrl;
      log(`   ✅ OK: ${publicUrl}`);

      const li = document.createElement('li');
      li.textContent = publicUrl;
      urlsEl.appendChild(li);
    }

    log('Gotovo s uploadom.');
  }

  document.getElementById('upload').addEventListener('click', () => {
    uploadFiles().catch((e) => {
      console.error(e);
      log('Fatal error: ' + e.message);
    });
  });
})();
