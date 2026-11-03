/* data.js — SUMBER DATA TUNGGAL untuk semua game.
   Dipakai oleh: index.html & murid.html (carousel), eksplor.html (daftar level),
   guru.html & orangtua.html (jumlah level), game1.html (isi level).
   Tambah / ubah level atau game cukup di sini. Tidak perlu edit file lain.

   Isi tiap level (game yang sudah jadi):
     t   = judul level          ins = instruksi untuk anak
     s   = posisi awal (x, y, d: 0=atas 1=kanan 2=bawah 3=kiri)
     g   = posisi tujuan        w   = daftar batu penghalang [x,y]
     g2  = (pilihan) tujuan KEDUA: level selesai setelah karakter mampir ke g DAN g2 (urutan bebas)
   Game yang belum jadi: isi  levels:[]  -> tampil "Segera hadir" dan tidak bisa dipilih guru. */
window.GAMES = [
  {
    id: 1, page: 'game1.html', img: 'image/game1.png',
    nama: 'Impostor & Crewmate', judul: 'Misi Sang Impostor & Crewmate',
    ct: 'Anak menyusun blok perintah supaya karakter sampai ke tujuan. Level 1-5 melatih <b>algoritma</b> (urutan langkah) dan <b>debugging</b> saat ada batu penghalang. Level 6-10 memperkenalkan blok Ulangi untuk melatih <b>pengenalan pola</b>. Level 11-15 menerapkan semuanya di misi crewmate, dan level 16-20 punya dua tujuan sehingga anak harus <b>memecah masalah</b> jadi bagian-bagian kecil.',
    chips: ['Algoritma', 'Pengenalan pola', 'Dekomposisi', 'Debugging'],
    levels: [
    {t:'Drag & Drop',ins:'Jalankan karakter ke tujuan.',s:{x:0,y:2,d:1},g:{x:4,y:2},w:[]},
    {t:'Belok Kiri',ins:'Maju dulu, lalu belok kiri untuk sampai ke tujuan.',s:{x:1,y:2,d:1},g:{x:4,y:0},w:[]},
    {t:'Belok Kanan',ins:'Gunakan belok kanan untuk turun ke tujuan.',s:{x:3,y:1,d:1},g:{x:5,y:4},w:[[3,3],[5,2]]},
    {t:'Hindari Box',ins:'Ada batu di jalan. Cari jalan memutar!',s:{x:0,y:2,d:1},g:{x:4,y:2},w:[[3,2]]},
    {t:'Jalan Memutar',ins:'Dinding box panjang. Cari jalur yang aman.',s:{x:2,y:4,d:0},g:{x:4,y:1},w:[[2,2],[3,2],[4,2],[5,2]]},
    /* ---- Level 6-10: ada blok ULANGI. Tiap level punya pola yang berulang ---- */
    {t:'Ulangi Maju',ins:'Tujuannya jauh! Pakai blok Ulangi, lalu masukkan Gerak maju ke dalamnya.',s:{x:0,y:2,d:1},g:{x:9,y:2},w:[]},
    {t:'Tangga',ins:'Naik tangga! Maju, belok kiri, maju, belok kanan... polanya berulang.',s:{x:1,y:3,d:1},g:{x:4,y:0},w:[[1,2],[2,1],[0,3],[5,1],[4,2],[3,3],[3,0],[2,4]]},
    {t:'Dua Ulangan',ins:'Jalan lurus dulu, belok, lalu lurus lagi. Pakai Ulangi dua kali.',s:{x:0,y:1,d:1},g:{x:7,y:4},w:[[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[6,2],[6,3]]},
    {t:'Zig-zag',ins:'Ikuti jalan zig-zag. Cari pola yang berulang.',s:{x:3,y:0,d:2},g:{x:8,y:4},w:[[4,0],[5,1],[6,1],[7,2],[8,2],[3,2],[4,3],[5,4]]},
    {t:'Mengelilingi Batu',ins:'Putar mengelilingi box.',s:{x:3,y:0,d:1},g:{x:3,y:3},w:[[3,2],[2,2],[3,1],[2,1]]},
    /* ---- Level 11-15: bagian crewmate 1 ---- */
    {t:'Crewmate',ins:'Kita punya misi! Sampai ke tujuan untuk menyelesaikan misi.',s:{x:2,y:2,d:1},g:{x:8,y:3},w:[]},
    {t:'Putar Arah',ins:'Tujuan ada di kiri atas, tapi karakter menghadap ke kanan. Belok dulu, lalu pakai Ulangi supaya kodenya singkat.',s:{x:7,y:3,d:1},g:{x:4,y:0},w:[]},
    {t:'Dua Jalan',ins:'Bantu crewmate mencapai tujuan.',s:{x:3,y:0,d:1},g:{x:6,y:3},w:[[2,1],[3,1],[5,1],[6,1]]},
    {t:'Terjebak',ins:'Ikuti yang terbuka untuk sampai ke tujuan.',s:{x:5,y:0,d:1},g:{x:8,y:3},w:[[4,0],[5,1],[6,1],[7,2],[8,2]]},
    {t:'Dinding Tiga Box',ins:'Tiga box menghalangi di bawah. Lewati untuk sampai ke tujuan.',s:{x:3,y:1,d:1},g:{x:3,y:3},w:[[3,2],[2,2],[4,2]]},
    /* ---- Level 16-20: bagian impostor 2 ---- */
    {t:'Sampai ke tujuan',ins:'Mampir ke tujuan pertama dulu, lalu hindari batu untuk sampai ke tujuan kedua.',s:{x:2,y:2,d:1},g:{x:6,y:2},g2:{x:8,y:3},w:[[7,2]]},
    {t:'Ada 2 crewmate',ins:'Ada 2 tujuan! Sampai ke keduanya dulu, baru level selesai.',s:{x:0,y:3,d:1},g:{x:4,y:0},g2:{x:3,y:0},w:[]},
    {t:'Lewat Celah',ins:'Ada tembok tinggi di tengah. Cari celah di bawah, capai satu tujuan, lalu naik ke tujuan satunya lagi.',s:{x:0,y:1,d:1},g:{x:4,y:3},g2:{x:4,y:0},w:[[2,0],[2,1],[2,2]]},
    {t:'Dua Tujuan',ins:'Jalannya berbentuk tangga dan ada 2 tujuan. Ulangi pola: maju, belok kanan, maju, belok kiri!',s:{x:1,y:1,d:1},g:{x:3,y:2},g2:{x:5,y:2},w:[[0,1],[1,2],[2,3],[3,4],[2,0],[3,1],[4,2]]},
    {t:'Misi Terakhir',ins:'Lorong berkelok-kelok! Lewati semua celah dan capai kedua tujuan. Cari bagian yang bisa diulang.',s:{x:1,y:2,d:4},g:{x:3,y:2},g2:{x:7,y:0},w:[[2,1],[2,2],[2,3],[2,4],[4,0],[4,1],[4,2],[4,3],[6,1],[6,2],[6,3],[6,4]]}
    ]
  },
  {
    id: 2, page: 'game2.html', img: "image/game2.jpeg",
    nama: "Cahaya Terakhir", judul: "Cahaya Terakhir (The Last Light)",
    ct: "Ikuti kisah Si Anak melawan Shadow sambil menyusun blok perintah. Level 1-10 melatih <b>algoritma</b> (urutan langkah); mulai Level 8 anak memakai blok ambil dan berikan untuk misi dua tujuan. Level 11-14 memperkenalkan Ulangi untuk <b>pengenalan pola</b>, level 15-19 memakai Jika untuk <b>memilih jalur sesuai kondisi</b>, dan level 20-25 menggabungkan semuanya (dua tujuan) untuk <b>memecah masalah</b>.",
    chips: ["Algoritma","Pengenalan pola","Kondisi (jika)","Dekomposisi"],
    /* Game 2: tiap level punya cerita sebelum/sesudah main. Field tambahan di game ini:
       map = nomor latar (nomor = isi BG di game2.js): 1-3 taman, 4 peralihan, 5 toko, 6 kamar nenek
       gw, gh = lebar & tinggi papan (jumlah petak)
       w  = penghalang [x,y]. Mau gambar khusus di satu petak: [x,y,'pohon.png'] (file di image/game2/)
       dk = petak gelap/bayangan [x,y]: menabrak = gagal, dan dihitung "rintangan" oleh blok jika
       aksi = cara level selesai:  (kosong) menginjak g  |  'ambil' berdiri di g lalu blok Ambil  |  'antar' Ambil di g, lalu Berikan di g2
            |  'serang' (level 25) kalahkan 3 Shadow (g, g2, g3) dengan blok Serang, urutan bebas
       ending = (level terakhir) dialog yang muncul di atas gambar penutup, sesudah 'after' dan sebelum tulisan TAMAT
       g2 = tujuan kedua (untuk aksi 'antar')
       cond = teks kondisi blok jika   hint = petunjuk kecil   best = langkah maju tersingkat
       before / after = percakapan:  'Nama|teks' = dialog, '*teks' = narasi, '#teks' = judul babak
       Blok: maju, belok kiri/kanan dari Level 1; Ambil & Berikan dari Level 8; Ulangi dari 11; Jika dari 15

       GAMBAR (tujuan, shadow, tongkat, penghalang, dst) TIDAK diatur di sini lagi:
       lihat GAMBAR_LEVEL di bagian atas game2.js. Suara: SUARAS di file yang sama. */
    levels: [
    /* 1 */
    {t:"Bertemu Shadow",ins:"Ada shadow didepan. Rencanakan rutenya sebelum menjalankan.",map:1,gw:8,gh:4,s:{x:0,y:0,d:1},g:{x:4,y:2},w:[[5,0],[1,1],[3,1],[5,2],[1,3],[2,3],[3,3]],dk:[],
     before:["#BABAK 1 · Kekalahan dan Perjalanan","Anak|Aku harus melawannya agar desa ini tidak ditelan kegelapan"],
     after:["Shadow|Beraninya manusia sepertimu mendatangiku","Anak|Gak akan ku biarkan kamu menghilangkan cahaya di desa ini!"]},
     /* 2 */
    {t:"Pertarungan Pertama",ins:"Seret blok maju untuk mendekati Shadow. Tongkat ajaibmu akan menyerang otomatis saat kamu sampai!",map:1,gw:10,gh:5,s:{x:2,y:2,d:1},g:{x:6,y:2},w:[],dk:[[3,3],[3,0],[5,0],[4,2],[5,3],[6,1]],
     before:["Anak|Kamu yang bikin desa jadi gelap, kan? Nggak akan kubiarin!","Shadow|..."],
     after:["*Tongkat Anak terpental jauh, Anak terjatuh.","Anak:sedih|Tongkatku... argh tubuhku nggak bisa digerakin...","Shadow|Manusia lemah sepertimu gak bisa mengalahkanku. Hahaha.","*Shadow menghilang."]},
    /* 3 */
    {t:"Tongkat yang Hilang",ins:"Cari tongkatmu di taman. Jalan ke tongkatnya, lalu pakai blok ambil.",map:2,gw:6,gh:5,s:{x:0,y:4,d:1},g:{x:3,y:1},w:[],dk:[[2,2],[2,3],[0,3],[4,4]],aksi:"ambil",
     before:["Anak|Tongkatku sepertinya jatuh di sekitar sini. Aku harus menemukan tongkatku."],
     after:["Anak|Ternyata ini hanya tongkat bagian atasnya saja.","Anak|Ada bekas cahaya di sana. Kayaknya sebelah lagi tongkatku mendarat di dekat situ."]},
    /* 4 */
    {t:"Tongkat yang Patah",ins:"Jalan ke dekat pohon besar tanpa menginjak petak gelap.",map:2,gw:8,gh:5,ox:3,oy:1,s:{x:2,y:3,d:1},g:{x:7,y:1},w:[[6,1]],dk:[[2,2],[3,2],[3,4],[5,1],[7,3]],
     before:["Anak|Pelan-pelan aja, jangan sampai kena sisa bayangan itu."],
     after:["Anak|Tongkatku patah jadi dua. Cuma satu potongan yang ketemu, satunya entah di mana.","Anak|Tanpa ini aku nggak bisa ngalahin Shadow. Tapi aku nggak boleh nyerah."]},
    /* 5 */
    {t:"Jalan Setapak",ins:"Ikuti jalan setapak yang berkelok. Susun blok dengan urutan yang tepat.",map:2,gw:8,gh:5,ox:4,oy:1,s:{x:1,y:2,d:2},g:{x:6,y:2},w:[[3,2],[5,2]],dk:[[2,2],[4,2]],
     before:["Anak|Jalannya sepi banget..."],
     after:["Anak|Kakiku capek. Tapi di ujung sana kayaknya ada cahaya."]},
    /* 6 */
    {t:"Lampu di Kejauhan",ins:"Ada cahaya lampu di ujung jalan. Jalan menuju ke sana dan hindari lubang gelap.",map:2,gw:8,gh:5,ox:2,oy:2,s:{x:2,y:2,d:1},g:{x:7,y:4},w:[],dk:[[2,3],[3,3],[4,2],[5,2],[6,3]],
     before:["Anak|Itu lampu... atau cuma ilusi?"],
     after:["Anak|Bukan ilusi! Ada bangunan kecil di sana."]},
    /* 7 */
    {t:"Kedai di Ujung Jalan",ins:"Dekati Nenek tersebut. Gabungkan maju dan belok dengan benar.",map:4,gw:12,gh:5,ox:0,oy:1,s:{x:0,y:2,d:1},g:{x:6,y:3},w:[],dk:[],
     before:["Anak|Kedai teh... buka nggak, ya?","Anak|Apakah Nenek itu?"],
     after:["Nenek|Ya ampun, anak kecil sendirian malam-malam. Masuk, Nak, di luar dingin.","Nenek|Duduk dulu. Nenek ambilkan makanan hangat."]},
    /* 8 */
    {t:"Pesanan Pertama",ins:"Blok baru: ambil dan berikan! Ambil teh di dapur, lalu antar dan berikan ke meja pelanggan. Urutan langkahnya harus tepat.",map:5,gw:11,gh:7,ox:1,oy:0,s:{x:7,y:1,d:2},g:{x:9,y:2},g2:{x:6,y:1},w:[[5,1,'pelanggan3.png'],[4,4,'pelanggan4.png'],[7,3,'pelanggan2.png'],[6,4,'pelanggan5.png'],[9,4,'nenek1.png']],dk:[],aksi:"antar",
     before:["#BABAK 2 · Hari-Hari di Kedai","Nenek|Kalau mau, bantu Nenek antar teh ke meja itu.","Anak|Boleh, Nek!"],
     after:["Pelanggan|Tehnya enak! Kamu anak baru, ya?","Anak|Cuma numpang bantu, Kak."]},
    /* 9 */
    {t:"Bayangan di Jendela",ins:"Ada sesuatu di luar jendela. Jalan ke jendela tanpa menginjak petak gelap.",map:5,gw:7,gh:4,s:{x:0,y:3,d:1},g:{x:1,y:0},w:[[6,1,'nenek1.png']],dk:[[2,2],[2,3]],
     before:["Anak|Nek, ada yang berdiri di luar...","Nenek|Mungkin cuma pohon, Nak. (suaranya agak tegang)"],
     after:["Anak|Itu Shadow, Nek. Dia ngikutin aku.","Nenek|Jangan terlalu dekat nak. Tutup jendelanya, Kamu aman di sini."]},
    /* 10 */
    {t:"Secangkir Teh Hangat",ins:"Mengambil teh, lalu bawa dan berikan ke meja Nenek. Rutenya lebih panjang, rencanakan dulu.",map:5,gw:7,gh:5,ox:1,oy:1,s:{x:0,y:3,d:1},g:{x:3,y:0},g2:{x:4,y:2},w:[[1,1],[2,2],[2,4],[5,2,'nenek2.png']],dk:[],aksi:"antar",
     before:["Nenek|Ambil teh itu lalu duduk sini, ceritakan perjalananmu Nak."],
     after:["Anak|Aku dulu punya tongkat ajaib, tapi patah waktu lawan Shadow.","*Nenek terdiam, menatap ke arah tangga lantai 2.","Nenek|...Begitu, Apakah kamu terluka?","Anak|Sekarang sudah lebih baik.","Nenek|Syukurlah... diminum dulu tehnya.","Anak|Makasih Nek (Teh hangatnya membuatku lebih baik)"]},
    /* 11 */
    {t:"Rahasia Resep Nenek",ins:"Membuat teh bersama Nenek. Berikan teh kepada pelanggan",map:5,gw:9,gh:5,s:{x:8,y:1,d:3},g:{x:7,y:0},g2:{x:5,y:3},w:[[8,3,'nenek2.png'],[3,0,'pelanggan4.png'],[3,3,'pelanggan1.png'],[4,3,'pelanggan2.png'],[4,0,'pelanggan5.png'],[3,4,'pelanggan3.png']],dk:[],aksi:"antar",
     before:["Nenek|Kunci teh enak itu sabar dan pengulangan. Aduk, aduk, aduk.","Anak|Berarti gerakannya sama terus, Nek?"],
     after:["Anak|Senang rasanya melihat pelanggan puas.","Nenek|Nah, kamu cepat belajar."]},
    /* 12 */
    {t:"Pelanggan yang Aneh",ins:"Pola jalannya berulang: maju, belok, maju, belok. Taruh keduanya di dalam ulangi.",map:5,gw:9,gh:5,s:{x:0,y:4,d:1},g:{x:5,y:1},w:[[1,2],[0,1],[2,4],[8,3,'nenek2.png'],[5,0,'pelanggan6.png'],],dk:[],
     before:["Pengembara|Nak, apakah kamu pernah melihat makhluk gelap?","Anak|...","Pengembara|Aku pernah melihat makhluk gelap itu di hutan. Tanaman di sana layu semua.","Anak|Kakek tau cara mengalahkannya?"],
     after:["Pengembara|Tongkat biasa gak cukup, Nak. Cuma Kristal Hikari yang bisa melawannya.","Anak|Kristal Hikari? Di mana aku bisa nemuin itu?","Pengembara|Itu yang nggak kuketahui. Tapi kamu harus mencarinya."]},
    /* 13 */
    {t:"Peta Tua di Taman",ins:"Kembali ke taman. Pakai ulangi untuk menyingkat jalur yang berpola dan ambil petanya.",map:2,gw:9,gh:5,ox:3,oy:1,s:{x:3,y:4,d:1},g:{x:7,y:0},w:[],dk:[[5,1],[3,2],[3,3],[5,2],[5,4],[6,4],[8,0]],aksi:"ambil",
     before:["Anak|Satu potongan tongkatku masih hilang. Mungkin masih ada di taman ini.","Anak|Aku cek lagi, siapa tau ketemu."],
     after:["Anak|Potongan tongkatnya nggak ada, tapi... aku dapat peta tua ini.","Anak|Petanya mengarah ke salah satu taman lain. Mungkin ada hubungannya sama Kristal Hikari."]},
    /* 14 */
    {t:"Jejak di Taman Gelap",ins:"Ikuti tanda yang diberikan. Gabungkan maju, belok, dan ulangi.",map:3,gw:8,gh:5,ox:4,oy:1,s:{x:3,y:0,d:2},g:{x:6,y:4},w:[],dk:[[4,0],[5,1],[6,2],[2,1],[3,2],[4,3],[5,4]],
     before:["Anak|Kristal Hikari mungkin ada di sekitar sini.","Anak|Gelapnya..."],
     after:["Anak|Taman ini bahkan lebih gelap dari sebelumnya.","Anak| Shadow pasti sudah melewati taman ini, tapi kristalnya nggak ada."]},
    /* 15 */
    {t:"Sosok Tanpa Wajah",ins:"Blok baru: jika! Contoh: jika ada lubang di depan, belok. Kalau tidak ada, jalan terus.",hint:"Letakkan blok jika di dalam ulangi.",map:3,gw:14,gh:5,s:{x:4,y:1,d:1},g:{x:7,y:4},w:[[12,1,'shadow5.png']],dk:[[4,0],[12,0],[13,1],[12,2],[11,1],[8,2],[8,3],[8,1],[4,2],[5,3]],cond:"ada lubang di depan",
     before:["#BABAK 3 · Bayangan Mendekat","Anak|Itu Shadow. Dia nggak punya wajah."],
     after:["Anak|Dia bukan bayangan biasa, dia kayak hidup. Aku harus balik dulu ke kedai."]},
    /* 16 */
    {t:"Rumah Kedua",ins:"Pulang ke kedai lewat jalur aman. Gabungkan jika dan ulangi.",map:5,gw:9,gh:4,ox:0,oy:2,s:{x:0,y:1,d:1},g:{x:7,y:1},w:[[2,0],[4,3],[2,1],[1,3],[4,2],[3,0],[3,3],[8,1,'nenek2.png']],dk:[],
     before:["Anak|Nek... aku kembali.","Nenek|Kemana aja kamu Nak?.","Anak|Abis dari luar sebentar Nek.","*Nenek melihat tangan Anak yang sedikit gemetar.","Nenek|Sini makan dulu mumpung masih hangat.",],
     after:["Anak|Kedai ini... udah kayak rumah.","Nenek|Memang rumah, Nak. Kapan pun kamu mau pulang."]},
    /* 17 */
    {t:"Malam yang Gelisah",ins:"Periksa seisi kedai. Jika ada rintangan, belok. Kalau tidak, maju.",map:5,gw:8,gh:5,ox:3,oy:1,s:{x:1,y:3,d:4},g:{x:7,y:1},w:[[1,1],[7,3,'nenek3.png'],[3,0,'pelanggan1.png'],[3,3,'pelanggan5.png'],[2,0,'pelanggan2.png'],[2,1,'pelanggan3.png']],dk:[],
     before:["Pelanggan 1|Desa sekarang menjadi lebih gelap.","Pelanggan 2|Benar, bahkan kami gak berani keluar terlalu malam akhir-akhir ini."],
     after:["Anak|Desa mulai sepi. Shadow makin dekat.","Nenek|Tetap tenang, Nak."]},
    /* 18 */
    {t:"Cahaya di Lemari",ins:"Naik ke lantai 2 dan telusuri arah cahaya menuju kamar Nenek. Gabungkan jika di dalam ulangi.",map:6,gw:9,gh:4,ox:4,oy:2,s:{x:3,y:3,d:1},g:{x:6,y:0},w:[[1,0,'nenek4.png'],[5,2],[4,2],[3,2],[6,2],[8,1],[8,3]],dk:[],
     before:["Anak|Nenek ke mana, ya? Aku lihat dari bawah ada cahaya dari lantai 2.","Anak|Sepertinya Nenek tidak mendengarku berjalan kesini?."],
     after:["Anak|*Nenek lagi buka lemari... ada sesuatu yang bersinar di dalamnya.","Anak|Mirip yang digambarin Kakek Pengembara. Apa itu Kristal Hikari?"]},
    /* 19 */
    {t:"Kristal Milik Nenek",ins:"Pakai jika untuk memilih jalur sesuai kondisi di kamar. Jika ada rintangan, belok kiri, lalu maju.",hint:"Taruh jika dan maju di dalam ulangi.",map:6,gw:12,gh:4,ox:4,oy:2,s:{x:0,y:3,d:1},g:{x:2,y:1},w:[[2,0,'nenek1.png'],[0,0],[0,1],[1,1],[5,1],[0,2],[1,2],[2,2],[3,2],[5,2],[5,3]],dk:[],
     before:["#BABAK 4 · Cahaya Terakhir","Anak|Nek, jujur... itu Kristal Hikari, kan? Nenek udah tau dari awal?","Nenek|Iya, Nak. Nenek simpan di lemari ini sejak lama."],
     after:["Nenek|Nenek takut Shadow mengikuti kristal ini ke kedai dan membahayakan orang-orang.","Nenek|Jadi Nenek tidak memberi tahumu","Anak|Aku ngerti, Nek. Makasih udah jujur."]},
    /* 20 */
    {t:"Hari yang Ingin Diingat",ins:"Ambil hidangan favorit Nenek, lalu bawa dan berikan ke meja kecil di kamar. Cari jalur yang paling singkat!",map:6,gw:11,gh:5,ox:4,oy:2,s:{x:10,y:3,d:0},g:{x:5,y:3},g2:{x:9,y:1},w:[[10,1,'nenek1.png'],[9,2],[8,2],[7,2],[4,2]],dk:[],aksi:"antar",best:7,
     before:["Nenek|Hari ini Nenek pengen istirahat sambil ngobrol aja, ya.","Anak|Aku bawain hidangan favorit Nenek dulu."],
     after:["Nenek|Enak. Rasanya selalu sama.","Anak|*sambil tersenyum, semoga hari ini tidak cepat berlalu."]},
    /* 21 */
    {t:"Cahaya yang Dipercayakan",ins:"Jalan ke lemari di kamar Nenek, lalu ambil kristalnya.",hint:"Pakai ulangi supaya blokmu singkat.",map:6,gw:10,gh:4,ox:5,oy:2,s:{x:3,y:3,d:2},g:{x:0,y:0},g2:{x:7,y:0},w:[[9,0,'nenek1.png'],[2,2],[3,2],[5,3],[6,3],[7,2],[7,3]],dk:[],aksi:"antar",
     before:["Nenek|Nak... Tolong buka lemari itu lalu ambil Kristalnya."],
     after:["Nenek|Nenek percaya sama kamu. Jaga kristal itu baik-baik ya, gunakan untuk kebaikan.","Anak:senyum|Aku akan jaga ini baik-baik, Nek."]},
    /* 22 */
    {t:"Secangkir Teh Terakhir",ins:"Buat teh dulu, lalu antar dan berikan ke Nenek di kasur. Pakai ulangi dan jika sesuai kebutuhan.",hint:"Setelah ambil, ulangi: jika ada rintangan belok kanan, lalu maju.",map:6,gw:12,gh:5,ox:4,oy:2,s:{x:1,y:2,d:4},g:{x:5,y:3},g2:{x:8,y:0},w:[[10,0,'nenek1.png'],[1,1],[6,0],[9,3],[10,3],[8,4]],dk:[],aksi:"antar",
     before:["*Nenek berbaring di kasur.","Nenek|*Uhuk-uhuk, Nak... Boleh minta secangkir teh?","Anak|Tunggu bentar, Nek. Aku bawain."],
     after:["Nenek|Tehnya masih sehangat dulu.","Anak:sedih|Terima kasih udah jadi rumah buat aku, Nek.","*Nenek berpulang dengan tenang di kasurnya."]},
    /* 23 */
    {t:"Pulang ke Taman",ins:"Kembali ke taman. Gabungkan semua blok yang kamu pelajari.",map:1,gw:8,gh:5,s:{x:0,y:4,d:1},g:{x:4,y:1},w:[],dk:[[3,0],[0,3],[2,1],[1,2],[4,2],[3,3],[2,4]],
     before:["Anak|Taman ini tempat awal semuanya.","Anak:senyum|Kali ini aku nggak sendiri. Ada kristal dari Nenek."],
     after:["*Langit menggelap, Shadow muncul."]},
    /* 24 */
    {t:"Cahaya Hikari",ins:"Hindari serangan Shadow. Jika ada bayangan di depan, belok kanan, lalu maju.",hint:"Taruh jika dan maju di dalam ulangi.",map:3,gw:12,gh:5,s:{x:6,y:0,d:2},g:{x:2,y:2},w:[[2,1,'shadow5.png']],dk:[[2,0],[3,1],[1,3],[1,1],[1,2],[3,2],[5,2],[7,1],[6,4],[9,2]],cond:"ada bayangan di depan",
     before:["Shadow|Hahaha. Masih berani datang kesini? bukankah tongkatmu sudah patah.","Anak:marah|Aku gak butuh tongkat untuk melawan kejahatanmu."],
     after:["Shadow|A-APA ITU?!","*Kristal Hikari bersinar terang.","Shadow:takut|Gawat, A-Apakah itu kristal Hikari?!","Anak|Nek... doakan aku dari sana."]},
    /* 25 */
    {t:"Cahaya Terakhir",ins:"Pertarungan terakhir! Kalahkan ketiga Shadow dengan cahaya Kristal Hikari. Hadapkan karakter ke Shadow, lalu pakai blok serang.",map:1,gw:13,gh:5,s:{x:1,y:3,d:1},g:{x:4,y:1},g2:{x:7,y:3},g3:{x:10,y:3},w:[],dk:[[1,2],[2,4],[5,3],[10,2],[3,1],[3,3],[5,2],[7,1],[6,4],[9,2],[10,0],[10,4],[11,2],[11,3],[12,4]],aksi:"serang",cond:"ada Shadow di depan",
     before:["Anak|Semoga dengan ini desa bisa kembali terang dan hangat.","Anak:marah|Shadow! kejahatanmu akan segera berakhir."],
     after:["Shadow:takut|ARRGGGHHHH!!!TIDAAKK..","Anak|Selesai... Shadow udah hilang."],
     ending:["Anak|Nek, tehnya udah dingin, tapi aku masih inget rasanya.","*Anak menatap dua cangkir teh di meja, satu untuk dirinya, satu untuk Nenek. Tongkat patah disimpan di sisinya."]}
    ]
  },
  { id: 3, img: 'image/comingsoon.jpeg', nama: 'Game 3',               judul: 'Coming Soon',          levels: [] }
];

// bantu cari game berdasarkan nomor
window.gameById = function (id) {
  return window.GAMES.filter(function (g) { return g.id === +id; })[0] || null;
};