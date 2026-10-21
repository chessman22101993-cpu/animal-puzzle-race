const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BRAIN_DIR = 'C:/Users/Dell/.gemini/antigravity/brain/4a87c2ce-6e35-4c78-b41c-0efcb2d71837';
const PUBLIC_ANIMALS_DIR = path.join(__dirname, '..', 'public', 'animals');

if (!fs.existsSync(PUBLIC_ANIMALS_DIR)) {
  fs.mkdirSync(PUBLIC_ANIMALS_DIR, { recursive: true });
}

async function makeOuterWhiteTransparent(inputPath, outputPath) {
  const image = sharp(inputPath);
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;

  const isVisited = new Uint8Array(width * height);
  const queue = [];

  function isBackground(idx) {
    const r = data[idx * 4];
    const g = data[idx * 4 + 1];
    const b = data[idx * 4 + 2];
    return r >= 240 && g >= 240 && b >= 240;
  }

  // Seed with border pixels
  for (let x = 0; x < width; x++) {
    queue.push(x);
    queue.push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    queue.push(y * width);
    queue.push(y * width + (width - 1));
  }

  while (queue.length > 0) {
    const idx = queue.pop();
    if (isVisited[idx]) continue;
    isVisited[idx] = 1;

    if (isBackground(idx)) {
      data[idx * 4 + 3] = 0; // Alpha = 0

      const x = idx % width;
      const y = Math.floor(idx / width);

      if (x > 0 && !isVisited[idx - 1] && isBackground(idx - 1)) queue.push(idx - 1);
      if (x < width - 1 && !isVisited[idx + 1] && isBackground(idx + 1)) queue.push(idx + 1);
      if (y > 0 && !isVisited[idx - width] && isBackground(idx - width)) queue.push(idx - width);
      if (y < height - 1 && !isVisited[idx + width] && isBackground(idx + width)) queue.push(idx + width);
    }
  }

  // Edge feathering pass
  for (let idx = 0; idx < width * height; idx++) {
    if (data[idx * 4 + 3] === 0) continue;
    const r = data[idx * 4];
    const g = data[idx * 4 + 1];
    const b = data[idx * 4 + 2];
    if (r > 230 && g > 230 && b > 230) {
      const x = idx % width;
      const y = Math.floor(idx / width);
      let adjacentTransparent = false;
      if (x > 0 && data[(idx - 1) * 4 + 3] === 0) adjacentTransparent = true;
      else if (x < width - 1 && data[(idx + 1) * 4 + 3] === 0) adjacentTransparent = true;
      else if (y > 0 && data[(idx - width) * 4 + 3] === 0) adjacentTransparent = true;
      else if (y < height - 1 && data[(idx + width) * 4 + 3] === 0) adjacentTransparent = true;

      if (adjacentTransparent) {
        data[idx * 4 + 3] = 0;
      }
    }
  }

  await sharp(data, {
    raw: {
      width,
      height,
      channels: 4
    }
  })
  .png()
  .toFile(outputPath);

  console.log(`Saved transparent image to: ${outputPath}`);
}

async function processAll() {
  const mapping = [
    { name: 'horse', file: path.join(BRAIN_DIR, '.user_uploaded', 'media_1792319748411.png') },
    { name: 'tiger', file: path.join(BRAIN_DIR, '.user_uploaded', 'media_1792319757422.png') },
    { name: 'cheetah', file: path.join(BRAIN_DIR, 'cheetah_runner_1792319847157.jpg') },
    { name: 'lion', file: path.join(BRAIN_DIR, 'lion_runner_1792319879240.jpg') },
    { name: 'zebra', file: path.join(BRAIN_DIR, 'zebra_runner_1792319902297.jpg') },
    { name: 'wolf', file: path.join(BRAIN_DIR, 'wolf_runner_1792319925426.jpg') },
    { name: 'falcon', file: path.join(BRAIN_DIR, 'falcon_runner_1792319949622.jpg') },
    { name: 'bear', file: path.join(BRAIN_DIR, 'bear_runner_1792319972163.jpg') }
  ];

  for (const item of mapping) {
    if (fs.existsSync(item.file)) {
      try {
        await makeOuterWhiteTransparent(item.file, path.join(PUBLIC_ANIMALS_DIR, `${item.name}.png`));
      } catch (err) {
        console.error(`Failed ${item.name}:`, err.message);
      }
    }
  }
}

processAll().catch(console.error);
