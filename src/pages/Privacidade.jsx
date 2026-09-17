import { Link } from 'react-router-dom'
import { CompassMascot } from '../components/illustrations'

const SECTIONS = [
  { id: 'quem-somos',      label: '1. Quem somos' },
  { id: 'dados',           label: '2. Dados que tratamos' },
  { id: 'finalidades',     label: '3. Para que usamos' },
  { id: 'bases-legais',    label: '4. Bases legais (LGPD)' },
  { id: 'compartilhamento',label: '5. Com quem compartilhamos' },
  { id: 'internacional',   label: '6. Transferência internacional' },
  { id: 'seguranca',       label: '7. Segurança' },
  { id: 'retencao',        label: '8. Retenção e exclusão' },
  { id: 'direitos',        label: '9. Seus direitos' },
  { id: 'criancas',        label: '10. Dados de crianças' },
  { id: 'google',          label: '11. Uso de dados do Google' },
  { id: 'cookies',         label: '12. Cookies' },
  { id: 'alteracoes',      label: '13. Alterações' },
  { id: 'contato',         label: '14. Encarregado e contato' },
]

export default function Privacidade() {
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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Política de Privacidade</h1>
            <p className="text-sm text-gray-500 mt-3">
              Última atualização: 15 de setembro de 2026 · Vigente a partir desta data.
            </p>
          </div>

          <div className="bg-brand-50/60 border border-brand-100 rounded-xl p-4 mb-8">
            <p className="text-sm text-gray-700 leading-relaxed">
              O Compasso é um aplicativo web feito para famílias brasileiras em guarda compartilhada. Este documento explica, em português claro, quais dados o Compasso trata, por que trata e quais são os seus direitos — em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei 13.709/2018)</strong> e com a <strong>Google API Services User Data Policy</strong>.
            </p>
          </div>

          {/* Sumário */}
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

            <section id="quem-somos">
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Quem somos</h2>
              <p>
                O Compasso é operado no domínio <a href="https://www.familiaemcompasso.com.br" className="text-brand-600 hover:underline">www.familiaemcompasso.com.br</a>. A pessoa responsável pelo tratamento de dados pessoais — a <strong>Controladora</strong>, para fins da LGPD — é identificada na seção 14 desta política.
              </p>
            </section>

            <section id="dados">
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Dados que tratamos</h2>

              <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.1. Dados de conta</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Nome e endereço de email — fornecidos por você diretamente ou obtidos via login com Google.</li>
                <li>Senha (apenas quando você opta pelo cadastro por email) — armazenada exclusivamente como hash criptográfico pelo Supabase Auth; a Compasso não tem acesso à senha em texto.</li>
                <li>Foto de perfil pública (apenas quando você usa login com Google).</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.2. Dados da família e da criança</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Nome da família.</li>
                <li>Nome, data de nascimento, escola, série e foto (opcional) da criança.</li>
                <li>Nome, papel parental (mãe, pai, madrasta, padrasto, avó/avô, babá, outros), cor de identificação e email dos demais membros incluídos na família.</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.3. Dados sensíveis <span className="text-xs font-normal text-gray-500">(LGPD art. 5º, II)</span></h3>
              <p className="mb-2">
                Os dados abaixo são classificados como <strong>sensíveis</strong> pela LGPD e recebem proteção adicional. Você fornece esses dados por decisão sua ao usar as áreas correspondentes do app.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Saúde física:</strong> vacinas administradas, consultas e retornos médicos, especialistas cadastrados, anotações de saúde, fotos do cartão de vacinação da criança.</li>
                <li><strong>Saúde mental / desenvolvimento:</strong> registros semanais de terapia e observações sobre o desenvolvimento emocional da criança.</li>
                <li><strong>Documentos oficiais da criança:</strong> arquivos que você optar por anexar (certidões, RG, laudos, autorizações).</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.4. Dados de uso do aplicativo</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Padrão de guarda alternante e ajustes manuais que você registrar.</li>
                <li>Eventos da agenda, acordos entre os pais e assinaturas ("Concordo") de cada parte, arquivos anexos e marcos/conquistas da criança.</li>
                <li>Metadados técnicos de cada registro: identificador interno, quem criou, data e hora.</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.5. Dados obtidos do Google (quando você usa "Entrar com Google")</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Nome, email e foto pública da sua conta Google — armazenados no seu perfil de conta do Compasso.</li>
                <li>Token de acesso temporário do Google, com o escopo <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">https://www.googleapis.com/auth/calendar</code>, usado <strong>exclusivamente</strong> para criar eventos no seu próprio Google Calendar quando você registra um evento no Compasso. O token é mantido em memória durante sua sessão e não é revendido, exportado ou usado para outras finalidades.</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.6. Dados que <em>não</em> coletamos</h3>
              <p>
                O Compasso não usa serviços de analytics (Google Analytics, Segment, Mixpanel etc.), não usa cookies de rastreamento, não coleta seu IP para fins de perfilamento, não usa ferramentas de A/B testing, nem pixels de publicidade.
              </p>
            </section>

            <section id="finalidades">
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Para que usamos esses dados</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Operar o serviço:</strong> mostrar rotina, agenda, saúde, arquivos, acordos e alertas — exclusivamente para os membros da sua família.</li>
                <li><strong>Isolar dados por família:</strong> aplicar segurança em nível de linha (Row-Level Security) do Postgres para garantir que apenas membros autorizados da sua família consigam ver os dados dela.</li>
                <li><strong>Sincronização com Google Calendar (opcional):</strong> quando você usa "Entrar com Google" e cria um evento no Compasso, o app pode criar esse mesmo evento no seu Google Calendar, para que ele apareça também no seu celular ou em outros calendários.</li>
                <li><strong>Alertas dentro do app:</strong> avisos sobre vacinas atrasadas, retornos médicos próximos e ausência de registros de terapia. Nada é enviado por email ou push automático a terceiros.</li>
                <li><strong>Segurança e integridade:</strong> prevenção de acesso indevido, auditoria mínima e proteção contra abuso do serviço.</li>
              </ul>
            </section>

            <section id="bases-legais">
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Bases legais do tratamento</h2>
              <p className="mb-2">Para cada finalidade, o Compasso se apoia em uma das seguintes bases legais previstas na LGPD (art. 7º e art. 11):</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Consentimento</strong> — para os dados sensíveis (saúde, terapia) e para a sincronização com o Google Calendar.</li>
                <li><strong>Execução de contrato</strong> — para operar as funcionalidades do serviço que você contratou ao criar sua conta.</li>
                <li><strong>Interesse legítimo</strong> — para segurança, integridade do serviço e prevenção de fraude.</li>
                <li><strong>Proteção do menor</strong> (art. 14) — para os dados da criança, sempre com base no consentimento do responsável legal.</li>
              </ul>
            </section>

            <section id="compartilhamento">
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Com quem compartilhamos</h2>
              <p className="mb-2">
                O Compasso <strong>não vende, aluga nem cede dados pessoais a terceiros para fins comerciais</strong>. Os dados são processados apenas pelos provedores estritamente necessários para o funcionamento do serviço, na condição de <strong>Operadores</strong>:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Supabase Inc.</strong> — banco de dados Postgres, autenticação e armazenamento de arquivos. Servidores em us-east-2 (Estados Unidos). É onde ficam armazenados todos os dados do app.</li>
                <li><strong>Vercel Inc.</strong> — hospedagem da aplicação web e CDN global. Não armazena dados de usuário além dos logs padrão de servidor.</li>
                <li><strong>Google LLC</strong> — apenas quando você opta por "Entrar com Google": o Google fornece ao Compasso os seus dados básicos de perfil e um token temporário para operar o Google Calendar em seu nome, conforme descrito na seção 11.</li>
              </ul>
              <p className="mt-3">
                Os dados também poderão ser divulgados em cumprimento de obrigação legal, ordem judicial ou requisição de autoridade competente, sempre no limite do que for exigido.
              </p>
            </section>

            <section id="internacional">
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Transferência internacional de dados</h2>
              <p>
                Como o Supabase e o Vercel operam em servidores nos Estados Unidos, seus dados são <strong>transferidos e processados fora do Brasil</strong>. Ambos os provedores mantêm certificações internacionais de segurança (SOC 2, ISO 27001) e cláusulas contratuais compatíveis com LGPD e GDPR. Ao criar sua conta, você fica ciente e consente com essa transferência.
              </p>
            </section>

            <section id="seguranca">
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Como protegemos seus dados</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>HTTPS/TLS</strong> em todas as conexões entre navegador e servidor.</li>
                <li><strong>Row-Level Security (RLS)</strong> aplicado no banco Postgres: cada linha de cada tabela é filtrada pelo ID da família do usuário logado, tornando fisicamente inacessível o dado de uma família para membros de outra família — mesmo que houvesse um bug na aplicação.</li>
                <li><strong>Storage privado</strong>: fotos e documentos ficam em buckets privados; o acesso a cada arquivo é feito por URL assinada com validade curta (10 minutos), gerada sob demanda.</li>
                <li><strong>Senhas</strong>: nunca são armazenadas em texto — o Supabase Auth aplica hash criptográfico moderno (bcrypt).</li>
                <li><strong>Papéis de acesso</strong>: cada membro da família tem um nível de acesso (Sysadmin, Admin, Editor, Visualizador) que limita o que pode ver e o que pode modificar.</li>
              </ul>
            </section>

            <section id="retencao">
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Retenção e exclusão</h2>
              <p>
                Seus dados são mantidos enquanto sua conta estiver ativa. Ao solicitar a exclusão da conta, os dados são apagados dos nossos sistemas em até <strong>30 dias</strong>, exceto quando houver obrigação legal de retenção maior. Cópias em backups seguros são sobrescritas em até 90 dias após a exclusão.
              </p>
              <p className="mt-2">
                Para solicitar exclusão, entre em contato pelo canal informado na seção 14.
              </p>
            </section>

            <section id="direitos">
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Seus direitos como titular</h2>
              <p className="mb-2">
                Nos termos do art. 18 da LGPD, você pode a qualquer momento:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Confirmar se seus dados estão sendo tratados e acessar uma cópia deles.</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
                <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários.</li>
                <li>Solicitar a portabilidade dos seus dados para outro fornecedor.</li>
                <li>Revogar o consentimento previamente dado.</li>
                <li>Se opor a tratamento realizado com base em interesse legítimo.</li>
                <li>Ser informado sobre com quem seus dados foram compartilhados.</li>
                <li>Peticionar diretamente à <strong>Autoridade Nacional de Proteção de Dados (ANPD)</strong>.</li>
              </ul>
              <p className="mt-3">
                Para exercer qualquer desses direitos, entre em contato pelo canal informado na seção 14. Respondemos em até 15 dias corridos.
              </p>
            </section>

            <section id="criancas">
              <h2 className="text-xl font-bold text-gray-900 mb-3">10. Dados de crianças e adolescentes</h2>
              <p>
                O Compasso trata dados de crianças e adolescentes com o cuidado adicional exigido pela LGPD (art. 14) e pelo Estatuto da Criança e do Adolescente. Todo o tratamento é feito no <strong>melhor interesse da criança</strong> e sempre com base no consentimento específico de ao menos um responsável legal — que é quem cria e opera a conta do Compasso.
              </p>
              <p className="mt-2">
                A criança <strong>não é usuária direta</strong> do aplicativo. Os dados registrados (rotina, saúde, escola, terapia) servem à coordenação do cuidado entre as duas casas em que a criança vive.
              </p>
            </section>

            <section id="google">
              <h2 className="text-xl font-bold text-gray-900 mb-3">11. Uso de dados obtidos do Google</h2>
              <p className="mb-3">
                Quando você entra no Compasso usando o botão <em>Entrar com Google</em>, o Compasso recebe do Google:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Nome, email e foto pública da sua conta Google — para identificar você no app.</li>
                <li>Um <strong>token de acesso temporário</strong> com o escopo <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">https://www.googleapis.com/auth/calendar</code>, usado apenas para criar novos eventos no seu próprio Google Calendar quando você cria um evento no Compasso.</li>
              </ul>

              <p className="mt-4 mb-2 font-semibold text-gray-900">Compromisso de Uso Limitado (Google Limited Use)</p>
              <p>
                O uso e a transferência para qualquer outro aplicativo de informações recebidas das APIs do Google respeitarão a <a href="https://developers.google.com/terms/api-services-user-data-policy#limited_use_requirements" className="text-brand-600 hover:underline" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, incluindo os requisitos de Uso Limitado ("Limited Use"). Em particular:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Os dados obtidos do Google são usados <strong>somente</strong> para operar as funcionalidades voltadas ao usuário dentro do Compasso.</li>
                <li>Os dados <strong>não são transferidos</strong> a terceiros, exceto quando for necessário para operar essas funcionalidades, cumprir a lei ou por decisão explícita do usuário.</li>
                <li>Os dados <strong>não são usados</strong> para publicidade, retargeting, venda, empréstimo ou análise de perfil.</li>
                <li>Os dados <strong>não são lidos por humanos</strong>, exceto (a) com seu consentimento afirmativo, (b) para segurança (ex: investigação de abuso), (c) para cumprir obrigação legal ou (d) quando os dados estiverem agregados e completamente anonimizados.</li>
                <li>O Compasso <strong>não lê nem lista</strong> eventos existentes no seu Google Calendar. O escopo é usado apenas para criar novos eventos originados no Compasso.</li>
              </ul>

              <p className="mt-4">
                Você pode revogar o acesso do Compasso à sua conta Google a qualquer momento em <a href="https://myaccount.google.com/permissions" className="text-brand-600 hover:underline" target="_blank" rel="noopener noreferrer">https://myaccount.google.com/permissions</a>. A revogação não apaga os dados já registrados dentro do Compasso — para isso, use a solicitação de exclusão descrita na seção 8.
              </p>
            </section>

            <section id="cookies">
              <h2 className="text-xl font-bold text-gray-900 mb-3">12. Cookies e armazenamento local</h2>
              <p>
                O Compasso usa <strong>apenas armazenamento local e cookies estritamente necessários</strong> para manter você autenticado na sessão (tokens de sessão do Supabase). Não usamos cookies de rastreamento, publicidade, analytics ou preferências publicitárias.
              </p>
            </section>

            <section id="alteracoes">
              <h2 className="text-xl font-bold text-gray-900 mb-3">13. Alterações desta política</h2>
              <p>
                Podemos revisar esta Política de Privacidade de tempos em tempos, para refletir mudanças no serviço, na legislação ou nos provedores utilizados. Sempre que houver alteração relevante, avisaremos por email cadastrado ou por um aviso destacado dentro do app com antecedência mínima de 15 dias.
              </p>
            </section>

            <section id="contato">
              <h2 className="text-xl font-bold text-gray-900 mb-3">14. Encarregado (DPO) e contato</h2>
              <p>
                As informações da Controladora e do Encarregado (DPO) pelo tratamento de dados pessoais serão informadas em breve nesta seção. Enquanto isso, o site oficial permanece em <a href="https://www.familiaemcompasso.com.br" className="text-brand-600 hover:underline">www.familiaemcompasso.com.br</a>.
              </p>
              <p className="mt-4">
                Você também pode entrar em contato com a <strong>Autoridade Nacional de Proteção de Dados (ANPD)</strong> em <a href="https://www.gov.br/anpd" className="text-brand-600 hover:underline" target="_blank" rel="noopener noreferrer">www.gov.br/anpd</a>.
              </p>
            </section>

          </div>
        </div>

        <div className="mt-6 flex items-center justify-between text-xs text-gray-500 px-2 flex-wrap gap-2">
          <Link to="/" className="hover:text-brand-600 hover:underline">← Voltar ao Compasso</Link>
          <div className="flex items-center gap-4">
            <Link to="/termos" className="hover:text-brand-600 hover:underline">Termos de Uso</Link>
            <span>Versão 1.0 · 15/09/2026</span>
          </div>
        </div>
      </main>
    </div>
  )
}
