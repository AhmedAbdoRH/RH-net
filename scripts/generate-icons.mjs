/**
 * Generate all app icon assets from the RH PRODUCTION metallic identity.
 * Master: public/icon-square.png — the complete metallic shape, transparent,
 * centered on a 512x512 canvas (source crop: public/icon.png 245x552).
 * Run: node scripts/generate-icons.mjs  (or: npm run icons)
 *
 * Requires `sharp` (transitive dependency of Next.js).
 */
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const master = await readFile(path.join(root, 'public', 'icon-square.png'));
const out = (p) => path.join(root, p);
await mkdir(out('public/icons'), { recursive: true });

const png = (size) => sharp(master).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

// Flattened-on-white variants: iOS/legacy favicon contexts need opaque icons.
const flattenWhite = (size) =>
  sharp(master)
    .resize(size, size)
    .flatten({ background: '#ffffff' })
    .ensureAlpha() // ICO entries must be RGBA for Next.js to decode them
    .png({ compressionLevel: 9 })
    .toBuffer();

const [logoPng, icon192, icon512, appleTouch] = await Promise.all([
  png(512), png(192), png(512), flattenWhite(180),
]);

// Maskable: keep artwork inside the safe zone on a blue background.
const fit = await sharp(master).resize(340, 340, { fit: 'contain' }).png().toBuffer();
const icon512Maskable = await sharp({
  create: { width: 512, height: 512, channels: 3, background: '#2563eb' },
})
  .composite([{ input: fit, gravity: 'centre' }])
  .png({ compressionLevel: 9 })
  .toBuffer();

await Promise.all([
  writeFile(out('public/logo.png'), logoPng),
  writeFile(out('public/icons/icon-192.png'), icon192),
  writeFile(out('public/icons/icon-512.png'), icon512),
  writeFile(out('public/icons/icon-512-maskable.png'), icon512Maskable),
  writeFile(out('public/icons/apple-touch-icon.png'), appleTouch),
]);

// --- ICO (multi-resolution, PNG-compressed entries, flattened on white) ---
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const entries = [];
  for (const img of images) {
    const e = Buffer.alloc(16);
    e[0] = img.size >= 256 ? 0 : img.size;
    e[1] = img.size >= 256 ? 0 : img.size;
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(img.buffer.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += img.buffer.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.buffer)]);
}

const icoSizes = [16, 32, 48];
const icoBuffers = await Promise.all(icoSizes.map((size) => flattenWhite(size)));
const ico = buildIco(icoSizes.map((size, i) => ({ size, buffer: icoBuffers[i] })));
await Promise.all([
  writeFile(out('public/favicon.ico'), ico),
  writeFile(out('public/logo.ico'), ico),
  writeFile(out('src/app/favicon.ico'), ico),
]);

console.log('Icons generated from complete transparent metallic identity ✔');
