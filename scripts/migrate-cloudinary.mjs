// One-time migration: uploads public assets, then records public URLs and a new Flyway migration.
// Run from the repository root with Node 22+. Credentials are read only from environment/.env.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, basename, extname } from 'node:path';

const root = resolve(import.meta.dirname, '..');
let local = '';
try { local = await readFile(resolve(root, '.env'), 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
for (const line of local.split(/\r?\n/)) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
}
const config = process.env.CLOUDINARY_URL ? new URL(process.env.CLOUDINARY_URL) : null;
if (!config || config.protocol !== 'cloudinary:' || !config.username || !config.password || !/^[a-z0-9_-]+$/.test(config.hostname)) {
  throw new Error('Configura CLOUDINARY_URL en .env o en el entorno.');
}
const auth = Buffer.from(`${decodeURIComponent(config.username)}:${decodeURIComponent(config.password)}`).toString('base64');
const images = resolve(root, 'frontend/public/images');
const manifestPath = resolve(root, 'docs/cloudinary-assets.json');
let assets = {};
try { assets = JSON.parse(await readFile(manifestPath, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const files = await readdir(images).catch(e => { if (e.code === 'ENOENT') return []; throw e; });
for (const file of files.sort()) {
  if (!/\.(svg|webp|jpg|png)$/i.test(file)) continue;
  const key = `/images/${file}`;
  if (assets[key]) { console.log(`Ya registrado: ${file}`); continue; }
  const form = new FormData();
  form.append('file', new Blob([await readFile(resolve(images, file))]), file);
  form.append('public_id', `cafe-barrio/${basename(file, extname(file))}`);
  form.append('overwrite', 'false');
  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.hostname}/image/upload`, {
    method: 'POST', headers: { Authorization: `Basic ${auth}` }, body: form, signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = String(error.error?.message || 'Sin detalle').replaceAll(decodeURIComponent(config.password), '[oculto]').replaceAll(auth, '[oculto]');
    throw new Error(`Cloudinary rechazó ${file} (HTTP ${response.status}): ${message}`);
  }
  const result = await response.json();
  if (!result.secure_url?.startsWith(`https://res.cloudinary.com/${config.hostname}/`)) throw new Error('URL de respuesta inválida.');
  assets[key] = { publicId: result.public_id, url: result.secure_url };
  await writeFile(manifestPath, JSON.stringify(assets, null, 2) + '\n');
  console.log(`Subido: ${file}`);
}
const heroSource = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85';
if (!assets[heroSource]) {
  const form = new FormData();
  form.append('file', heroSource);
  form.append('public_id', 'cafe-barrio/hero-photo');
  form.append('overwrite', 'false');
  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.hostname}/image/upload`, {
    method: 'POST', headers: { Authorization: `Basic ${auth}` }, body: form, signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`No se pudo migrar la portada (HTTP ${response.status}).`);
  const result = await response.json();
  if (!result.secure_url?.startsWith(`https://res.cloudinary.com/${config.hostname}/`)) throw new Error('URL de respuesta inválida.');
  assets[heroSource] = { publicId: result.public_id, url: result.secure_url };
  await writeFile(manifestPath, JSON.stringify(assets, null, 2) + '\n');
  console.log('Subido: portada');
}
const sql = '-- Migrate existing local image references; preserve customized external URLs and all product data.\n' +
  Object.entries(assets).filter(([path]) => path.startsWith('/images/')).map(([path, asset]) => `UPDATE products SET image_url='${asset.url.replaceAll("'", "''")}' WHERE image_url='${path}';`).join('\n') + '\n';
const migration = resolve(root, 'src/main/resources/db/migration/V4__cloudinary_images.sql');
try {
  const previous = await readFile(migration, 'utf8');
  if (previous !== sql) throw new Error('V4 ya existe y difiere: crea una nueva migración, no cambies una aplicada.');
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
  await writeFile(migration, sql);
}
console.log('Manifest y migración preparados. Reinicia el backend para aplicar V4.');
// Shared frontend asset references contain only public delivery URLs, never credentials.
const urls = Object.fromEntries(Object.entries(assets).map(([path, asset]) => [path, asset.url]));
const media = {
  logo: urls['/images/logo-cafe-rio.jpg'],
  hero: urls[heroSource],
  productFallback: urls['/images/coffee-cusco.webp'],
  heroFallback: urls['/images/hero.svg'],
  legacyUrls: urls,
};
await writeFile(resolve(root, 'frontend/src/app/core/media.ts'),
  '// Public Cloudinary delivery URLs. Generated by scripts/migrate-cloudinary.mjs.\n' +
  'export const MEDIA = ' + JSON.stringify(media, null, 2) + ' as const;\n');
const index = resolve(root, 'frontend/src/index.html');
const html = await readFile(index, 'utf8');
await writeFile(index, html.replace(/href="(?:\/images\/logo-cafe-rio.jpg|https:\/\/res.cloudinary.com\/[^\"]+)"/, `href="${media.logo}"`));
