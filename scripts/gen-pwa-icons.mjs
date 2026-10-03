// Gera ícones PWA a partir de public/compass-512.png.
// - icon-192.png e icon-512.png: ícones normais (sem padding), fundo transparente
// - icon-maskable-192.png e icon-maskable-512.png: ícone com safe zone (padding ~20%)
//   sobre fundo da marca (Névoa #ECEEFF). Esses rodam no adaptive icon do Android.
// Roda com: node scripts/gen-pwa-icons.mjs
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const SRC = path.join(root, 'public', 'compass-512.png')
const PUB = path.join(root, 'public')

const BRAND_BG = '#ECEEFF' // Névoa (bússola-wash)

async function makeNormal(size) {
  await sharp(SRC)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(PUB, `icon-${size}.png`))
}

async function makeMaskable(size) {
  // Safe zone: 80% centralizada. Ícone com padding 20%.
  const inner = Math.round(size * 0.6)
  const padded = await sharp(SRC)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BRAND_BG,
    },
  })
    .composite([{ input: padded, gravity: 'center' }])
    .png()
    .toFile(path.join(PUB, `icon-maskable-${size}.png`))
}

const sizes = [192, 512]
await Promise.all([
  ...sizes.map(makeNormal),
  ...sizes.map(makeMaskable),
])
console.log('✓ ícones PWA gerados em public/')
