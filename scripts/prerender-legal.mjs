// Gera dist/privacidade/index.html e dist/termos/index.html com o conteúdo já renderizado.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const ssrDir = resolve(root, 'dist-ssr')

const { render, paths } = await import(pathToFileURL(resolve(ssrDir, 'entry-legal.js')).href)
const template = readFileSync(resolve(dist, 'index.html'), 'utf8')

for (const path of paths) {
  const { html, title } = render(path)
  const page = template
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`)
  if (!page.includes(html)) throw new Error(`Falha ao injetar HTML em ${path}`)
  const outDir = resolve(dist, path.slice(1))
  mkdirSync(outDir, { recursive: true })
  writeFileSync(resolve(outDir, 'index.html'), page)
  console.log(`prerender: ${path} (${html.length} bytes)`)
}

rmSync(ssrDir, { recursive: true, force: true })
