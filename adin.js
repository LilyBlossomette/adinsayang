const MAX_CHECK = 50;
const PHOTO_FOLDER = 'image/';
const PHOTO_PREFIX = 'image';
const PHOTO_EXT = '.jpg';
let placeholderPhotos = [];

const FRONT_CHANCE = 0.4;

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

function getLaneConfig(){
  const w = window.innerWidth;
  if(w <= 420) return { lanes: 2, perLane: 2, bubbleMin: 62, bubbleMax: 88 };
  if(w <= 640) return { lanes: 2, perLane: 2, bubbleMin: 72, bubbleMax: 100 };
  if(w <= 900) return { lanes: 3, perLane: 2, bubbleMin: 80, bubbleMax: 115 };
  return { lanes: 4, perLane: 2, bubbleMin: 90, bubbleMax: 140 };
}

function buildSide(colWidthSource, frontEl, backEl){
  frontEl.innerHTML = '';
  backEl.innerHTML = '';

  const cfg = getLaneConfig();
  const colWidth = colWidthSource.clientWidth || 180;
  const laneWidth = colWidth / cfg.lanes;
  const slotWidth = laneWidth / cfg.perLane;

  for(let laneIndex = 0; laneIndex < cfg.lanes; laneIndex++){
    const duration = 14 + Math.random() * 10;
    const rot = (Math.random() * 10 - 5).toFixed(1);
    const sway = (14 + Math.random() * 18).toFixed(0);

    const maxWidth = Math.min(cfg.bubbleMax, laneWidth - 10);
    const minWidth = Math.min(cfg.bubbleMin, maxWidth);

    for(let n = 0; n < cfg.perLane; n++){
      const depth = Math.random();
      const width = Math.round(minWidth + depth * (maxWidth - minWidth));
      const slotStart = laneIndex * laneWidth + n * slotWidth;
      const jitterRoom = Math.max(0, slotWidth - width);
      const left = slotStart + Math.random() * jitterRoom;

      const isFront = Math.random() < FRONT_CHANCE;

      const el = document.createElement('div');
      el.className = 'polaroid';
      el.style.left = left + 'px';
      el.style.width = width + 'px';
      el.style.setProperty('--rot', rot + 'deg');
      el.style.setProperty('--sway1', sway + 'px');
      el.style.setProperty('--op', (0.55 + depth * 0.4).toFixed(2));

      if(isFront){
        el.style.setProperty('--blur', '0px');
      } else {
        el.style.setProperty('--blur', ((1 - depth) * 1.4).toFixed(2) + 'px');
      }

      el.style.animationDuration = duration + 's';
      el.style.animationDelay = (-(duration / cfg.perLane) * n - Math.random() * 2) + 's';
      el.innerHTML = `<img src="${nextPhoto()}" alt="momen">`;

      el.addEventListener('animationiteration', () => {
        el.querySelector('img').src = nextPhoto();
      });

      (isFront ? frontEl : backEl).appendChild(el);
    }
  }
}

function rebuildColumns(){
  if(placeholderPhotos.length === 0) return;
  buildSide(colLeftBack, colLeftFront, colLeftBack);
  buildSide(colRightBack, colRightFront, colRightBack);
}

let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(rebuildColumns, 300);
});

detectPhotos().then((photos) => {
  placeholderPhotos = photos;

  if(placeholderPhotos.length === 0){
    console.warn('Gak ada foto ditemukan di folder image/. Cek nama file & MAX_CHECK.');
    return;
  }

  rebuildColumns();
});
