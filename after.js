/* after.js — beranda GURU dan ORANG TUA (data dari Supabase). Butuh app.js + data.js.
   Menu, nama, avatar, dan tombol Keluar sudah ditangani app.js dan guard.js. */
(function () {
  var role = document.body.dataset.role, esc = App.esc;
  var $ = function (s) { return document.querySelector(s); };
  var ada = function (g) { return g.levels.length > 0; };

  /* ============ ORANG TUA ============ */
  if (role === 'parents') {
    var JUMLAH_LEVEL = GAMES.reduce(function (n, g) { return n + g.levels.length; }, 0);   // semua level game yang sudah jadi
    var laporan = [];

    function menit(detik) {
      var m = Math.round(detik / 60);
      return m >= 60 ? Math.floor(m / 60) + ' j ' + (m % 60) + ' mnt' : m + ' mnt';
    }

    // kode anak: yang dipakai saat login + yang ditambah lewat tombol "+ Tambah kode anak"
    function daftarKode() {
      var arr = []; try { arr = JSON.parse(localStorage.getItem('parentCodes')) || []; } catch (e) {}
      var utama = localStorage.getItem('parentCode');
      if (utama) arr.unshift(utama);
      return arr.filter(function (c, i) { return c && arr.indexOf(c) === i; });
    }

    async function ambilLaporan(kode) {
      var u = window.currentUser;
      if (u && u.report && kode === localStorage.getItem('parentCode')) return u.report;   // sudah diambil guard.js
      var r = await db.rpc('get_child_report', { p_code: kode });
      return r.error ? null : r.data;
    }

    function barisGame(g, prog) {
      var n = g.levels.length, s = prog.filter(function (p) { return p.game === g.id && p.completed; }).length;
      return '<div class="prog-row"><div class="row-h"><b>Game ' + g.id + '</b><span>' +
        (!n ? 'Segera hadir' : s ? 'Level ' + s + '/' + n : 'Belum main') + '</span></div>' +
        '<div class="bar"><i style="width:' + (n ? Math.round(s / n * 100) : 0) + '%"></i></div></div>';
    }

    function gambarAnak() {
      $('#kids').innerHTML = !laporan.length
        ? '<div class="empty">Belum ada data anak. Tambah kode anak di atas.</div>'
        : laporan.map(function (x) {
            var r = x.data, prog = r.progress || [];
            return '<article class="panel" style="margin-bottom:16px">' +
              '<div class="item" style="grid-template-columns:auto 1fr"><div class="ava">' + esc(r.name.charAt(0).toUpperCase()) + '</div>' +
              '<div><h3>' + esc(r.name) + '</h3><span class="muted">' + esc(r['class'] || 'Belum bergabung kelas') +
              ' | kode anak: <span class="kode">' + esc(x.code) + '</span></span></div></div>' +
              '<div class="stats"><div><span class="muted">Level selesai</span><b>' +
              prog.filter(function (p) { return p.completed; }).length + ' / ' + JUMLAH_LEVEL + '</b></div>' +
              '<div><span class="muted">Lama bermain</span><b>' + menit(r.seconds || 0) + '</b></div></div>' +
              GAMES.map(function (g) { return barisGame(g, prog); }).join('') + '</article>';
          }).join('');
    }

    async function muatAnak() {
      var hasil = await Promise.all(daftarKode().map(function (k) {      // semua anak diambil bersamaan
        return ambilLaporan(k).then(function (d) { return d && { code: k, data: d }; })
                              .catch(function (e) { console.error(e); return null; });
      }));
      laporan = hasil.filter(Boolean);
      if (laporan.length) $('#p-title').textContent = 'Orang Tua ' + laporan[0].data.name;
      gambarAnak();
    }
    App.siap(muatAnak);

    $('#add-kid').addEventListener('click', function () { $('#kid-form').hidden = !$('#kid-form').hidden; });
    $('#kid-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var c = $('#kid-code').value.trim().toUpperCase(), n = $('#kid-name').value.trim(), msg = $('#kid-msg');
      if (!/^[A-Z]{6}$/.test(c) || n.length < 3) { msg.textContent = 'Isi nama anak dan kode anak (contoh WIQKXM).'; return; }
      try {
        var ok = await db.rpc('check_child', { p_code: c, p_name: n });
        if (ok.error) throw ok.error;
        if (ok.data !== true) { msg.textContent = 'Kode atau nama anak tidak cocok. Tanyakan kode ke guru.'; return; }
        var arr = []; try { arr = JSON.parse(localStorage.getItem('parentCodes')) || []; } catch (x) {}
        if (arr.indexOf(c) === -1) arr.push(c);
        localStorage.setItem('parentCodes', JSON.stringify(arr));
        e.target.reset(); e.target.hidden = true; msg.textContent = '';
        muatAnak();
      } catch (err) { console.error(err); msg.textContent = 'Gagal terhubung ke server. Coba lagi.'; }
    });
  }

  /* ============ GURU ============ */
  if (role === 'teacher') {
    var classes = [];
    var jumlah = function (c) { return c.students && c.students[0] ? c.students[0].count : 0; };

    // hanya game yang sudah jadi yang bisa ditugaskan; jumlah level mengikuti game-nya
    function opsiGame(sel) {
      return GAMES.filter(ada).map(function (g) {
        return '<option value="' + g.id + '"' + (g.id === sel ? ' selected' : '') + '>Game ' + g.id + '</option>';
      }).join('');
    }
    function opsiLevel(game, sel) {
      var n = (gameById(game) || { levels: [] }).levels.length || 20, s = '';
      for (var i = 1; i <= n; i++) s += '<option value="' + i + '"' + (i === sel ? ' selected' : '') + '>Level ' + i + '</option>';
      return s;
    }

    function gambarKelas() {
      $('#classes-wrap').hidden = !classes.length;
      $('#classes').innerHTML = classes.map(function (c, i) {
        return '<article class="panel item" data-i="' + i + '"><div class="ava">' + esc(c.name.charAt(0).toUpperCase()) + '</div>' +
          '<div><h3>' + esc(c.name) + '</h3><span class="muted">Kode kelas: <span class="kode">' + esc(c.code) + '</span> · ' + jumlah(c) + ' murid</span>' +
          '<div class="btns" style="margin-top:10px"><span class="muted">Tugas:</span>' +
          '<select class="pick" data-f="game">' + opsiGame(c.game) + '</select>' +
          '<select class="pick" data-f="level">' + opsiLevel(c.game, c.level) + '</select></div></div>' +
          '<div class="btns"><button class="btn-f" data-a="view">Lihat murid</button><button class="btn-o" data-a="del">Hapus</button></div>' +
          '<div class="detail" hidden style="grid-column:1/-1"></div></article>';
      }).join('');
      $('#cnt').textContent = classes.length;
    }

    async function muat() {
      try { classes = await Kelas.daftarGuru(); }
      catch (err) { console.error(err); classes = []; }
      gambarKelas();
    }
    App.siap(muat);

    $('#new-class').addEventListener('click', async function () {
      var n = prompt('Nama kelas (contoh: Kelas 5A)'); if (!n || !n.trim()) return;
      try {
        var k = await Kelas.buat(n.trim());
        await muat();
        alert('Kelas dibuat.\nKode kelas: ' + k.code + '\nBagikan kode ini ke murid.');
      } catch (err) { alert(err.message); }
    });

    // ganti game / level tugas kelas
    $('#classes').addEventListener('change', async function (e) {
      var f = e.target.dataset.f, card = e.target.closest('.item');
      if (!f || !card) return;
      var c = classes[card.dataset.i];
      c[f] = +e.target.value;
      if (f === 'game') c.level = 1;          // ganti game -> mulai dari level 1
      try { await Kelas.atur(c.id, c.game, c.level); }
      catch (err) { alert(err.message); }
      if (f === 'game') gambarKelas();        // jumlah level mengikuti game yang dipilih
    });

    $('#classes').addEventListener('click', async function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var card = b.closest('.item'), c = classes[card.dataset.i];
      if (b.dataset.a === 'del') {
        if (!confirm('Hapus kelas "' + c.name + '"? Murid tidak ikut terhapus.')) return;
        try { await Kelas.hapus(c.id); await muat(); } catch (err) { alert(err.message); }
        return;
      }
      var d = card.querySelector('.detail');
      if (!d.hidden) { d.hidden = true; return; }
      try {
        var murid = await Kelas.murid(c.id), n = (gameById(c.game) || { levels: [] }).levels.length || 20;
        d.innerHTML = murid.length ? murid.map(function (s) {
          var selesai = (s.progress || []).filter(function (p) { return p.completed; }).length;
          return '<div class="prog-row"><div class="row-h"><b>' + esc(s.name) + '</b><span>Kode anak: <span class="kode">' + esc(s.child_code) + '</span> · ' +
            (selesai ? selesai + ' level selesai' : 'Belum main') + '</span></div>' +
            '<div class="bar"><i style="width:' + Math.min(100, Math.round(selesai / n * 100)) + '%"></i></div></div>';
        }).join('') : 'Belum ada murid. Bagikan kode kelas ' + esc(c.code) + ' ke murid.';
        d.hidden = false;
      } catch (err) { alert(err.message); }
    });

    $('#show').addEventListener('click', function (e) {
      var p = $('#prog'); p.hidden = !p.hidden;
      e.currentTarget.textContent = p.hidden ? 'Tampilkan' : 'Sembunyikan';
      p.innerHTML = classes.length ? classes.map(function (c) {
        return '<div class="prog-row"><div class="row-h"><b>' + esc(c.name) + '</b><span>' + jumlah(c) + ' murid</span></div></div>';
      }).join('') : 'Belum ada kelas.';
    });
  }
})();
