// Entrada usada apenas no build para gerar HTML estático das páginas legais.
// Assim, robôs que não executam JavaScript (ex.: verificação de marca do Google)
// conseguem ler o conteúdo completo de /privacidade e /termos.
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import Privacidade from './pages/Privacidade.jsx'
import Termos from './pages/Termos.jsx'

const PAGES = {
  '/privacidade': { Component: Privacidade, title: 'Política de Privacidade | Compasso' },
  '/termos': { Component: Termos, title: 'Termos de Uso | Compasso' },
}

export function render(path) {
  const { Component, title } = PAGES[path]
  const html = renderToString(
    <StaticRouter location={path}>
      <Component />
    </StaticRouter>
  )
  return { html, title }
}

export const paths = Object.keys(PAGES)
