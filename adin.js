// Semua foto otomatis dideteksi dari folder photos/
// Syarat: nama file harus urut → foto1.jpg, foto2.jpg, foto3.jpg, dst.
// Ganti MAX_CHECK kalau foto kamu lebih dari 50.
const MAX_CHECK = 50;
const PHOTO_FOLDER = 'image/';
const PHOTO_PREFIX = 'image';
const PHOTO_EXT = '.jpg'; // ganti ke '.png' / '.jpeg' kalau formatnya beda

let placeholderPhotos = []; // diisi otomatis setelah deteksi selesai

function detectPhotos(){
  return new Promise((resolve) => {
    let found = [];
    let checked = 0;

    for(let i = 1; i <= MAX_CHECK; i++){
      const path = `${PHOTO_FOLDER}${PHOTO_PREFIX}${i}${PHOTO_EXT}`;
      const img = new Image();

      img.onload = () => {
        found.push({ index: i, path });
        checked++;
        if(checked === MAX_CHECK) finish();
      };
      img.onerror = () => {
        checked++;
        if(checked === MAX_CHECK) finish();
      };
      img.src = path;
    }

    function finish(){
      // urutkan sesuai nomor file, biar konsisten
      found.sort((a, b) => a.index - b.index);
      resolve(found.map(f => f.path));
    }
  });
}

const colLeftBack = document.getElementById('colLeftBack');
const colRightBack = document.getElementById('colRightBack');
const colLeftFront = document.getElementById('colLeftFront');
const colRightFront = document.getElementById('colRightFront');

let photoIndex = 0;

function nextPhoto(){
  const src = placeholderPhotos[photoIndex % placeholderPhotos.length];
  photoIndex++;
  return src;
}

/**
 * Setiap foto berjalan di "lane" (jalur) horizontal yang tetap miliknya sendiri.
 * Karena posisi horizontal per lane gak berubah-ubah acak, dan bubble berikutnya
 * di lane yang sama baru muncul setelah bubble sebelumnya "beres" naik + jeda,
 * foto gak akan pernah numpuk satu sama lain — baik sesama lane maupun antar lane.
 *
 * backCol & frontCol adalah dua kemungkinan tempat foto ini dilahirkan — tiap kali
 * spawn, dipilih acak salah satu, jadi fotonya kadang lewat di belakang card,
 * kadang di depan card.
 */
function runLane(backCol, frontCol, laneIndex, totalLanes){
  // posisi tiap lane dibagi rata di lebar kolom, dikasih sedikit jitter kecil
  // (jitter dibatasi supaya gak nyerempet ke lane sebelah)
  const laneWidth = 100 / totalLanes;
  const laneCenter = laneWidth * laneIndex + laneWidth / 2;
  const jitterRange = laneWidth * 0.25;

  function spawnOnce(){
    const src = nextPhoto();
    const el = document.createElement('div');
    el.className = 'polaroid';

    const jitter = (Math.random() * jitterRange * 2 - jitterRange);
    const left = Math.min(92, Math.max(0, laneCenter + jitter));

    const duration = 10 + Math.random() * 6; // 10-16s naik — dipercepat biar lebih rame
    const depth = 0.3 + Math.random() * 0.7; // depth lebih ke arah "dekat" biar tetap kelihatan jelas
    const scale = (0.75 + depth * 0.5).toFixed(2);
    const blur = ((1 - depth) * 1.2).toFixed(2);
    const opacity = (0.6 + depth * 0.35).toFixed(2);
    const rot = (Math.random() * 8 - 4).toFixed(1);
    const sway = (10 + Math.random() * 10).toFixed(0);

    el.style.left = left + '%';
    el.style.setProperty('--scale', scale);
    el.style.setProperty('--blur', blur + 'px');
    el.style.setProperty('--op', opacity);
    el.style.setProperty('--rot', rot + 'deg');
    el.style.setProperty('--sway1', sway + 'px');
    el.style.animationDuration = duration + 's';
    el.style.animationIterationCount = '1'; // sekali naik, lalu dibuang & diganti bubble baru
    el.innerHTML = `<img src="${src}" alt="momen">`;

    // acak: kali ini foto muncul di depan card atau di belakang card
    const isFront = Math.random() < 0.5;
    const parent = isFront ? frontCol : backCol;
    el.style.zIndex = isFront ? '999' : '5'; // dobel jaminan selain z-index di CSS container
    parent.appendChild(el);

    // Setelah bubble ini selesai naik & hilang, baru lane ini boleh spawn bubble berikutnya.
    // Jeda kecil (gap) ditambahkan supaya ada nafas sebelum bubble baru muncul dari bawah.
    const gap = 150 + Math.random() * 350; // jeda dipersingkat biar spawn lebih intens
    setTimeout(() => {
      el.remove();
      spawnOnce();
    }, duration * 1000 + gap);
  }

  // delay awal biar tiap lane gak mulai barengan
  setTimeout(spawnOnce, laneIndex * 400 + Math.random() * 400);
}

function startColumn(backCol, frontCol, laneCount){
  for(let i = 0; i < laneCount; i++){
    runLane(backCol, frontCol, i, laneCount);
  }
}

// Jumlah lane (jalur) disesuaikan lebar layar — makin lebar layar, makin banyak jalur
// bisa muat tanpa numpuk. Nilai ini juga yang bikin fotonya kerasa "lebih banyak".
function getLaneCount(){
  const w = window.innerWidth;
  if(w < 480) return 4;   // hp kecil
  if(w < 768) return 5;   // hp besar / tablet kecil
  if(w < 1100) return 7;  // tablet / laptop kecil
  return 9;                // desktop lebar
}

// Deteksi dulu semua foto yang ada, baru mulai animasi
detectPhotos().then((photos) => {
  placeholderPhotos = photos;

  if(placeholderPhotos.length === 0){
    console.warn('Gak ada foto ditemukan di folder photos/. Cek nama file & MAX_CHECK.');
    return;
  }

  const lanes = getLaneCount();
  startColumn(colLeftBack, colLeftFront, lanes);
  startColumn(colRightBack, colRightFront, lanes);
});
