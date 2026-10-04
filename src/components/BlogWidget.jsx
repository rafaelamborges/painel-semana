import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPosts, formatDate } from '../lib/blog'

// Últimos textos do blog na home. Some sem alarde se a API não responder.
export default function BlogWidget() {
  const [posts, setPosts] = useState(null)

  useEffect(() => {
    let alive = true
    fetchPosts(2).then(p => { if (alive) setPosts(p) }).catch(() => { if (alive) setPosts([]) })
    return () => { alive = false }
  }, [])

  if (!posts || posts.length === 0) return null

  return (
    <section aria-labelledby="blog-widget-titulo">
      <h2 id="blog-widget-titulo" className="section-title mb-3">Do blog</h2>
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {posts.map(p => (
          <Link key={p.id} to={`/blog/${p.slug}`} className="card-link block">
            <p className="rotulo mb-3">{formatDate(p.date).toUpperCase()}</p>
            <p className="font-display leading-snug tracking-tight text-ink" style={{ fontSize: '22px', fontWeight: 600 }}>
              {p.title}
            </p>
            {p.excerpt && (
              <p className="text-[15px] font-light leading-snug text-ink-body mt-2 line-clamp-2">{p.excerpt}</p>
            )}
            <span className="btn-texto mt-3">Ler o texto</span>
          </Link>
        ))}
      </div>
      <div className="mt-5">
        <Link to="/blog" className="btn-secundario">Ir para o blog</Link>
      </div>
    </section>
  )
}
