// Posts do blog vêm do WordPress.com (familiaemcompasso.wordpress.com) pela API pública.
// No build, scripts/prerender-legal.mjs usa estas mesmas funções para gerar HTML estático
// de /blog e /blog/:slug. No navegador, as páginas buscam os posts ao vivo.

export const BLOG_SITE = 'familiaemcompasso.wordpress.com'
const API = `https://public-api.wordpress.com/rest/v1.1/sites/${BLOG_SITE}/posts`
const LIST_FIELDS = 'ID,slug,title,date,excerpt,featured_image'
const POST_FIELDS = `${LIST_FIELDS},content`

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—' }

export function decodeEntities(text = '') {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
}

export function stripTags(html = '') {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function normalize(p) {
  return {
    id: p.ID,
    slug: p.slug,
    title: decodeEntities(p.title),
    date: p.date,
    excerpt: stripTags(p.excerpt),
    image: p.featured_image || null,
    content: p.content ?? null,
  }
}

export async function fetchPosts(limit = 100) {
  const res = await fetch(`${API}/?number=${limit}&order_by=date&order=DESC&fields=${LIST_FIELDS}`)
  if (!res.ok) throw new Error(`Blog: falha ao listar posts (${res.status})`)
  const data = await res.json()
  return (data.posts || []).map(normalize)
}

export async function fetchPost(slug) {
  const res = await fetch(`${API}/slug:${encodeURIComponent(slug)}?fields=${POST_FIELDS}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Blog: falha ao carregar o post (${res.status})`)
  return normalize(await res.json())
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Recife',
  })
}

// Dados embutidos pelo pré-render, para a página abrir sem esperar a API.
export function readPrerendered(path) {
  if (typeof window === 'undefined') return null
  const data = window.__BLOG__
  return data && data.path === path ? data : null
}
