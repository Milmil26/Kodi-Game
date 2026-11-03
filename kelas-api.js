/* kelas-api.js — fungsi siap pakai untuk fitur kelas
   Pasang SETELAH supabase-config.js:
     <script src="kelas-api.js"></script>
   Semua fungsi async; kalau gagal akan melempar Error dengan pesan Indonesia. */
(function () {
  function cek(r) {
    if (r.error) throw new Error(r.error.message || 'Terjadi kesalahan.');
    return r.data;
  }

  window.Kelas = {
    /* ---------- GURU ---------- */

    // Buat kelas baru -> { id, name, code }
    buat: async function (nama) {
      return cek(await db.rpc('create_class', { p_name: nama }));
    },

    // Daftar kelas milik guru yang login -> [{ id, name, code, created_at }]
    daftarGuru: async function () {
      return cek(await db.from('classes')
        .select('id,name,code,game,level,created_at,students(count)')
        .order('created_at', { ascending: false }));
    },

    // Atur game dan level aktif sebuah kelas
    atur: async function (classId, game, level) {
      return cek(await db.from('classes')
        .update({ game: game, level: level }).eq('id', classId));
    },

    // Murid dalam satu kelas + progresnya
    // -> [{ id, name, child_code, progress: [{game, level, completed}] }]
    murid: async function (classId) {
      return cek(await db.from('students')
        .select('id,name,child_code,progress(game,level,completed)')
        .eq('class_id', classId)
        .order('name'));
    },

    // Hapus kelas (murid tidak terhapus, hanya keluar dari kelas)
    hapus: async function (classId) {
      return cek(await db.from('classes').delete().eq('id', classId));
    },

    /* ---------- MURID ---------- */

    // Gabung kelas pakai kode 6 angka -> { id, name }
    gabung: async function (kode) {
      return cek(await db.rpc('join_class', { p_code: kode }));
    },

    // Kelas murid saat ini -> { name, code } atau null kalau belum gabung
    kelasSaya: async function () {
      var s = await db.auth.getSession();
      var uid = s.data.session && s.data.session.user.id;
      if (!uid) return null;
      var d = cek(await db.from('students')
        .select('class_id,classes(name,code)')
        .eq('user_id', uid).maybeSingle());
      return d && d.classes ? d.classes : null;
    },

    // Info kelas murid: { class, teacher, game, level, done, students:[{name, me}] } atau null
    info: async function () {
      return cek(await db.rpc('get_my_class'));
    },

    // Murid keluar dari kelas
    keluar: async function () {
      return cek(await db.rpc('leave_class'));
    },

    // Kode anak milik murid (untuk dikasih ke orang tua) -> 'WIQKXM'
    kodeAnak: async function () {
      var s = await db.auth.getSession();
      var uid = s.data.session && s.data.session.user.id;
      if (!uid) return null;
      var d = cek(await db.from('students')
        .select('child_code').eq('user_id', uid).maybeSingle());
      return d ? d.child_code : null;
    }
  };
})();