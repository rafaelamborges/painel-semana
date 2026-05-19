#!/usr/bin/env python3
"""
Painel Semana JCPM
─────────────────
Lê a página de texto corrido do Notion, gera o index.html e envia por e-mail.
Agendado via Agendador de Tarefas do Windows toda segunda às 11h.

Dependências:  pip install notion-client
"""

import json
import re
import smtplib
import sys
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

# ── Caminhos e IDs ────────────────────────────────────────────
BASE_DIR    = Path(__file__).parent
CONFIG_FILE = BASE_DIR / "config.json"
OUTPUT_HTML = BASE_DIR / "index.html"

PAGE_ID = "3569d5bf2aa480fe98ebdd2ecd405957"   # página de texto corrido

# ── Mapeamentos ───────────────────────────────────────────────
ORDEM_CATEGORIAS = ["CRM", "Comunidades", "Central", "Programa de Relacionamento"]

CAT_ICONES = {
    "crm":                        ("CRM",                        "📊"),
    "comunidades":                ("Comunidades",                "🤝"),
    "central":                    ("Central",                    "🏬"),
    "programa de relacionamento": ("Programa de Relacionamento", "⭐"),
    "relacionamento":             ("Programa de Relacionamento", "⭐"),
}

DIAS_MAP = {
    "segunda": "Segunda", "terca": "Terça", "terça": "Terça",
    "quarta":  "Quarta",  "quinta": "Quinta", "sexta": "Sexta",
}

STATUS_BADGE = {
    "Em andamento": ("b-andamento",  "● Em andamento"),
    "Aguardando":   ("b-aguardando", "● Aguardando"),
    "Agendado":     ("b-agendado",   "📅 Agendado"),
    "Aprovado":     ("b-aprovado",   "✓ Aprovado"),
    "Pendente":     ("b-pendente",   "● Pendente"),
    "Em revisão":   ("b-revisao",    "● Em revisão"),
    "Em avaliação": ("b-avaliacao",  "● Em avaliação"),
}

# ── Config ────────────────────────────────────────────────────
def carregar_config():
    with open(CONFIG_FILE, encoding="utf-8") as f:
        return json.load(f)

# ── Cliente Notion ────────────────────────────────────────────
def notion_client(token):
    try:
        from notion_client import Client
        return Client(auth=token)
    except ImportError:
        print("ERRO: instale notion-client com:  pip install notion-client")
        sys.exit(1)

# ── Buscar blocos da página ───────────────────────────────────
def buscar_blocos(notion):
    blocks, cursor = [], None
    while True:
        resp = notion.blocks.children.list(
            block_id=PAGE_ID, start_cursor=cursor, page_size=100
        )
        blocks.extend(resp["results"])
        if not resp["has_more"]:
            break
        cursor = resp["next_cursor"]
    return blocks

# ── Helpers de rich_text ──────────────────────────────────────
def texto_puro(rich_text):
    return "".join(rt.get("plain_text", "") for rt in rich_text)

def primeiro_eh_negrito(rich_text):
    """Verifica se o primeiro segmento não-vazio é negrito."""
    for rt in rich_text:
        txt = rt.get("plain_text", "").strip()
        if txt:
            return rt.get("annotations", {}).get("bold", False)
    return False

def tem_fundo_laranja(rich_text):
    return any(
        "orange" in rt.get("annotations", {}).get("color", "")
        for rt in rich_text
    )

# ── Detectar status pelo texto ────────────────────────────────
def detectar_status(texto):
    t = texto.lower()
    if any(w in t for w in ["aprovado", "aprovada"]):
        return "Aprovado"
    if any(w in t for w in ["realizado", "realizada", "concluído", "concluída"]):
        return "Em andamento"   # realizado parcialmente ainda em acompanhamento
    if "agendad" in t:
        return "Agendado"
    if "aquém" in t or "abaixo do esperado" in t:
        return "Em revisão"
    if "aguardando" in t or "aguardar" in t:
        return "Aguardando"
    if "avaliação" in t or "avaliando" in t or "contratação" in t:
        return "Em avaliação"
    if any(w in t for w in ["enviarei", "enviando", "nesta semana",
                            "esta semana", "realizarei", "em andamento"]):
        return "Em andamento"
    if any(w in t for w in ["ainda não", "não priorizei", "não foi", "realizar"]):
        return "Pendente"
    return "Em andamento"

# ── Parser principal ──────────────────────────────────────────
def parsear_pagina(blocks):
    """
    Retorna (semana_str, dias, categorias).
    Faz a leitura bloco a bloco respeitando a estrutura:
      - Linha de semana  → semana_str
      - Linhas de dia    → dias[]
      - Cabeçalho laranja → nova categoria
      - Linha negrito:desc → nova atividade na categoria
      - Texto livre      → continuação da atividade anterior
    """
    hoje  = datetime.today()
    seg   = hoje - timedelta(days=hoje.weekday())
    datas = {nome: (seg + timedelta(i)).day
             for i, nome in enumerate(["Segunda","Terça","Quarta","Quinta","Sexta"])}

    semana_str   = ""
    dias         = []
    cats_dict    = {}   # nome_normalizado → {nome, icone, atividades}
    cat_atual    = None
    ativ_atual   = None

    for block in blocks:
        btype = block.get("type", "")
        if btype not in ("paragraph", "bulleted_list_item", "numbered_list_item"):
            continue

        rt  = block.get(btype, {}).get("rich_text", [])
        txt = texto_puro(rt).strip()
        if not txt:
            continue

        # ── 1. Cabeçalho de semana ────────────────────────────
        if re.search(r"semana\s+de\s+\d", txt, re.I):
            semana_str = re.sub(r"\*+", "", txt).strip()
            ativ_atual = None
            continue

        # ── 2. Cabeçalho de categoria (fundo laranja) ─────────
        if tem_fundo_laranja(rt):
            chave = re.sub(r"[\*_:\s]+", " ", txt).strip().lower()
            # tenta encontrar categoria pelo início da string
            cat_nome_display = None
            cat_icone        = None
            for k, (nome_d, icone) in CAT_ICONES.items():
                if chave.startswith(k) or k in chave:
                    cat_nome_display = nome_d
                    cat_icone        = icone
                    break
            if cat_nome_display is None:
                cat_nome_display = re.sub(r"\*+", "", txt).strip().rstrip(":")
                cat_icone        = "📋"

            if cat_nome_display not in cats_dict:
                cats_dict[cat_nome_display] = {
                    "nome":       cat_nome_display,
                    "icone":      cat_icone,
                    "atividades": [],
                }
            cat_atual  = cats_dict[cat_nome_display]
            ativ_atual = None
            continue

        # ── 3. Entrada de dia (Segunda: ...) ──────────────────
        m_dia = re.match(r"\*{0,2}(\w+)\*{0,2}\s*:\s*(.*)", txt)
        if m_dia:
            chave = m_dia.group(1).lower()
            chave_sem_acento = chave.replace("ç","c").replace("ã","a").replace("é","e").replace("ê","e")
            nome_dia = DIAS_MAP.get(chave) or DIAS_MAP.get(chave_sem_acento)
            if nome_dia:
                local = re.sub(r"\*+", "", m_dia.group(2)).strip()
                dias.append({
                    "nome":  nome_dia,
                    "num":   datas.get(nome_dia, "—"),
                    "local": local,
                })
                ativ_atual = None
                continue

        # ── 4. Atividade dentro de categoria ──────────────────
        if cat_atual and ":" in txt and primeiro_eh_negrito(rt):
            idx   = txt.index(":")
            nome  = re.sub(r"\*+", "", txt[:idx]).strip()
            desc  = re.sub(r"\*+", "", txt[idx+1:]).strip()
            status = detectar_status(desc)
            cls, badge = STATUS_BADGE.get(status, ("b-andamento", "● Em andamento"))
            ativ_atual = {"nome": nome, "desc": desc, "cls": cls, "badge": badge}
            cat_atual["atividades"].append(ativ_atual)
            continue

        # ── 5. Continuação de descrição ───────────────────────
        if ativ_atual and cat_atual:
            extra = re.sub(r"\*+", "", txt).strip()
            if extra:
                ativ_atual["desc"] += " " + extra
            continue

    # Ordena categorias conforme ordem definida
    categorias = []
    for nome in ORDEM_CATEGORIAS:
        if nome in cats_dict and cats_dict[nome]["atividades"]:
            categorias.append(cats_dict[nome])
    # Adiciona categorias extras não previstas
    for nome, cat in cats_dict.items():
        if nome not in ORDEM_CATEGORIAS and cat["atividades"]:
            categorias.append(cat)

    return semana_str, dias, categorias

# ── Stats ─────────────────────────────────────────────────────
def calcular_stats(categorias):
    COR = {
        "b-andamento":  ("7C3AED", "Em andamento"),
        "b-aguardando": ("D97706", "Aguardando"),
        "b-pendente":   ("6B7280", "Pendente"),
        "b-aprovado":   ("059669", "Aprovado"),
        "b-agendado":   ("2563EB", "Agendado"),
        "b-revisao":    ("DC2626", "Em revisão"),
        "b-avaliacao":  ("7E22CE", "Em avaliação"),
    }
    totais = {k: 0 for k in COR}
    for cat in categorias:
        for a in cat["atividades"]:
            if a["cls"] in totais:
                totais[a["cls"]] += 1

    html = ""
    for cls, (cor, label) in COR.items():
        if totais[cls] > 0:
            html += f"""
  <div class="stat">
    <div class="stat-dot" style="background:#{cor}"></div>
    <span class="stat-text"><span class="stat-count">{totais[cls]}</span> {label}</span>
  </div>"""
    return html

# ── Helpers de render ─────────────────────────────────────────
def eh_hoje(nome_dia):
    mapa = {"Segunda": 0, "Terça": 1, "Quarta": 2, "Quinta": 3, "Sexta": 4}
    return mapa.get(nome_dia) == datetime.today().weekday()

def chips_dia(local):
    l = local.lower()
    chips = []
    if "jcpm" in l:
        chips.append('<span class="chip chip-jcpm">🏢 JCPM</span>')
    if "home" in l:
        chips.append('<span class="chip chip-home">🏠 Home</span>')
    if "central" in l:
        chips.append('<span class="chip chip-central">🏬 Central</span>')
    return "\n        ".join(chips)

def render_dia(dia):
    hoje  = "today" if eh_hoje(dia["nome"]) else ""
    badge = ('<span class="chip" style="background:#FEF9EE;'
             'color:#C4993B;border:1px solid #C4993B;">Hoje</span>') if hoje else ""
    return f"""    <div class="day-card {hoje}">
      <div class="day-name">{dia['nome']}</div>
      <div class="day-num">{dia['num']}</div>
      <div class="day-location">{dia['local']}</div>
      <div class="chips">
        {chips_dia(dia['local'])}
        {badge}
      </div>
    </div>"""

def render_atividade(a):
    return f"""        <div class="act">
          <div class="act-top">
            <span class="act-name">{a['nome']}</span>
            <span class="badge {a['cls']}">{a['badge']}</span>
          </div>
          <div class="act-desc">{a['desc']}</div>
        </div>"""

def render_categoria(cat):
    n     = len(cat["atividades"])
    ativs = "\n".join(render_atividade(a) for a in cat["atividades"])
    return f"""    <div class="cat-card">
      <div class="cat-header">
        <span class="cat-icon">{cat['icone']}</span>
        <span class="cat-name">{cat['nome']}</span>
        <span class="cat-count">{n} atividade{"s" if n != 1 else ""}</span>
      </div>
      <div class="act-list">
{ativs}
      </div>
    </div>"""

# ── Template HTML ─────────────────────────────────────────────
HTML = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CRM + Central - Prioridades da Semana | JCPM</title>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: #EEF0F4; color: #1F2937; line-height: 1.5;
    }}
    .header {{
      background: linear-gradient(135deg, #0C1C30 0%, #1B3A5C 55%, #23527A 100%);
      color: white; padding: 28px 48px;
      display: flex; justify-content: space-between; align-items: center;
      box-shadow: 0 2px 24px rgba(0,0,0,0.35);
    }}
    .brand {{ display: flex; align-items: center; gap: 14px; }}
    .brand-logo {{
      width: 50px; height: 50px; background: #C4993B; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 900; color: white; letter-spacing: -1px;
    }}
    .brand-text h1 {{ font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }}
    .brand-text p  {{ font-size: 13px; opacity: 0.6; margin-top: 2px; }}
    .header-right  {{ text-align: right; }}
    .updated-at {{ font-size: 11px; opacity: 0.45; margin-top: 4px; }}
    .stats-bar {{
      background: white; border-bottom: 1px solid #E5E7EB;
      padding: 14px 48px; display: flex; gap: 28px; align-items: center; flex-wrap: wrap;
    }}
    .stat {{ display: flex; align-items: center; gap: 7px; }}
    .stat-dot {{ width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }}
    .stat-text {{ font-size: 12px; color: #6B7280; }}
    .stat-count {{ font-weight: 700; color: #1F2937; }}
    .container {{ max-width: 1160px; margin: 0 auto; padding: 32px 24px 56px; }}
    .section-row {{ display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }}
    .section-label {{ font-size: 10px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: #9CA3AF; white-space: nowrap; }}
    .section-line {{ flex: 1; height: 1px; background: #D1D5DB; }}
    .calendar-grid {{ display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 40px; }}
    .day-card {{
      background: white; border-radius: 14px; padding: 18px 16px 16px;
      border-top: 3px solid #CBD5E1; box-shadow: 0 1px 3px rgba(0,0,0,0.06); transition: box-shadow 0.15s;
    }}
    .day-card:hover {{ box-shadow: 0 4px 14px rgba(0,0,0,0.1); }}
    .day-card.today {{ border-top-color: #C4993B; background: linear-gradient(170deg, #FFFBF0 0%, #FFF 45%); }}
    .day-name {{ font-size: 10px; font-weight: 700; letter-spacing: 1.1px; text-transform: uppercase; color: #9CA3AF; }}
    .day-card.today .day-name {{ color: #C4993B; }}
    .day-num {{ font-size: 30px; font-weight: 700; color: #1B3A5C; margin: 3px 0 8px; line-height: 1; }}
    .day-card.today .day-num {{ color: #C4993B; }}
    .day-location {{ font-size: 12px; color: #4B5563; line-height: 1.4; margin-bottom: 10px; }}
    .chips {{ display: flex; flex-wrap: wrap; gap: 4px; }}
    .chip {{ font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 6px; }}
    .chip-jcpm    {{ background: #DBEAFE; color: #1E40AF; }}
    .chip-home    {{ background: #D1FAE5; color: #065F46; }}
    .chip-central {{ background: #FEF3C7; color: #92400E; }}
    .activities-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }}
    .cat-card {{ background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.07); }}
    .cat-header {{
      padding: 15px 20px; display: flex; align-items: center; gap: 10px;
      background: linear-gradient(135deg, #1B3A5C 0%, #2A537E 100%); color: white;
    }}
    .cat-icon {{ font-size: 18px; }}
    .cat-name {{ font-size: 14px; font-weight: 700; flex: 1; }}
    .cat-count {{ background: rgba(255,255,255,0.18); padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }}
    .act-list  {{ padding: 4px 0; }}
    .act {{ padding: 13px 20px; border-bottom: 1px solid #F3F4F6; }}
    .act:last-child {{ border-bottom: none; }}
    .act-top {{ display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 5px; }}
    .act-name {{ font-size: 13px; font-weight: 600; color: #111827; flex: 1; line-height: 1.3; }}
    .badge {{
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 100px;
      white-space: nowrap; flex-shrink: 0; letter-spacing: 0.2px;
    }}
    .b-aprovado   {{ background: #D1FAE5; color: #065F46; }}
    .b-agendado   {{ background: #DBEAFE; color: #1E40AF; }}
    .b-andamento  {{ background: #EDE9FE; color: #5B21B6; }}
    .b-aguardando {{ background: #FEF3C7; color: #92400E; }}
    .b-revisao    {{ background: #FEE2E2; color: #991B1B; }}
    .b-pendente   {{ background: #F3F4F6; color: #4B5563; }}
    .b-avaliacao  {{ background: #FDF4FF; color: #7E22CE; }}
    .act-desc {{ font-size: 12px; color: #6B7280; line-height: 1.5; }}
    .footer {{ text-align: center; padding: 22px 48px; border-top: 1px solid #E5E7EB; background: white; margin-top: 8px; }}
    .footer p {{ font-size: 11px; color: #B0B7C3; }}
    .footer a {{ color: #1B3A5C; text-decoration: none; }}
    @media print {{
      body {{ background: white; }}
      .header, .cat-header, .badge, .chip {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
      .stats-bar {{ display: none; }}
    }}
    @media (max-width: 900px) {{
      .header {{ padding: 20px 24px; flex-direction: column; gap: 14px; text-align: center; }}
      .calendar-grid {{ grid-template-columns: repeat(3, 1fr); }}
      .activities-grid {{ grid-template-columns: 1fr; }}
    }}
  </style>
</head>
<body>

<div class="header">
  <div class="brand">
    <div class="brand-logo">JC</div>
    <div class="brand-text">
      <h1>{semana_titulo}</h1>
      <p>CRM + Central — Prioridades da Semana</p>
    </div>
  </div>
  <div class="header-right">
    <div class="updated-at">Atualizado em {atualizado_em}</div>
  </div>
</div>

<div class="stats-bar">
{stats_html}
</div>

<div class="container">
  <div class="section-row">
    <span class="section-label">📍 Agenda da semana</span>
    <div class="section-line"></div>
  </div>
  <div class="calendar-grid">
{dias_html}
  </div>

  <div class="section-row">
    <span class="section-label">📋 Atividades e status</span>
    <div class="section-line"></div>
  </div>
  <div class="activities-grid">
{cats_html}
  </div>
</div>

<div class="footer">
  <p>Gerado automaticamente a partir da
    <a href="https://www.notion.so/3569d5bf2aa480fe98ebdd2ecd405957" target="_blank">
    Programação da Semana no Notion</a>
    · JCPM Shoppings</p>
</div>

</body>
</html>"""


def gerar_html(semana_str, dias, categorias):
    hoje  = datetime.today()
    seg   = hoje - timedelta(days=hoje.weekday())
    sex   = seg + timedelta(4)
    meses = ["","janeiro","fevereiro","março","abril","maio","junho",
             "julho","agosto","setembro","outubro","novembro","dezembro"]

    titulo = semana_str if semana_str else (
        f"Semana de {seg.day} a {sex.day} / {meses[sex.month]} / {sex.year}"
    )
    return HTML.format(
        semana_titulo = titulo,
        atualizado_em = hoje.strftime("%d/%m/%Y às %H:%M"),
        stats_html    = calcular_stats(categorias),
        dias_html     = "\n".join(render_dia(d) for d in dias),
        cats_html     = "\n".join(render_categoria(c) for c in categorias),
    )

# ── Enviar e-mail ─────────────────────────────────────────────
def enviar_email(cfg_email, html_content):
    hoje = datetime.today()
    seg  = hoje - timedelta(days=hoje.weekday())
    sex  = seg + timedelta(4)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"📋 Prioridades da Semana {seg.day}/{seg.month:02d} a {sex.day}/{sex.month:02d} — JCPM"
    msg["From"]    = f"{cfg_email['remetente_nome']} <{cfg_email['usuario']}>"
    msg["To"]      = ", ".join(cfg_email["destinatarios"])

    msg.attach(MIMEText("Programação da Semana — JCPM", "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    with smtplib.SMTP(cfg_email["smtp_server"], cfg_email["smtp_port"]) as srv:
        srv.ehlo()
        srv.starttls()
        srv.login(cfg_email["usuario"], cfg_email["senha"])
        srv.sendmail(cfg_email["usuario"], cfg_email["destinatarios"], msg.as_bytes())

    print(f"  ✅ E-mail enviado para: {', '.join(cfg_email['destinatarios'])}")

# ── Main ──────────────────────────────────────────────────────
def main():
    print(f"[{datetime.now().strftime('%d/%m/%Y %H:%M')}] Iniciando atualização...")

    cfg    = carregar_config()
    notion = notion_client(cfg["notion"]["token"])

    # 1. Buscar e parsear a página de texto corrido
    print("  → Lendo página do Notion...")
    blocks = buscar_blocos(notion)
    semana_str, dias, categorias = parsear_pagina(blocks)
    total = sum(len(c["atividades"]) for c in categorias)
    print(f"     Semana: {semana_str or '(datas automáticas)'}")
    print(f"     {len(dias)} dias · {total} atividades em {len(categorias)} categorias")

    # 2. Gerar HTML
    print("  → Gerando index.html...")
    html = gerar_html(semana_str, dias, categorias)
    OUTPUT_HTML.write_text(html, encoding="utf-8")
    print(f"     Salvo em: {OUTPUT_HTML}")

    # 3. Enviar e-mail
    print("  → Enviando e-mail...")
    enviar_email(cfg["email"], html)

    print("✅ Concluído!")

if __name__ == "__main__":
    main()
