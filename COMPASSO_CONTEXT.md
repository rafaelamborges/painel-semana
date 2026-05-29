# COMPASSO — Documento de Contexto Completo
## Para uso em novos chats de product marketing, branding e estratégia de lançamento

---

## INSTRUÇÃO PARA O ASSISTENTE

Você é um especialista em product marketing, branding e estratégia de lançamento de produtos digitais. Vou te apresentar o contexto completo de um produto SaaS chamado **Compasso**. Seu papel é ajudar com: criação de personas sintéticas de usuário, planejamento de branding completo, estratégia de lançamento (go-to-market), posicionamento, naming de funcionalidades, copies, e qualquer tarefa de product marketing relacionada.

---

## 1. O PRODUTO

### Nome
**Compasso**

### Tagline atual (provisória)
*"Acompanhamento infantil para famílias em guarda compartilhada"*

### O que é
Software web progressivo (PWA) — acessível por qualquer navegador, sem instalação — voltado para **famílias em regime de guarda compartilhada**. Centraliza toda a gestão prática da criança entre duas casas em um único painel digital compartilhado entre os responsáveis.

### O problema que resolve
Pais em guarda compartilhada coordenam responsabilidades complexas de forma improvisada: WhatsApp para comunicar trocas de guarda, planilhas para vacinas, Google Drive para documentos, memória para consultas médicas. Isso gera:
- Conflitos por falha de comunicação
- Perda de histórico clínico e escolar
- Exposição emocional desnecessária entre ex-cônjuges
- Risco real para a criança (vacinas atrasadas, medicamentos esquecidos)

O Compasso resolve com um ambiente neutro, estruturado e compartilhado.

---

## 2. FUNCIONALIDADES IMPLEMENTADAS (produção)

### Calendário de guarda automático
- Calcula automaticamente qual responsável está com a criança a cada semana
- Baseado em data-referência + dia de troca configurável
- Exibe calendário mensal colorido por responsável (cada pai tem cor própria)
- Suporta ajustes manuais de período (ex: "esta semana fico eu")
- Suporta solicitações de troca entre pais com histórico

### Agenda compartilhada
- Eventos sincronizados entre os dois responsáveis
- Cada evento exibe a cor do pai que está na guarda naquele dia
- Aparece como preview na home

### Saúde
- **Calendário vacinal PNI completo** — todas as vacinas do Programa Nacional de Imunizações brasileiro, calculadas dinamicamente pela idade da criança
- Alertas automáticos de vacinas atrasadas e próximas
- Registro de vacinas aplicadas com data real
- **Cartão de vacinação digital** — upload de foto do cartão físico
- Consultas médicas com especialidade, médico, data, observações e retorno
- **Anotações de saúde** por categoria: Geral, Remédios (com posologia), Alergias (com gravidade), Médicos (com telefone clicável), Exames (com resultado)

### Documentos
- Upload e visualização de documentos da criança (PDF, imagens)
- Grade de miniaturas com leitor integrado

### Decisões
- Registro formal de acordos tomados entre os responsáveis (histórico auditável)

### Lembretes
- Central unificada de alertas priorizados (urgente / atenção / informativo)
- Agrega: vacinas, retornos de consultas, eventos próximos

### Sistema de convites
- Criador da família convida o outro responsável via link único
- Validade de 7 dias, uso único, limite de 6 membros por família
- Papel configurável no convite (admin, editor, visualizador)

### Admin de usuários (RBAC)
- 4 níveis: Sysadmin, Admin, Editor, Visualizador
- Criador automático vira Sysadmin
- Gestão de papéis, renomear membros, remover

---

## 3. MODELO DE ACESSO E DADOS

- **SaaS** — hospedado na Vercel (CDN global)
- **Banco de dados** — Supabase (PostgreSQL em nuvem, Row Level Security)
- **Autenticação** — e-mail + senha (Supabase Auth)
- **Storage** — Supabase Storage (fotos do cartão de vacinação, documentos)
- **Sem app nativo** — web responsiva com PWA (instalável como app pelo browser)
- **Sem mensageria entre pais** — deliberadamente. O app é sobre gestão, não comunicação. Isso evita conflitos e mantém o foco.

---

## 4. DESIGN E IDENTIDADE VISUAL

### Fonte
**Lexend** — fonte projetada especificamente para reduzir fadiga visual e melhorar leiturabilidade. Escolha deliberada para um app que pais acessam em momentos de estresse.

### Cores
- **Brand primária:** Indigo (`#4F46E5`) — confiança, calma, tecnologia
- **Guardião A (mãe):** Azul (`#3B82F6`) — configurável
- **Guardião B (pai):** Verde-esmeralda (`#10B981`) — configurável
- As cores dos guardiões se propagam em toda a interface contextualmente

### Estilo
- Clean, minimalista, mobile-first
- Cards com sombra suave, bordas sutis
- Bottom navigation no mobile (5 ítens principais)
- Sidebar elegante no desktop

### Logo
Bússola (compass) — círculo sólido indigo com agulha branca. Metáfora: orientação, direção compartilhada.

---

## 5. AUTORIA E ESTÁGIO

- **Autor:** Rafael Amborges (individual, pessoa física)
- **E-mail:** rafaelamborges@gmail.com
- **País:** Brasil
- **Estágio:** Protótipo funcional em produção — sistema real com banco de dados, autenticação, todas as funcionalidades principais operacionais
- **Monetização:** Ainda não definida
- **Usuários atuais:** Fase inicial / uso próprio

---

## 6. MERCADO E CONCORRÊNCIA

### Brasil — contexto jurídico
- Lei 13.058/2014 — Lei da Guarda Compartilhada: obriga a guarda compartilhada como regra no Brasil (salvo exceções)
- Estima-se **3,5 a 4 milhões** de famílias em guarda compartilhada no Brasil
- Número cresce ano a ano com o aumento de divórcios e com a lei tornando guarda compartilhada padrão

### Concorrentes diretos
Não existe solução equivalente em **português** no mercado brasileiro.

### Concorrentes internacionais (em inglês, pagos)
| Produto | Limitação principal |
|---|---|
| OurFamilyWizard (EUA) | Inglês, foco em mensageria/comunicação, sem PNI |
| 2houses (EUA/Europa) | Inglês, sem calendário vacinal brasileiro |
| Cozi | Família nuclear, sem lógica de guarda alternada |
| TalkingParents | Focado em comunicação judicial, não em gestão |

### Vantagens competitivas do Compasso
1. **Único em português** para guarda compartilhada
2. **PNI brasileiro integrado** — nenhum concorrente tem isso
3. **Algoritmo de guarda alternada** — calcula automaticamente, não é manual
4. **Sem mensageria** — posicionamento deliberado (foco em gestão, não conflito)
5. **Gratuito** (atualmente)

---

## 7. PERSONAS — PONTO DE PARTIDA (expandir)

### Persona A — "A Mãe Organizadora"
- 28–42 anos, ensino superior completo
- Divorciada há 1–4 anos, guarda compartilhada formalizada
- Trabalha fora, vida agitada
- Sofre com a desorganização das informações da criança entre as casas
- Medo de vacinas atrasadas, médicos perdidos, informações não repassadas
- Usa muito WhatsApp mas odeia depender do ex para tudo
- Tecnologicamente confortável (usa apps de banco, delivery, etc.)

### Persona B — "O Pai Presente"
- 30–45 anos
- Quer ser um pai ativo mas sente que perde informações importantes
- Frequentemente não sabe sobre consultas, medicamentos, agenda escolar
- Quer uma forma neutra de acessar as informações sem depender de conversas difíceis com a ex

### Persona C — "O Advogado de Família" (B2B potencial)
- Indica o app para clientes em processo de divórcio
- Quer que clientes tenham um histórico auditável de decisões e comunicações

---

## 8. NOMENCLATURA DAS FUNCIONALIDADES (atual)

| Tela | Nome atual |
|---|---|
| Home | Início / Dashboard |
| Calendário de guarda | Guarda |
| Agenda compartilhada | Agenda |
| Saúde + vacinas + anotações | Saúde |
| Upload de documentos | Documentos |
| Acordos formais | Decisões |
| Central de alertas | Lembretes |
| Gestão de membros | Admin de usuários / Membros |

---

## 9. O QUE AINDA NÃO EXISTE (roadmap não oficial)

- Notificações push / e-mail
- Comunicação interna (mensagens formais entre pais, com registro)
- Plano de saúde / convênio
- Agenda escolar (notas, atividades, reuniões)
- Modo offline
- App nativo iOS/Android
- Planos pagos / monetização
- Modo para advogados/mediadores (B2B)
- Relatórios exportáveis (úteis em processos judiciais)

---

## 10. TAREFAS PARA ESTE CHAT

Use todo o contexto acima para me ajudar com:

1. **Personas sintéticas detalhadas** — crie 4–6 personas completas com nome, foto descritiva, história, dores, ganhos, comportamentos digitais, jobs-to-be-done, frases reais que diriam
2. **Posicionamento e mensagem central** — tagline definitiva, proposta de valor em 1 frase, elevator pitch de 30 segundos
3. **Estratégia de branding** — arquitetura de marca, tom de voz, pilares, o que a marca é / não é
4. **Estratégia de lançamento (go-to-market)** — canais, sequência, parcerias potenciais (advogados de família, psicólogos, pediatras), métricas de sucesso
5. **Naming de funcionalidades** — os nomes atuais são técnicos. Propor nomes mais humanos e emocionais
6. **Copy para landing page** — headline, subtítulo, CTAs, seções

---

*Documento gerado a partir do contexto completo de desenvolvimento do Compasso em 29/05/2026.*
