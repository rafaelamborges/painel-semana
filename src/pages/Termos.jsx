import { Link } from 'react-router-dom'
import { CompassMascot } from '../components/illustrations'

const SECTIONS = [
  { id: 'aceitacao',       label: '1. Aceitação destes termos' },
  { id: 'servico',         label: '2. O que é o Compasso' },
  { id: 'elegibilidade',   label: '3. Elegibilidade' },
  { id: 'conta',           label: '4. Cadastro, conta e senha' },
  { id: 'conteudo',        label: '5. Conteúdo que você registra' },
  { id: 'permissoes',      label: '6. Papéis e permissões na família' },
  { id: 'uso-aceitavel',   label: '7. Uso aceitável' },
  { id: 'propriedade',     label: '8. Propriedade intelectual' },
  { id: 'privacidade',     label: '9. Privacidade' },
  { id: 'disponibilidade', label: '10. Disponibilidade do serviço' },
  { id: 'suspensao',       label: '11. Suspensão e encerramento' },
  { id: 'responsabilidade',label: '12. Isenção e limitação de responsabilidade' },
  { id: 'alteracoes',      label: '13. Alterações destes termos' },
  { id: 'lei-foro',        label: '14. Lei aplicável e foro' },
  { id: 'contato',         label: '15. Contato' },
]

export default function Termos() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-blue-50">
      <header className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-6 flex items-center gap-4">
        <Link to="/" className="flex-shrink-0 hover:opacity-80 transition-opacity" aria-label="Voltar ao Compasso">
          <CompassMascot size={56} />
        </Link>
        <div>
          <Link to="/" className="text-brand-700 font-bold text-xl hover:underline">Compasso</Link>
          <p className="text-xs text-gray-500">Rotina, saúde e escola em harmonia entre as duas casas</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 mb-2">Documento legal</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Termos de Uso</h1>
            <p className="text-sm text-gray-500 mt-3">
              Última atualização: 15 de setembro de 2026 · Vigente a partir desta data.
            </p>
          </div>

          <div className="bg-brand-50/60 border border-brand-100 rounded-xl p-4 mb-8">
            <p className="text-sm text-gray-700 leading-relaxed">
              Estes Termos regulam o uso do <strong>Compasso</strong>, aplicativo web disponível em <a href="https://www.familiaemcompasso.com.br" className="text-brand-600 hover:underline">www.familiaemcompasso.com.br</a>. Ao criar uma conta ou usar o serviço, você concorda com o que está escrito aqui.
            </p>
          </div>

          <nav className="mb-10 border border-gray-100 rounded-xl p-4 bg-gray-50/60">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Sumário</p>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 list-none">
              {SECTIONS.map(s => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-sm text-brand-700 hover:underline">{s.label}</a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="prose-compasso space-y-10 text-gray-700 leading-relaxed">

            <section id="aceitacao">
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Aceitação destes termos</h2>
              <p>
                Ao criar uma conta, aceitar um convite para entrar em uma família ou de qualquer forma utilizar o Compasso, você declara ter lido, compreendido e aceito integralmente estes Termos de Uso e a nossa <Link to="/privacidade" className="text-brand-600 hover:underline">Política de Privacidade</Link>. Se você não concorda com algum ponto, não use o serviço.
              </p>
            </section>

            <section id="servico">
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. O que é o Compasso</h2>
              <p>
                O Compasso é uma ferramenta digital de coordenação de rotina para famílias em regime de guarda compartilhada. O serviço permite registrar e visualizar, entre os adultos responsáveis por uma mesma criança, informações como calendário de guarda, agenda de eventos, saúde, terapia, documentos, acordos entre os pais e conquistas da criança.
              </p>
              <p className="mt-2">
                O Compasso é uma <strong>ferramenta de organização familiar</strong> — não substitui aconselhamento jurídico, orientação médica, psicoterapia, decisões judiciais nem qualquer serviço profissional especializado.
              </p>
            </section>

            <section id="elegibilidade">
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Elegibilidade</h2>
              <p>
                O Compasso é destinado a maiores de 18 anos, com capacidade civil plena, responsáveis por crianças em regime de guarda compartilhada ou pessoas por eles convidadas (novo cônjuge, avós, babás etc.). Ao usar o serviço, você declara atender a esses requisitos.
              </p>
              <p className="mt-2">
                A criança <strong>não é usuária</strong> do Compasso. Os dados registrados se referem a ela, mas o serviço é operado exclusivamente pelos adultos responsáveis.
              </p>
            </section>

            <section id="conta">
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Cadastro, conta e senha</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Você é responsável pelas informações que fornece no cadastro e pela sua veracidade.</li>
                <li>Você é responsável por manter a confidencialidade da sua senha e por toda atividade praticada com a sua conta.</li>
                <li>Ao usar o login com Google, você autoriza o Compasso a receber os dados básicos do seu perfil Google, na forma descrita na Política de Privacidade.</li>
                <li>Se identificar acesso não autorizado à sua conta, comunique-nos imediatamente pelo email da seção 15.</li>
              </ul>
            </section>

            <section id="conteudo">
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Conteúdo que você registra</h2>
              <p>
                Você é o único responsável por todo o conteúdo que registra no Compasso — textos, datas, decisões, fotos e arquivos. Isso inclui dados sobre a criança, dados de saúde, dados de terceiros (novo cônjuge, avós, babás) e conteúdo trocado entre os pais.
              </p>
              <p className="mt-2">
                Você declara que:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Tem autoridade legal para tratar os dados da criança sob sua responsabilidade;</li>
                <li>Obteve consentimento das demais pessoas cujos dados forem registrados no Compasso (por exemplo, ao convidar um novo membro para a família);</li>
                <li>Não viola direitos de terceiros ao usar o serviço;</li>
                <li>Reconhece que informações registradas no Compasso ficam <strong>visíveis a todos os membros da família</strong>, conforme o papel de acesso de cada um.</li>
              </ul>
              <p className="mt-3">
                A <strong>propriedade</strong> do conteúdo é sua. Ao registrar dados no Compasso, você concede à Controladora do serviço apenas a licença estritamente necessária para armazenar, processar e exibir esse conteúdo aos demais membros da sua família — nenhuma outra utilização.
              </p>
            </section>

            <section id="permissoes">
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Papéis e permissões na família</h2>
              <p>
                Cada família no Compasso tem no máximo <strong>6 membros</strong>. Cada membro possui dois atributos independentes:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Papel parental</strong> — mãe, pai, madrasta, padrasto, avó/avô, babá, outros.</li>
                <li><strong>Nível de acesso</strong> — Sysadmin, Admin, Editor ou Visualizador. Define o que a pessoa pode ver e o que pode modificar dentro do app.</li>
              </ul>
              <p className="mt-3">
                O membro Sysadmin da família é responsável por convidar novos membros, definir seus níveis de acesso e removê-los. Ao convidar alguém para a sua família, você é responsável por essa escolha e pelo que essa pessoa passará a acessar.
              </p>
            </section>

            <section id="uso-aceitavel">
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Uso aceitável</h2>
              <p>Você concorda em <strong>não</strong>:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Usar o Compasso para qualquer atividade ilegal, fraudulenta ou que viole direitos de terceiros;</li>
                <li>Registrar dados falsos ou enganosos com intenção de prejudicar outra pessoa;</li>
                <li>Tentar acessar dados de outra família ou burlar os mecanismos de segurança do serviço;</li>
                <li>Copiar, extrair, revender ou distribuir os dados de outras pessoas armazenados no Compasso;</li>
                <li>Aplicar engenharia reversa, descompilar ou copiar substancialmente o código ou o design do aplicativo;</li>
                <li>Usar o serviço para publicidade não solicitada, spam ou automação massiva de qualquer natureza;</li>
                <li>Registrar conteúdo de teor ofensivo, discriminatório, difamatório, obsceno ou que exponha a criança a risco.</li>
              </ul>
              <p className="mt-3">
                O descumprimento pode levar à suspensão ou encerramento da sua conta, sem prejuízo das medidas legais cabíveis.
              </p>
            </section>

            <section id="propriedade">
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Propriedade intelectual</h2>
              <p>
                O nome "Compasso", a marca, o mascote, o design da interface, as ilustrações, o código-fonte e o conteúdo produzido pela Controladora são de titularidade de <strong>Rafaela Borges</strong> e estão protegidos pela Lei de Direitos Autorais (Lei 9.610/1998) e pela Lei de Software (Lei 9.609/1998).
              </p>
              <p className="mt-2">
                Nada nestes Termos transfere a você qualquer direito sobre esses elementos além da licença de uso pessoal do aplicativo. O <strong>seu conteúdo</strong> (dados que você registra) segue sendo seu, conforme já descrito na seção 5.
              </p>
            </section>

            <section id="privacidade">
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Privacidade</h2>
              <p>
                O tratamento dos seus dados pessoais é regido pela nossa <Link to="/privacidade" className="text-brand-600 hover:underline">Política de Privacidade</Link>, que faz parte integrante destes Termos. Recomendamos a leitura atenta antes de aceitar.
              </p>
            </section>

            <section id="disponibilidade">
              <h2 className="text-xl font-bold text-gray-900 mb-3">10. Disponibilidade do serviço</h2>
              <p>
                Fazemos esforços razoáveis para manter o Compasso disponível 24 horas por dia, sete dias por semana. Ainda assim, o serviço pode ficar indisponível por manutenção programada, falhas dos provedores utilizados (Supabase, Vercel, Google), instabilidades da Internet ou eventos alheios ao nosso controle. Não garantimos disponibilidade contínua e ininterrupta, tampouco ausência de erros.
              </p>
              <p className="mt-2">
                Reservamo-nos o direito de modificar, suspender ou descontinuar funcionalidades a qualquer tempo, sempre que tecnicamente necessário. Alterações relevantes serão comunicadas dentro do próprio app.
              </p>
            </section>

            <section id="suspensao">
              <h2 className="text-xl font-bold text-gray-900 mb-3">11. Suspensão e encerramento</h2>
              <p>
                Você pode encerrar sua conta a qualquer momento, solicitando a exclusão pelo email da seção 15. A Controladora pode suspender ou encerrar contas em caso de descumprimento destes Termos, mediante aviso quando possível, especialmente nas hipóteses da seção 7.
              </p>
              <p className="mt-2">
                A exclusão da conta segue a política de retenção descrita na seção 8 da <Link to="/privacidade" className="text-brand-600 hover:underline">Política de Privacidade</Link>.
              </p>
            </section>

            <section id="responsabilidade">
              <h2 className="text-xl font-bold text-gray-900 mb-3">12. Isenção e limitação de responsabilidade</h2>
              <p>
                O Compasso é oferecido <strong>"como está"</strong> ("as is"), sem garantias implícitas de adequação a uma finalidade específica. A Controladora não se responsabiliza por:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Decisões tomadas com base exclusiva em registros feitos no app — inclusive decisões médicas, jurídicas, escolares ou terapêuticas;</li>
                <li>Perda de dados decorrente de falha de provedores terceirizados ou de exclusão feita por você ou por outro membro da sua família;</li>
                <li>Uso indevido do serviço por outro membro da família ou por terceiros que tenham obtido acesso à sua conta;</li>
                <li>Conteúdo registrado por outros membros da sua família ou repercussões desses registros em conflitos privados.</li>
              </ul>
              <p className="mt-3">
                Nada nesta cláusula afasta responsabilidades que a legislação brasileira estabelece como inafastáveis, especialmente as previstas no Código de Defesa do Consumidor quando a relação for de consumo.
              </p>
            </section>

            <section id="alteracoes">
              <h2 className="text-xl font-bold text-gray-900 mb-3">13. Alterações destes termos</h2>
              <p>
                Podemos atualizar estes Termos de tempos em tempos, para refletir mudanças no serviço, na legislação ou nos provedores utilizados. Sempre que houver alteração relevante, informaremos por email ou por aviso destacado dentro do app, com antecedência mínima de 15 dias. O uso continuado do Compasso após a entrada em vigor da nova versão implica aceitação das mudanças.
              </p>
            </section>

            <section id="lei-foro">
              <h2 className="text-xl font-bold text-gray-900 mb-3">14. Lei aplicável e foro</h2>
              <p>
                Estes Termos são regidos pelas leis da <strong>República Federativa do Brasil</strong>. Fica eleito o foro da comarca de domicílio do usuário para dirimir eventuais controvérsias decorrentes da relação com o Compasso, quando a relação for de consumo, na forma do Código de Defesa do Consumidor.
              </p>
            </section>

            <section id="contato">
              <h2 className="text-xl font-bold text-gray-900 mb-3">15. Contato</h2>
              <div className="mt-2 border border-gray-100 rounded-xl p-4 bg-gray-50/60">
                <p><strong>Rafaela Borges</strong> — Controladora</p>
                <p>Email: <a href="mailto:rafaelamborges@gmail.com" className="text-brand-600 hover:underline">rafaelamborges@gmail.com</a></p>
                <p>Site: <a href="https://www.familiaemcompasso.com.br" className="text-brand-600 hover:underline">www.familiaemcompasso.com.br</a></p>
              </div>
            </section>

          </div>
        </div>

        <div className="mt-6 flex items-center justify-between text-xs text-gray-500 px-2 flex-wrap gap-2">
          <Link to="/" className="hover:text-brand-600 hover:underline">← Voltar ao Compasso</Link>
          <div className="flex items-center gap-4">
            <Link to="/privacidade" className="hover:text-brand-600 hover:underline">Política de Privacidade</Link>
            <span>Versão 1.0 · 15/09/2026</span>
          </div>
        </div>
      </main>
    </div>
  )
}
