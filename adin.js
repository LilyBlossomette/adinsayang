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

const colLeft = document.getElementById('colLeft');
const colRight = document.getElementById('colRight');

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
 */
function runLane(col, laneIndex, totalLanes){
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

    const duration = 13 + Math.random() * 7; // 13-20s naik
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

    col.appendChild(el);

    // Setelah bubble ini selesai naik & hilang, baru lane ini boleh spawn bubble berikutnya.
    // Jeda kecil (gap) ditambahkan supaya ada nafas sebelum bubble baru muncul dari bawah.
    const gap = 300 + Math.random() * 700;
    setTimeout(() => {
      el.remove();
      spawnOnce();
    }, duration * 1000 + gap);
  }

  // delay awal biar tiap lane gak mulai barengan
  setTimeout(spawnOnce, laneIndex * 700 + Math.random() * 500);
}

function startColumn(col, laneCount){
  for(let i = 0; i < laneCount; i++){
    runLane(col, i, laneCount);
  }
}

// Deteksi dulu semua foto yang ada, baru mulai animasi
detectPhotos().then((photos) => {
  placeholderPhotos = photos;

  if(placeholderPhotos.length === 0){
    console.warn('Gak ada foto ditemukan di folder photos/. Cek nama file & MAX_CHECK.');
    return;
  }

  seedColumn(colLeft, 6);
  seedColumn(colRight, 6);
});
