/* reset.js — halaman reset.html: atur kata sandi baru setelah klik tautan dari email. Butuh app.js. */
(async function () {
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form'), msg = $('msg'), status = $('status'), tampil = false;

  function tampilkanForm() {
    if (tampil) return;
    tampil = true;
    $('tunggu').hidden = true;
    form.hidden = false;
    $('pw').focus();
  }
  function gagal(teks) {
    status.textContent = teks;
    status.classList.add('err');
    $('kembali').hidden = false;
  }
  function paramUrl(k) {
    var q = new URLSearchParams(location.search.slice(1)), h = new URLSearchParams(location.hash.replace(/^#/, ''));
    return q.get(k) || h.get(k);
  }
  function pesan(teks, error) { msg.textContent = teks; msg.classList.toggle('err', !!error); }

  if (!window.db) { gagal('Supabase belum terhubung. Cek supabase-config.js.'); return; }

  // Tautan kedaluwarsa / sudah dipakai
  if (paramUrl('error')) {
    gagal('Tautan tidak berlaku lagi (kedaluwarsa atau sudah dipakai). Minta tautan baru lewat "Lupa kata sandi?" di halaman Log in.');
    return;
  }

  // Supabase memberi event PASSWORD_RECOVERY setelah memproses tautan dari email
  // (hanya ubah tampilan di sini; jangan panggil fungsi Supabase di dalam callback ini)
  db.auth.onAuthStateChange(function (event) { if (event === 'PASSWORD_RECOVERY') tampilkanForm(); });

  try {
    var s = (await db.auth.getSession()).data.session;
    if (s) tampilkanForm();
    else gagal('Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru lewat "Lupa kata sandi?" di halaman Log in.');
  } catch (e) {
    console.error(e);
    gagal('Gagal terhubung ke server. Coba lagi.');
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var a = $('pw').value, b = $('pw2').value;
    if (a.length < 8) { pesan('Kata sandi minimal 8 karakter.', true); $('pw').focus(); return; }
    if (a !== b) { pesan('Kata sandi tidak sama.', true); $('pw2').focus(); return; }

    var btn = $('simpan'); btn.disabled = true; pesan('Menyimpan...');
    try {
      var r = await db.auth.updateUser({ password: a });
      if (r.error) throw r.error;
      pesan('Kata sandi berhasil diganti. Mengalihkan...');
      setTimeout(function () { location.href = 'lengkapi.html'; }, 1200);   // lengkapi.html mengarahkan ke beranda sesuai role
    } catch (ex) {
      console.error(ex);
      var m = (ex && ex.message) || '';
      pesan(/different from the old|same as the old/i.test(m) ? 'Kata sandi baru harus berbeda dari yang lama.'
        : /password/i.test(m) ? 'Kata sandi ditolak: ' + m
        : 'Gagal menyimpan. Coba lagi.', true);
      btn.disabled = false;
    }
  });
})();