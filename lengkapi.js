/* lengkapi.js — halaman lengkapi.html: pintu masuk setelah login Google/Facebook, klik tautan konfirmasi email,
   dan selesai atur ulang kata sandi. Butuh app.js (App.masuk). Fungsi database: lengkapi_profil (supabase-oauth.sql). */
(async function () {
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form'), err = $('err'), status = $('status');
  var USERNAME_RE = /^[A-Za-z0-9_.]{4,}$/;

  function info(teks, error) {
    status.textContent = teks;
    status.classList.toggle('err', !!error);
  }
  function berhenti(judul, teks) {      // tampilkan pesan gagal + tombol kembali
    $('judul').textContent = judul;
    $('sub').textContent = '';
    info(teks, true);
    $('kembali').hidden = false;
  }
  function paramUrl(k) {                // error dari Supabase bisa ada di ?query atau #hash
    var q = new URLSearchParams(location.search.slice(1)), h = new URLSearchParams(location.hash.replace(/^#/, ''));
    return q.get(k) || h.get(k);
  }
  function pilihRole() {
    var r = form.querySelector('input[name="role"]:checked');
    return r ? r.value : '';
  }
  function aturUsername() {             // kolom username hanya untuk guru
    var guru = pilihRole() === 'teacher';
    $('grp-username').hidden = !guru;
    $('username').disabled = !guru;
  }

  if (!window.db) { berhenti('Belum bisa dilanjutkan', 'Supabase belum terhubung. Cek supabase-config.js.'); return; }

  // 1. Login dibatalkan / ditolak di Google atau Facebook, atau gagal membuat akun di database
  var galat = paramUrl('error_description') || paramUrl('error');
  if (galat) {
    var kode = paramUrl('error_code') || '';
    var teks = /otp_expired|expired/i.test(kode + galat) ? 'Tautan sudah kedaluwarsa. Silakan coba lagi.'
      : /access_denied/i.test(galat) ? 'Login dibatalkan.'
      : /database error/i.test(galat) ? 'Akun belum bisa dibuat. Hubungi admin (cek trigger profil di Supabase).'
      : 'Login gagal: ' + galat.replace(/\+/g, ' ');
    berhenti('Login gagal', teks);
    return;
  }

  try {
    // 2. Harus ada sesi (getSession menunggu supabase-js selesai memproses tautan/kode dari URL)
    var s = (await db.auth.getSession()).data.session;
    if (!s) { location.replace('login.html'); return; }
    var u = s.user;

    // 3. Akun tanpa email (mis. Facebook yang daftar pakai nomor HP): tolak, karena tidak bisa reset kata sandi
    if (!u.email) {
      await db.auth.signOut();
      berhenti('Akun belum bisa dipakai', 'Akun ini tidak membagikan alamat email, jadi kami tidak bisa memverifikasinya. Pakai akun lain, atau daftar dengan email.');
      return;
    }

    // 4. Profil sudah lengkap -> langsung ke beranda
    // Trigger database otomatis membuat profil 'murid' untuk akun Google/Facebook baru, jadi penandanya
    // bukan role, tapi tanggal lahir: pendaftaran email selalu mengisinya, akun sosial baru belum.
    var p = await db.from('profiles').select('role,name,birth').eq('id', u.id).maybeSingle();
    if (p.error) throw p.error;
    if (p.data && p.data.role && p.data.birth) { App.masuk({ role: p.data.role, name: p.data.name }); return; }

    // 5. Akun baru dari Google/Facebook: minta data yang kurang
    var meta = u.user_metadata || {};
    $('fullname').value = meta.full_name || meta.name || '';
    $('birth').max = new Date().toISOString().split('T')[0];
    var awal = sessionStorage.getItem('pendingRole');       // role yang dipilih di halaman Sign up
    if (awal === 'student' || awal === 'teacher') form.querySelector('input[value="' + awal + '"]').checked = true;
    aturUsername();

    $('judul').textContent = 'Lengkapi profil';
    $('sub').textContent = 'Tinggal beberapa data lagi sebelum mulai bermain.';
    $('info').hidden = true;
    form.hidden = false;

    form.addEventListener('change', function (e) { if (e.target.name === 'role') aturUsername(); });

    $('akun-lain').addEventListener('click', async function () {
      sessionStorage.removeItem('pendingRole');
      try { await db.auth.signOut(); } catch (x) { console.error(x); }
      location.replace('login.html');
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      err.textContent = '';
      var role = pilihRole(), nama = $('fullname').value.trim(), lahir = $('birth').value,
          username = $('username').value.trim().toLowerCase();
      if (!role) { err.textContent = 'Pilih dulu: Murid atau Guru.'; return; }
      if (nama.length < 3) { err.textContent = 'Nama lengkap minimal 3 huruf.'; $('fullname').focus(); return; }
      if (!lahir) { err.textContent = 'Tanggal lahir wajib diisi.'; $('birth').focus(); return; }
      if (role === 'teacher' && !USERNAME_RE.test(username)) {
        err.textContent = 'Username minimal 4 karakter (huruf, angka, _ atau .).'; $('username').focus(); return;
      }

      var btn = $('simpan'); btn.disabled = true; btn.textContent = 'Menyimpan...';
      try {
        var r = await db.rpc('lengkapi_profil', {
          p_role: role, p_name: nama, p_birth: lahir, p_username: role === 'teacher' ? username : null
        });
        if (r.error) throw r.error;
        sessionStorage.removeItem('pendingRole');
        App.masuk({ role: role, name: nama });
      } catch (ex) {
        console.error(ex);
        var m = (ex && ex.message) || '';
        err.textContent = /duplicate|unique|username/i.test(m) ? 'Username sudah dipakai. Coba yang lain.'
          : /could not find the function|lengkapi_profil/i.test(m) ? 'Fungsi lengkapi_profil belum dibuat di Supabase.'
          : /sudah lengkap/i.test(m) ? 'Profil ini sudah lengkap. Silakan Log in lagi.'
          : 'Gagal menyimpan. Coba lagi.';
        btn.disabled = false; btn.textContent = 'Simpan dan lanjut';
      }
    });
  } catch (ex) {
    console.error(ex);
    berhenti('Terjadi masalah', 'Gagal terhubung ke server. Coba lagi.');
  }
})();