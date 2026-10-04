import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CompassSymbol } from '../components/illustrations'
import { fetchPosts, formatDate, readPrerendered } from '../lib/blog'

export function BlogShell({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-nevoa via-white to-aurora text-profundo">
      <header className="max-w-3xl mx-auto px-6 pt-10 pb-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" aria-label="Ir para o Compasso">
          <CompassSymbol size={36} />
          <span className="font-display text-xl" style={{ fontWeight: 600 }}>Compasso</span>
        </Link>
        <Link to="/blog" className="text-[13px] tracking-[0.1em] uppercase text-penumbra hover:text-bussola">Blog</Link>
      </header>
      <main className="max-w-3xl mx-auto px-6 pb-24">{children}</main>
      <footer className="max-w-3xl mx-auto px-6 pb-12 text-[13px] text-penumbra flex flex-wrap gap-x-6 gap-y-2">
        <Link to="/" className="hover:text-bussola">Acessar o Compasso</Link>
        <Link to="/privacidade" className="hover:text-bussola">Política de Privacidade</Link>
        <Link to="/termos" className="hover:text-bussola">Termos de Uso</Link>
      </footer>
    </div>
  )
}

export default function Blog({ initialPosts }) {
  const pre = initialPosts ? { posts: initialPosts } : readPrerendered('/blog')
  const [posts, setPosts] = useState(pre?.posts ?? null)
  const [error, setError] = useState(false)

  useEffect(() => {
    document.title = 'Blog | Compasso'
    fetchPosts().then(setPosts).catch(() => { if (!posts) setError(true) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <BlogShell>
      <div className="mb-16">
        <h1 className="font-display leading-[1.0] tracking-[-0.03em]" style={{ fontSize: 'clamp(40px,7vw,64px)', fontWeight: 200 }}>
          <span className="block">Duas casas.</span>
          <em className="block" style={{ fontWeight: 600 }}>Uma só criança.</em>
        </h1>
        <p className="mt-5 text-[16px] leading-[1.55] font-light max-w-xl">
          Coparentalidade, desenvolvimento infantil e a rotina da criança entre dois lares.
        </p>
      </div>

      {error && <p className="font-light">Não foi possível carregar os textos agora. Tente de novo em instantes.</p>}
      {!posts && !error && <p className="font-light text-penumbra">Carregando…</p>}
      {posts && posts.length === 0 && <p className="font-light">Nenhum texto publicado ainda.</p>}

      {posts && posts.length > 0 && (
        <ol className="space-y-12 list-none p-0">
          {posts.map(p => (
            <li key={p.id}>
              <article>
                <Link to={`/blog/${p.slug}`} className="group block">
                  <p className="text-[12px] tracking-[0.1em] uppercase text-penumbra mb-3">
                    <time dateTime={p.date}>{formatDate(p.date)}</time>
                  </p>
                  <h2 className="font-display text-[30px] sm:text-[36px] leading-[1.08] tracking-[-0.02em] group-hover:text-bussola transition-colors" style={{ fontWeight: 600 }}>
                    {p.title}
                  </h2>
                  {p.excerpt && <p className="mt-3 text-[16px] leading-[1.55] font-light max-w-[65ch]">{p.excerpt}</p>}
                  <span className="inline-block mt-4 text-[14px] text-bussola">Ler o texto</span>
                </Link>
              </article>
            </li>
          ))}
        </ol>
      )}
    </BlogShell>
  )
}
