const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_ANIMALS_DIR = path.join(__dirname, '..', 'public', 'animals');
if (!fs.existsSync(PUBLIC_ANIMALS_DIR)) {
  fs.mkdirSync(PUBLIC_ANIMALS_DIR, { recursive: true });
}

// Flood fill from outer corners to only turn outer white background transparent
// (preserving inner whites like teeth, belly, eye, star blaze)
async function makeOuterWhiteTransparent(inputPath, outputPath) {
  const image = sharp(inputPath);
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;
  const channels = info.channels; // 4: r, g, b, a

  const isVisited = new Uint8Array(width * height);
  const queue = [];

  function isBackground(idx) {
    const r = data[idx * 4];
    const g = data[idx * 4 + 1];
    const b = data[idx * 4 + 2];
    // Pure white or very near white
    return r >= 245 && g >= 245 && b >= 245;
  }

  // Seed with border pixels
  for (let x = 0; x < width; x++) {
    queue.push(x); // top
    queue.push((height - 1) * width + x); // bottom
  }
  for (let y = 0; y < height; y++) {
    queue.push(y * width); // left
    queue.push(y * width + (width - 1)); // right
  }

  while (queue.length > 0) {
    const idx = queue.pop();
    if (isVisited[idx]) continue;
    isVisited[idx] = 1;

    if (isBackground(idx)) {
      // Make transparent
      data[idx * 4 + 3] = 0;

      const x = idx % width;
      const y = Math.floor(idx / width);

      if (x > 0 && !isVisited[idx - 1] && isBackground(idx - 1)) queue.push(idx - 1);
      if (x < width - 1 && !isVisited[idx + 1] && isBackground(idx + 1)) queue.push(idx + 1);
      if (y > 0 && !isVisited[idx - width] && isBackground(idx - width)) queue.push(idx - width);
      if (y < height - 1 && !isVisited[idx + width] && isBackground(idx + width)) queue.push(idx + width);
    }
  }

  // Anti-aliasing pass on edge pixels
  for (let idx = 0; idx < width * height; idx++) {
    if (data[idx * 4 + 3] === 0) continue;
    const r = data[idx * 4];
    const g = data[idx * 4 + 1];
    const b = data[idx * 4 + 2];
    if (r > 230 && g > 230 && b > 230) {
      // Check if adjacent to transparent pixel
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

async function run() {
  const horseInput = 'C:/Users/Dell/.gemini/antigravity/brain/4a87c2ce-6e35-4c78-b41c-0efcb2d71837/.user_uploaded/media_1792319748411.png';
  const tigerInput = 'C:/Users/Dell/.gemini/antigravity/brain/4a87c2ce-6e35-4c78-b41c-0efcb2d71837/.user_uploaded/media_1792319757422.png';

  await makeOuterWhiteTransparent(horseInput, path.join(PUBLIC_ANIMALS_DIR, 'horse.png'));
  await makeOuterWhiteTransparent(tigerInput, path.join(PUBLIC_ANIMALS_DIR, 'tiger.png'));
}

run().catch(console.error);
