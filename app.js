/* =====================================================================
   app.js — script BERSAMA untuk semua halaman (pasang di akhir <body>, sebelum script halaman)
   Isi: 1 Util   2 Menu & profil halaman setelah login   3 Carousel game
        4 Halaman Log in   5 Bagian Contact (kirim ke email lewat Supabase Edge Function)
   ===================================================================== */
(function () {
  /* ====== ISI DATA KAMU DI SINI ====== */
  var CONTACT = {
    email: 'maulidamilda26@gmail.com',   // hanya untuk tombol "Shoot us an email" (penerima form diatur di server)
    wa:    '6287894570143',              // nomor WhatsApp: format 62, tanpa 0 atau +
    line:  ''                            // LINE ID kamu. Kosong = tombol LINE disembunyikan
  };

  /* ---------- 1. UTIL ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); };
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  var HALAMAN = window.HALAMAN = window.HALAMAN ||
    { student: 'murid.html', teacher: 'guru.html', parents: 'orangtua.html' };
  var NAMA_ROLE = { student: 'Murid', teacher: 'Guru', parents: 'Orang Tua' };

  // jalankan fn setelah guard.js selesai memeriksa login (fn menerima data user)
  function siap(fn) {
    if (window.currentUser) fn(window.currentUser);
    else document.addEventListener('auth-ready', function (e) { fn(e.detail); });
  }

  // simpan data login lalu pindah ke beranda sesuai role
  function masuk(user, kodeAnak) {
    if (user.role === 'parents') {
      localStorage.setItem('parentCode', kodeAnak);
      localStorage.removeItem('parentCodes');      // buang daftar anak milik orang lain di browser ini
    }
    localStorage.setItem('user', JSON.stringify(user));
    location.href = HALAMAN[user.role];
  }

  // tombol Lihat / Sembunyikan kata sandi: <button class="pw-toggle" data-target="id-input">
  function setPw(btn, buka) {
    var inp = $(btn.getAttribute('data-target')), img = btn.querySelector('img');
    inp.type = buka ? 'text' : 'password';
    btn.setAttribute('aria-pressed', String(buka));
    btn.setAttribute('aria-label', buka ? 'Sembunyikan kata sandi' : 'Lihat kata sandi');
    if (img) img.src = buka ? 'icon/eye-off.png' : 'icon/eye.png';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.pw-toggle');
    if (b) setPw(b, $(b.getAttribute('data-target')).type === 'password');
  });

  // alamat halaman lain di folder yang sama (aman untuk localhost, subfolder, maupun domain produksi)
  function url(halaman) { return new URL(halaman, location.href).href; }

  // Masuk / daftar lewat Google atau Facebook (OAuth Supabase).
  // Setelah login di Google/Facebook, user dibawa ke lengkapi.html yang menentukan tujuan akhirnya.
  async function loginSosial(provider) {
    if (!window.db) throw new Error('Supabase belum terhubung. Cek supabase-config.js.');
    var p = String(provider).toLowerCase();
    if (p !== 'google' && p !== 'facebook') throw new Error('Penyedia login tidak dikenal.');
    var r = await db.auth.signInWithOAuth({ provider: p, options: { redirectTo: url('lengkapi.html') } });
    if (r.error) throw r.error;
  }

  window.App = { esc: esc, siap: siap, masuk: masuk, setPw: setPw, HALAMAN: HALAMAN, url: url, loginSosial: loginSosial };

  /* ---------- 2. MENU & PROFIL (halaman setelah login) ---------- */
  var MENU = {   // [teks, tujuan]  — urutan pertama = About, kedua = Eksplor
    student: [['About', 'murid.html'], ['Learning', 'eksplor.html'], ['Tugas', 'murid.html#kelas-sec'], ['Contact', '#contact']],
    teacher: [['About', 'guru.html'],  ['Eksplor', 'eksplor.html'],  ['Tugas', 'guru.html#classes-wrap'], ['Contact', '#contact']],
    parents: [['About', 'orangtua.html'], ['Eksplor', 'eksplor.html'], ['Laporan', 'orangtua.html#anak'], ['Contact', '#contact']]
  };

  function shell() {
    var av = document.querySelector('.avatar'), dd = document.querySelector('.dd'), menu = document.querySelector('[data-menu]');
    if (!av || !dd) return;

    function tutup() { dd.hidden = true; av.setAttribute('aria-expanded', 'false'); }
    av.addEventListener('click', function (e) {
      e.stopPropagation();
      dd.hidden = !dd.hidden;
      av.setAttribute('aria-expanded', String(!dd.hidden));
    });
    document.addEventListener('click', tutup);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') tutup(); });

    siap(function (u) {
      var role = u.role, nama = (u.name || NAMA_ROLE[role]).trim();
      $$('[data-name]').forEach(function (el) { el.textContent = nama; });
      av.textContent = nama.charAt(0).toUpperCase();

      var aktif = document.body.dataset.page === 'eksplor' ? 1 : 0;
      if (menu) menu.innerHTML = MENU[role].map(function (m, i) {
        return '<a href="' + m[1] + '"' + (i === aktif ? ' class="on"' : '') + '>' + m[0] + '</a>';
      }).join('');

      dd.innerHTML = '<a href="' + HALAMAN[role] + '">Beranda saya</a>' +
        (role === 'student' ? '<a href="murid.html#profil">Profil saya</a>' : '') +
        '<a href="#" data-logout>Keluar</a>';     // data-logout ditangani guard.js
    });
  }

  /* ---------- 3. CAROUSEL GAME (dibuat dari data.js) ---------- */
  function carousel() {
    var track = $('track');
    if (!track || !window.GAMES) return;
    var tujuan = track.getAttribute('data-href');   // index.html: semua game mengarah ke login.html

    track.innerHTML = GAMES.map(function (g) {
      var ada = g.levels.length > 0, img = '<img src="' + g.img + '" alt="' + esc(g.nama) + '">';
      return '<div class="card"><div class="pic">' + (ada ? '<a href="' + (tujuan || g.page) + '">' + img + '</a>' : img) + '</div>' +
        '<div class="info"><b>' + esc(g.nama) + '</b><small>' + (ada ? g.levels.length + ' level' : 'Segera hadir') + '</small></div></div>';
    }).join('');

    var cards = $$('.card', track), wadahDots = $('dots'), i = 0;
    wadahDots.innerHTML = cards.map(function () { return '<i></i>'; }).join('');
    var dots = $$('i', wadahDots);

    function go(n) {
      i = (n + cards.length) % cards.length;
      var langkah = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 0;   // lebar kartu + jarak, dihitung langsung
      track.style.transform = 'translateX(' + (-i * langkah) + 'px)';
      cards.forEach(function (c, k) { c.classList.toggle('active', k === i); });
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    }
    $('next').addEventListener('click', function () { go(i + 1); });
    dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); }); });
    window.addEventListener('resize', function () { go(i); });
    go(0);
  }

  /* ---------- 4. HALAMAN LOG IN ---------- */
  function login() {
    var formAkun = $('form-akun');
    if (!formAkun) return;
    var user = $('user'), pw = $('pw'), kode = $('kode'), msgAkun = $('msg-akun'), msgKode = $('msg-kode');

    function tampil(el, teks, error) { el.textContent = teks; el.classList.toggle('err', !!error); }
    function dbSiap(el) {
      if (!window.db) { tampil(el, 'Supabase belum terhubung. Cek supabase-config.js.', true); return false; }
      return true;
    }

    // Kolom kode 6 karakter: otomatis huruf besar. Khusus orang tua (kode anak = 6 huruf)
    var slots = $$('#pin .slot');
    function gambarKode() {
      kode.value = kode.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      var fokus = document.activeElement === kode;
      slots.forEach(function (s, k) {
        var ch = kode.value.charAt(k);
        s.textContent = ch || '-';
        s.classList.toggle('filled', !!ch);
        s.classList.toggle('current', fokus && k === Math.min(kode.value.length, 5));
      });
    }
    ['input', 'focus', 'blur'].forEach(function (ev) { kode.addEventListener(ev, gambarKode); });
    gambarKode();

    // Masuk dengan email/username + kata sandi (Supabase Auth)
    formAkun.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!user.value.trim()) { tampil(msgAkun, 'Email atau username wajib diisi.', true); user.focus(); return; }
      if (!pw.value) { tampil(msgAkun, 'Kata sandi wajib diisi.', true); pw.focus(); return; }
      if (!dbSiap(msgAkun)) return;
      tampil(msgAkun, 'Sedang masuk...');
      try {
        // username -> email (kalau yang diketik sudah email, dipakai apa adanya)
        var cari = await db.rpc('login_email', { identifier: user.value.trim() });
        if (cari.error) throw cari.error;
        if (!cari.data) { tampil(msgAkun, 'Akun atau kata sandi salah.', true); return; }

        var s = await db.auth.signInWithPassword({ email: cari.data, password: pw.value });
        if (s.error) {
          tampil(msgAkun, /not confirmed/i.test(s.error.message || '')
            ? 'Email belum dikonfirmasi. Cek kotak masuk email kamu.'
            : 'Akun atau kata sandi salah.', true);
          return;
        }
        var p = await db.from('profiles').select('role,name').eq('id', s.data.user.id).single();
        if (p.error || !p.data) { tampil(msgAkun, 'Profil akun tidak ditemukan.', true); return; }
        masuk({ role: p.data.role, name: p.data.name });
      } catch (err) {
        console.error(err);
        tampil(msgAkun, 'Gagal terhubung ke server. Coba lagi.', true);
      }
    });

    // Masuk orang tua dengan kode anak (6 huruf, tanpa akun)
    $('form-kode').addEventListener('submit', async function (e) {
      e.preventDefault();
      if (/^\d{6}$/.test(kode.value)) {
        tampil(msgKode, 'Kolom ini khusus orang tua. Murid masuk lewat email atau username di sebelah kiri.', true);
        return;
      }
      if (!/^[A-Z]{6}$/.test(kode.value)) {
        tampil(msgKode, 'Kode anak terdiri dari 6 huruf. Contoh: WIQKXM.', true);
        kode.focus();
        return;
      }
      if (!dbSiap(msgKode)) return;
      tampil(msgKode, 'Memeriksa kode...');
      try {
        var r = await db.rpc('check_child', { p_code: kode.value, p_name: null });
        if (r.error) throw r.error;
        if (r.data === true) masuk({ role: 'parents', name: 'Orang Tua' }, kode.value);
        else tampil(msgKode, 'Kode tidak ditemukan.', true);
      } catch (err) {
        console.error(err);
        tampil(msgKode, 'Gagal terhubung ke server. Coba lagi.', true);
      }
    });

    // Lanjutkan dengan Google / Facebook (OAuth Supabase)
    $$('.btn-social').forEach(function (b) {
      b.addEventListener('click', async function () {
        var nama = b.getAttribute('data-sosial');
        sessionStorage.removeItem('pendingRole');      // dari halaman login tidak ada role pilihan; lengkapi.html yang menanyakan
        b.disabled = true;
        tampil(msgAkun, 'Membuka ' + nama + '...');
        try { await loginSosial(nama); }
        catch (err) {
          console.error(err);
          b.disabled = false;
          tampil(msgAkun, 'Masuk dengan ' + nama + ' gagal. Coba lagi.', true);
        }
      });
    });

    // Lupa kata sandi: kirim tautan atur ulang ke email (boleh ketik email atau username di kolom atas)
    var lupa = $('forgot');
    if (lupa) lupa.addEventListener('click', async function (e) {
      e.preventDefault();
      var v = user.value.trim();
      if (!v) {
        tampil(msgAkun, 'Ketik email atau username kamu di kolom atas dulu, lalu klik "Lupa kata sandi?" lagi.', true);
        user.focus();
        return;
      }
      if (!dbSiap(msgAkun)) return;
      tampil(msgAkun, 'Mengirim tautan...');
      try {
        var email = v;
        if (v.indexOf('@') === -1) {                    // username -> email
          var c = await db.rpc('login_email', { identifier: v });
          if (c.error) throw c.error;
          email = c.data;
        }
        if (email) {
          var r = await db.auth.resetPasswordForEmail(email, { redirectTo: url('reset.html') });
          if (r.error) throw r.error;
        }
        // pesan sama baik akunnya ada atau tidak (supaya orang lain tidak bisa menebak email yang terdaftar)
        tampil(msgAkun, 'Kalau akunnya ada, tautan atur ulang kata sandi sudah dikirim ke emailnya. Cek inbox dan folder spam.');
      } catch (err) {
        console.error(err);
        tampil(msgAkun, /rate limit|too many|seconds/i.test((err && err.message) || '')
          ? 'Terlalu sering meminta tautan. Tunggu beberapa menit lalu coba lagi.'
          : 'Gagal mengirim tautan. Coba lagi.', true);
      }
    });
  }

  /* ---------- 5. CONTACT ---------- */
  function contact() {
    var wrap = document.querySelector('.wrap');
    if (!wrap || $('contact')) return;

    var sec = document.createElement('section');
    sec.className = 'contact';
    sec.id = 'contact';
    sec.innerHTML =
      '<h2>Contact</h2>' +
      '<p class="contact-sub">Ada pertanyaan atau saran soal Coding Game? Tulis pesanmu, kami baca satu per satu.</p>' +
      '<div class="contact-card">' +
        '<form class="contact-form" id="contactForm" novalidate>' +
          '<div class="c-row">' +
            '<div class="c-field"><label for="cName">Your Name</label>' +
              '<input id="cName" name="name" type="text" maxlength="100" autocomplete="name" placeholder="Nama lengkap" required></div>' +
            '<div class="c-field"><label for="cEmail">Your Email</label>' +
              '<input id="cEmail" name="email" type="email" maxlength="254" autocomplete="email" placeholder="nama@email.com" required></div>' +
          '</div>' +
          '<div class="c-field"><label for="cSubject">Your Subject</label>' +
            '<input id="cSubject" name="subject" type="text" maxlength="150" placeholder="Tentang apa?" required></div>' +
          '<div class="c-field"><label for="cMsg">Message</label>' +
            '<textarea id="cMsg" name="message" rows="4" maxlength="3000" placeholder="Write here your message" required></textarea></div>' +
          '<div class="c-hp" aria-hidden="true"><label>Website <input name="website" type="text" tabindex="-1" autocomplete="off"></label></div>' +
          '<div class="c-actions">' +
            '<button class="btn-f c-send" type="submit">Send Message</button>' +
            '<p class="c-status" id="cStatus" role="status" aria-live="polite"></p>' +
          '</div>' +
        '</form>' +
        '<aside class="contact-side">' +
          '<h3>Contact Information</h3>' +
          '<p>Lebih suka langsung? Klik salah satu, kamu akan diarahkan ke aplikasinya.</p>' +
          '<a class="c-link" href="mailto:' + CONTACT.email + '?subject=' + encodeURIComponent('Tanya Coding Game') + '">' +
            '<span class="c-ico"><img src="icon/email.png" alt=""></span>' +
            '<span>Shoot us an email<small>Kirim lewat email</small></span></a>' +
          '<a class="c-link" target="_blank" rel="noopener" href="https://wa.me/' + CONTACT.wa + '?text=' + encodeURIComponent('Halo, saya mau tanya soal Coding Game') + '">' +
            '<span class="c-ico"><img src="icon/whatsapp.png" alt=""></span>' +
            '<span>Message us on WhatsApp<small>Chat langsung</small></span></a>' +
          (CONTACT.line
            ? '<a class="c-link" target="_blank" rel="noopener" href="https://line.me/ti/p/~' + encodeURIComponent(CONTACT.line) + '">' +
                '<span class="c-ico"><img src="icon/line.png" alt=""></span>' +
                '<span>Message us on LINE<small>Chat langsung</small></span></a>'
            : '') +
        '</aside>' +
      '</div>';
    wrap.appendChild(sec);

    var f = $('contactForm'), st = $('cStatus'), btn = f.querySelector('.c-send');
    var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    function status(teks, error) { st.textContent = teks; st.className = 'c-status' + (error ? ' err' : ''); }

    // ambil pesan error dari Edge Function (kalau ada), kalau tidak pakai pesan umum
    async function pesanError(err) {
      try { var j = await err.context.json(); if (j && j.error) return j.error; } catch (e) {}
      return 'Gagal mengirim pesan. Coba lagi sebentar lagi.';
    }

    f.addEventListener('submit', async function (e) {
      e.preventDefault();
      var d = new FormData(f), data = {
        name: d.get('name').trim(), email: d.get('email').trim(),
        subject: d.get('subject').trim(), message: d.get('message').trim(),
        website: d.get('website') || ''           // jebakan spam: manusia tidak mengisinya
      };
      if (!data.name || !data.email || !data.subject || !data.message) return status('Lengkapi semua kolom dulu ya.', true);
      if (!EMAIL_RE.test(data.email)) return status('Format email belum benar.', true);
      if (Date.now() - (+sessionStorage.getItem('contactSent') || 0) < 20000) return status('Tunggu sebentar sebelum kirim lagi ya.', true);

      // cadangan: kalau Supabase belum tersambung, buka aplikasi email pengguna
      if (!window.db || !db.functions) {
        location.href = 'mailto:' + CONTACT.email + '?subject=' + encodeURIComponent(data.subject) +
          '&body=' + encodeURIComponent('Nama: ' + data.name + '\nEmail: ' + data.email + '\n\n' + data.message);
        return status('Membuka aplikasi emailmu...');
      }

      btn.disabled = true;
      status('Mengirim...');
      try {
        var r = await db.functions.invoke('send-contact', { body: data });
        if (r.error) throw r.error;
        if (!r.data || !r.data.ok) throw new Error('Respons server tidak dikenal');
        sessionStorage.setItem('contactSent', String(Date.now()));
        f.reset();
        status('Terkirim! Terima kasih, pesanmu sudah kami terima.');
      } catch (err) {
        console.error(err);
        status(await pesanError(err), true);
      } finally {
        btn.disabled = false;
      }
    });
  }

  carousel();
  login();
  contact();
  shell();
})();