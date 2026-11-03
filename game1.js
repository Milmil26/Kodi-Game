(function(){
  /* ===== DATA LEVEL =====
     Isi level (posisi awal, tujuan, batu, instruksi) ada di data.js, supaya halaman Eksplor
     memakai data yang sama. Tambah / ubah level di sana. */
  var LEVELS=window.GAMES[0].levels;
  var LOOP_DARI=6;   // blok Ulangi mulai muncul di level ini
  var COLS=12,ROWS=5,TOTAL=20,DX=[0,1,0,-1],DY=[-1,0,1,0];

   /* ===== GAMBAR KARAKTER (UBAH DI SINI SAJA) =====
     Karakter dibagi per TAHAP. Tiap tahap = satu paket gambar: PEMAIN (idle, walk) + TUJUAN (goal, menang).
     "dari" = mulai dari level berapa paket itu dipakai. Paket pertama harus dari:1.
       Tahap 1 -> level 1 sampai 10
       Tahap 2 -> level 11 dan seterusnya
     Mau tahap ketiga (misal mulai level 16)? Salin satu blok { ... } lalu isi dari:16.*/

     var SETS=[
    { dari:1, folder:'image/',
      idle:{atas:'hadap-blkng.png',kanan:'karakter1.png',bawah:'hadap-dpn.png',kiri:null},
      walk:{atas:['jalan-blkng.png'],
            kanan:['karakter2.png','karakter3.png','karakter4.png'],
            bawah:['jalan-dpn.png'],
            kiri:null},
      goal:'sipink.png',          // karakter tujuan
      goalWin:'sipink-2.png'      // gambar saat berhasil (gambar berhasil)
    },
    { dari:6, folder:'image/',
      goal:'biru-kiri.png',          // karakter tujuan
      goalWin:'tulang-b.png'      
    },
    { dari:11, folder:'image/',
      // PEMAIN tahap 2: ganti dengan nama file PNG karakter kamu
      idle:{atas:'k-hdp blkng.png',kanan:'kun-kanan.png',bawah:'k-depan.png',kiri:null},
      walk:{atas:['k-jln blkng.png'],
            kanan:['k-jalan.png','k-jalan1.png','kun-kanan.png'],
            bawah:['k-jln depan.png'],
            kiri:null},
      // TUJUAN tahap 2: alas + animasi saat sampai
      goal:'tujuan2.png',                   // alas kosong
      menang:[
        {src:'k-crew2.png',tunda:0},     // karakter bersinar hijau
        {src:'k-crew3.png',tunda:800}    // cakram hijau melewati karakter
      ],
      menangDurasi:2200,
      sembunyikanPemain:true
    },
    { dari:16, folder:'image/',
      idle:{atas:'hadap-blkng.png',kanan:'karakter1.png',bawah:'hadap-dpn.png',kiri:null},
      walk:{atas:['jalan-blkng.png'],
            kanan:['karakter2.png','karakter3.png','karakter4.png'],
            bawah:['jalan-dpn.png'],
            kiri:null},
      goal:'kuning-kiri.png',          // karakter tujuan
      goalWin:'tulang-k.png',      // gambar saat tujuan 1 tercapai
      goal2:'sibiru.png',          // tujuan 2 (dipakai level yang punya g2)
      goal2Win:'sibiru-2.png'      // gambar saat tujuan 2 tercapai (kosongkan/hapus = tujuan 2 menghilang)
    },

  ];
  var SPRITE=SETS[0],GSET=SETS[0];   // SPRITE = paket pemain yang dipakai, GSET = paket tujuan (diganti otomatis tiap level)

  /* ===== GAMBAR MAP (GANTI DI SINI) =====
     1. Taruh gambar di folder  image/map/
     2. gambar = background papan. Rasio papan 12:5 (contoh 1920x800 px), 1 petak = 160x160 px
     3. tembok = gambar penghalang (kotak, background transparan). null = kotak ungu bawaan */
  var BG={
    folder:'image/',          // folder gambar map (kalau map ada di image/map/ tulis 'image/map/')
    gambar:'map-pas.png',     // map yang kotak-kotaknya sudah dibuat rata & sama besar
    tembok:'box1.png',        // gambar penghalang (boleh null: kotak ungu bawaan)
    /* AREA LANTAI di gambar map (supaya karakter tidak keluar dari kotak-kotak).
       rasio = lebar/tinggi gambar map (px). kolom = jumlah kotak mendatar di lantai.
       t/r/b/l = jarak tepi gambar ke lantai, dalam % (atas, kanan, bawah, kiri).
       Kalau ganti gambar map, ubah 4 angka ini sesuai gambar barunya. */
    rasio:'1942/809',
    kolom:11,
    area:{t:12.36,r:3.50,b:11.50,l:3.24},
    garis:false              // true = tampilkan garis merah petak game di atas map (untuk mengecek pas/tidaknya)
  };
  if(BG.gambar&&BG.kolom)COLS=BG.kolom;

  /* ===== MUSIK / SUARA (GANTI DI SINI) =====
     1. Buat folder  audio/  di sebelah game1.html, taruh file .mp3 / .ogg / .wav di situ
     2. Ada 3 suara, diputar berurutan:
        awal     = musik waktu game muncul (karakter tampil)
        tujuan    = saat karakter sampai di tujuan (animasi menang)
        berhasil = saat pemberitahuan "Hebat! / target berhasil" muncul */
  var SUARAS=[
    { levels:[[1,10],[16,20]], folder:'audio/',
      awal:'awalan-impos.mp3',
      tujuan:'death.mp3',
      berhasil:'hore.mp3',
      lebihAwal:500,  // suara tujuan dinyalakan sekian ms SEBELUM gambar berubah (0 = tepat saat berubah)
      volume:0.6
    },
    { levels:[[11,15]], folder:'audio/',
      awal:'awalan-impos.mp3',     // <- ganti: musik awal tahap 2
      tujuan:'scan-sound.mp3',           // <- ganti: suara saat sampai di tujuan (misal suara teleport)
      berhasil:'hore.mp3',         // <- ganti: suara "Hebat!"
      lebihAwal:500,
      volume:0.6
    }
  ];
  var SUARA=SUARAS[0];
  // pastikan semua folder diakhiri tanda "/" (supaya 'image' dan 'image/' sama-sama aman)
  SETS.concat(SUARAS).concat([BG]).forEach(function(o){if(o.folder&&o.folder.slice(-1)!=='/')o.folder+='/'});

  var sfx={},awalMain=false;
  function suara(k){
    if(!SUARA[k])return null;
    if(!sfx[k]){
      sfx[k]=new Audio();
      sfx[k].preload='auto';
      sfx[k].src=SUARA.folder+SUARA[k];
      sfx[k].volume=SUARA.volume;
      sfx[k].onerror=function(){console.warn('Suara tidak ditemukan: '+SUARA.folder+SUARA[k])};
    }
    return sfx[k];
  }
  function mainkan(k){
    var a=suara(k);
    if(!a)return;
    a._buka=false;a.muted=false;
    try{a.currentTime=0;var p=a.play();if(p&&p.catch)p.catch(function(){})}catch(e){}
  }
  // muat semua suara dari awal (supaya langsung bunyi, tidak telat) dan
  // "buka kunci" suara yang bunyinya nanti (tujuan, berhasil) saat tombol Jalankan diklik -
  // browser (terutama HP/iPhone) hanya mengizinkan suara yang disiapkan lewat klik
  function siapkanSuara(){
    ['awal','tujuan','berhasil'].forEach(suara);
  }
  function bukaKunciSuara(){
    ['tujuan','berhasil'].forEach(function(k){
      var a=suara(k);
      if(!a)return;
      a._buka=true;a.muted=true;
      var p;
      try{p=a.play()}catch(e){}
      if(p&&p.then)p.then(function(){
        if(a._buka){a.pause();a.currentTime=0}
        a.muted=false;
      }).catch(function(){a.muted=false});
      else a.muted=false;
    });
  }
  siapkanSuara();
  // ganti paket suara sesuai level; musik awal paket lama dihentikan, paket baru dimainkan dari awal
  function pilihSuara(i){
    var pick=SUARAS[0],n=i+1;
    SUARAS.forEach(function(S){
      var cocok=S.levels?S.levels.some(function(r){return n>=r[0]&&n<=r[1]}):n>=S.dari;
      if(cocok)pick=S;
    });
    if(pick===SUARA)return;
    Object.keys(sfx).forEach(function(k){try{sfx[k].pause()}catch(e){}});
    sfx={};awalMain=false;
    SUARA=pick;
    siapkanSuara();
  }
  // suara tujuan: dimainkan sekali per percobaan, boleh lebih awal dari gambar berhasil
  var tujuanT=null,tujuanSudah=false;
  function suaraTujuan(){
    if(tujuanSudah)return;
    tujuanSudah=true;
    if(sfx.awal)sfx.awal.pause();   // musik awal berhenti, ganti suara tujuan
    mainkan('tujuan');
  }
  // level 2 tujuan: SETIAP tujuan yang dicapai bunyi sendiri (bisa berkali-kali dalam satu percobaan)
  function suaraTujuanGanda(){
    if(sfx.awal)sfx.awal.pause();
    mainkan('tujuan');
  }
  // musik awal: dicoba langsung, kalau diblok browser ditunda sampai klik/sentuh pertama
  function musikAwal(){
    var a=suara('awal');
    if(!a||awalMain)return;
    awalMain=true;
    var p;
    try{p=a.play()}catch(e){}
    if(p&&p.catch)p.catch(function(){
      awalMain=false;
      var go=function(){
        ['click','keydown','touchstart'].forEach(function(ev){document.removeEventListener(ev,go)});
        musikAwal();
      };
      ['click','keydown','touchstart'].forEach(function(ev){document.addEventListener(ev,go)});
    });
  }

  /* ===== KECEPATAN JALAN =====
     STEP harus sama dengan durasi transition di game1.css (.g-hero = .5s)
     JEDA = berhenti sebentar setelah tiap langkah/belokan (ms), supaya anak bisa menghitung
     "satu blok = satu kali jalan". Mau lebih jelas: besarkan (misal 250). Mau tanpa jeda: 0 */
  var STEP=500,TURN=300,JEDA=100;
  var NAMES=['atas','kanan','bawah','kiri'],useImg=false,useImgG=false,walkT=null,frame=0,menangT=[];
  var CODE={maju:'maju();',kiri:'belokKiri();',kanan:'belokKanan();'};
  function sah(c){return c==='ulangi'||!!CODE[c]}   // perintah blok yang dikenal

  var $=function(id){return document.getElementById(id)};
  var grid,board=$('g-board'),list=$('g-list'),ws=$('g-ws'),runBtn=$('g-run'),res=$('g-result');
  var lvl=0,done=[],x,y,ang,running=false,timer=null,dragEl=null,hero,goal,goals=[];

  /* ===== TERAKHIR DIMAINKAN =====
     Tiap level dibuka (load) dan tiap level selesai, dicatat ke Supabase lewat progres-api.js.
     murid.html membaca catatan terbaru itu untuk bagian "Terakhir dimainkan". */
  var tMulai=Date.now();   // waktu level dibuka, untuk menghitung lama bermain
  // buka level dari ?level=8 (tombol Lanjutkan di murid.html)
  function levelAwal(){
    var n=parseInt(new URLSearchParams(location.search).get('level'),10);
    return (n>=1&&n<=LEVELS.length&&n<=terbuka())?n-1:0;
  }

  /* ===== KUNCI LEVEL =====
     Level 1-5 terbuka dari awal. Setiap kelipatan 5 level yang lolos
     otomatis membuka 5 level berikutnya (5 lolos -> 6-10, 10 lolos -> 11-15, dst). */
  var PER_BLOK=5;
  function terbuka(){
    if(ROLE==='teacher')return TOTAL;   // guru boleh membuka semua level
    var n=done.filter(Boolean).length;
    return Math.min(TOTAL,(Math.floor(n/PER_BLOK)+1)*PER_BLOK);
  }
  // kemajuan disimpan per murid di Supabase (tabel progress)
  function simpanProgres(){
    var detik=Math.min(3600,Math.round((Date.now()-tMulai)/1000));
    Progres.simpan(1,lvl+1,true,detik);
  }
  // ambil level yang sudah selesai dari Supabase, lalu panggil cb(indeksLevelAwal)
  function mulai(cb){
    done=[];
    Progres.muat(1).then(function(rows){
      rows.forEach(function(r){if(r.completed)done[r.level-1]=true});
      cb(levelAwal());
    }).catch(function(err){
      console.error(err);
      cb(levelAwal());
    });
  }

  function dirOf(){return ((ang/90)%4+4)%4}
  function isWall(cx,cy){return LEVELS[lvl].w.some(function(p){return p[0]===cx&&p[1]===cy})}
  // urutan langkah yang dijalankan: blok Ulangi dibuka jadi langkah-langkah satu per satu
  function program(){
    var P=[];
    [].forEach.call(list.children,function(b){
      if(b.dataset.cmd==='ulangi'){
        var n=parseInt(b.dataset.n,10)||1,
            kids=[].filter.call(b.querySelector('.g-inner').children,function(k){return k.dataset.cmd});
        for(var i=0;i<n;i++)kids.forEach(function(k){P.push({cmd:k.dataset.cmd,el:k,loop:b})});
      }else P.push({cmd:b.dataset.cmd,el:b,loop:null});
    });
    return P;
  }
  /* ===== PAPAN GAME ===== */
  function sprite(cls,src){
    var e=document.createElement('div');
    e.className=cls;
    if((cls==='g-hero'?useImg:useImgG)&&src){
      e.classList.add('img');
      e.innerHTML='<img class="bean" alt="">';
      if(src!=='hero')e.firstChild.src=GSET.folder+src;
    }else{
      e.innerHTML='<svg class="bean"><use href="#bean"/></svg>';
    }
    grid.appendChild(e);
    return e;
  }
  function build(){
    var L=LEVELS[lvl];
    var A=BG.gambar?BG.area:{t:0,r:0,b:0,l:0};
    board.style.aspectRatio=BG.gambar?BG.rasio:COLS+'/'+ROWS;
    board.innerHTML='';
    grid=document.createElement('div');
    grid.className='g-grid';
    grid.style.cssText='left:'+A.l+'%;right:'+A.r+'%;top:'+A.t+'%;bottom:'+A.b+'%';
    grid.style.setProperty('--c',COLS);
    grid.style.setProperty('--r',ROWS);
    board.appendChild(grid);
    board.style.backgroundImage=BG.gambar?'url('+BG.folder+BG.gambar+')':'';
    board.classList.toggle('has-bg',!!BG.gambar);
    board.classList.toggle('debug',!!BG.garis||/[?&]garis=1/.test(location.search));
    if(BG.gambar){
      // kalau gambar map tidak ketemu: balik ke papan kotak-kotak ungu + pesan di Console (F12)
      var pr=new Image();
      pr.onerror=function(){
        board.classList.remove('has-bg');board.style.backgroundImage='';
        console.warn('Gambar map tidak ditemukan: '+BG.folder+BG.gambar);
      };
      pr.src=BG.folder+BG.gambar;
    }
    for(var k=0;k<COLS*ROWS;k++){
      var c=document.createElement('div'),cx=k%COLS,cy=(k-cx)/COLS;
      c.className='g-cell'+((cx+cy)%2?' b':'')+(isWall(cx,cy)?' wall':'');
      if(BG.tembok&&isWall(cx,cy)){
        c.classList.add('img');
        c.style.setProperty('--img','url('+BG.folder+BG.tembok+')');   // ukuran box diatur di game1.css (--ukuran)
      }
      grid.appendChild(c);
    }
    // tujuan 1 (g) dan, kalau ada, tujuan 2 (g2). Tiap tujuan punya status "hit" (sudah dicapai atau belum)
    goals=[];
    [[L.g,GSET.goal,GSET.goalWin],L.g2&&[L.g2,GSET.goal2||GSET.goal,GSET.goal2Win]].forEach(function(t){
      if(!t)return;
      var e=sprite('g-goal',t[1]);
      e.style.left=t[0].x*100/COLS+'%';
      e.style.top=t[0].y*100/ROWS+'%';
      goals.push({x:t[0].x,y:t[0].y,el:e,hit:false,awal:t[1],menang:t[2]||null});
    });
    goal=goals[0].el;
    hero=sprite('g-hero',useImg?'hero':null);
  }
  // pilih gambar sesuai arah; saat melangkah bergantian antar frame walk
  function img(){
    if(!useImg||!hero)return;
    var n=NAMES[dirOf()],set=n,flip=false;
    // kalau arah ini tidak punya gambar sama sekali (null), pakai arah sebaliknya yang dibalik
    if(!SPRITE.idle[n]&&!(SPRITE.walk[n]&&SPRITE.walk[n].length)){set=(n==='kiri')?'kanan':'kiri';flip=true}
    var idle=SPRITE.idle[set],w=SPRITE.walk[set]||[],src=idle||w[0];
    if(walkT&&w.length){
      // kalau frame jalan cuma 1, gantian dengan gambar diam supaya kaki tetap bergerak
      var fr=(w.length>1||!idle)?w:[idle,w[0]];
      src=fr[frame%fr.length];
    }
    if(!src)return;
    hero.firstChild.src=SPRITE.folder+src;
    hero.firstChild.style.transform=flip?'scaleX(-1)':'';
  }
  function startWalk(){
    if(!useImg)return;
    clearInterval(walkT);frame=0;
    walkT=setInterval(function(){frame++;img()},125);
    img();
  }
  function stopWalk(){
    clearInterval(walkT);walkT=null;img();
  }
  function draw(){
    hero.style.left=x*100/COLS+'%';
    hero.style.top=y*100/ROWS+'%';
    if(useImg){img();return}
    hero.firstChild.style.transform=dirOf()===3?'scaleX(-1)':'';
  }
  function reset(){
    clearTimeout(timer);
    ['tujuan','berhasil'].forEach(function(k){if(sfx[k])sfx[k].pause()});   // hentikan suara kalau main ulang
    clearTimeout(tujuanT);tujuanSudah=false;
    clearInterval(walkT);walkT=null;
    running=false;runBtn.disabled=false;
    var s=LEVELS[lvl].s;
    x=s.x;y=s.y;ang=s.d*90;
    hero.classList.add('noanim');
    hero.classList.remove('shake');
    goals.forEach(function(g){
      g.hit=false;
      g.el.classList.remove('pop','swap','menang');
      if(useImgG&&g.awal&&g.el.firstChild)g.el.firstChild.src=GSET.folder+g.awal;
    });
    clearTimeout(goal._t);
    menangT.forEach(clearTimeout);menangT=[];
    hero.classList.remove('hilang');
    draw();
    hero.offsetWidth;
    hero.classList.remove('noanim');
    mark(null);
  }
  function mark(el,loop){
    [].forEach.call(list.querySelectorAll('.run,.u-on'),function(b){b.classList.remove('run','u-on')});
    if(el)el.classList.add('run');
    if(loop)loop.classList.add('u-on');
  }

  /* ===== TUJUAN GANDA =====
     Level dengan g2 punya 2 tujuan: selesai kalau dua-duanya sudah dimampiri (urutan bebas).
     Level dengan 1 tujuan: aturan lama, karakter harus berhenti tepat di tujuan. */
  function semuaTercapai(px,py){
    if(goals.length<2)return px===goals[0].x&&py===goals[0].y;
    return goals.every(function(g){return g.hit||(g.x===px&&g.y===py)});
  }
  // dipanggil tiap karakter selesai melangkah: tandai tujuan yang baru dicapai + tampilkan gambar berhasilnya
  function cekTujuan(){
    if(goals.length<2)return;
    goals.forEach(function(g){
      if(g.hit||g.x!==x||g.y!==y)return;
      g.hit=true;
      if(useImgG&&g.menang){g.el.classList.add('swap');g.el.firstChild.src=GSET.folder+g.menang}
      else if(useImgG){
        // gambar berhasil tujuan ini belum diisi / filenya tidak ketemu: gambar dibiarkan (hanya bergoyang), TIDAK dihilangkan
        console.warn('Tujuan di petak ('+g.x+','+g.y+') belum punya gambar berhasil (goalWin / goal2Win di SETS). Cek juga pesan "Gambar karakter tidak ditemukan".');
        g.el.classList.add('swap');
      }else g.el.classList.add('pop');
    });
  }

  /* ===== MENJALANKAN BLOK ===== */
  function run(){
    if(running)return;
    var P=program(),c=P.map(function(p){return p.cmd});
    if(!c.length){
      if(list.children.length)showRes(false,'Blok Ulangi masih kosong','Masukkan blok Gerak maju atau Belok ke dalam blok Ulangi.');
      else showRes(false,'Belum ada blok','Seret blok ke area kerja dulu ya.');
      return;
    }
    reset();
    running=true;runBtn.disabled=true;
    bukaKunciSuara();
    var k=0;
    (function step(){
      if(k>=c.length){mark(null);stopWalk();finish();return}
      mark(P[k].el,P[k].loop);
      var cmd=c[k++];
      if(cmd==='maju'){
        var nx=x+DX[dirOf()],ny=y+DY[dirOf()];
        if(nx<0||ny<0||nx>=COLS||ny>=ROWS||isWall(nx,ny)){crash();return}
        x=nx;y=ny;
        // langkah terakhir yang sampai di tujuan: nyalakan suara tujuan sedikit lebih awal dari gambar berhasil
        if(goals.length>1){
          // level 2 tujuan: kalau petak ini tujuan yang belum dicapai, bunyikan suaranya sedikit lebih awal dari gambarnya berubah
          if(goals.some(function(g){return !g.hit&&g.x===x&&g.y===y}))
            tujuanT=setTimeout(suaraTujuanGanda,Math.max(0,STEP-SUARA.lebihAwal));
        }else if(k>=c.length&&semuaTercapai(x,y))
          tujuanT=setTimeout(suaraTujuan,Math.max(0,STEP-SUARA.lebihAwal));
        startWalk();             // satu blok maju = satu petak, kaki bergerak
        draw();
        timer=setTimeout(function(){
          stopWalk();            // sampai di petak: berdiri diam sebentar
          cekTujuan();           // kena tujuan 1 / 2?
          if(k>=c.length){mark(null);finish();return}   // langkah terakhir: tanpa jeda, langsung cek tujuan
          timer=setTimeout(step,JEDA);
        },STEP);
      }else{
        stopWalk();              // berhenti dulu saat belok
        ang+=(cmd==='kiri'?-90:90);
        draw();
        timer=setTimeout(step,k>=c.length?TURN:TURN+JEDA);
      }
    })();
  }
  function crash(){
    stopWalk();
    hero.classList.add('shake');
    timer=setTimeout(function(){
      running=false;
      showRes(false,'Ups, menabrak!','Karakter menabrak penghalang atau tepi papan. Coba atur ulang blok.');
    },500);
  }
  function finish(){
    running=false;
    if(semuaTercapai(x,y)){
      var tunggu=1600;                  // ms sampai pesan "Hebat!" muncul
      if(goals.length>1){
        // suara & gambar berhasil tiap tujuan sudah jalan saat tujuan itu dicapai (lihat cekTujuan), jadi tidak diulang di sini
        tunggu=1100;
      }else if(useImgG&&GSET.menang&&GSET.menang.length){
        // urutan gambar menang (lihat "menang" di SETS): tiap frame muncul sesuai tunda
        suaraTujuan();
        goal.classList.add('menang');   // ukuran gambar menang diatur di game1.css (.g-goal.menang)
        if(GSET.sembunyikanPemain)hero.classList.add('hilang');
        GSET.menang.forEach(function(m){
          menangT.push(setTimeout(function(){goal.firstChild.src=GSET.folder+m.src},m.tunda||0));
        });
        tunggu=GSET.menangDurasi||2200;
      }else if(useImgG&&GSET.goalWin){
        // ganti gambar target (si biru -> gambar berhasil) dengan animasi
        // begitu karakter merah sampai: karakter tujuan LANGSUNG berubah jadi gambar berhasil (tanpa jeda)
        goal.classList.add('swap');
        goal.firstChild.src=GSET.folder+GSET.goalWin;
        suaraTujuan();                   // kalau belum bunyi lebih awal, bunyikan sekarang
      }else{
        goal.classList.add('pop');
        suaraTujuan();
      }
      var sebelum=terbuka();
      done[lvl]=true;simpanProgres();
      var sesudah=terbuka();
      prog();
      timer=setTimeout(function(){
        var info=sesudah>sebelum?' Level '+(sebelum+1)+'\u2013'+sesudah+' terbuka!':'';
        showRes(true,'Hebat!',(goals.length>1?'Kamu berhasil mencapai kedua tujuan dengan ':'Kamu berhasil sampai ke tujuan dengan ')+list.querySelectorAll('.blk').length+' blok.'+info);
      },tunggu);
    }else{
      var n=goals.filter(function(g){return g.hit}).length;
      if(goals.length>1&&n>0)showRes(false,'Baru separuh','Baru '+n+' dari '+goals.length+' tujuan yang tercapai. Capai keduanya ya!');
      else showRes(false,'Belum sampai','Karakter belum sampai di tujuan. Coba lagi!');
    }
  }
  function showRes(ok,t,p){
    $('g-res-t').textContent=t;
    $('g-res-p').textContent=p;
    $('g-stars').hidden=!ok;
    if(ok)mainkan('berhasil');   // suara pemberitahuan berhasil
    $('g-next').hidden=!(ok&&lvl<LEVELS.length-1&&lvl+1<terbuka());
    res.hidden=false;
    runBtn.disabled=false;
  }

  /* ===== BLOK: seret / ketuk ===== */
  // kode yang tampil di panel Kode (blok Ulangi ditulis dengan { })
  function barisKode(box,pad){
    var out=[];
    [].forEach.call(box.children,function(b){
      var c=b.dataset.cmd;
      if(!c)return;
      if(c==='ulangi'){
        out.push(pad+'ulangi('+(b.dataset.n||1)+') {');
        out=out.concat(barisKode(b.querySelector('.g-inner'),pad+'  '));
        out.push(pad+'}');
      }else out.push(pad+CODE[c]);
    });
    return out;
  }
  function update(){
    var L=barisKode(list,'');
    $('g-code').textContent='// ketika dijalankan\n'+(L.length?L.join('\n'):'// (belum ada blok)');
  }
  function blockHTML(cmd){
    if(cmd==='maju')return '<span>Gerak maju</span>';
    return '<span>belok</span><span class="fld"><select aria-label="Arah belok">'+
      '<option value="kiri"'+(cmd==='kiri'?' selected':'')+'>kiri \u21BA</option>'+
      '<option value="kanan"'+(cmd==='kanan'?' selected':'')+'>kanan \u21BB</option></select></span>';
  }
  // blok ULANGI: kepala (jumlah ulangan) + isi (tempat blok lain) + kaki
  function loopHTML(n){
    var o='';
    for(var i=2;i<=12;i++)o+='<option value="'+i+'"'+(i==n?' selected':'')+'>'+i+'</option>';
    return '<div class="u-head"><span>Ulangi</span><span class="fld"><select aria-label="Jumlah ulangan">'+o+
      '</select></span><span>kali</span></div><div class="g-inner"></div><div class="u-foot"></div>';
  }
  // box = tempat blok dimasukkan (area kerja utama, atau bagian dalam blok Ulangi)
  function addBlock(cmd,before,box,n){
    box=box||list;
    var b=document.createElement('div');
    b.className='blk '+(cmd==='maju'?'maju':cmd==='ulangi'?'ulang':'belok');
    b.dataset.cmd=cmd;b.draggable=true;b.tabIndex=0;
    if(cmd==='ulangi'){b.dataset.n=n||3;b.innerHTML=loopHTML(b.dataset.n)}
    else b.innerHTML=blockHTML(cmd);
    box.insertBefore(b,before||null);
    update();
    return b;
  }
  function removeBlock(b){
    if(b&&b.parentNode&&!running){b.parentNode.removeChild(b);update()}
  }
  function after(py,box){
    box=box||list;
    var kids=[].filter.call(box.children,function(b){return b!==dragEl});
    for(var i=0;i<kids.length;i++){
      var r=kids[i].getBoundingClientRect();
      if(py<r.top+r.height/2)return kids[i];
    }
    return null;
  }
  function bersihOver(){
    [].forEach.call(document.querySelectorAll('.g-inner.over'),function(i){i.classList.remove('over')});
    ws.classList.remove('over');
  }

  var pal=$('g-pal'),dragN=3;
  // tujuan "ketuk": kalau ada blok Ulangi yang sedang dipilih, blok lain masuk ke dalamnya
  function tujuanKetuk(cmd){
    var s=list.querySelector('.blk.ulang.sel');
    return (s&&cmd!=='ulangi')?s.querySelector('.g-inner'):null;
  }
  pal.addEventListener('dragstart',function(e){
    var b=e.target.closest('[data-cmd]');
    if(!b)return;
    dragEl=null;dragN=b.dataset.n||3;
    e.dataTransfer.setData('text/plain',b.dataset.cmd);
  });
  pal.addEventListener('click',function(e){
    var b=e.target.closest('[data-cmd]');
    if(b&&!e.target.closest('select')&&!running)addBlock(b.dataset.cmd,null,tujuanKetuk(b.dataset.cmd),b.dataset.n);
  });
  pal.addEventListener('keydown',function(e){
    if((e.key==='Enter'||e.key===' ')&&e.target.dataset.cmd&&!running){
      e.preventDefault();addBlock(e.target.dataset.cmd,null,tujuanKetuk(e.target.dataset.cmd),e.target.dataset.n);
    }
  });
  // hapus blok: seret kembali ke panel Blok
  pal.addEventListener('dragover',function(e){if(dragEl)e.preventDefault()});
  pal.addEventListener('drop',function(e){
    if(dragEl){e.preventDefault();removeBlock(dragEl);dragEl=null}
  });
  // ganti arah belok / jumlah ulangan lewat dropdown (di palet maupun di area kerja)
  [pal,list].forEach(function(box){
    box.addEventListener('change',function(e){
      var b=e.target.closest('.blk');
      if(!b)return;
      if(b.classList.contains('ulang'))b.dataset.n=e.target.value;
      else b.dataset.cmd=e.target.value;
      update();
    });
  });

  list.addEventListener('dragstart',function(e){
    var b=e.target.closest('.blk');
    if(!b)return;
    dragEl=b;b.classList.add('drag');e.dataTransfer.setData('text/plain',b.dataset.cmd);
  });
  list.addEventListener('dragend',function(){
    if(dragEl)dragEl.classList.remove('drag');
    dragEl=null;bersihOver();
  });
  // ketuk = pilih blok; klik dua kali / tombol Delete = hapus
  list.addEventListener('click',function(e){
    var b=e.target.closest('.blk');
    if(!b||e.target.closest('select'))return;
    [].forEach.call(list.querySelectorAll('.blk'),function(k){k.classList.toggle('sel',k===b&&!k.classList.contains('sel'))});
  });
  list.addEventListener('dblclick',function(e){
    if(!e.target.closest('select'))removeBlock(e.target.closest('.blk'));
  });
  list.addEventListener('keydown',function(e){
    if((e.key==='Delete'||e.key==='Backspace')&&e.target.classList.contains('blk')){
      e.preventDefault();removeBlock(e.target);
    }
  });

  // menjatuhkan blok DI DALAM blok Ulangi (blok Ulangi tidak boleh di dalam Ulangi)
  list.addEventListener('dragover',function(e){
    var inner=e.target.closest('.g-inner');
    if(!inner)return;
    e.preventDefault();e.stopPropagation();
    ws.classList.remove('over');inner.classList.add('over');
  });
  list.addEventListener('dragleave',function(e){
    var inner=e.target.closest('.g-inner');
    if(inner&&!inner.contains(e.relatedTarget))inner.classList.remove('over');
  });
  list.addEventListener('drop',function(e){
    var inner=e.target.closest('.g-inner');
    if(!inner)return;
    e.preventDefault();e.stopPropagation();
    bersihOver();
    var cmd=e.dataTransfer.getData('text/plain');
    if(!sah(cmd)||running)return;
    if(cmd==='ulangi')return;
    var before=after(e.clientY,inner);
    if(dragEl){inner.insertBefore(dragEl,before);update()}
    else addBlock(cmd,before,inner);
  });

  ws.addEventListener('dragover',function(e){e.preventDefault();ws.classList.add('over')});
  ws.addEventListener('dragleave',function(){ws.classList.remove('over')});
  ws.addEventListener('drop',function(e){
    e.preventDefault();ws.classList.remove('over');
    var cmd=e.dataTransfer.getData('text/plain');
    if(!sah(cmd)||running)return;
    var before=after(e.clientY,list);
    if(dragEl){list.insertBefore(dragEl,before);update()}
    else addBlock(cmd,before,list,dragN);
  });

  /* ===== LEVEL & KEMAJUAN ===== */
  function prog(){
    var h='',buka=terbuka();
    for(var k=0;k<TOTAL;k++){
      var kunciLvl=k>=buka,
          cls=k===lvl?'on':done[k]?'done':kunciLvl?'lock':'',
          tip=kunciLvl?'Terkunci: lolos '+buka+' level dulu':'Level '+(k+1)+(done[k]?' (selesai)':'');
      h+='<i class="'+cls+'" data-k="'+k+'" title="'+tip+'" aria-label="'+tip+'"></i>';
    }
    var p=$('g-prog');
    p.innerHTML=h+'<span class="flag">\u2691</span>';
    // di layar sempit: geser agar level yang sedang dimainkan terlihat
    var on=p.querySelector('.on');
    if(on&&p.scrollWidth>p.clientWidth)p.scrollLeft=on.offsetLeft-p.clientWidth/2+on.offsetWidth/2;
  }
  // pilih paket gambar sesuai level (lihat SETS). Pemain dan tujuan dipilih terpisah;
  // paket yang gambarnya hilang dilewati.
  function pilihSet(i){
    var h=null,g=null,ih=0,ig=0;
    SETS.forEach(function(S,k){
      if(i+1<S.dari)return;
      if(S._okH){h=S;ih=k}
      if(S._okG){g=S;ig=k}
    });
    SPRITE=h||SETS[0];useImg=!!h;
    GSET=g||SETS[0];useImgG=!!g;
    board.dataset.pemain=ih+1;    // dipakai CSS untuk menyetel ukuran (lihat game1.css)
    board.dataset.tujuan=ig+1;
  }
  function load(i){
    lvl=i;
    tMulai=Date.now();
    Progres.simpan(1,i+1,false,0);   // catat sebagai terakhir dimainkan
    list.innerHTML='';
    pilihSet(i);
    pilihSuara(i);
    var lp=$('g-pal-loop');
    if(lp)lp.hidden=!(i+1>=LOOP_DARI);
    build();reset();
    res.hidden=true;
    $('g-title').textContent='Level '+(i+1)+' : '+LEVELS[i].t;
    $('g-ins').textContent=LEVELS[i].ins;
    prog();update();
    musikAwal();
  }
  $('g-prog').addEventListener('click',function(e){
    var k=e.target.dataset.k;
    if(k===undefined||running)return;
    k=+k;
    if(k>=terbuka()){
      var d=e.target;d.classList.remove('no');d.offsetWidth;d.classList.add('no');
      return;
    }
    if(k<LEVELS.length)load(k);
  });

  /* ===== TOMBOL ===== */
  runBtn.onclick=run;
  $('g-restart').onclick=function(){list.innerHTML='';update();res.hidden=true;reset()};
  $('g-again').onclick=function(){res.hidden=true;reset()};
  $('g-next').onclick=function(){load(lvl+1)};
  /* ===== PROFIL & MENU (bisa diklik) ===== */
  // nama + role diambil dari guard.js (window.currentUser), bukan dari localStorage yang bisa diubah-ubah
  var ROLE='student';
  function profil(){
    var u=window.currentUser||{},nama=(u.name||'Murid').trim();
    ROLE=u.role||'student';
    $('g-name').textContent=nama;
    $('g-prof-btn').textContent=nama.charAt(0).toUpperCase();
    $('g-role').textContent=ROLE==='teacher'?'Guru':'Murid';
    $('g-home').href=ROLE==='teacher'?'guru.html':'murid.html';
    $('g-prof-link').hidden=ROLE==='teacher';   // popup profil hanya ada untuk murid
  }

  var DD=[['g-prof-btn','g-prof'],['g-menu-btn','g-menu']];
  function closeMenus(){
    DD.forEach(function(p){$(p[1]).hidden=true;$(p[0]).setAttribute('aria-expanded','false')});
  }
  DD.forEach(function(p){
    $(p[0]).onclick=function(e){
      e.stopPropagation();
      var buka=$(p[1]).hidden;
      closeMenus();
      $(p[1]).hidden=!buka;
      this.setAttribute('aria-expanded',buka);
    };
  });
  document.addEventListener('click',closeMenus);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeMenus()});

  /* muat semua gambar karakter dulu (semua tahap). Pemain dan tujuan dicek terpisah:
     tahap yang gambarnya kurang memakai paket sebelumnya; kalau tidak ada yang lengkap, karakter bawaan */
  var gambarOK=false,loginOK=false;
  function coba(){if(gambarOK&&loginOK)mulai(load)}
  (function(fn){if(window.currentUser)fn();else document.addEventListener('auth-ready',function(){fn()})})(function(){profil();loginOK=true;coba()});
  (function(){
    var left=SETS.length;
    function selesai(){if(--left<=0){gambarOK=true;coba()}}
    SETS.forEach(function(S){
      var uh=[],ug=[];
      function add(arr,u){if(u&&arr.indexOf(u)<0)arr.push(u)}
      NAMES.forEach(function(n){add(uh,(S.idle||{})[n]);((S.walk||{})[n]||[]).forEach(function(u){add(uh,u)})});
      add(ug,S.goal);add(ug,S.goalWin);add(ug,S.goal2);add(ug,S.goal2Win);
      (S.menang||[]).forEach(function(m){add(ug,m.src)});
      S._okH=uh.length>0;S._okG=ug.length>0;
      var sisa=uh.length+ug.length;
      if(!sisa){selesai();return}
      function muat(u,flag){
        var im=new Image();
        im.onload=function(){if(--sisa<=0)selesai()};
        im.onerror=function(){
          console.warn('Gambar karakter tidak ditemukan: '+S.folder+u);
          if(flag==='_okG'&&u!==S.goal){
            // gambar pelengkap (berhasil / tujuan 2 / frame menang) hilang: paket tidak dibuang, gambar itu saja yang dilewati
            ['goalWin','goal2','goal2Win'].forEach(function(k){if(S[k]===u)S[k]=null});
            if(S.menang){S.menang=S.menang.filter(function(m){return m.src!==u});if(!S.menang.length)S.menang=null}
          }else S[flag]=false;
          if(--sisa<=0)selesai();
        };
        im.src=S.folder+u;
      }
      uh.forEach(function(u){muat(u,'_okH')});
      ug.forEach(function(u){muat(u,'_okG')});
    });
  })();
})();