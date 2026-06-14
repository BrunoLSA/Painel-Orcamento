// =========================================================================
// Painel Orcamentario COMGAP — logica do frontend
// Busca os dados da API e renderiza todas as secoes do painel.
// =========================================================================

// ----- Formatadores ------------------------------------------------------
const fmtBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const fmtBRLcent = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

// Formata valores grandes de forma compacta (ex.: R$ 1,2 mi) para os cards.
function fmtCompacto(v) {
  const abs = Math.abs(v);
  if (abs >= 1e9) return "R$ " + (v / 1e9).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + " bi";
  if (abs >= 1e6) return "R$ " + (v / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + " mi";
  if (abs >= 1e3) return "R$ " + (v / 1e3).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mil";
  return fmtBRL.format(v);
}

const pct = (parte, total) => (total > 0 ? (parte / total) * 100 : 0);
const fmtPct = (v) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%";

// ----- Elementos ---------------------------------------------------------
const el = (id) => document.getElementById(id);

// ----- Carregamento ------------------------------------------------------
async function carregar() {
  el("loading").hidden = false;
  el("error").hidden = true;
  el("dashboard").hidden = true;

  try {
    // Caminho relativo: funciona tanto no GitHub Pages (data.json estatico)
    // quanto no servidor local (Express serve a pasta docs/).
    const resp = await fetch("./data.json", { cache: "no-store" });
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    const dados = await resp.json();
    renderizar(dados);
    el("loading").hidden = true;
    el("dashboard").hidden = false;
  } catch (e) {
    console.error(e);
    el("loading").hidden = true;
    el("error").hidden = false;
  }
}

// ----- Renderizacao principal -------------------------------------------
function renderizar(d) {
  const r = d.resumo;

  // Cabecalho
  el("subtitle").textContent = d.orgaoNome || d.orgao;
  el("footerExercicio").textContent = d.exercicio;
  const dt = new Date(d.atualizadoEm);
  el("updated").textContent =
    "Atualizado em " +
    dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " as " +
    dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  renderResumo(r);
  renderExecucao(r);
  renderAcoes(d.acoesOrcamentarias);
  renderDiref(d.creditoDirefDetalhes);
  renderUGE(d.creditoUGE);
  renderRAP(d.restosAPagar);
}

// ----- Cards de resumo ---------------------------------------------------
function renderResumo(r) {
  const cards = [
    { lbl: "Dotacao " + "do exercicio", val: r.dotacao, cls: "card--destaque card--verde", sub: "Limite orcamentario total" },
    { lbl: "Recebido", val: r.recebido, cls: "card--azul", sub: "Credito descentralizado" },
    { lbl: "Empenhado", val: r.empenhado, cls: "card--verde", sub: fmtPct(pct(r.empenhado, r.recebido)) + " do recebido" },
    { lbl: "Liquidado", val: r.liquidado, cls: "card--amarelo", sub: fmtPct(pct(r.liquidado, r.empenhado)) + " do empenhado" },
    { lbl: "Pago", val: r.pago, cls: "card--roxo", sub: fmtPct(pct(r.pago, r.liquidado)) + " do liquidado" },
    { lbl: "Cred. Disp. DIREF", val: r.creditoDisponivelDiref, cls: "card--azul", sub: "Por AO / ND" },
    { lbl: "Cred. Disp. UGE", val: r.creditoDisponivelUGE, cls: "card--verde", sub: "Nas Unidades Gestoras" },
    { lbl: "Restos a Pagar", val: r.rapAPagar, cls: "card--vermelho", sub: "Saldo a pagar (RP)" },
  ];

  el("resumoCards").innerHTML = cards
    .map(
      (c) => `
      <div class="card ${c.cls}">
        <div class="card__label">${c.lbl}</div>
        <div class="card__value" title="${fmtBRLcent.format(c.val)}">${fmtCompacto(c.val)}</div>
        <div class="card__sub">${c.sub}</div>
      </div>`
    )
    .join("");
}

// ----- Barras de execucao da despesa ------------------------------------
function renderExecucao(r) {
  // Cada etapa e comparada a dotacao para visao do funil de execucao.
  const base = r.dotacao;
  const linhas = [
    { lbl: "Recebido", val: r.recebido, cls: "recebido" },
    { lbl: "Empenhado", val: r.empenhado, cls: "empenhado" },
    { lbl: "Liquidado", val: r.liquidado, cls: "liquidado" },
    { lbl: "Pago", val: r.pago, cls: "pago" },
  ];

  el("execucaoPanel").innerHTML =
    '<div class="exec">' +
    linhas
      .map((l) => {
        const p = pct(l.val, base);
        return `
        <div class="exec__row">
          <div class="exec__head">
            <span class="exec__label">${l.lbl}<span class="exec__pct">${fmtPct(p)} da dotacao</span></span>
            <span class="exec__val">${fmtCompacto(l.val)}</span>
          </div>
          <div class="bar"><div class="bar__fill bar__fill--${l.cls}" style="width:${Math.min(p, 100)}%"></div></div>
        </div>`;
      })
      .join("") +
    "</div>";
}

// ----- Dotacao por Acao Orcamentaria (accordion) ------------------------
function renderAcoes(acoes) {
  const ordenadas = [...acoes].sort((a, b) => b.dotacao - a.dotacao);

  el("aoPanel").innerHTML = ordenadas
    .map((a, i) => {
      const minis = [
        { l: "Recebido", v: a.recebido },
        { l: "Empenhado", v: a.empenhado },
        { l: "Liquidado", v: a.liquidado },
        { l: "Pago", v: a.pago },
        { l: "A empenhar", v: a.recebido - a.empenhado },
        { l: "Execucao", v: null, txt: fmtPct(pct(a.empenhado, a.dotacao)) + " empenhado" },
      ];
      return `
      <div class="ao-item" data-idx="${i}">
        <button class="ao-item__head" aria-expanded="false">
          <span class="ao-item__code">${a.codigo}</span>
          <span class="ao-item__info">
            <span class="ao-item__name">${a.nome}</span>
            <span class="ao-item__dotacao">Dotacao: <b>${fmtBRL.format(a.dotacao)}</b></span>
          </span>
          <span class="ao-item__chevron">&#9656;</span>
        </button>
        <div class="ao-item__body">
          <div class="ao-mini">
            ${minis
              .map(
                (m) => `
              <div class="ao-mini__cell">
                <div class="ao-mini__lbl">${m.l}</div>
                <div class="ao-mini__val">${m.txt ? m.txt : fmtBRL.format(m.v)}</div>
              </div>`
              )
              .join("")}
          </div>
        </div>
      </div>`;
    })
    .join("");

  // Comportamento accordion
  el("aoPanel")
    .querySelectorAll(".ao-item__head")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = btn.closest(".ao-item");
        const open = item.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
}

// ----- Credito disponivel DIREF (tabela) --------------------------------
function renderDiref(itens) {
  const total = itens.reduce((a, x) => a + x.disponivel, 0);
  const linhas = itens
    .map(
      (x) => `
      <tr>
        <td><span class="tag">${x.ao}</span></td>
        <td>${x.nd}<br><small style="color:var(--texto-fraco)">${x.ndNome}</small></td>
        <td>${x.fonte}</td>
        <td class="num">${fmtBRL.format(x.disponivel)}</td>
      </tr>`
    )
    .join("");

  el("direfPanel").innerHTML = `
    <div class="tbl-wrap">
      <table class="tbl">
        <thead>
          <tr><th>AO</th><th>Natureza de Despesa</th><th>Fonte</th><th class="num">Disponivel</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
        <tfoot>
          <tr class="tfoot-total"><td colspan="3">Total disponivel DIREF</td><td class="num">${fmtBRL.format(total)}</td></tr>
        </tfoot>
      </table>
    </div>`;
}

// ----- Credito disponivel UGE (cards) -----------------------------------
function renderUGE(uges) {
  const ordenadas = [...uges].sort((a, b) => b.disponivel - a.disponivel);
  el("ugePanel").innerHTML =
    '<div class="uge-list">' +
    ordenadas
      .map(
        (u) => `
      <div class="uge-card">
        <div class="uge-card__top">
          <span class="uge-card__sigla">${u.sigla}</span>
          <span class="uge-card__cod">UG ${u.codigo}</span>
        </div>
        <div class="uge-card__nome">${u.nome}</div>
        <div class="uge-card__disp-lbl">Credito disponivel</div>
        <div class="uge-card__disp">${fmtBRL.format(u.disponivel)}</div>
        <div class="uge-card__meta">
          <span>Recebido: <b>${fmtCompacto(u.recebido)}</b></span>
          <span>Empenhado: <b>${fmtCompacto(u.empenhado)}</b></span>
        </div>
      </div>`
      )
      .join("") +
    "</div>";
}

// ----- Restos a Pagar ----------------------------------------------------
function renderRAP(itens) {
  el("rapPanel").innerHTML =
    '<div class="rap">' +
    itens
      .map((r) => {
        const aPagar = (r.inscrito || 0) - (r.cancelado || 0) - (r.pago || 0);
        const cells = [
          { l: "Inscrito", v: r.inscrito },
          { l: "Cancelado", v: r.cancelado },
        ];
        if (r.liquidado !== undefined) cells.push({ l: "Liquidado", v: r.liquidado });
        cells.push({ l: "Pago", v: r.pago });
        cells.push({ l: "A pagar", v: aPagar, apagar: true });

        return `
        <div class="rap-card">
          <div class="rap-card__head">
            <span class="rap-card__sigla">${r.sigla}</span>
            <span class="rap-card__tipo">${r.tipo}</span>
          </div>
          <div class="rap-grid">
            ${cells
              .map(
                (c) => `
              <div class="rap-grid__cell">
                <div class="rap-grid__lbl">${c.l}</div>
                <div class="rap-grid__val ${c.apagar ? "rap-grid__val--apagar" : ""}">${fmtBRL.format(c.v)}</div>
              </div>`
              )
              .join("")}
          </div>
        </div>`;
      })
      .join("") +
    "</div>";
}

// ----- Eventos -----------------------------------------------------------
el("reloadBtn").addEventListener("click", (e) => {
  e.currentTarget.classList.add("spin");
  setTimeout(() => e.currentTarget.classList.remove("spin"), 600);
  carregar();
});
el("retryBtn").addEventListener("click", carregar);

// Inicializa
carregar();
