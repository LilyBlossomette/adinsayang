const MAX_CHECK = 50;
const PHOTO_FOLDER = 'image/';
const PHOTO_PREFIX = 'image';
const PHOTO_EXT = '.jpg'; 
let placeholderPhotos = []; 

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

const colLeft = document.getElementById('colLeft');
const colRight = document.getElementById('colRight');

let photoIndex = 0;
function nextPhoto(){
  const src = placeholderPhotos[photoIndex % placeholderPhotos.length];
  photoIndex++;
  return src;
}

function getLaneConfig(){
  const w = window.innerWidth;
  if(w <= 420) return { lanes: 2, perLane: 2, bubbleMin: 42, bubbleMax: 60 };
  if(w <= 640) return { lanes: 2, perLane: 2, bubbleMin: 48, bubbleMax: 70 };
  if(w <= 900) return { lanes: 3, perLane: 2, bubbleMin: 55, bubbleMax: 80 };
  return { lanes: 4, perLane: 2, bubbleMin: 60, bubbleMax: 100 };
}

function buildColumn(col){
  col.innerHTML = '';
  const cfg = getLaneConfig();
  const colWidth = col.clientWidth || 180;
  const laneWidth = colWidth / cfg.lanes;

  for(let laneIndex = 0; laneIndex < cfg.lanes; laneIndex++){
    const duration = 14 + Math.random() * 10; 
    const rot = (Math.random() * 10 - 5).toFixed(1);
    const sway = (14 + Math.random() * 18).toFixed(0);

    const maxWidth = Math.min(cfg.bubbleMax, laneWidth - 10);
    const minWidth = Math.min(cfg.bubbleMin, maxWidth);

    for(let n = 0; n < cfg.perLane; n++){
      const depth = Math.random();
      const width = Math.round(minWidth + depth * (maxWidth - minWidth));
      const leftMax = Math.max(0, laneWidth - width - 6);
      const left = laneIndex * laneWidth + 3 + Math.random() * leftMax;

      const el = document.createElement('div');
      el.className = 'polaroid';
      el.style.left = left + 'px';
      el.style.width = width + 'px';
      el.style.setProperty('--blur', ((1 - depth) * 1.4).toFixed(2) + 'px');
      el.style.setProperty('--op', (0.55 + depth * 0.4).toFixed(2));
      el.style.setProperty('--rot', rot + 'deg');
      el.style.setProperty('--sway1', sway + 'px');
      el.style.animationDuration = duration + 's';
      el.style.animationDelay = (-(duration / cfg.perLane) * n) + 's';
      el.innerHTML = `<img src="${nextPhoto()}" alt="momen">`;

      el.addEventListener('animationiteration', () => {
        el.querySelector('img').src = nextPhoto();
      });

      col.appendChild(el);
    }
  }
}

function rebuildColumns(){
  if(placeholderPhotos.length === 0) return;
  buildColumn(colLeft);
  buildColumn(colRight);
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