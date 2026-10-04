// Entrada usada apenas no build para gerar HTML estático de páginas públicas
// (páginas legais e blog). Assim, robôs que não executam JavaScript
// (Google, verificação de marca, redes sociais) leem o conteúdo completo.
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { Routes, Route } from 'react-router-dom'
import Privacidade from './pages/Privacidade.jsx'
import Termos from './pages/Termos.jsx'
import Blog from './pages/Blog.jsx'
import BlogPost from './pages/BlogPost.jsx'

export { fetchPosts, fetchPost } from './lib/blog.js'

export const legalPages = {
  '/privacidade': { Component: Privacidade, title: 'Política de Privacidade | Compasso' },
  '/termos': { Component: Termos, title: 'Termos de Uso | Compasso' },
}

function toHtml(path, element) {
  return renderToString(<StaticRouter location={path}>{element}</StaticRouter>)
}

export function renderLegal(path) {
  const { Component, title } = legalPages[path]
  return { html: toHtml(path, <Component />), title }
}

export function renderBlogList(posts) {
  return toHtml('/blog', <Blog initialPosts={posts} />)
}

export function renderBlogPost(post) {
  const path = `/blog/${post.slug}`
  return toHtml(path, (
    <Routes>
      <Route path="/blog/:slug" element={<BlogPost initialPost={post} />} />
    </Routes>
  ))
}
