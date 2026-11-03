/* guard.js — proteksi halaman murid / guru / orang tua
   Cara pakai (di <head> tiap halaman, SETELAH library Supabase dan supabase-config.js):
     <script src="guard.js" data-role="student"></script>   murid.html
     <script src="guard.js" data-role="teacher"></script>   guru.html
     <script src="guard.js" data-role="parents"></script>   orangtua.html
     <script src="guard.js" data-role="student,teacher,parents"></script>   halaman bersama (eksplor.html)

   Nama, menu, dan avatar diisi oleh app.js setelah event 'auth-ready' (data user ada di window.currentUser).

   PENTING: ini hanya pengaman tampilan (UX). Perlindungan data yang sebenarnya
   ada di aturan RLS di Supabase, bukan di file ini.
*/
(function () {
  var ROLES = document.currentScript.getAttribute('data-role').split(',').map(function (r) { return r.trim(); });
  var HALAMAN = window.HALAMAN = { student: 'murid.html', teacher: 'guru.html', parents: 'orangtua.html' };

  // Sembunyikan halaman sampai pengecekan selesai (supaya isinya tidak sempat terlihat)
  document.documentElement.style.visibility = 'hidden';

  // hapus semua data login di browser ini (termasuk daftar anak orang tua)
  function bersih() {
    ['user', 'parentCode', 'parentCodes'].forEach(function (k) { localStorage.removeItem(k); });
  }

  function keLogin() {
    bersih();
    location.replace('login.html');
  }

  async function cek() {
    try {
      if (!window.db) { keLogin(); return; }

      // Halaman bersama (banyak role): orang tua dikenali dari role yang disimpan saat login
      var hint = null;
      try { hint = (JSON.parse(localStorage.getItem('user')) || {}).role; } catch (e) {}
      var jalurOrtu = ROLES.indexOf('parents') > -1 && (ROLES.length === 1 || hint === 'parents');

      if (jalurOrtu) {
        // Orang tua: tanpa akun, divalidasi lewat kode anak
        var code = localStorage.getItem('parentCode');
        if (!code) { keLogin(); return; }
        var r = await db.rpc('get_child_report', { p_code: code });
        if (r.error || !r.data) { keLogin(); return; }
        window.currentUser = { role: 'parents', report: r.data };
      } else {
        // Murid / guru: harus punya sesi Supabase yang masih berlaku
        var s = await db.auth.getSession();
        if (!s.data.session) { keLogin(); return; }

        var p = await db.from('profiles').select('role,name,birth')
                        .eq('id', s.data.session.user.id).maybeSingle();
        if (p.error) { await db.auth.signOut(); keLogin(); return; }
        // Login Google/Facebook pertama kali: sesi ada tapi profil/role belum diisi -> lengkapi dulu
        if (!p.data || !p.data.role || !p.data.birth) { location.replace('lengkapi.html'); return; }

        // Role tidak diizinkan di halaman ini -> arahkan ke halaman yang benar
        if (ROLES.indexOf(p.data.role) === -1) { location.replace(HALAMAN[p.data.role]); return; }

        window.currentUser = { role: p.data.role, name: p.data.name, id: s.data.session.user.id };
      }

      document.documentElement.style.visibility = '';
      document.dispatchEvent(new CustomEvent('auth-ready', { detail: window.currentUser }));
    } catch (err) {
      console.error(err);
      keLogin();
    }
  }

  // Keluar: pasang atribut data-logout di tombol apa pun, atau panggil logout()
  window.logout = async function () {
    try { if (window.db) await db.auth.signOut(); } catch (e) { console.error(e); }
    keLogin();
  };
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-logout]');
    if (t) { e.preventDefault(); window.logout(); }
  });

  // Tombol Back browser: cek ulang kalau halaman dimuat dari cache
  window.addEventListener('pageshow', function (e) { if (e.persisted) cek(); });

  cek();
})();