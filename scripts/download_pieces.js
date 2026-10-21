const fs = require('fs');
const path = require('path');

const PIECES_DIR = path.join(__dirname, '..', 'public', 'pieces');
if (!fs.existsSync(PIECES_DIR)) {
  fs.mkdirSync(PIECES_DIR, { recursive: true });
}

const pieces = [
  'wP', 'wN', 'wB', 'wR', 'wQ', 'wK',
  'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'
];

async function downloadPieces() {
  for (const p of pieces) {
    const url = `https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/${p}.svg`;
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const svg = await resp.text();
        fs.writeFileSync(path.join(PIECES_DIR, `${p.toLowerCase()}.svg`), svg, 'utf8');
        console.log(`Saved ${p}.svg`);
      } else {
        console.warn(`Failed ${p}: ${resp.status}`);
      }
    } catch (e) {
      console.error(`Error ${p}:`, e.message);
    }
  }
}

downloadPieces().catch(console.error);
