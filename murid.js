/* murid.js — beranda MURID (data dari Supabase). Butuh app.js + data.js + kelas-api.js.
   Menu, nama, avatar, dan tombol Keluar sudah ditangani app.js dan guard.js. */
(function () {
  var $ = function (id) { return document.getElementById(id); };

  /* ---- Terakhir dimainkan: hanya muncul kalau murid pernah main ---- */
  async function muatTerakhir() {
    try {
      var r = await db.from('progress').select('game,level,completed,updated_at').order('updated_at', { ascending: false });
      if (r.error || !r.data || !r.data.length) return;           // belum pernah main -> tetap tersembunyi
      var t = r.data[0], g = gameById(t.game);
      if (!g || !g.levels.length) return;
      var total = g.levels.length,
          selesai = r.data.filter(function (x) { return x.game === t.game && x.completed; }).length,
          lanjut = Math.min(total, t.level + (t.completed ? 1 : 0));
      $('last-img').src = g.img;
      $('last-title').textContent = g.judul;
      $('last-level').textContent = 'Level ' + lanjut + ' dari ' + total;
      $('last-bar').style.width = Math.round(selesai / total * 100) + '%';
      $('last-go').href = g.page + '?level=' + lanjut;
      $('last-sec').hidden = false;
    } catch (err) { console.error(err); }
  }

  /* ---- Kelas: guru, tugas, teman sekelas (hanya tampil kalau sudah gabung kelas) ---- */
  async function muatKelas() {
    var sec = $('kelas-sec');
    try {
      var d = await Kelas.info(), g = d && gameById(d.game);
      if (!d) { sec.hidden = true; return; }
      $('k-nama').textContent = d['class'];
      $('k-guru').textContent = d.teacher || '-';
      $('k-tugas').className = 'tugas' + (d.done ? ' done' : '');
      $('k-tugas-teks').textContent = 'Game ' + d.game + ' \u00B7 Level ' + d.level;
      $('k-tugas-status').textContent = d.done ? 'Sudah selesai' : 'Belum dikerjakan';
      var go = $('k-tugas-go');
      go.hidden = !!d.done || !g || !g.levels.length;
      if (g && g.page) go.href = g.page + '?level=' + d.level;
      var ul = $('k-list');
      ul.innerHTML = '';
      (d.students || []).forEach(function (s) {
        var li = document.createElement('li');
        li.textContent = s.name + (s.me ? ' (kamu)' : '');
        if (s.me) li.className = 'me';
        ul.appendChild(li);
      });
      sec.hidden = false;
    } catch (err) { console.error(err); sec.hidden = true; }
  }

  App.siap(function () { muatTerakhir(); muatKelas(); });

  /* ---- Profil saya (popup): nama, username, kode anak, gabung kelas ---- */
  var pf = $('pf'), pfMsg = $('pf-msg');
  function pesan(t, err) { pfMsg.textContent = t; pfMsg.className = 'pf-msg' + (err ? ' err' : ''); }

  async function isiProfil() {
    pesan('');
    try {
      var u = window.currentUser;
      var p = await db.from('profiles').select('name,username').eq('id', u.id).single();
      $('pf-nama').textContent = (p.data && p.data.name) || u.name || '-';
      $('pf-user').textContent = (p.data && p.data.username) || '-';
      $('pf-kode').textContent = (await Kelas.kodeAnak()) || '-';
      var k = await Kelas.kelasSaya();
      $('pf-kelas').textContent = k ? k.name : 'Belum bergabung';
      $('pf-out').hidden = !k;
    } catch (err) { console.error(err); pesan('Gagal memuat profil.', true); }
  }
  function bukaProfil() { pf.hidden = false; App.siap(isiProfil); }
  function tutupProfil() { pf.hidden = true; }

  // "Profil saya" ada di menu avatar (dibuat app.js) dan juga dibuka dari halaman lain lewat murid.html#profil
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="murid.html#profil"]');
    if (a) { e.preventDefault(); bukaProfil(); }
  });
  if (location.hash === '#profil') { history.replaceState(null, '', location.pathname); bukaProfil(); }

  $('pf-x').addEventListener('click', tutupProfil);
  pf.addEventListener('mousedown', function (e) { if (e.target === pf) tutupProfil(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pf.hidden) tutupProfil(); });
  $('pf-kc').addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 6); });

  $('pf-join').addEventListener('submit', async function (e) {
    e.preventDefault();
    var kc = $('pf-kc').value;
    if (!/^\d{6}$/.test(kc)) { pesan('Kode kelas terdiri dari 6 angka.', true); return; }
    try {
      var k = await Kelas.gabung(kc);
      $('pf-kc').value = '';
      await isiProfil();
      muatKelas();
      pesan('Berhasil masuk kelas ' + k.name + '.');
    } catch (err) { pesan(err.message, true); }
  });
  $('pf-out').addEventListener('click', async function () {
    if (!confirm('Keluar dari kelas ini?')) return;
    try { await Kelas.keluar(); await isiProfil(); muatKelas(); pesan('Kamu sudah keluar dari kelas.'); }
    catch (err) { pesan(err.message, true); }
  });
})();
