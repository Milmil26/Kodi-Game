/* progres-api.js — simpan & baca kemajuan game murid (Supabase)
   Pasang SETELAH supabase-config.js dan guard.js di halaman game. */
(function () {
  window.Progres = {
    // Level yang pernah dibuka/selesai di satu game -> [{ level, completed }]
    muat: async function (game) {
      var r = await db.from('progress').select('level,completed').eq('game', game);
      if (r.error) throw r.error;
      return r.data || [];
    },

    // Catat level dibuka (selesai=false) atau selesai (selesai=true, detik = lama main).
    // Level yang sudah selesai tidak akan menjadi "belum selesai" lagi.
    simpan: function (game, level, selesai, detik) {
      // guru hanya mencoba game: progresnya tidak dicatat (supaya tidak masuk laporan murid)
      if (window.currentUser && window.currentUser.role === 'teacher') return Promise.resolve();
      return db.rpc('save_progress', {
        p_game: game, p_level: level, p_completed: !!selesai, p_seconds: detik || 0
      }).then(function (r) {
        if (r.error) console.error('Gagal menyimpan progres:', r.error.message);
      }).catch(function (e) { console.error('Gagal menyimpan progres:', e); });
    }
  };
})();