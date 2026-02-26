const sharp = require('sharp');

async function extractPot() {
  const { data, info } = await sharp('public/QTPot.png')
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  console.log(`Image: ${width}x${height}`);

  // Crop: remove top ~4% (rounded rect artifacts) and bottom ~23% (QTPot text)
  const cropTop = Math.round(height * 0.04);
  const cropBot = Math.round(height * 0.77);
  const cropH   = cropBot - cropTop;

  // Copy cropped pixels
  const pixels = new Uint8Array(width * cropH * 4);
  for (let y = 0; y < cropH; y++) {
    const srcOff = (y + cropTop) * width * 4;
    const dstOff = y * width * 4;
    pixels.set(data.slice(srcOff, srcOff + width * 4), dstOff);
  }

  // Sample background color from top-center (clearly background area)
  const sampleIdx = (5 * width + Math.floor(width / 2)) * 4;
  const bgR = pixels[sampleIdx];
  const bgG = pixels[sampleIdx + 1];
  const bgB = pixels[sampleIdx + 2];
  console.log(`Background color: rgb(${bgR}, ${bgG}, ${bgB})`);

  const threshold = 70;

  function isBg(idx) {
    if (pixels[idx + 3] < 10) return true; // already transparent
    return (
      Math.abs(pixels[idx]     - bgR) < threshold &&
      Math.abs(pixels[idx + 1] - bgG) < threshold &&
      Math.abs(pixels[idx + 2] - bgB) < threshold
    );
  }

  // BFS flood fill from all edges to remove background
  const visited = new Uint8Array(width * cropH);
  const queue = [];

  function seed(x, y) {
    const ni = y * width + x;
    if (visited[ni]) return;
    if (isBg(ni * 4)) {
      visited[ni] = 1;
      queue.push(x, y);
    }
  }

  for (let x = 0; x < width; x++) { seed(x, 0); seed(x, cropH - 1); }
  for (let y = 0; y < cropH; y++) { seed(0, y); seed(width - 1, y); }

  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  let qi = 0;
  while (qi < queue.length) {
    const cx = queue[qi++];
    const cy = queue[qi++];
    const idx = (cy * width + cx) * 4;
    pixels[idx]     = 0;
    pixels[idx + 1] = 0;
    pixels[idx + 2] = 0;
    pixels[idx + 3] = 0; // make transparent

    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= cropH) continue;
      const ni = ny * width + nx;
      if (visited[ni]) continue;
      if (isBg(ni * 4)) {
        visited[ni] = 1;
        queue.push(nx, ny);
      }
    }
  }

  await sharp(Buffer.from(pixels.buffer), {
    raw: { width, height: cropH, channels: 4 }
  })
    .trim({ threshold: 0 })  // auto-crop transparent borders
    .png()
    .toFile('public/pot-badge.png');

  console.log('Done! → public/pot-badge.png');
}

extractPot().catch(console.error);
