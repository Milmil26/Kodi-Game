/* engine2.js — logika murni (tanpa DOM). Dipakai game2.js dan bisa dites di Node. */
const DX = [0, 1, 0, -1];   // arah: 0 atas, 1 kanan, 2 bawah, 3 kiri
const DY = [-1, 0, 1, 0];

// Ubah level dari data.js (s, g, g2, w, dk, gw, gh, aksi) menjadi data siap main.
function parseLevel(raw) {
  const w = raw.gw, h = raw.gh;
  const cells = Array.from({ length: h }, () => Array(w).fill('.'));
  (raw.w || []).forEach(([x, y]) => { cells[y][x] = '#'; });
  (raw.dk || []).forEach(([x, y]) => { cells[y][x] = 'x'; });
  return Object.assign({}, raw, {
    w, h, cells: cells.map((r) => r.join('')),
    sx: raw.s.x, sy: raw.s.y, dir: raw.s.d, gx: raw.g.x, gy: raw.g.y,
    aksi: raw.aksi || 'sampai',
  });
}

/* Jalankan program (pohon blok) dan hasilkan daftar aksi untuk dianimasikan.
   Tiap aksi membawa el (blok DOM yang sedang jalan) dan chain (blok pembungkusnya) untuk penyorotan.
   Cara level selesai (lv.aksi):
     'sampai' = menginjak tujuan g
     'ambil'  = berdiri di g lalu blok ambil
     'antar'  = ambil di g, lalu berdiri di g2 dan blok berikan
     'serang' = kalahkan ketiga Shadow (g, g2, g3) dengan blok serang, urutan bebas */
function simulate(prog, lv) {
  const st = { x: lv.sx, y: lv.sy, d: lv.dir, has: false };
  const actions = [];
  let guard = 0, moves = 0;
  // level 'serang': 3 Shadow (g, g2, g3), SEMUA harus dikalahkan dengan blok serang.
  // Shadow yang masih hidup menghalangi jalan (menabrak = gagal); setelah dikalahkan petaknya bebas.
  const shadows = lv.aksi === 'serang' ? [lv.g, lv.g2, lv.g3] : [];
  const kalah = [false, false, false];
  const jikaCek = new Set(), jikaAktif = new Set();   // untuk petunjuk: Jika mana yang tidak pernah aktif
  const shadowDi = (x, y) => { for (let i = 0; i < shadows.length; i++) if (!kalah[i] && shadows[i] && shadows[i].x === x && shadows[i].y === y) return i; return -1; };
  const adaShadow = (x, y) => shadowDi(x, y) >= 0;
  const blockedAt = (x, y) =>
    x < 0 || y < 0 || x >= lv.w || y >= lv.h || lv.cells[y][x] === '#' || lv.cells[y][x] === 'x' || adaShadow(x, y);
  const front = () => blockedAt(st.x + DX[st.d], st.y + DY[st.d]);
  const atG = () => st.x === lv.gx && st.y === lv.gy;
  const atG2 = () => !!lv.g2 && st.x === lv.g2.x && st.y === lv.g2.y;
  const tick = () => { if (++guard > 800) throw { end: 'loop' }; };
  const act = (o, b, chain) => actions.push(Object.assign(o, { el: b.el, chain: chain.slice() }));

  function run(list, chain) {
    for (const b of list) {
      tick();
      const inner = chain.concat(b.el ? [b.el] : []);
      switch (b.type) {
        case 'maju': {
          const nx = st.x + DX[st.d], ny = st.y + DY[st.d];
          if (blockedAt(nx, ny)) { act({ t: 'crash', x: st.x, y: st.y, d: st.d }, b, chain); throw { end: 'crash' }; }
          st.x = nx; st.y = ny; moves++;
          act({ t: 'move', x: st.x, y: st.y, d: st.d }, b, chain);
          if (lv.aksi === 'sampai' && atG()) throw { end: 'win' };
          break;
        }
        case 'belok':
          st.d = b.dir === 'kiri' ? (st.d + 3) % 4 : (st.d + 1) % 4;
          act({ t: 'turn', x: st.x, y: st.y, d: st.d }, b, chain);
          break;
        case 'ulangi':
          for (let i = 0; i < b.n; i++) run(b.body, inner);
          break;
        case 'jika':   // level serang: kondisinya "ada Shadow di depan" (hanya Shadow yang masih hidup); level lain: ada rintangan di depan
          jikaCek.add(b);
          if (lv.aksi === 'serang' ? adaShadow(st.x + DX[st.d], st.y + DY[st.d]) : front()) { jikaAktif.add(b); run(b.body, inner); }
          break;
        case 'ambil':
          if (lv.aksi !== 'sampai' && atG() && !st.has) {
            if (lv.aksi === 'ambil') { act({ t: 'ambil', final: true }, b, chain); throw { end: 'win' }; }
            st.has = true; act({ t: 'ambil', final: false }, b, chain);
          } else { act({ t: 'gagal' }, b, chain); throw { end: 'salahAmbil' }; }
          break;
        case 'berikan':
          if (lv.aksi === 'antar' && st.has && atG2()) { act({ t: 'berikan', final: true }, b, chain); throw { end: 'win' }; }
          act({ t: 'gagal' }, b, chain); throw { end: 'salahBerikan' };
        case 'serang': {   // serang petak tepat di depan: kalau ada Shadow hidup di situ, Shadow itu kalah
          const fx = st.x + DX[st.d], fy = st.y + DY[st.d], i = shadowDi(fx, fy);
          if (i < 0) { act({ t: 'gagal' }, b, chain); throw { end: 'salahSerang' }; }
          kalah[i] = true;
          const semua = kalah.every((k, n) => k || !shadows[n]);
          act({ t: 'serang', x: fx, y: fy, idx: i, final: semua }, b, chain);
          if (semua) throw { end: 'win' };
          break;
        }
      }
    }
  }

  let outcome;
  try { run(prog, []); outcome = (lv.aksi === 'sampai' && atG()) ? 'win' : 'short'; }
  catch (e) { if (e && e.end) outcome = e.end; else throw e; }
  return { actions, outcome, moves, jikaCek, jikaAktif };
}

if (typeof module !== 'undefined') module.exports = { parseLevel, simulate, DX, DY };

/* ===================================================================
   TAMPILAN GAME 2 (struktur sama dengan game1.js; level dibaca dari data.js, game id 2)
   =================================================================== */
(function(){
  var GID=2,LEVELS=window.gameById(GID).levels,TOTAL=LEVELS.length;
  var LV=LEVELS.map(parseLevel);       // level siap main (petak, penghalang, bayangan)
  var COLS=1,ROWS=1,ratioN=1;
  /* blok baru muncul mulai level ini. Ambil & Berikan mulai level 8 (Berikan hanya tampil di level yang butuh), Ulangi 1, Jika 15 */
  var MULAI={maju:1,kiri:1,kanan:1,ulangi:1,ambil:3,berikan:8,jika:15,serang:25};   // Ambil mulai level 3 (hanya di level yang butuh, lalu muncul terus mulai level 8)
  var PER_BLOK=5;
  /* Mau tes semua level di satu map dulu? Isi nomor map (mis. 1). null = tiap level pakai field map di data.js */
  var SAMA_MAP=null;
  function mapKey(L){return SAMA_MAP||L.map}
  // posisi papan level di dalam lantai map: ox / oy di data.js (kalau ada) > ox / oy milik map (BG) > tengah. Selalu dijaga agar muat.
  function posOx(L,cfg,kol){var v=(L.ox!=null)?L.ox:(cfg.ox!=null?cfg.ox:Math.round((kol-COLS)/2));return Math.max(0,Math.min(Math.max(0,kol-COLS),v))}
  function posOy(L,cfg,bar){var v=(L.oy!=null)?L.oy:(cfg.oy!=null?cfg.oy:Math.round((bar-ROWS)/2));return Math.max(0,Math.min(Math.max(0,bar-ROWS),v))}

  /* ##################################################################################
     BAGIAN YANG SERING DIEDIT ADA DI SINI (1 sampai 5). Sisanya jangan diutak-atik.
     ################################################################################## */

  var FOLDER='image/game2/';   // folder semua gambar Game 2

  /* ===== 1. KARAKTER PEMAIN (per rentang level, sama seperti SETS di Game 1) =====*/
  var PEMAIN=[
    { dari:1,   // level 1-2
      idle:{atas:'cbt-blkng.png',kanan:'cbt-kanan.png',bawah:'cbt-depan.png',kiri:'cbt-kiri.png'},
      walk:{atas:['cbt-blkgjln.png'],kanan:['cbt-kananjln.png','cbt-kananjln1.png'],
            bawah:['cbt-dpnjalan.png'],kiri:['cbt-kirijln.png','cbt-kirijln2.png']} },
    { dari:3,   // level 3-22 
      idle:{atas:'c-blkng.png',kanan:'c-kanan.png',bawah:'c-depan.png',kiri:'c-kiri2.png'},
      walk:{atas:['c-blkngjln.png'],kanan:['c-kananjln1.png','c-kananjln2.png'],
            bawah:['c-depanjln1.png','c-depanjln2.png','c-depan.png'],kiri:['c-kirijln1.png','c-kirijln2.png']} },
    { dari:23,  // level 23-25
      idle:{atas:'cbc-blkng.png',kanan:'cbc-kanan.png',bawah:'cbc-depan.png',kiri:'cbc-kiri.png'},
      walk:{atas:['cbc-blkngjln.png'],kanan:['cbc-kananjln2.png','cbc-kananjln.png'],
            bawah:['cbc-dpnjln1.png','cbc-dpnjln2.png'],kiri:['cbc-kirijln.png','cbc-kirijln2.png']} }
  ];

  /* ===== 2. GAMBAR TUJUAN + PENGHALANG PER LEVEL =====
     Tiap baris berlaku untuk level  lv:[dari,sampai]  (atau lv:7 untuk satu level).
     Baris yang lebih bawah MENIMPA baris di atasnya (hanya field yang ia isi), jadi pola kerjanya:
     baris pertama = isi dasar semua level, baris berikutnya = pengecualian.

       g       = tujuan pertama          g2 = tujuan kedua (kalau kosong, memakai gambar g)          g3 = tujuan ketiga (level 25: Shadow ketiga)
       tembok  = gambar penghalang (kotak, latar transparan). Mau beda tiap petak: di data.js tulis [x,y,'nama.png']
       gelap   = gambar petak gelap / lubang (dk di data.js)

     Isi g / g2:
       img      = gambar tujuan. Kosong (null) = hanya cahaya biru
       win      = gambar saat tujuan tercapai (kosong = cahaya membesar lalu hilang; level "ambil" = benda terbang)
       efek     = 'lenyap' -> saat dikalahkan, gambar menghilang dengan efek (kilau, memudar, naik). Tidak perlu gambar win
       win2     = (pilihan) gambar susulan setelah win, mis. Shadow kalah -> menghilang
       glow     = true -> BENDA kecil ditaruh DI ATAS cahaya biru (teh, peta, kristal, tongkat). false = gambar memenuhi petak (karakter)
       cahaya   = true -> KARAKTER (gambar memenuhi petak) tetap diberi cahaya biru di bawahnya, mis. pelanggan tujuan kedua
                  (cahaya biru = dibuat dari CSS, lihat .g-goal .cssglow di game2.css; tidak perlu file gambar)
       komposit = true -> gambar win menggantikan pemain juga (pemain disembunyikan), mis. Anak memegang tongkat */
  var GAMBAR_LEVEL=[
    {lv:[1,25], tembok:'box.png', gelap:'lubanghtm.png'},         // dasar semua level
    {lv:[1,6],  tembok:'pohon.png'},                               // taman
    {lv:7,      tembok:'tugu.png'},                                // peralihan
    {lv:[13,15],tembok:'pohon.png'},                               // taman / peralihan
    {lv:[23,25],tembok:'pohon.png'},                               // taman berkristal

    {lv:1,  g:{img:'shadow1.png',win:'shadow4.png'}},
    {lv:2,  g:{img:'shadow4.png',win:'shadow5.png'}},
    {lv:3,  g:{img:'tgktpatah1.png'}},                   //tongkat
    {lv:7,  g:{img:'nenek1.png',win:'nenek2.png'}},
    {lv:13, g:{img:'peta.png',glow:true}},                         // peta tua
    {lv:21, g:{img:'kristal.png',glow:true}, g2:{}},                      // Kristal Hikari
    {lv:22, g:{img:'teh.png',glow:true}, g2:{}},
    {lv:8,  g:{img:'teh.png',glow:true}, g2:{}},
    {lv:10,  g:{img:'teh.png',glow:true}, g2:{}},
    {lv:11,  g:{img:'teh.png',glow:true}, g2:{}},
    // level 25: tiga Shadow (g, g2, g3), semuanya harus dikalahkan. Menghilang pakai efek CSS (tanpa gambar): kilau terang lalu memudar & terbang naik
    {lv:25, g:{img:'shadow1.png'}, g2:{img:'shadow2.png'}, g3:{img:'shadow5.png'}}
  ];

  var WIN2_TUNDA=1200;   
  function artLevel(n){
    var o={g:{},g2:null,g3:null,tembok:null,gelap:null};
    GAMBAR_LEVEL.forEach(function(r){
      var lo=[].concat(r.lv)[0],hi=[].concat(r.lv)[1]||lo;
      if(n<lo||n>hi)return;
      ['g','g2','g3','tembok','gelap'].forEach(function(k){if(r[k]!==undefined)o[k]=r[k]});
    });
    if(!o.g2)o.g2=o.g;
    return o;
  }

  // ===== 3. GAMBAR MAP =====
  var GARIS={rasio:'1923/817',kolom:19,baris:8,
             area:{t:10.5,r:1.3,b:6,l:6.8},   // jarak tepi gambar ke lantai (%), hasil pas-pasan di level 1
             ox:2,oy:1};                   // posisi awal papan level: petak dari kiri / atas. Level yang beda: isi ox / oy di data.js

  function petaBG(file,rasio,atur){var A=GARIS.area;
    var o={gambar:file,rasio:rasio||GARIS.rasio,kolom:GARIS.kolom,baris:GARIS.baris,
      area:{t:A.t,r:A.r,b:A.b,l:A.l},ox:GARIS.ox,oy:GARIS.oy};
    if(atur)for(var k in atur)o[k]=atur[k];
    return o}
  var BG={folder:FOLDER,garis:true,   // garis:true = tampilkan garis petak (untuk cek pas / tidaknya)
    1:petaBG('map1taman.png'),
    2:petaBG('map2taman.jpeg'),
    3:petaBG('map3taman.png'),
    4:petaBG('map4peralihan.jpeg',null,{kolom:19,baris:8,area:{t:8.7,r:2.8,b:0.4,l:3.6}}),
    5:petaBG('map5toko.png',null,{kolom:12,baris:6,area:{t:6.8,r:7.7,b:20.2,l:8}}),
    6:petaBG('map6kamar.jpeg',null,{kolom:19,baris:8,area:{t:4.7,r:1,b:1.5,l:3.1}}),
  };

  //===== 4. SUARA =====
  var SUARAS=[
    { levels:[[1,25]], folder:'audio/',
      awal:'awal-game2.mp3',
      tujuan:null,
      berhasil:'berhasil-game2.mp3',
      volume:0.6 },
    { levels:[[23,25]], folder:'audio/', 
      awal:'awal-final.mp3',
      tujuan:null,
      berhasil:'berhasil-final.mp3', volume:0.6 }
  ];

  // ===== 5. WAJAH TOKOH DI DIALOG (beda per level & per ekspresi) =====
  /* Tiap tokoh punya daftar "paket". Paket yang dipakai = yang rentang level-nya cocok dengan level sekarang
     (dicek dari ATAS ke bawah, yang cocok pertama dipakai).
       levels : [[awal,akhir],[awal,akhir],...]  atau angka tunggal, mis. [[1,2],[23,25]] atau [5]  (dihapus = semua level)
       gambar : { namaEkspresi : 'file.png', ... }   -> ekspresi PERTAMA = bawaan (dipakai kalau di data.js tidak ditulis ekspresinya)
     Di data.js tulis ekspresinya setelah nama, dipisah titik dua:
       "Nenek|Halo Nak"          -> ekspresi bawaan (yang pertama)
       "Nenek:sedih|Nenek capek" -> ekspresi "sedih"
     Nama ekspresi bebas (biasa, senang, sedih, kaget, ...), yang penting sama dengan di sini.
     Kalau ekspresi tidak ketemu -> pakai bawaan; kalau tokoh tidak ada di sini / gambar gagal dimuat -> emoji bawaan. */
  var WAJAH={
    Anak:[
      {levels:[[1,2],[23,25]], gambar:{biasa:'cb-dialog1.png', senang:'cb-dialog2.png', kaget:'cb-dialog3.png',sedih:'cb-dialog4.png', marah:'cb-dialog5.png'}},
      {levels:[[3,22]],        gambar:{biasa:'c-dialog1.png', senang:'c-dialog2.png', pensaran:'c-dialog3.png',kaget:'c-dialog4.png', sedih:'c-dialog5.png',marah:'c-dialog6.png'}}
    ],
    Nenek:[
      {gambar:{biasa:'nnk-dlg1.png', senang:'nnk-dlg2.png', sedih:'nnk-dlg3.png'}}
    ],
    Pelanggan1:[{gambar:{biasa:'dlg-plgn4.png'}}],
    Pelanggan2:[{gambar:{biasa:'dlg-plgn6.png'}}],
    Pengembara:[{gambar:{biasa:'dlg-plgn1.png'}}],
    Shadow:[{gambar:{senang:'sh-dlg.png', takut:'sh-dlg2.png'}}]
  };
  function wajahFile(who,eks){
    var daftar=WAJAH[who]||WAJAH[who.replace(/\s+/g,'')];if(!daftar)return null;   // 'Pelanggan 1' (dengan spasi di data.js) juga cocok dengan kunci 'Pelanggan1'
    var no=lvl+1;
    for(var i=0;i<daftar.length;i++){
      var P=daftar[i],R=P.levels,cocok=!R||!R.length;
      if(!cocok)for(var j=0;j<R.length;j++){
        var r=R[j];
        if(Array.isArray(r)?(no>=r[0]&&no<=r[1]):no===r){cocok=true;break}
      }
      if(cocok){
        var g=P.gambar||{},kunci=Object.keys(g);
        return g[eks]||g[kunci[0]]||null;
      }
    }
    return null;
  }

  [PEMAIN,SUARAS].forEach(function(arr){arr.forEach(function(o){if(o.folder&&o.folder.slice(-1)!=='/')o.folder+='/'})});
  [BG].forEach(function(o){if(o.folder.slice(-1)!=='/')o.folder+='/'});
  if(FOLDER.slice(-1)!=='/')FOLDER+='/';
  PEMAIN.forEach(function(S){S.folder=S.folder||FOLDER});
  var SPRITE=null;   // paket pemain yang sedang dipakai (diganti otomatis tiap level)

  /* ===== SUARA (mesin) ===== */
  var SUARA=SUARAS[0],sfx={},awalTunda=false;
  function suara(k){
    if(!SUARA[k])return null;
    if(!sfx[k]){
      sfx[k]=new Audio();sfx[k].preload='auto';
      sfx[k].src=SUARA.folder+SUARA[k];sfx[k].volume=SUARA.volume;
      sfx[k].onerror=function(){console.warn('Suara tidak ditemukan: '+SUARA.folder+SUARA[k])};
    }
    return sfx[k];
  }
  function mainkan(k){
    var a=suara(k);if(!a)return;
    a._buka=false;a.muted=false;
    try{a.currentTime=0;var p=a.play();if(p&&p.catch)p.catch(function(){})}catch(e){}
  }
  function jedaAwal(){if(sfx.awal){try{sfx.awal.pause()}catch(e){}}}
  function suaraTujuan(){jedaAwal();mainkan('tujuan')}
  function suaraBerhasil(){jedaAwal();mainkan('berhasil')}
  // HP / iPhone hanya mengizinkan suara yang "dibuka" lewat klik -> dilakukan saat tombol Jalankan diklik
  function bukaKunciSuara(){
    ['tujuan','berhasil'].forEach(function(k){
      var a=suara(k);if(!a)return;
      a._buka=true;a.muted=true;
      var p;try{p=a.play()}catch(e){}
      if(p&&p.then)p.then(function(){if(a._buka){a.pause();a.currentTime=0}a.muted=false}).catch(function(){a.muted=false});
      else a.muted=false;
    });
  }
  function hentikanSuara(){['tujuan','berhasil'].forEach(function(k){if(sfx[k]){try{sfx[k].pause()}catch(e){}}})}
  function pilihSuara(i){
    var pick=SUARAS[0],n=i+1;
    SUARAS.forEach(function(S){if(S.levels.some(function(r){return n>=r[0]&&n<=r[1]}))pick=S});
    if(pick===SUARA)return;
    Object.keys(sfx).forEach(function(k){try{sfx[k].pause()}catch(e){}});
    sfx={};SUARA=pick;
  }
  // musik awal: diputar dari awal tiap level dibuka; kalau diblok browser, ditunda sampai klik / sentuh pertama
  function musikAwal(){
    var a=suara('awal');if(!a)return;
    try{a.pause();a.currentTime=0}catch(e){}
    var p;try{p=a.play()}catch(e){}
    if(p&&p.catch)p.catch(function(){
      if(awalTunda)return;awalTunda=true;
      var go=function(){
        ['click','keydown','touchstart'].forEach(function(ev){document.removeEventListener(ev,go)});
        awalTunda=false;try{a.play()}catch(e){}
      };
      ['click','keydown','touchstart'].forEach(function(ev){document.addEventListener(ev,go)});
    });
  }

  var STEP=500,TURN=300,JEDA=100;     // STEP harus sama dengan transition .g-hero di game1.css (.5s)
  var NAMES=['atas','kanan','bawah','kiri'],CODE={maju:'maju();',kiri:'belokKiri();',kanan:'belokKanan();',ambil:'ambil();',berikan:'berikan();',serang:'serang();'};
  var CONT={ulangi:1,jika:1};
  function sah(c){return !!CONT[c]||!!CODE[c]}

  var $=function(id){return document.getElementById(id)};
  var grid,board=$('g-board'),list=$('g-list'),ws=$('g-ws'),runBtn=$('g-run'),res=$('g-result'),pal=$('g-pal');
  var lvl=0,done=[],x,y,ang,running=false,timer=null,dragEl=null,hero,goalEls=[],menangT=[],walkT=null,frame=0,useImg=false,ROLE='student';
  var tMulai=Date.now(),aturRender=null,gbTool=null;

  /* ===== KUNCI LEVEL & PROGRES (sama dengan Game 1, tersimpan di Supabase) ===== */
  function terbuka(){
    if(ROLE==='teacher')return TOTAL;
    var n=done.filter(Boolean).length;
    return Math.min(TOTAL,(Math.floor(n/PER_BLOK)+1)*PER_BLOK);
  }
  function simpanProgres(){
    Progres.simpan(GID,lvl+1,true,Math.min(3600,Math.round((Date.now()-tMulai)/1000)));
  }
  function levelAwal(){
    var n=parseInt(new URLSearchParams(location.search).get('level'),10);
    return (n>=1&&n<=TOTAL&&n<=terbuka())?n-1:Math.min(terbuka(),done.filter(Boolean).length+1)-1;
  }
  function mulai(cb){
    done=[];var sudah=false;
    function go(){if(sudah)return;sudah=true;cb(levelAwal())}
    setTimeout(function(){if(!sudah){console.warn('Progres terlalu lama dimuat, game dimulai tanpa progres tersimpan');go()}},4000);
    Progres.muat(GID).then(function(rows){
      rows.forEach(function(r){if(r.completed)done[r.level-1]=true});
      go();
    }).catch(function(err){console.error(err);go()});
  }

  function dirOf(){return ((ang/90)%4+4)%4}
  function condTxt(){return LEVELS[lvl].cond||'ada rintangan di depan'}   // teks blok Jika = cond di data.js; level tanpa cond memakai teks bawaan ini
  function condFn(){var c=condTxt();return /shadow/i.test(c)?'adaShadow()':/bayangan/i.test(c)?'adaBayangan()':/lubang/i.test(c)?'adaLubang()':'adaRintangan()'}

  /* ===== PAPAN ===== */
  function fit(){
    /* Map bergambar: papan selalu selebar kotak putih (tinggi mengikuti rasio gambar) -> tidak ada sisa kosong.
       Papan polos (tanpa gambar): tetap dibatasi tinggi layar supaya tidak terlalu tinggi. */
    if(board.classList.contains('has-bg')){board.style.maxWidth='none';board.style.width='100%'}
    else{board.style.width='';board.style.maxWidth=Math.floor(Math.max(300,window.innerHeight*0.52*ratioN))+'px'}
    if(grid)board.style.setProperty('--cell',(grid.getBoundingClientRect().width/COLS)+'px');
  }
  function cekGambarPetak(g){   // gambar penghalang / gelap yang filenya tidak ada -> kembali ke tampilan bawaan
    var sudah={};
    [].forEach.call(g.querySelectorAll('[data-gb]'),function(c){
      var f=c.dataset.gb;if(sudah[f])return;sudah[f]=1;
      var im=new Image();
      im.onerror=function(){
        console.warn('Gambar tidak ditemukan: '+FOLDER+f);
        [].forEach.call(g.querySelectorAll('[data-gb]'),function(k){
          if(k.dataset.gb===f){k.classList.remove('img','pic');k.style.removeProperty('--img');k.style.removeProperty('--gimg');k.removeAttribute('data-gb')}
        });
      };
      im.src=FOLDER+f;
    });
  }
  function pilihPemain(i){   // pilih paket karakter sesuai level (paket yang gambarnya hilang dilewati)
    var h=null,ih=0;
    PEMAIN.forEach(function(S,k){if(i+1>=S.dari&&S._ok){h=S;ih=k}});
    SPRITE=h;useImg=!!h;
    board.dataset.pemain=ih+1;   // dipakai CSS kalau ukuran tiap paket beda
  }
  function build(){
    var L=LEVELS[lvl],V=LV[lvl],cfg=BG[mapKey(L)],AR=artLevel(lvl+1),wi={};
    (L.w||[]).forEach(function(p){if(p[2])wi[p[0]+','+p[1]]=p[2]});   // penghalang dengan gambar khusus: [x,y,'file.png']
    COLS=V.w;ROWS=V.h;
    board.innerHTML='';
    grid=document.createElement('div');grid.className='g-grid';
    grid.style.setProperty('--c',COLS);grid.style.setProperty('--r',ROWS);
    var hasBg=!!(cfg&&cfg.gambar);
    if(hasBg){
      /* Garis petak sudah ada di gambar map (14 x 6, memenuhi seluruh gambar). Papan level ditaruh di kelipatan bulat petak,
         jadi tiap petak game persis menutup satu kotak di gambar. Geser level: isi ox / oy (jumlah petak dari kiri / atas) di data.js */
      var A=cfg.area||{t:0,r:0,b:0,l:0},kol=cfg.kolom||COLS,bar=cfg.baris||ROWS,
          fw=100-A.l-A.r,fh=100-A.t-A.b,cw=fw/kol,ch=fh/bar,
          ox=posOx(L,cfg,kol),oy=posOy(L,cfg,bar);
      grid.style.left=(A.l+ox*cw)+'%';grid.style.top=(A.t+oy*ch)+'%';grid.style.width=(COLS*cw)+'%';grid.style.height=(ROWS*ch)+'%';
      var rs=cfg.rasio||(COLS+'/'+ROWS),rr=rs.split('/');ratioN=rr[0]/rr[1];
      board.style.aspectRatio=rs;
      board.style.backgroundImage='url('+BG.folder+cfg.gambar+')';
      board.style.backgroundSize='100% 100%';board.style.backgroundRepeat='no-repeat';   // gambar pas memenuhi papan
      var pr=new Image();pr.onerror=function(){board.classList.remove('has-bg');board.style.backgroundImage='';console.warn('Gambar map tidak ditemukan: '+BG.folder+cfg.gambar)};
      pr.src=BG.folder+cfg.gambar;
    }else{
      grid.style.left=grid.style.top='0';grid.style.width=grid.style.height='100%';
      ratioN=COLS/ROWS;board.style.aspectRatio=COLS+'/'+ROWS;board.style.backgroundImage='';
    }
    board.classList.toggle('has-bg',hasBg);
    board.classList.toggle('debug',!!BG.garis||/[?&](garis|atur)=1/.test(location.search));
    board.dataset.map=mapKey(L);board.dataset.level=lvl+1;   // dipakai CSS: .g-board[data-level="4"] .g-cell[data-gb="..."]{...}
    board.appendChild(grid);
    for(var k=0;k<COLS*ROWS;k++){
      var c=document.createElement('div'),cx=k%COLS,cy=(k-cx)/COLS,ch=V.cells[cy][cx];
      c.className='g-cell'+((cx+cy)%2?' b':'')+(ch==='#'?' wall':'')+(ch==='x'?' dark':'');
      if(ch==='#'){   // gambar penghalang: per petak (data.js) > per level (GAMBAR_LEVEL) > kotak bawaan
        var tw=wi[cx+','+cy]||AR.tembok;
        if(tw){c.classList.add('img');c.dataset.gb=tw;c.style.setProperty('--img','url('+FOLDER+tw+')')}
      }
      if(ch==='x'&&AR.gelap){c.classList.add('pic');c.dataset.gb=AR.gelap;c.style.setProperty('--gimg','url('+FOLDER+AR.gelap+')')}
      grid.appendChild(c);
    }
    cekGambarPetak(grid);
    if(gbTool)gbTool();   // (alat atur) pasang ulang ukuran gambar penghalang yang sedang digeser
    // tujuan: cahaya biru / benda / Shadow (g dan, kalau ada, g2)
    hero=null;bikinGoals();
    hero=document.createElement('div');hero.className='g-hero';
    hero.style.width=100/COLS+'%';hero.style.height=100/ROWS+'%';   // kotak karakter = persis 1 petak
    if(useImg){hero.classList.add('img');hero.innerHTML='<img class="bean" alt="">'}
    else hero.innerHTML='<svg class="bean"><use href="#anak"/></svg>';
    var orb=document.createElement('i');orb.className='bawa';orb.hidden=true;hero.appendChild(orb);   // penanda 'sedang membawa'
    grid.appendChild(hero);
    fit();
  }
  /* ===== TUJUAN =====
     Gambar tiap tujuan diatur di GAMBAR_LEVEL (atas file ini), bukan di sini. */
  function glowEl(){   // cahaya biru murni dari CSS (tanpa gambar)
    var e=document.createElement('div');e.className='cssglow';
    return e;
  }
  function isiGoal(e){   // gambar awal tujuan (dipakai saat dibuat & saat diulang)
    var c=e._c;e.innerHTML='';e.classList.remove('karakter');
    if(!c.img||c.glow||c.cahaya)e.appendChild(glowEl());   // cahaya selalu paling bawah (sebelum gambar)
    if(!c.img)return;                                       // tanpa gambar = cahaya biru saja
    var im=document.createElement('img');im.alt='';im.src=FOLDER+c.img;
    if(c.glow)im.className='bean item';                     // benda kecil di atas cahaya
    else{im.className='bean';e.classList.add('karakter')}   // karakter memenuhi petak
    im.onerror=function(){   // gambar tidak ketemu -> cahaya biru saja
      console.warn('Gambar tujuan tidak ditemukan: '+FOLDER+c.img);
      im.remove();e.classList.remove('karakter');
      if(!e.querySelector('.cssglow'))e.appendChild(glowEl());
    };
    e.appendChild(im);
  }
  function mkGoal(p,c){
    var e=document.createElement('div');
    e.className='g-goal img';e._c=c;
    e.style.left=p.x*100/COLS+'%';e.style.top=p.y*100/ROWS+'%';
    e.style.width=100/COLS+'%';e.style.height=100/ROWS+'%';   // kotak tujuan = persis 1 petak
    isiGoal(e);
    grid.insertBefore(e,hero||null);return e;
  }
  function bikinGoals(){
    var L=LEVELS[lvl],A=artLevel(lvl+1);
    goalEls=[mkGoal(L.g,A.g)];
    if(L.g2)goalEls.push(mkGoal(L.g2,A.g2));
    if(L.g3)goalEls.push(mkGoal(L.g3,A.g3||{}));
  }
  function tampilBawa(){   // benda yang dibawa karakter: gambar tujuan 1 (mis. teh); kalau tidak ada gambarnya = bola cahaya
    var o=hero.querySelector('.bawa'),c=goalEls[0]&&goalEls[0]._c;
    o.hidden=false;o.innerHTML='';o.classList.remove('gambar');
    if(c&&c.img&&c.glow){
      var im=document.createElement('img');im.alt='';im.src=FOLDER+c.img;
      im.onload=function(){o.classList.add('gambar')};   // gambar ketemu -> bola cahaya diganti gambar
      o.appendChild(im);
    }
  }
  function resetGoals(){   // kembalikan tujuan ke gambar awal (dibuat ulang)
    menangT.forEach(clearTimeout);menangT=[];
    goalEls.forEach(function(e){if(e.parentNode)e.parentNode.removeChild(e)});
    [].forEach.call(grid.querySelectorAll('.g-burst'),function(e){e.parentNode.removeChild(e)});
    bikinGoals();
    if(hero){hero.classList.remove('hilang');var o=hero.querySelector('.bawa');if(o)o.hidden=true}
  }
  /* efek saat tujuan tercapai: ganti ke gambar win (lalu win2) kalau ada; kalau tidak, animasi bawaan */
  function efekAkhir(el,L){
    var c=el._c;
    suaraTujuan();
    if(c.efek==='lenyap'){el.classList.add('lenyap');return}   // Shadow dikalahkan: menghilang dengan efek CSS
    if(c.win){
      el.innerHTML='';
      var im=document.createElement('img');im.className='bean';im.alt='';im.src=FOLDER+c.win;
      im.onerror=function(){
        console.warn('Gambar win tidak ditemukan: '+FOLDER+c.win);
        el.innerHTML='';el.classList.remove('menang-anak','karakter');hero.classList.remove('hilang');
        el.appendChild(glowEl());el.classList.add('selesai');
      };
      el.appendChild(im);
      if(c.komposit){el.classList.add('menang-anak');hero.classList.add('hilang')}
      else el.classList.add('karakter','getar');
      if(c.win2)menangT.push(setTimeout(function(){im.src=FOLDER+c.win2},WIN2_TUNDA));
      return;
    }
    el.classList.add(L.aksi==='ambil'?'diambil':'selesai');
  }
  function efekSerang(tx,ty){   // kilau cahaya Kristal di petak yang diserang
    var b=document.createElement('div');b.className='g-burst';
    b.style.left=tx*100/COLS+'%';b.style.top=ty*100/ROWS+'%';b.style.width=100/COLS+'%';b.style.height=100/ROWS+'%';
    grid.appendChild(b);
    setTimeout(function(){if(b.parentNode)b.parentNode.removeChild(b)},1000);
  }
  function goalHilang(){   // dipanggil dari narasi dialog: "... menghilang"
    goalEls.forEach(function(e){if(e._c.img&&!e._c.glow&&!e._c.komposit)e.classList.add('pudar')});
  }
  function img(){
    if(!useImg||!hero)return;
    var S=SPRITE,n=NAMES[dirOf()],set=n,flip=false;
    function adaWalk(k){return !!(S.walk[k]&&S.walk[k].length)}
    function lawan(k){return k==='kiri'?'kanan':'kiri'}
    // arah ini tidak punya gambar sama sekali (null) -> pakai arah sebaliknya, dibalik
    if(!S.idle[n]&&!adaWalk(n)){set=lawan(n);flip=true}
    var idle=S.idle[set],w=S.walk[set]||[],src=idle||w[0];
    if(walkT){
      // gambar jalan kanan / kiri kosong (null) tapi arah sebaliknya punya -> pakai gambar jalan arah sebaliknya, dibalik
      if(!w.length&&(n==='kiri'||n==='kanan')&&adaWalk(lawan(n))){set=lawan(n);flip=true;idle=S.idle[set];w=S.walk[set]}
      if(w.length){
        var fr=(w.length>1||!idle)?w:[idle,w[0]];   // frame jalan cuma 1: gantian dengan gambar diam
        src=fr[frame%fr.length];
      }
    }
    if(!src)return;
    hero.firstChild.src=S.folder+src;
    hero.firstChild.style.transform=flip?'scaleX(-1)':'';
  }
  function startWalk(){if(!useImg)return;clearInterval(walkT);frame=0;walkT=setInterval(function(){frame++;img()},125);img()}
  function stopWalk(){clearInterval(walkT);walkT=null;img()}
  function draw(){
    hero.style.left=x*100/COLS+'%';hero.style.top=y*100/ROWS+'%';
    if(useImg){img();return}
    hero.firstChild.style.transform=dirOf()===3?'scaleX(-1)':'';
  }
  function reset(){
    clearTimeout(timer);clearInterval(walkT);walkT=null;hentikanSuara();
    running=false;runBtn.disabled=false;
    var s=LEVELS[lvl].s;x=s.x;y=s.y;ang=s.d*90;
    hero.classList.add('noanim');hero.classList.remove('shake');
    resetGoals();
    draw();hero.offsetWidth;hero.classList.remove('noanim');
    mark(null);
  }
  function mark(el,chain){
    [].forEach.call(list.querySelectorAll('.run,.u-on'),function(b){b.classList.remove('run','u-on')});
    if(el)el.classList.add('run');
    (chain||[]).forEach(function(c){c.classList.add('u-on')});
  }

  /* ===== PROGRAM = pohon blok dari area kerja ===== */
  function inners(b){return [].filter.call(b.children,function(c){return c.classList.contains('g-inner')})}
  function kids(box){return [].filter.call(box.children,function(k){return k.dataset&&k.dataset.cmd})}
  function tree(box){
    return kids(box).map(function(b){
      var c=b.dataset.cmd,n={el:b};
      if(c==='kiri'||c==='kanan'){n.type='belok';n.dir=c}
      else if(c==='maju'||c==='ambil'||c==='berikan'||c==='serang')n.type=c;
      else{var I=inners(b);n.type=c;n.n=parseInt(b.dataset.n,10)||1;n.body=I[0]?tree(I[0]):[];n.elseBody=I[1]?tree(I[1]):[]}
      return n;
    });
  }

  /* ===== PEMERIKSAAN PROGRAM & PETUNJUK KESALAHAN ===== */
  var lastP=[];
  function hapusTanda(){[].forEach.call(list.querySelectorAll('.salah'),function(b){b.classList.remove('salah')})}
  function tandai(ns){ns.forEach(function(n){if(n.el)n.el.classList.add('salah')})}   // blok yang bermasalah diberi garis merah berkedip
  function adaMaju(ns){return ns.some(function(n){return n.type==='maju'||(n.body&&adaMaju(n.body))})}
  function adaGerak(ns){return ns.some(function(n){return n.type==='maju'||n.type==='ambil'||n.type==='berikan'||n.type==='serang'||(n.body&&adaGerak(n.body))})}
  function namaBlok(n){return n.type==='ulangi'?'Ulangi '+n.n+' kali':'Jika ('+condTxt()+')'}
  // kesalahan yang PASTI membuat program gagal: program tidak dijalankan, murid langsung diberi tahu apa yang salah
  function cekProgram(P){
    var pesan=[],salah=[];
    (function cari(ns){ns.forEach(function(n){
      if(n.body){
        if(!n.body.length){pesan.push('Blok '+namaBlok(n)+' masih kosong, isi dengan blok lain.');salah.push(n)}
        else cari(n.body);
      }
    })})(P);
    if(!adaMaju(P))pesan.push('Belum ada blok Gerak maju, jadi karakter tidak akan berjalan.');
    return {pesan:pesan,salah:salah};
  }
  // petunjuk setelah program selesai tapi belum berhasil: apa yang kemungkinan keliru
  function petunjuk(P,r){
    var tips=[],salah=[];
    function tambah(t){if(tips.indexOf(t)<0)tips.push(t)}
    (function cari(ns){ns.forEach(function(n){
      if(n.type==='ulangi'&&n.body.length&&!adaGerak(n.body)){
        tambah('Blok Ulangi '+n.n+' kali isinya tidak ada Gerak maju, jadi karakter hanya berputar atau diam di tempat. Masukkan Gerak maju ke dalam Ulangi kalau ingin karakter berjalan berulang-ulang.');
        salah.push(n);
      }
      if(n.body)cari(n.body);
    })})(P);
    if(r.jikaCek)r.jikaCek.forEach(function(n){
      if(!r.jikaAktif.has(n)){
        tambah('Blok Jika ('+condTxt()+') tidak pernah aktif karena syaratnya tidak terpenuhi saat dicek, jadi isi di dalamnya tidak pernah jalan. Periksa lagi di mana blok Jika diletakkan.');
        salah.push(n);
      }
    });
    if(!r.actions.length&&!tips.length)tambah('Karakter belum melakukan apa-apa. Periksa lagi susunan bloknya.');
    tandai(salah);
    return tips.slice(0,2).join(' ');
  }
  function daruratGagal(e){   // kalau ada error tak terduga: jangan macet, beri tahu murid dan buka kunci tombol
    if(window.console)console.error('Game 2: error saat menjalankan program',e);
    clearTimeout(timer);stopWalk();running=false;mark(null);
    showRes(false,'Programmu belum bisa dijalankan','Susunan bloknya belum bisa diproses. Periksa lagi: blok Ulangi dan Jika harus berisi blok, dan harus ada Gerak maju. Perbaiki lalu coba lagi.');
  }

  /* ===== MENJALANKAN ===== */
  function run(){if(running)return;try{runInti()}catch(e){daruratGagal(e)}}
  function runInti(){
    hapusTanda();
    var P=tree(list);lastP=P;
    if(!P.length){showRes(false,'Belum ada blok','Seret blok ke area kerja dulu ya.');return}
    var cek=cekProgram(P);
    if(cek.pesan.length){tandai(cek.salah);showRes(false,'Programmu belum bisa jalan',cek.pesan.join(' ')+' Perbaiki dulu, lalu coba lagi.');return}
    reset();running=true;runBtn.disabled=true;bukaKunciSuara();
    var r=simulate(P,LV[lvl]),A=r.outcome==='loop'?r.actions.slice(0,40):r.actions,k=0;
    (function step(){try{
      if(k>=A.length){mark(null);stopWalk();finish(r);return}
      var a=A[k++];
      mark(a.el,a.chain);
      if(a.t==='move'){
        x=a.x;y=a.y;startWalk();draw();
        timer=setTimeout(function(){
          stopWalk();
          if(k>=A.length){mark(null);finish(r);return}
          timer=setTimeout(step,JEDA);
        },STEP);
      }else if(a.t==='turn'){
        stopWalk();
        var d=(a.d-dirOf()+4)%4;ang+=(d===3?-90:90*d);
        draw();timer=setTimeout(step,k>=A.length?TURN:TURN+JEDA);
      }else if(a.t==='ambil'||a.t==='berikan'){
        stopWalk();
        if(a.t==='ambil'&&!a.final){   // ambil di tujuan pertama: benda diambil, karakter membawanya
          goalEls[0].classList.add('diambil');tampilBawa();
        }else{
          efekAkhir(goalEls[a.t==='berikan'?1:0],LEVELS[lvl]);
          hero.querySelector('.bawa').hidden=true;
        }
        timer=setTimeout(function(){
          if(k>=A.length){mark(null);finish(r);return}
          timer=setTimeout(step,JEDA);
        },a.final?900:650);
      }else if(a.t==='serang'){   // Shadow kalah: kilau cahaya, lalu Shadow itu menghilang dengan efek
        stopWalk();
        efekSerang(a.x,a.y);suaraTujuan();
        var sh=goalEls[a.idx];if(sh)sh.classList.add('lenyap');
        timer=setTimeout(function(){
          if(k>=A.length){mark(null);finish(r);return}
          timer=setTimeout(step,JEDA);
        },a.final?1300:800);
      }else if(a.t==='gagal'){
        stopWalk();hero.classList.add('shake');
        timer=setTimeout(function(){
          running=false;mark(null);
          showRes(false,'Ups!',r.outcome==='salahSerang'?'Tidak ada Shadow di depan. Hadapkan karakter ke Shadow dulu, baru serang.':r.outcome==='salahAmbil'
            ?'Di sini tidak ada yang bisa diambil. Pakai blok ambil saat karakter berdiri di titik cahaya (dan belum membawa apa-apa).'
            :'Belum bisa memberikan. Ambil dulu di titik cahaya pertama, lalu berikan di titik cahaya kedua.');
        },500);
      }else{   // crash
        stopWalk();hero.classList.add('shake');
        timer=setTimeout(function(){
          running=false;mark(null);
          showRes(false,'Ups, menabrak!','Karakter menabrak penghalang, bayangan, atau tepi papan. Coba atur ulang blok.');
        },500);
      }
    }catch(e){daruratGagal(e)}})();
  }
  function finish(r){
    running=false;
    var T=r.outcome==='win'?'':petunjuk(lastP,r);   // petunjuk kesalahan (kalau belum berhasil)
    if(r.outcome==='win'){
      if((LEVELS[lvl].aksi||'sampai')==='sampai')efekAkhir(goalEls[0],LEVELS[lvl]);
      var sebelum=terbuka();done[lvl]=true;simpanProgres();simpanSolusi();var sesudah=terbuka();prog();
      var L=LEVELS[lvl],blok=list.querySelectorAll('.blk').length;
      timer=setTimeout(function(){
        playDialog(L.after).then(function(){
          var info=sesudah>sebelum?' Level '+(sebelum+1)+'\u2013'+sesudah+' terbuka!':'';
          var best=L.best?(r.moves<=L.best?' Jalurmu sudah yang paling singkat!':' Jalurmu '+r.moves+' langkah; yang tersingkat '+L.best+' langkah. Mau coba lagi?'):'';
          if(lvl===TOTAL-1){   // tamat: gambar penutup + dialog (field ending di data.js), lalu layar TAMAT
            if(L.ending&&L.ending.length)tampilAkhir(L.ending);else tamat();
            return;
          }
          else showRes(true,'Hebat!','Kamu berhasil menyelesaikan misi dengan '+blok+' blok.'+best+info);
        });
      },900);
    }else if(r.outcome==='loop')showRes(false,'Terlalu lama','Programmu berputar terlalu lama. Periksa blok Ulangi-mu.');
    else{
      var ak=LEVELS[lvl].aksi||'sampai';
      showRes(false,'Belum selesai',ak==='serang'?'Programmu sudah selesai, tapi masih ada Shadow yang belum dikalahkan. Kalahkan ketiganya dengan blok serang saat Shadow ada tepat di depanmu.':ak==='sampai'?'Programmu sudah selesai, tapi karakter belum sampai di tujuan. Coba lagi!'
        :'Programmu sudah selesai, tapi misinya belum beres. Jangan lupa blok ambil'+(ak==='antar'?' dan berikan':'')+' di titik cahaya.');
      if(T)$('g-res-p').textContent+=' Petunjuk: '+T;
    }
  }
  function showRes(ok,t,p){
    $('g-res-t').textContent=t;$('g-res-p').textContent=p;
    $('g-stars').hidden=!ok;
    if(ok)suaraBerhasil();
    $('g-next').hidden=!(ok&&lvl<TOTAL-1&&lvl+1<terbuka());
    res.hidden=false;runBtn.disabled=false;
  }

  /* ===== KHUSUS GURU: susunan blok yang berhasil tersimpan per level (di browser ini), jadi tidak perlu menyusun ulang ===== */
  function kunciSolusi(i){var u=window.currentUser||{};return 'kodi_g2_solusi:'+(u.id||u.email||u.name||'guru')+':'+i}
  function serial(box){return kids(box).map(function(b){
    var c=b.dataset.cmd,o={c:c};
    if(c==='ulangi')o.n=parseInt(b.dataset.n,10)||3;
    if(CONT[c])o.body=serial(inners(b)[0]);
    return o;
  })}
  function isiBlok(box,arr){arr.forEach(function(o){
    if(!o||!o.c||!sah(o.c))return;
    var b=addBlock(o.c,null,box,o.n);
    if(CONT[o.c]&&o.body)isiBlok(inners(b)[0],o.body);
  })}
  function simpanSolusi(){
    if(ROLE!=='teacher')return;
    try{localStorage.setItem(kunciSolusi(lvl),JSON.stringify({v:1,t:Date.now(),blok:serial(list)}))}catch(e){}
  }
  function muatSolusi(){
    if(ROLE!=='teacher')return false;
    try{
      var s=localStorage.getItem(kunciSolusi(lvl));if(!s)return false;
      var d=JSON.parse(s);if(!d||!d.blok||!d.blok.length)return false;
      isiBlok(list,d.blok);return true;
    }catch(e){return false}
  }

  /* ===== BLOK: seret / ketuk ===== */
  function barisKode(box,pad){
    var out=[];
    kids(box).forEach(function(b){
      var c=b.dataset.cmd,I=inners(b);
      if(c==='ulangi'){out.push(pad+'ulangi('+(b.dataset.n||1)+') {');out=out.concat(barisKode(I[0],pad+'  '));out.push(pad+'}')}
      else if(c==='jika'){out.push(pad+'jika ('+condFn()+') {');out=out.concat(barisKode(I[0],pad+'  '));out.push(pad+'}')}
      else out.push(pad+CODE[c]);
    });
    return out;
  }
  function update(){
    hapusTanda();
    var L=barisKode(list,'');
    $('g-code').textContent='// ketika dijalankan\n'+(L.length?L.join('\n'):'// (belum ada blok)');
  }
  function selectN(n){
    var o='';for(var i=2;i<=15;i++)o+='<option value="'+i+'"'+(i==n?' selected':'')+'>'+i+'</option>';
    return '<span class="fld"><select aria-label="Jumlah ulangan">'+o+'</select></span>';
  }
  function blockHTML(cmd,n){
    if(cmd==='maju')return '<span>Gerak maju</span>';
    if(cmd==='ambil')return '<span>Ambil</span>';
    if(cmd==='berikan')return '<span>Berikan</span>';
    if(cmd==='serang')return '<span>Serang</span>';
    if(cmd==='kiri'||cmd==='kanan')return '<span>belok</span><span class="fld"><select aria-label="Arah belok">'+
      '<option value="kiri"'+(cmd==='kiri'?' selected':'')+'>kiri \u21BA</option>'+
      '<option value="kanan"'+(cmd==='kanan'?' selected':'')+'>kanan \u21BB</option></select></span>';
    var head=cmd==='ulangi'?'<span>Ulangi</span>'+selectN(n)+'<span>kali</span>'
      :'<span>Jika</span><span class="cnd">'+condTxt()+'</span>';
    return '<div class="u-head">'+head+'</div><div class="g-inner"></div><div class="u-foot"></div>';
  }
  function createBlock(cmd,n){
    var b=document.createElement('div');
    b.className='blk '+(cmd==='maju'?'maju':CONT[cmd]?'ulang '+cmd:(cmd==='ambil'||cmd==='berikan'||cmd==='serang')?'aksi '+cmd:'belok');
    b.dataset.cmd=cmd;b.draggable=true;b.tabIndex=0;
    if(cmd==='ulangi')b.dataset.n=n||3;
    b.innerHTML=blockHTML(cmd,b.dataset.n);
    return b;
  }
  function addBlock(cmd,before,box,n){
    var b=createBlock(cmd,n);
    (box||list).insertBefore(b,before||null);
    update();return b;
  }
  function removeBlock(b){if(b&&b.parentNode&&!running){b.parentNode.removeChild(b);update()}}
  function after(py,box){
    var ks=[].filter.call(box.children,function(b){return b!==dragEl&&b.dataset&&b.dataset.cmd});
    for(var i=0;i<ks.length;i++){var r=ks[i].getBoundingClientRect();if(py<r.top+r.height/2)return ks[i]}
    return null;
  }
  function bersihOver(){
    [].forEach.call(document.querySelectorAll('.g-inner.over'),function(i){i.classList.remove('over')});
    ws.classList.remove('over');
  }
  function tampil(c){   // ambil/berikan hanya muncul di level yang memakainya
    var ak=LEVELS[lvl].aksi||'sampai';
    if(lvl+1<MULAI[c])return false;
    if(c==='serang')return ak==='serang';
    if(c==='ambil')return ak==='serang'?false:(ak!=='sampai'||lvl+1>=8);   // level 3-7: hanya di level yang butuh; mulai level 8 selalu tampil (di level 'sampai' memakainya = salah ambil)
    if(c==='berikan')return ak==='antar';
    return true;
  }
  function buildPal(){
    pal.innerHTML='';
    ['maju','kiri','kanan','ulangi','ambil','berikan','serang','jika'].forEach(function(c){
      var b=createBlock(c,3);b.hidden=!tampil(c);pal.appendChild(b);
    });
  }

  var dragN=3;
  function tujuanKetuk(){var s=list.querySelector('.blk.ulang.sel');return s?inners(s)[0]:null}
  pal.addEventListener('dragstart',function(e){
    var b=e.target.closest('[data-cmd]');if(!b)return;
    dragEl=null;dragN=b.dataset.n||3;e.dataTransfer.setData('text/plain',b.dataset.cmd);
  });
  pal.addEventListener('click',function(e){
    var b=e.target.closest('[data-cmd]');
    if(b&&!e.target.closest('select')&&!running)addBlock(b.dataset.cmd,null,tujuanKetuk(),b.dataset.n);
  });
  pal.addEventListener('keydown',function(e){
    if((e.key==='Enter'||e.key===' ')&&e.target.dataset.cmd&&!running){e.preventDefault();addBlock(e.target.dataset.cmd,null,tujuanKetuk(),e.target.dataset.n)}
  });
  pal.addEventListener('dragover',function(e){if(dragEl)e.preventDefault()});
  pal.addEventListener('drop',function(e){if(dragEl){e.preventDefault();removeBlock(dragEl);dragEl=null}});
  [pal,list].forEach(function(box){
    box.addEventListener('change',function(e){
      var b=e.target.closest('.blk');if(!b)return;
      if(b.dataset.cmd==='ulangi')b.dataset.n=e.target.value;else b.dataset.cmd=e.target.value;
      update();
    });
  });
  list.addEventListener('dragstart',function(e){
    var b=e.target.closest('.blk');if(!b)return;
    dragEl=b;b.classList.add('drag');e.dataTransfer.setData('text/plain',b.dataset.cmd);
  });
  list.addEventListener('dragend',function(){if(dragEl)dragEl.classList.remove('drag');dragEl=null;bersihOver()});
  list.addEventListener('click',function(e){
    var b=e.target.closest('.blk');if(!b||e.target.closest('select'))return;
    [].forEach.call(list.querySelectorAll('.blk'),function(k){k.classList.toggle('sel',k===b&&!k.classList.contains('sel'))});
  });
  list.addEventListener('dblclick',function(e){if(!e.target.closest('select'))removeBlock(e.target.closest('.blk'))});
  list.addEventListener('keydown',function(e){
    if((e.key==='Delete'||e.key==='Backspace')&&e.target.classList.contains('blk')){e.preventDefault();removeBlock(e.target)}
  });
  // jatuhkan blok DI DALAM blok pembungkus (Ulangi / Jika / Jika..Kalau tidak / Ulangi sampai); blok tidak boleh masuk ke dirinya sendiri
  list.addEventListener('dragover',function(e){
    var inner=e.target.closest('.g-inner');
    if(!inner||(dragEl&&dragEl.contains(inner)))return;
    e.preventDefault();e.stopPropagation();bersihOver();inner.classList.add('over');
  });
  list.addEventListener('dragleave',function(e){
    var inner=e.target.closest('.g-inner');
    if(inner&&!inner.contains(e.relatedTarget))inner.classList.remove('over');
  });
  list.addEventListener('drop',function(e){
    var inner=e.target.closest('.g-inner');
    if(!inner||(dragEl&&dragEl.contains(inner)))return;
    e.preventDefault();e.stopPropagation();bersihOver();
    var cmd=e.dataTransfer.getData('text/plain');
    if(!sah(cmd)||running)return;
    var before=after(e.clientY,inner);
    if(dragEl){inner.insertBefore(dragEl,before);update()}else addBlock(cmd,before,inner,dragN);
  });
  ws.addEventListener('dragover',function(e){e.preventDefault();ws.classList.add('over')});
  ws.addEventListener('dragleave',function(){ws.classList.remove('over')});
  ws.addEventListener('drop',function(e){
    e.preventDefault();ws.classList.remove('over');
    var cmd=e.dataTransfer.getData('text/plain');
    if(!sah(cmd)||running)return;
    var before=after(e.clientY,list);
    if(dragEl){list.insertBefore(dragEl,before);update()}else addBlock(cmd,before,list,dragN);
  });

  /* ===== DIALOG CERITA =====
     Baris:  'Nama|teks' dialog  |  '*teks' narasi  |  '#teks' judul babak   (isi ada di data.js: before / after) */
  var SPEAKER={Anak:{c:'#e08a1e',i:'\uD83E\uDDD2'},Nenek:{c:'#c0527a',i:'\uD83D\uDC75'},Pelanggan:{c:'#2e8f86',i:'\uD83D\uDE42'},Pelanggan1:{c:'#2e8f86',i:'\uD83D\uDE42'},Pelanggan2:{c:'#2e8f86',i:'\uD83D\uDE42'},
    Pengembara:{c:'#6a5a3c',i:'\uD83E\uDDD9'},Shadow:{c:'#3b2f66',i:'\uD83D\uDC64'}};
  var dlgDone=null,typing=null,queue=[],curText='';
  function playDialog(lines){
    return new Promise(function(ok){
      if(!lines||!lines.length)return ok();
      queue=lines.slice();dlgDone=ok;$('dlg').hidden=false;nextLine();
    });
  }
  function nextLine(){
    if(!queue.length){$('dlg').hidden=true;bukaMata();var f=dlgDone;dlgDone=null;if(f)f();return}
    var line=queue.shift(),card=$('dlg-card'),text;
    card.className='dlg-card';card.style.removeProperty('--spk');
    if(line.charAt(0)==='#'){card.classList.add('judul');text=line.slice(1)}
    else if(line.charAt(0)==='*'){card.classList.add('narr');text=line.slice(1);if(/meredup|berpulang/i.test(text))tutupMata();if(/menghilang/i.test(text))goalHilang()}
    else{
      var i=line.indexOf('|'),nm=line.slice(0,i),k=nm.indexOf(':'),
          who=(k<0?nm:nm.slice(0,k)).trim(),eks=k<0?'':nm.slice(k+1).trim(),
          sp=SPEAKER[who]||SPEAKER[who.replace(/\s+/g,'')]||{c:'#7b4bd1',i:'\uD83D\uDE42'},fw=wajahFile(who,eks);
      text=line.slice(i+1);
      card.style.setProperty('--spk',sp.c);
      $('dlg-name').textContent=who;
      var face=$('dlg-face');face.textContent=sp.i;
      if(fw){
        var im=new Image();im.alt='';
        face._im=im;im.onload=function(){if(face._im===im){face.textContent='';face.appendChild(im)}};
        im.onerror=function(){console.warn('Gambar dialog tidak ditemukan: '+FOLDER+fw)};
        im.src=FOLDER+fw;
      }
    }
    curText=text;$('dlg-text').textContent='';
    var n=0;clearInterval(typing);
    typing=setInterval(function(){n++;$('dlg-text').textContent=text.slice(0,n);if(n>=text.length){clearInterval(typing);typing=null}},22);
  }
  function lanjut(){
    if(typing){clearInterval(typing);typing=null;$('dlg-text').textContent=curText;return}
    nextLine();
  }
  function lewati(){clearInterval(typing);typing=null;queue=[];nextLine()}
  /* efek menutup mata (Level 22: Nenek berpulang): kedip 2x perlahan, lalu menutup semua perlahan (gaya film).
     Tertutup selama dialog; setelah dialog selesai (dan animasi menutup tuntas) membuka lagi pelan-pelan. Kecepatan diatur di game2.css */
  function mataEl(){
    var m=document.querySelector('.mata');
    if(!m){
      m=document.createElement('div');m.className='mata';m.innerHTML='<i class="atas"></i><i class="bawah"></i>';
      m.addEventListener('animationend',function(e){
        if(e.animationName==='mataA'||e.animationName==='mataB'){
          m._tutup=true;
          if(m._bukaNanti)bukaMata();
        }else if(e.animationName==='bukaA'||e.animationName==='bukaB'){
          if(e.animationName==='bukaB')resetMata();
        }
      });
      document.body.appendChild(m);
    }
    return m;
  }
  function resetMata(){var m=document.querySelector('.mata');if(m){m.classList.remove('tutup','buka');m._tutup=false;m._bukaNanti=false}}
  function tutupMata(){var m=mataEl();resetMata();requestAnimationFrame(function(){requestAnimationFrame(function(){m.classList.add('tutup')})})}
  function bukaMata(){
    var m=document.querySelector('.mata');if(!m||!m.classList.contains('tutup'))return;
    if(!m._tutup){m._bukaNanti=true;return}   // masih kedip / menutup -> tunggu tuntas dulu
    m._bukaNanti=false;
    setTimeout(function(){m.classList.remove('tutup');m.classList.add('buka')},700);
  }
  $('dlg').addEventListener('click',function(e){if(e.target.id!=='dlg-skip')lanjut()});
  $('dlg-skip').addEventListener('click',function(e){e.stopPropagation();lewati()});
  document.addEventListener('keydown',function(e){
    if(!$('dlg').hidden&&(e.key==='Enter'||e.key===' ')){e.preventDefault();lanjut()}
  });

  /* ===== LEVEL & KEMAJUAN ===== */
  function prog(){
    var h='',buka=terbuka();
    for(var k=0;k<TOTAL;k++){
      var kunci=k>=buka,cls=k===lvl?'on':done[k]?'done':kunci?'lock':'',
          tip=kunci?'Terkunci: lolos '+buka+' level dulu':'Level '+(k+1)+(done[k]?' (selesai)':'');
      h+='<i class="'+cls+'" data-k="'+k+'" title="'+tip+'" aria-label="'+tip+'"></i>';
    }
    var p=$('g-prog');p.innerHTML=h+'<span class="flag">\u2691</span>';
    var on=p.querySelector('.on');
    if(on&&p.scrollWidth>p.clientWidth)p.scrollLeft=on.offsetLeft-p.clientWidth/2+on.offsetWidth/2;
  }
  var sudahMulai=false;
  function load(i){
    sudahMulai=true;
    if(dlgDone)lewati();
    resetMata();hapusAkhir();
    lvl=i;tMulai=Date.now();
    Progres.simpan(GID,i+1,false,0);   // catat sebagai terakhir dimainkan
    list.innerHTML='';
    var L=LEVELS[i];
    pilihPemain(i);pilihSuara(i);
    buildPal();build();reset();res.hidden=true;
    $('g-title').textContent='Level '+(i+1)+' : '+L.t;
    $('g-ins').textContent=L.ins;
    $('g-hint').textContent=L.hint?'\uD83D\uDCA1 '+L.hint:'';$('g-hint').hidden=!L.hint;
    prog();update();if(aturRender)aturRender();
    if(muatSolusi()){   // guru: susunan blok yang dulu berhasil dimuat lagi
      var hn=$('g-hint');hn.textContent=(L.hint?'\uD83D\uDCA1 '+L.hint+'  ':'')+'\u2714 Susunan blok jawabanmu yang berhasil dimuat. Tekan "Mulai ulang" kalau mau mengosongkan.';hn.hidden=false;
    }
    history.replaceState(null,'','?level='+(i+1));
    runBtn.disabled=true;
    musikAwal();
    playDialog(L.before).then(function(){runBtn.disabled=false});
  }
  $('g-prog').addEventListener('click',function(e){
    var k=e.target.dataset.k;if(k===undefined||running)return;
    k=+k;
    if(k>=terbuka()){var d=e.target;d.classList.remove('no');d.offsetWidth;d.classList.add('no');return}
    if(k<TOTAL)load(k);
  });

  /* ===== LAYAR AKHIR (setelah level terakhir) =====
     1) gambar penutup memenuhi area map  2) dialog (field ending di data.js)  3) tulisan TAMAT menutupi area map.
     Taruh gambarnya di folder gambar Game 2, lalu isi namanya di AKHIR_GAMBAR. Kalau file belum ada, latar gelap dipakai dulu. */
  var AKHIR_GAMBAR='ending.png';
  var akhirEl=null;
  function posAkhir(){   // pas menutupi area map (g-stage)
    var s=document.querySelector('.g-stage');if(!akhirEl||!s)return;
    var r=s.getBoundingClientRect();
    akhirEl.style.left=(r.left+(window.pageXOffset||0))+'px';akhirEl.style.top=(r.top+(window.pageYOffset||0))+'px';
    akhirEl.style.width=r.width+'px';akhirEl.style.height=r.height+'px';
    akhirEl.style.borderRadius=getComputedStyle(s).borderRadius;
  }
  function hapusAkhir(){if(akhirEl&&akhirEl.parentNode)akhirEl.parentNode.removeChild(akhirEl);akhirEl=null}
  function tampilAkhir(lines){
    hapusAkhir();
    var el=document.createElement('div');el.className='akhir';
    el.innerHTML='<div class="akhir-gbr"></div><div class="akhir-tamat"><b>TAMAT</b><p>Terima kasih sudah memainkan Cahaya Terakhir.</p>'+
      '<div class="g-row"><a class="btn-f" id="akhir-home" href="murid.html">Kembali ke Beranda</a><button class="btn-o" id="akhir-tutup" type="button">Lihat hasil</button></div></div>';
    document.body.appendChild(el);akhirEl=el;posAkhir();
    var h=$('g-home');if(h&&h.getAttribute('href'))el.querySelector('#akhir-home').setAttribute('href',h.getAttribute('href'));
    el.querySelector('#akhir-tutup').onclick=hapusAkhir;
    var g=el.querySelector('.akhir-gbr'),im=new Image();
    im.onload=function(){g.style.backgroundImage='url('+FOLDER+AKHIR_GAMBAR+')'};
    im.onerror=function(){console.warn('Gambar penutup tidak ditemukan: '+FOLDER+AKHIR_GAMBAR)};
    im.src=FOLDER+AKHIR_GAMBAR;
    requestAnimationFrame(function(){requestAnimationFrame(function(){el.classList.add('on')})});   // gambar muncul perlahan
    setTimeout(function(){playDialog(lines).then(tamat)},1800);
  }
  function tamat(){
    if(!akhirEl){tampilAkhir([]);return}   // tanpa dialog: gambar dulu, lalu TAMAT
    showRes(true,'Tamat','Terima kasih sudah memainkan Cahaya Terakhir. Kamu sudah menguasai urutan, ulangi, jika, dan ulangi sampai!');
    akhirEl.classList.add('tamat');   // tulisan TAMAT muncul perlahan menutupi map
  }
  window.addEventListener('resize',posAkhir);

  /* ===== TOMBOL ===== */
  runBtn.onclick=run;
  $('g-restart').onclick=function(){list.innerHTML='';update();res.hidden=true;reset()};
  $('g-again').onclick=function(){hapusAkhir();res.hidden=true;reset()};
  $('g-next').onclick=function(){load(lvl+1)};
  $('g-talk').onclick=function(){if(!running)playDialog(LEVELS[lvl].before)};
  window.addEventListener('resize',fit);

  /* ===== PROFIL & MENU ===== */
  function profil(){
    var u=window.currentUser||{},nama=(u.name||'Murid').trim();
    ROLE=u.role||'student';
    $('g-name').textContent=nama;
    $('g-prof-btn').textContent=nama.charAt(0).toUpperCase();
    $('g-role').textContent=ROLE==='teacher'?'Guru':'Murid';
    $('g-home').href=ROLE==='teacher'?'guru.html':'murid.html';
    $('g-prof-link').hidden=ROLE==='teacher';
  }
  var DD=[['g-prof-btn','g-prof'],['g-menu-btn','g-menu']];
  function closeMenus(){DD.forEach(function(p){$(p[1]).hidden=true;$(p[0]).setAttribute('aria-expanded','false')})}
  DD.forEach(function(p){
    $(p[0]).onclick=function(e){
      e.stopPropagation();var buka=$(p[1]).hidden;closeMenus();$(p[1]).hidden=!buka;this.setAttribute('aria-expanded',buka);
    };
  });
  document.addEventListener('click',closeMenus);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeMenus()});


  /* ===== ALAT ATUR (buka game2.html?level=1&atur=1) =====
     Slider paling atas = posisi papan level (garis hijau) per level, bergeser per petak sehingga selalu pas di garis map.
     Slider karakter/Shadow = ukuran & posisi gambar di dalam petak. Slider "Lantai" = kalau garis petak map-nya sendiri meleset.
     Klik "Salin angka", lalu tempel ke data.js (ox, oy) / game2.css / BG di game2.js. */
  if(/[?&]atur=1/.test(location.search))(function(){
    var P=document.createElement('div');P.id='atur';document.body.appendChild(P);
    var VARS=[['hero-h','Karakter: ukuran',40,260,160],['hero-x','Karakter: geser kanan(+) / kiri(-)',-60,60,-22],['hero-y','Karakter: geser turun(+) / naik(-)',-60,60,-55],
              ['sh-h','Tujuan karakter: ukuran',40,260,150],['sh-x','Tujuan karakter: geser kanan(+) / kiri(-)',-60,60,-20],['sh-y','Tujuan karakter: geser turun(+) / naik(-)',-60,60,-26]];
    var vals={};VARS.forEach(function(v){vals[v[0]]=v[4]});
    function terap(){VARS.forEach(function(v){board.style.setProperty('--'+v[0],vals[v[0]]+'%')})}
    function geom(){build();reset()}
    function slider(lbl,min,max,step,get,set){
      var w=document.createElement('label'),t=document.createElement('span'),n=document.createElement('span'),r=document.createElement('input');
      t.textContent=lbl;r.type='range';r.min=min;r.max=max;r.step=step;r.value=get();n.textContent=get();
      r.oninput=function(){set(+r.value);n.textContent=r.value;teks()};
      w.appendChild(t);w.appendChild(n);w.appendChild(r);P.appendChild(w);
    }
    var ta,gbVals={};
    gbTool=function(){   // pasang nilai slider ke semua petak yang memakai gambar itu
      Object.keys(gbVals).forEach(function(f){
        var g=gbVals[f];
        [].forEach.call(grid.querySelectorAll('[data-gb]'),function(c){
          if(c.dataset.gb!==f)return;
          c.style.setProperty('--gb-skala',g.sk);c.style.setProperty('--gb-x',g.x+'%');c.style.setProperty('--gb-y',g.y+'%');
        });
      });
    };
    function teks(){
      var m=mapKey(LEVELS[lvl]),cfg=BG[m],o='/* game2.css */\n.g-board[data-map="'+m+'"]{';
      VARS.forEach(function(v){o+='--'+v[0]+':'+vals[v[0]]+'%;'});o+='}\n';
      if(cfg){var a=cfg.area;o+='\n/* game2.js: GANTI seluruh baris  '+m+':petaBG(...)  di BG dengan ini (map terakhir tanpa koma di ujung) */\n'+m+":petaBG('"+cfg.gambar+"',null,{kolom:"+cfg.kolom+',baris:'+cfg.baris+',area:{t:'+a.t+',r:'+a.r+',b:'+a.b+',l:'+a.l+'}}),'}
      var Lt=LEVELS[lvl];
      if(cfg){var kk=cfg.kolom||COLS,bb=cfg.baris||ROWS;
        o+='\n\n/* data.js, level '+(lvl+1)+' (tambahkan di level ini) */\nox:'+posOx(Lt,cfg,kk)+',oy:'+posOy(Lt,cfg,bb)+','}
      var fl=Object.keys(gbVals);
      if(fl.length){
        o+='\n\n/* game2.css: tempel di bagian "UKURAN & POSISI GAMBAR PENGHALANG" (ganti baris file yang sama). Khusus map ini saja: awali dengan .g-board[data-map="'+m+'"] */';
        fl.forEach(function(f){var g=gbVals[f];o+='\n.g-cell[data-gb="'+f+'"]{--gb-skala:'+g.sk+';--gb-x:'+g.x+'%;--gb-y:'+g.y+'%}'});
      }
      ta.value=o;
    }
    aturRender=function(){
      P.innerHTML='<b style="margin-top:0">Alat atur (map '+mapKey(LEVELS[lvl])+')</b>';
      var Lc=LEVELS[lvl],cfg=BG[mapKey(Lc)];
      if(cfg){   // posisi papan level = garis hijau (geser per petak, selalu pas di garis map)
        var kol0=cfg.kolom||COLS,bar0=cfg.baris||ROWS;
        P.insertAdjacentHTML('beforeend','<b>Posisi papan level ini (garis hijau) - level '+(lvl+1)+'</b>');
        if(kol0-COLS>0)slider('Geser kanan (petak dari kiri)',0,kol0-COLS,1,function(){return posOx(Lc,cfg,kol0)},function(x){Lc.ox=x;geom()});
        if(bar0-ROWS>0)slider('Geser turun (petak dari atas)',0,bar0-ROWS,1,function(){return posOy(Lc,cfg,bar0)},function(x){Lc.oy=x;geom()});
      }
      VARS.forEach(function(v){slider(v[1],v[2],v[3],1,function(){return vals[v[0]]},function(x){vals[v[0]]=x;terap()})});
      gbVals={};
      var files=[];[].forEach.call(grid.querySelectorAll('[data-gb]'),function(c){var f=c.dataset.gb;if(f&&files.indexOf(f)<0)files.push(f)});
      if(files.length){   // ukuran & posisi gambar penghalang / lubang yang dipakai di level ini
        P.insertAdjacentHTML('beforeend','<b>Gambar penghalang / lubang di level ini</b>');
        files.forEach(function(f){
          var cell=grid.querySelector('[data-gb="'+f+'"]'),cs=getComputedStyle(cell);
          gbVals[f]={sk:parseFloat(cs.getPropertyValue('--gb-skala'))||1,x:parseFloat(cs.getPropertyValue('--gb-x'))||0,y:parseFloat(cs.getPropertyValue('--gb-y'))||0};
          P.insertAdjacentHTML('beforeend','<b style="margin-top:4px">'+f+'</b>');
          slider('ukuran (1 = 1 petak)',0.3,4,0.05,function(){return gbVals[f].sk},function(v){gbVals[f].sk=v;gbTool()});
          slider('geser kanan(+) / kiri(-) (%)',-100,100,1,function(){return gbVals[f].x},function(v){gbVals[f].x=v;gbTool()});
          slider('geser turun(+) / naik(-) (%)',-100,100,1,function(){return gbVals[f].y},function(v){gbVals[f].y=v;gbTool()});
        });
      }
      if(cfg){
        P.insertAdjacentHTML('beforeend','<b>Lantai di gambar map (garis petak)</b>');
        [['t','Jarak atas'],['b','Jarak bawah'],['l','Jarak kiri'],['r','Jarak kanan']].forEach(function(k){
          slider(k[1]+' (%)',0,30,0.1,function(){return cfg.area[k[0]]},function(x){cfg.area[k[0]]=Math.round(x*10)/10;geom()})});
        slider('Kolom lantai',4,30,1,function(){return cfg.kolom},function(x){cfg.kolom=x;geom()});
        slider('Baris lantai',3,20,1,function(){return cfg.baris},function(x){cfg.baris=x;geom()});
      }
      ta=document.createElement('textarea');ta.readOnly=true;P.appendChild(ta);
      var b=document.createElement('button');b.type='button';b.textContent='Salin angka';
      b.onclick=function(){ta.select();try{document.execCommand('copy')}catch(e){}};P.appendChild(b);
      terap();teks();
    };
  })();

  /* ===== MULAI: tunggu login + gambar karakter siap ===== */
  var gambarOK=false,loginOK=false;
  function coba(){if(gambarOK&&loginOK)mulai(load)}
  setTimeout(function(){   // diagnosa kalau game belum mulai setelah 6 detik
    if(sudahMulai)return;
    window.__errGame2('Game belum mulai setelah 6 detik.\n- login siap: '+loginOK+(loginOK?'':'  (guard.js belum memberi window.currentUser / event auth-ready)')+
      '\n- gambar karakter siap: '+gambarOK+'\n- Progres ada: '+(typeof Progres!=='undefined'));
  },6000);
  (function(fn){if(window.currentUser)fn();else document.addEventListener('auth-ready',function(){fn()})})(function(){profil();loginOK=true;coba()});
  (function(){   // muat dulu semua gambar pemain. Hanya FILE yang hilang yang dibuang (arah itu otomatis pakai arah sebaliknya, dibalik);
                 // paket baru dilewati kalau tidak ada satu pun gambarnya
    var sisaSet=PEMAIN.length;
    function selesaiSet(){if(--sisaSet<=0){gambarOK=true;coba()}}
    PEMAIN.forEach(function(S){
      var urls=[],gagal={};
      NAMES.forEach(function(n){
        if(S.idle&&S.idle[n])urls.push(S.idle[n]);
        ((S.walk&&S.walk[n])||[]).forEach(function(u){urls.push(u)});
      });
      var sisa=urls.length,hilang=[];
      function beres(){
        NAMES.forEach(function(n){
          if(S.idle&&gagal[S.idle[n]])S.idle[n]=null;
          if(S.walk&&S.walk[n])S.walk[n]=S.walk[n].filter(function(u){return !gagal[u]});
        });
        S._ok=hilang.length<urls.length;
        if(hilang.length)console.error('Karakter pemain (dari level '+S.dari+'): file tidak ditemukan di '+S.folder+' -> '+hilang.join(', ')+
          '  (cek ejaan & huruf besar/kecil nama file)');
        selesaiSet();
      }
      if(!sisa){S._ok=false;selesaiSet();return}
      urls.forEach(function(u){
        var im=new Image();
        im.onload=function(){if(--sisa<=0)beres()};
        im.onerror=function(){gagal[u]=1;hilang.push(u);if(--sisa<=0)beres()};
        im.src=S.folder+u;
      });
    });
  })();
})();