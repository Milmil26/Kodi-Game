/* signup.js — halaman Sign up (modal daftar per role). Butuh app.js (App.masuk, App.setPw). */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var overlay = $('overlay'), form = $('signupForm'), formView = $('formView'), doneView = $('doneView'),
      errorBox = $('error'), submitBtn = form.querySelector('.btn-p'),
      groups = [].slice.call(form.querySelectorAll('.grp')),
      cards = [].slice.call(document.querySelectorAll('.role-card')),
      codeInput = $('code'), pwToggles = [].slice.call(form.querySelectorAll('.pw-toggle'));
  var lastFocus = null, currentRole = '';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Tanggal lahir tidak boleh di masa depan
  $('birth').max = new Date().toISOString().split('T')[0];

  // Kolom kode anak: huruf saja, otomatis huruf besar
  codeInput.addEventListener('input', function () {
    codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
  });

  // Tampilkan hanya kolom yang sesuai role (kolom yang disembunyikan juga dinonaktifkan)
  function applyRole(role) {
    groups.forEach(function (g) {
      var show = g.getAttribute('data-roles').split(' ').indexOf(role) !== -1;
      g.hidden = !show;
      [].forEach.call(g.querySelectorAll('input'), function (el) { el.disabled = !show; });
    });
  }

  function clearError() {
    errorBox.textContent = '';
    [].forEach.call(form.querySelectorAll('input'), function (el) { el.classList.remove('bad'); });
  }

  function fail(el, msg) {
    errorBox.textContent = msg;
    el.classList.add('bad');
    el.focus();
    return false;
  }

  function openModal(card) {
    currentRole = card.getAttribute('data-role');
    $('modalTitle').textContent = 'Daftar sebagai ' + card.getAttribute('data-label');
    form.reset();
    pwToggles.forEach(function (b) { App.setPw(b, false); });
    applyRole(currentRole);
    clearError();
    formView.hidden = false;
    doneView.hidden = true;
    lastFocus = card;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lock');
    var first = form.querySelector('.grp:not([hidden]) input');
    setTimeout(function () { if (first) first.focus(); }, 150);
  }

  function closeModal() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lock');
    if (lastFocus) lastFocus.focus();
  }

  // Klik / Enter / Spasi pada card -> buka modal
  cards.forEach(function (card) {
    card.addEventListener('click', function () { openModal(card); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card); }
    });
  });

  // Tutup modal: tombol X, tombol Selesai, klik latar gelap, tombol Esc
  $('closeBtn').addEventListener('click', closeModal);
  $('doneBtn').addEventListener('click', closeModal);
  overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });

  // Tombol media sosial (Google / Facebook lewat OAuth Supabase)
  [].forEach.call(document.querySelectorAll('.soc'), function (btn) {
    btn.addEventListener('click', async function () {
      clearError();
      var nama = btn.getAttribute('data-provider');
      sessionStorage.setItem('pendingRole', currentRole);   // ingat role yang dipilih; dibaca lengkapi.html setelah kembali dari Google/Facebook
      btn.disabled = true;
      try { await App.loginSosial(nama); }
      catch (err) {
        console.error(err);
        btn.disabled = false;
        errorBox.textContent = 'Daftar dengan ' + nama + ' gagal. Coba lagi.';
      }
    });
  });

  function validate(f) {
    var murid = currentRole === 'student', guru = currentRole === 'teacher';
    if (murid || guru) {
      if (!EMAIL_RE.test(f.email.value.trim())) return fail(f.email, 'Format email belum benar.');
      if (murid && f.fullname.value.trim().length < 3) return fail(f.fullname, 'Nama lengkap minimal 3 huruf.');
      if (guru && !f.firstname.value.trim()) return fail(f.firstname, 'Nama depan wajib diisi.');
      if (guru && !f.lastname.value.trim()) return fail(f.lastname, 'Nama belakang wajib diisi.');
      if (!f.birth.value) return fail(f.birth, 'Tanggal lahir wajib diisi.');
      if (guru && !/^[A-Za-z0-9_.]{4,}$/.test(f.username.value.trim()))
        return fail(f.username, 'Username minimal 4 karakter (huruf, angka, _ atau .).');
      if (f.password.value.length < 8) return fail(f.password, 'Kata sandi minimal 8 karakter.');
      if (f.password.value !== f.password2.value) return fail(f.password2, 'Kata sandi tidak sama.');
    } else {
      if (f.parentname.value.trim().length < 3) return fail(f.parentname, 'Nama / username minimal 3 karakter.');
      if (f.childname.value.trim().length < 3) return fail(f.childname, 'Nama anak minimal 3 huruf.');
      if (!/^[A-Z]{6}$/.test(f.code.value)) return fail(f.code, 'Kode anak: 6 huruf, contoh WIQKXM.');
    }
    return true;
  }

  function setLoading(on) {
    submitBtn.disabled = on;
    submitBtn.textContent = on ? 'Memproses...' : 'Daftar';
  }

  function pesanError(err) {
    var m = (err && err.message) || '';
    if (/already registered|already been registered/i.test(m)) return 'Email ini sudah terdaftar. Coba Log in.';
    if (/database error/i.test(m)) return 'Gagal membuat akun. Username mungkin sudah dipakai.';
    if (/password/i.test(m)) return 'Kata sandi ditolak: ' + m;
    if (/rate limit|too many/i.test(m)) return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
    return 'Pendaftaran gagal' + (m ? ': ' + m : '. Coba lagi.');
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearError();
    var f = form.elements;
    if (!validate(f)) return;
    if (!window.db) { errorBox.textContent = 'Supabase belum terhubung. Cek supabase-config.js.'; return; }

    setLoading(true);
    try {
      // ===== ORANG TUA: tanpa akun, cukup cek kode anak =====
      if (currentRole === 'parents') {
        var r = await db.rpc('check_child', { p_code: f.code.value, p_name: f.childname.value.trim() });
        if (r.error) throw r.error;
        if (r.data !== true) { fail(f.code, 'Kode atau nama anak tidak cocok. Tanyakan kode ke guru.'); return; }
        App.masuk({ role: 'parents', name: f.parentname.value.trim() }, f.code.value);
        return;
      }

      // ===== MURID / GURU: akun Supabase (email + kata sandi) =====
      var murid = currentRole === 'student',
          name = murid ? f.fullname.value.trim() : f.firstname.value.trim() + ' ' + f.lastname.value.trim(),
          email = f.email.value.trim().toLowerCase();

      var res = await db.auth.signUp({
        email: email,
        password: f.password.value,
        options: { emailRedirectTo: App.url('lengkapi.html'), data: {
          role: currentRole, name: name, birth: f.birth.value,
          username: murid ? undefined : f.username.value.trim().toLowerCase()   // murid belum punya username
        } }
      });
      if (res.error) throw res.error;

      // Supabase tidak memberi error untuk email yang sudah ada kalau konfirmasi email aktif;
      // tandanya: akun balasan tidak punya identitas
      var u = res.data.user;
      if (u && u.identities && !u.identities.length) throw new Error('User already registered');

      if (res.data.session) {
        App.masuk({ role: currentRole, name: name });      // langsung masuk
      } else {                                              // konfirmasi email aktif di Supabase
        formView.hidden = true;
        doneView.hidden = false;
        $('doneText').textContent = 'Kami mengirim tautan konfirmasi ke ' + email +
          '. Buka email itu (cek juga folder spam) dan klik tautannya; kamu akan langsung masuk.';
      }
    } catch (err) {
      console.error(err);
      errorBox.textContent = pesanError(err);
    } finally {
      setLoading(false);
    }
  });
})();