import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BlogShell } from './Blog'
import { fetchPost, formatDate, readPrerendered } from '../lib/blog'

export default function BlogPost({ initialPost }) {
  const { slug } = useParams()
  const pre = initialPost ? { post: initialPost } : readPrerendered(`/blog/${slug}`)
  const [post, setPost] = useState(pre?.post ?? undefined)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (post?.slug === slug) { document.title = `${post.title} | Compasso`; return }
    setPost(undefined)
    fetchPost(slug)
      .then(p => { setPost(p); if (p) document.title = `${p.title} | Compasso` })
      .catch(() => setError(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  return (
    <BlogShell>
      <Link to="/blog" className="text-[14px] text-penumbra hover:text-bussola">Todos os textos</Link>

      {error && <p className="mt-10 font-light">Não foi possível carregar este texto agora. Tente de novo em instantes.</p>}
      {post === undefined && !error && <p className="mt-10 font-light text-penumbra">Carregando…</p>}
      {post === null && <p className="mt-10 font-light">Este texto não foi encontrado.</p>}

      {post && (
        <article className="mt-10">
          <p className="text-[12px] tracking-[0.1em] uppercase text-penumbra mb-4">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
          </p>
          <h1 className="font-display leading-[1.05] tracking-[-0.02em] max-w-[22ch]" style={{ fontSize: 'clamp(32px,5.5vw,44px)', fontWeight: 600 }}>
            {post.title}
          </h1>
          {post.image && (
            <img src={post.image} alt="" className="mt-10 w-full rounded-2xl object-cover" loading="eager" />
          )}
          <div className="blog-conteudo mt-10" dangerouslySetInnerHTML={{ __html: post.content || '' }} />
        </article>
      )}
    </BlogShell>
  )
}
