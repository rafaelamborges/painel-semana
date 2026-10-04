// Gera HTML estático para páginas públicas: /privacidade, /termos, /blog e /blog/:slug.
// Também gera sitemap.xml. Se a API do blog falhar, o build segue sem o blog estático
// (as páginas do blog continuam funcionando pelo app, buscando os posts ao vivo).
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SITE = 'https://familiaemcompasso.com.br'
const DEFAULT_DESCRIPTION = 'Organizando o cuidado das crianças com leveza e alinhamento.'
const DEFAULT_IMAGE = `${SITE}/icon-512.png`
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const ssrDir = resolve(root, 'dist-ssr')

const mod = await import(pathToFileURL(resolve(ssrDir, 'entry-prerender.js')).href)
const template = readFileSync(resolve(dist, 'index.html'), 'utf8')

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function writePage(path, { html, title, description, image, type = 'website', data }) {
  const url = SITE + path
  let head = `<link rel="canonical" href="${url}" />\n    <meta property="og:title" content="${esc(title)}" />\n    <meta property="og:url" content="${url}" />\n    <meta property="og:type" content="${type}" />\n    <meta property="og:site_name" content="Compasso" />`
  head += `\n    <meta property="og:description" content="${esc(description || DEFAULT_DESCRIPTION)}" />`
  head += `\n    <meta property="og:image" content="${esc(image || DEFAULT_IMAGE)}" />`
  if (data) head += `\n    <script>window.__BLOG__=${JSON.stringify({ path, ...data }).replace(/</g, '\\u003c')}</script>`

  // Remove as tags genéricas do index.html que serão substituídas pelas da página.
  const base = template.replace(/\s*<meta property="og:(title|description|type|url|image)" content="[^"]*" \/>/g, '')
  let page = base
    .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`)
  if (description) page = page.replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(description)}" />`)
  if (!page.includes(html)) throw new Error(`Falha ao injetar HTML em ${path}`)

  const outDir = resolve(dist, path.slice(1))
  mkdirSync(outDir, { recursive: true })
  writeFileSync(resolve(outDir, 'index.html'), page)
  console.log(`prerender: ${path} (${html.length} bytes)`)
}

const urls = ['/', ...Object.keys(mod.legalPages)]

for (const path of Object.keys(mod.legalPages)) {
  writePage(path, mod.renderLegal(path))
}

try {
  const list = await mod.fetchPosts()
  writePage('/blog', {
    html: mod.renderBlogList(list),
    title: 'Blog | Compasso',
    description: 'Coparentalidade, desenvolvimento infantil e a rotina da criança entre dois lares.',
    data: { posts: list },
  })
  urls.push('/blog')
  for (const item of list) {
    const post = await mod.fetchPost(item.slug)
    if (!post) continue
    const path = `/blog/${post.slug}`
    writePage(path, {
      html: mod.renderBlogPost(post),
      title: `${post.title} | Compasso`,
      description: post.excerpt,
      image: post.image,
      type: 'article',
      data: { post },
    })
    urls.push(path)
  }
} catch (err) {
  console.warn(`prerender: blog ignorado (${err.message})`)
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}\n</urlset>\n`
writeFileSync(resolve(dist, 'sitemap.xml'), sitemap)
writeFileSync(resolve(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`)
console.log(`prerender: sitemap.xml (${urls.length} URLs)`)

rmSync(ssrDir, { recursive: true, force: true })
