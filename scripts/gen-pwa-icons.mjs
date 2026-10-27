// Gera ícones PWA a partir do SVG da bússola (viewBox com margem interna
// pra o círculo não encostar na borda e cortar a parte de baixo).
// - icon-192.png / icon-512.png: ícones normais com fundo transparente
// - icon-maskable-192.png / icon-maskable-512.png: safe zone 60% sobre fundo Névoa
// - compass-512.png e apple-touch-icon.png também são regenerados
// Roda com: node scripts/gen-pwa-icons.mjs
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const PUB = path.join(root, 'public')

const BRAND_BG = '#ECEEFF' // Névoa (bússola-wash)

// viewBox 36x36 com a bússola centralizada em (18,18) e raio 13: deixa ~2px de margem
// de cada lado pro stroke de 2.5px não ser clipado.
const SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36' fill='none'>
  <circle cx='18' cy='18' r='13' fill='none' stroke='#4F46E5' stroke-width='2.5'/>
  <polygon points='18,9 21,18 18,16.5 15,18' fill='#4F46E5'/>
  <polygon points='18,27 15,18 18,19.5 21,18' fill='#4F46E5' opacity='0.55'/>
</svg>`

const base = await sharp(Buffer.from(SVG), { density: 400 })
  .resize(1024, 1024)
  .png()
  .toBuffer()

async function makeNormal(size) {
  await sharp(base)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(PUB, `icon-${size}.png`))
}

async function makeMaskable(size) {
  const inner = Math.round(size * 0.6)
  const padded = await sharp(base)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
  await sharp({
    create: { width: size, height: size, channels: 4, background: BRAND_BG },
  })
    .composite([{ input: padded, gravity: 'center' }])
    .png()
    .toFile(path.join(PUB, `icon-maskable-${size}.png`))
}

const sizes = [192, 512]
await Promise.all([
  ...sizes.map(makeNormal),
  ...sizes.map(makeMaskable),
  sharp(base).resize(512, 512).png().toFile(path.join(PUB, 'compass-512.png')),
  sharp(base).resize(180, 180).png().toFile(path.join(PUB, 'apple-touch-icon.png')),
])
console.log('✓ ícones PWA gerados em public/')
