// =========================================================================
// Painel Orcamentario DIRMAB — logica do frontend
// Busca o dataset, permite filtrar por exercicio (ano) e por Acao Orcamentaria
// (na secao Credito) e recalcula/renderiza todas as secoes no cliente.
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
const soma = (arr, campo) => arr.reduce((a, x) => a + (x[campo] || 0), 0);

const el = (id) => document.getElementById(id);

// ----- Estado ------------------------------------------------------------
const TODAS = "TODAS"; // usado pelo filtro de AO (chip "Todas")
let DATASET = null;
let anoAtivo = null;

// Filtros de Acao Orcamentaria (multisselecao). Conjunto vazio = todas as AO.
let aoCreditoSel = new Set(); // secao Credito
let aoGeralSel = new Set(); // secao Visao Geral
let creditoDirefCache = [];
let creditoUGRCache = [];
let geralCache = null;
let aoNomesCache = new Map();

// ----- Carregamento ------------------------------------------------------
async function carregar() {
  el("loading").hidden = false;
  el("error").hidden = true;
  el("dashboard").hidden = true;
  el("filtros").hidden = true;

  try {
    // Caminho relativo: funciona tanto no GitHub Pages (data.json estatico)
    // quanto no servidor local (Express serve a pasta docs/).
    const resp = await fetch("./data.json", { cache: "no-store" });
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    DATASET = await resp.json();

    renderCabecalho(DATASET);
    construirSeletorAno(DATASET);
    atualizar();

    el("loading").hidden = true;
    el("filtros").hidden = false;
    el("dashboard").hidden = false;
    ajustarTopbar();
  } catch (e) {
    console.error(e);
    el("loading").hidden = true;
    el("error").hidden = false;
  }
}

// Mede a altura da barra superior fixa e expoe em --topbar-h, para que o
// menu lateral (no desktop) fique fixo logo abaixo dela, sem rolar.
function ajustarTopbar() {
  const tb = document.querySelector(".topbar");
  if (tb) document.documentElement.style.setProperty("--topbar-h", tb.offsetHeight + "px");
}
window.addEventListener("resize", ajustarTopbar);

// ----- Cabecalho ---------------------------------------------------------
function renderCabecalho(d) {
  el("subtitle").textContent = d.orgaoNome || d.orgao;
  const dt = new Date(d.atualizadoEm);
  el("updated").textContent =
    "Atualizado em " +
    dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " às " +
    dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ----- Seletor de exercicio (ano) ---------------------------------------
function construirSeletorAno(d) {
  const anos =
    d.exercicios && d.exercicios.length
      ? [...d.exercicios]
      : [...new Set(d.execucao.map((e) => e.exercicio))];
  anos.sort((a, b) => b - a);

  // Mantem o ano atual se ainda existir; senao usa o padrao (mais recente).
  anoAtivo = anos.includes(anoAtivo) ? anoAtivo : d.exercicioPadrao || anos[0];

  const sel = el("anoSelect");
  sel.innerHTML = anos.map((a) => `<option value="${a}">${a}</option>`).join("");
  sel.value = String(anoAtivo);
  sel.onchange = () => {
    anoAtivo = Number(sel.value);
    atualizar();
  };
}

// Recalcula contexto, rodape e todas as secoes para o exercicio ativo.
function atualizar() {
  el("footerExercicio").textContent = anoAtivo;
  el("filtroContexto").textContent = `${DATASET.orgaoNome || DATASET.orgao} · Exercício ${anoAtivo}`;
  renderTudo(filtrarDataset(anoAtivo));
}

// Devolve o dataset com cada lista filtrada pelo exercicio.
function filtrarDataset(an) {
  const f = (arr) => arr.filter((x) => x.exercicio === an);
  return {
    execucao: f(DATASET.execucao),
    creditoDiref: f(DATASET.creditoDiref),
    creditoUGR: f(DATASET.creditoUGR),
    restosAPagar: f(DATASET.restosAPagar),
    restosAPagarUGR: f(DATASET.restosAPagarUGR || []),
  };
}

// ----- Renderizacao ------------------------------------------------------
function renderTudo(d) {
  const resumo = calcularResumo(d);
  const acoes = agregarAcoes(d.execucao);
  const rap = agregarRAP(d.restosAPagar);

  // Nomes das AOs (para rotular o credito DIREF, que so traz o codigo).
  aoNomesCache = new Map(d.execucao.map((e) => [e.ao, e.aoNome]));

  // Visao Geral: guarda o recorte do exercicio e aplica o filtro local de AO.
  geralCache = d;
  construirChipsAOgeral();
  renderVisaoGeral();

  renderExecucao(resumo);
  renderChartAO(acoes); // Execucao: barras de dotacao por AO
  renderAcoes(acoes);

  // Credito Disponivel: guarda o recorte atual (do exercicio) e aplica o
  // filtro local de AO ao renderizar a secao.
  creditoDirefCache = d.creditoDiref;
  creditoUGRCache = d.creditoUGR;
  construirChipsAO();
  renderCreditoSecao();

  renderChartRAP(rap); // RAP: barras empilhadas
  renderRAP(rap);
  renderRapPorAO(d.restosAPagarUGR, aoNomesCache); // RAP por AO (tabela)
  renderRapPorUGR(d.restosAPagarUGR, aoNomesCache); // RAP por UGR + rosca de AO
}

// Helper generico: monta chips de AO (multisselecao) num container.
function montarChipsAO(containerId, aos, sel, onChange) {
  for (const a of [...sel]) if (!aos.includes(a)) sel.delete(a); // limpa AOs ausentes
  el(containerId).innerHTML =
    `<button class="chip" data-ao="${TODAS}" title="Todas as Ações Orçamentárias">Todas</button>` +
    aos
      .map((a) => `<button class="chip" data-ao="${a}" title="${a} · ${aoNomesCache.get(a) || ""}">${a}</button>`)
      .join("");
  el(containerId)
    .querySelectorAll(".chip")
    .forEach((btn) =>
      btn.addEventListener("click", () => {
        const ao = btn.dataset.ao;
        if (ao === TODAS) sel.clear();
        else if (sel.has(ao)) sel.delete(ao);
        else sel.add(ao);
        onChange();
      })
    );
}

// Helper generico: pinta o estado ativo dos chips de AO de um container.
function pintarChipsAO(containerId, sel) {
  el(containerId)
    .querySelectorAll(".chip")
    .forEach((btn) => {
      const ao = btn.dataset.ao;
      const ativo = ao === TODAS ? sel.size === 0 : sel.has(ao);
      btn.classList.toggle("chip--ativo", ativo);
      btn.setAttribute("aria-pressed", ativo ? "true" : "false");
    });
}

// ----- Visao Geral (com filtro proprio de AO) ----------------------------
function construirChipsAOgeral() {
  const d = geralCache;
  const aos = [
    ...new Set(
      [...d.execucao, ...d.creditoDiref, ...d.creditoUGR, ...(d.restosAPagarUGR || [])].map((x) => x.ao).filter(Boolean)
    ),
  ].sort();
  montarChipsAO("aoGeralChips", aos, aoGeralSel, renderVisaoGeral);
}

function renderVisaoGeral() {
  pintarChipsAO("aoGeralChips", aoGeralSel);
  const d = geralCache;
  const filtra = (arr) => (aoGeralSel.size === 0 ? arr : (arr || []).filter((x) => aoGeralSel.has(x.ao)));
  const resumo = calcularResumo({
    execucao: filtra(d.execucao),
    creditoDiref: filtra(d.creditoDiref),
    creditoUGR: filtra(d.creditoUGR),
    restosAPagar: d.restosAPagar,
    restosAPagarUGR: filtra(d.restosAPagarUGR),
  });
  renderResumo(resumo);
  renderChartExecucao(resumo); // duas roscas de execucao
}

// Monta os chips de Acao Orcamentaria (multisselecao) da secao Credito.
function construirChipsAO() {
  const aos = [...new Set([...creditoDirefCache, ...creditoUGRCache].map((x) => x.ao).filter(Boolean))].sort();
  montarChipsAO("aoCreditoChips", aos, aoCreditoSel, renderCreditoSecao);
}

// Renderiza a secao Credito aplicando o filtro local de AO (uma ou varias).
function renderCreditoSecao() {
  pintarChipsAO("aoCreditoChips", aoCreditoSel);
  const filtra = (arr) => (aoCreditoSel.size === 0 ? arr : arr.filter((x) => aoCreditoSel.has(x.ao)));
  const diref = filtra(creditoDirefCache);
  const ugr = filtra(creditoUGRCache);

  // Grafico do topo: rosca de ND quando ha exatamente uma AO; senao, por AO.
  if (aoCreditoSel.size === 1) {
    const ao = [...aoCreditoSel][0];
    const nome = aoNomesCache.get(ao) || "";
    el("chartCreditoAO").innerHTML = diref.length
      ? `<div class="grafico-bloco"><p class="grafico-bloco__tit">${ao} · ${nome} — por Natureza de Despesa</p>${ndDonutHTML(diref)}</div>`
      : vazioGraf("Sem crédito DIREF para esta AO.");
  } else {
    renderChartCreditoAO(diref, aoNomesCache);
  }
  renderDiref(diref, aoNomesCache);
  renderChartUGR(ugr);
  renderUGR(ugr, aoNomesCache);
}

// Liga o comportamento de acordeao (expandir/recolher) num container.
function ativarAccordion(container) {
  container.querySelectorAll(".ao-item__head").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".ao-item");
      const open = item.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
}

// Consolida os totais a partir das listas ja filtradas.
function calcularResumo(d) {
  const dotacao = soma(d.execucao, "dotacao");
  const recebido = soma(d.execucao, "recebido");
  const empenhado = soma(d.execucao, "empenhado");
  const liquidado = soma(d.execucao, "liquidado");
  const pago = soma(d.execucao, "pago");
  // Saldo a pagar (RAP): usa o detalhamento por UGR (com AO) quando disponivel,
  // permitindo filtrar por AO; senao, soma o RAP por tipo.
  const rapAPagar =
    d.restosAPagarUGR && d.restosAPagarUGR.length
      ? soma(d.restosAPagarUGR, "aPagar")
      : (d.restosAPagar || []).reduce((a, r) => a + ((r.inscrito || 0) - (r.cancelado || 0) - (r.pago || 0)), 0);
  return {
    dotacao,
    recebido,
    empenhado,
    liquidado,
    pago,
    cambio: soma(d.execucao, "cambio"),
    creditoDisponivelDiref: soma(d.creditoDiref, "disponivel"),
    creditoDisponivelUGR: soma(d.creditoUGR, "disponivel"),
    rapAPagar,
  };
}

// Agrega a execucao por Acao Orcamentaria (somando as linhas do exercicio).
function agregarAcoes(execucao) {
  const mapa = new Map();
  for (const e of execucao) {
    let ao = mapa.get(e.ao);
    if (!ao) {
      ao = { codigo: e.ao, nome: e.aoNome, dotacao: 0, recebido: 0, empenhado: 0, liquidado: 0, pago: 0 };
      mapa.set(e.ao, ao);
    }
    ao.dotacao += e.dotacao || 0;
    ao.recebido += e.recebido || 0;
    ao.empenhado += e.empenhado || 0;
    ao.liquidado += e.liquidado || 0;
    ao.pago += e.pago || 0;
  }
  return [...mapa.values()].sort((a, b) => b.dotacao - a.dotacao);
}

// Agrega Restos a Pagar por tipo (somando as linhas do exercicio).
function agregarRAP(rap) {
  const ordem = ["Processados", "Não Processados"];
  const mapa = new Map();
  for (const r of rap) {
    let t = mapa.get(r.tipo);
    if (!t) {
      t = { tipo: r.tipo, sigla: r.sigla, inscrito: 0, cancelado: 0, liquidado: 0, pago: 0, temLiquidado: false };
      mapa.set(r.tipo, t);
    }
    t.inscrito += r.inscrito || 0;
    t.cancelado += r.cancelado || 0;
    t.pago += r.pago || 0;
    if (r.liquidado !== undefined) {
      t.liquidado += r.liquidado || 0;
      t.temLiquidado = true;
    }
  }
  return [...mapa.values()].sort((a, b) => ordem.indexOf(a.tipo) - ordem.indexOf(b.tipo));
}

// ----- Cards de resumo ---------------------------------------------------
function renderResumo(r) {
  const cards = [
    { lbl: "Dotação do exercício", val: r.dotacao, cls: "card--destaque card--verde", sub: "Limite orçamentário total" },
    { lbl: "Recebido", val: r.recebido, cls: "card--azul", sub: "Crédito descentralizado" },
    { lbl: "Empenhado", val: r.empenhado, cls: "card--verde", sub: fmtPct(pct(r.empenhado, r.recebido)) + " do recebido" },
    { lbl: "Liquidado", val: r.liquidado, cls: "card--amarelo", sub: fmtPct(pct(r.liquidado, r.empenhado)) + " do empenhado" },
    { lbl: "Pago", val: r.pago, cls: "card--roxo", sub: fmtPct(pct(r.pago, r.liquidado)) + " do liquidado" },
    { lbl: "Créd. Disp. DIREF", val: r.creditoDisponivelDiref, cls: "card--azul", sub: "Por AO / ND" },
    { lbl: "Câmbio", val: r.cambio, cls: "card--amarelo", sub: "Recursos em câmbio (moeda)" },
    { lbl: "Créd. Disp. UGR", val: r.creditoDisponivelUGR, cls: "card--verde", sub: "Unidades Gestoras Resp." },
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
        // Recebido: so % da dotacao. Demais etapas: % da dotacao e % do recebido.
        const detalhe =
          l.cls === "recebido"
            ? `${fmtPct(p)} da dotação`
            : `${fmtPct(p)} da dotação · ${fmtPct(pct(l.val, r.recebido))} do recebido`;
        return `
        <div class="exec__row">
          <div class="exec__head">
            <span class="exec__label">${l.lbl}<span class="exec__pct">${detalhe}</span></span>
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
  if (!acoes.length) {
    el("aoPanel").innerHTML = '<div class="vazio">Sem dados para este exercício.</div>';
    return;
  }
  el("aoPanel").innerHTML = acoes
    .map((a) => {
      const minis = [
        { l: "Recebido", v: a.recebido },
        { l: "Empenhado", v: a.empenhado },
        { l: "Liquidado", v: a.liquidado },
        { l: "Pago", v: a.pago },
        { l: "A empenhar", v: a.recebido - a.empenhado },
        { l: "Execução", txt: fmtPct(pct(a.empenhado, a.dotacao)) + " empenhado" },
      ];
      // Rosca de execucao da AO (Recebido/Empenhado/Liquidado/Pago da dotacao).
      const donut = blocoAneis(
        "Execução",
        a.dotacao,
        [
          { lbl: "Recebido", val: a.recebido, cor: "#2563eb", raio: 70 },
          { lbl: "Empenhado", val: a.empenhado, cor: "#1f8a64", raio: 56 },
          { lbl: "Liquidado", val: a.liquidado, cor: "#d97706", raio: 42 },
          { lbl: "Pago", val: a.pago, cor: "#7c3aed", raio: 28 },
        ],
        "recebido"
      );
      return `
      <div class="ao-item">
        <button class="ao-item__head" aria-expanded="false">
          <span class="ao-item__code">${a.codigo}</span>
          <span class="ao-item__info">
            <span class="ao-item__name">${a.nome}</span>
            <span class="ao-item__dotacao">Dotação: <b>${fmtBRL.format(a.dotacao)}</b></span>
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
          ${donut}
        </div>
      </div>`;
    })
    .join("");

  ativarAccordion(el("aoPanel"));
}

// Agrupa registros por uma chave e soma o "disponivel"; preserva as linhas
// originais para o detalhamento por ND.
function agruparPor(itens, chaveFn, valorFn) {
  const mapa = new Map();
  for (const x of itens) {
    const k = chaveFn(x);
    let g = mapa.get(k);
    if (!g) {
      g = { chave: k, total: 0, linhas: [] };
      mapa.set(k, g);
    }
    g.total += (valorFn ? valorFn(x) : x.disponivel) || 0;
    g.linhas.push(x);
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total);
}

// ----- Credito disponivel DIREF (linhas por AO, expandem ND) -------------
function renderDiref(itens, aoNomes) {
  if (!itens.length) {
    el("direfPanel").innerHTML = vazioGraf("Sem crédito DIREF para este filtro.");
    return;
  }
  const grupos = agruparPor(itens, (x) => x.ao);
  el("direfPanel").innerHTML = grupos
    .map(
      (g) => `
      <div class="ao-item">
        <button class="ao-item__head" aria-expanded="false">
          <span class="ao-item__code">${g.chave}</span>
          <span class="ao-item__info">
            <span class="ao-item__name">${(aoNomes && aoNomes.get(g.chave)) || "Ação Orçamentária"}</span>
            <span class="ao-item__dotacao">Disponível: <b>${fmtBRL.format(g.total)}</b></span>
          </span>
          <span class="ao-item__chevron">&#9656;</span>
        </button>
        <div class="ao-item__body">${ndDonutHTML(g.linhas)}</div>
      </div>`
    )
    .join("");
  ativarAccordion(el("direfPanel"));
}

// ----- Credito disponivel UGR (linhas por UGR, expandem por AO) -----------
function renderUGR(ugrs, aoNomes) {
  if (!ugrs.length) {
    el("ugrPanel").innerHTML = vazioGraf("Sem UGR para este filtro.");
    return;
  }
  const grupos = agruparPor(ugrs, (x) => x.sigla);
  el("ugrPanel").innerHTML = grupos
    .map((g) => {
      const u = g.linhas[0];
      return `
      <div class="ao-item">
        <button class="ao-item__head" aria-expanded="false">
          <span class="ao-item__code">${u.sigla}</span>
          <span class="ao-item__info">
            <span class="ao-item__name">${u.nome}</span>
            <span class="ao-item__dotacao">Disponível: <b>${fmtBRL.format(g.total)}</b></span>
          </span>
          <span class="ao-item__chevron">&#9656;</span>
        </button>
        <div class="ao-item__body">${aoDonutHTML(g.linhas, aoNomes)}</div>
      </div>`;
    })
    .join("");
  ativarAccordion(el("ugrPanel"));
}

// ----- Restos a Pagar ----------------------------------------------------
function renderRAP(itens) {
  if (!itens.length) {
    el("rapPanel").innerHTML = '<div class="vazio">Sem dados para este exercício.</div>';
    return;
  }
  el("rapPanel").innerHTML =
    '<div class="rap">' +
    itens
      .map((r) => {
        const aPagar = r.inscrito - r.cancelado - r.pago;
        const cells = [
          { l: "Inscrito", v: r.inscrito },
          { l: "Cancelado", v: r.cancelado },
        ];
        if (r.temLiquidado) cells.push({ l: "Liquidado", v: r.liquidado });
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

// ----- Restos a Pagar por AO (tabela de barras) --------------------------
function renderRapPorAO(itens, aoNomes) {
  itens = itens || [];
  if (!itens.length) {
    el("chartRapAO").innerHTML = vazioGraf("Sem Restos a Pagar para este filtro.");
    return;
  }
  const grupos = agruparPor(itens, (x) => x.ao, (x) => x.aPagar);
  const barras = grupos.map((g) => ({
    label: `${g.chave} · ${(aoNomes && aoNomes.get(g.chave)) || ""}`.replace(/ · $/, ""),
    value: g.total,
  }));
  el("chartRapAO").innerHTML = barrasHoriz(barras, { cor: "#b91c1c" });
}

// ----- Restos a Pagar por UGR (linhas por UGR, expandem por AO) -----------
function renderRapPorUGR(itens, aoNomes) {
  itens = itens || [];
  if (!itens.length) {
    el("rapUgrPanel").innerHTML = vazioGraf("Sem Restos a Pagar por UGR para este filtro.");
    return;
  }
  const grupos = agruparPor(itens, (x) => x.sigla, (x) => x.aPagar);
  el("rapUgrPanel").innerHTML = grupos
    .map((g) => {
      const u = g.linhas[0];
      return `
      <div class="ao-item">
        <button class="ao-item__head" aria-expanded="false">
          <span class="ao-item__code">${u.sigla}</span>
          <span class="ao-item__info">
            <span class="ao-item__name">${u.nome}</span>
            <span class="ao-item__dotacao">A pagar: <b>${fmtBRL.format(g.total)}</b></span>
          </span>
          <span class="ao-item__chevron">&#9656;</span>
        </button>
        <div class="ao-item__body">${donutPorAO(g.linhas, aoNomes, (x) => x.aPagar, "a pagar")}</div>
      </div>`;
    })
    .join("");
  ativarAccordion(el("rapUgrPanel"));
}

// =========================================================================
// Graficos (SVG/CSS puro, sem dependencias) — respeitam os filtros ativos
// =========================================================================
const CORES_GRAF = ["#1f8a64", "#2563eb", "#d97706", "#7c3aed", "#0ea5a4", "#b91c1c", "#0b3d2e", "#9333ea"];
const vazioGraf = (msg) => `<div class="vazio">${msg || "Sem dados para este filtro."}</div>`;

// Rosca (donut) generica a partir de segmentos [{label, value, color}].
function svgDonut(segmentos, { size = 168, thickness = 24, centroValor = "", centroLabel = "" } = {}) {
  const total = segmentos.reduce((a, s) => a + (s.value || 0), 0);
  if (total <= 0) return null;
  const r = size / 2 - thickness / 2 - 2;
  const c = size / 2;
  let acc = 0;
  const arcos = segmentos
    .filter((s) => s.value > 0)
    .map((s) => {
      const pct = (s.value / total) * 100;
      const el = `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${thickness}" pathLength="100" stroke-dasharray="${pct} ${100 - pct}" stroke-dashoffset="${-acc}" transform="rotate(-90 ${c} ${c})"/>`;
      acc += pct;
      return el;
    })
    .join("");
  return `<svg class="donut" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img">
      <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#edf2f0" stroke-width="${thickness}"/>
      ${arcos}
      <text x="${c}" y="${c - 2}" text-anchor="middle" class="donut__val">${centroValor}</text>
      <text x="${c}" y="${c + 15}" text-anchor="middle" class="donut__lbl">${centroLabel}</text>
    </svg>`;
}

// Legenda generica para os segmentos.
function legenda(segmentos, total) {
  return (
    '<ul class="legenda">' +
    segmentos
      .filter((s) => s.value > 0)
      .map(
        (s) =>
          `<li class="legenda__item">
            <span class="legenda__cor" style="background:${s.color}"></span>
            <span class="legenda__txt">${s.label}</span>
            <span class="legenda__val">${fmtCompacto(s.value)}${total ? ` · ${fmtPct(pct(s.value, total))}` : ""}</span>
          </li>`
      )
      .join("") +
    "</ul>"
  );
}

// Bloco de aneis concentricos (cada anel = % do seu valor sobre `base`).
// `centroLbl` indica qual anel aparece no centro (o primeiro da lista).
function blocoAneis(titulo, base, aneis, centroLbl) {
  if (!base) return "";
  const size = 160, c = 80, sw = 12;
  const arcos = aneis
    .map((a) => {
      const p = Math.min(pct(a.val, base), 100);
      return `<circle cx="${c}" cy="${c}" r="${a.raio}" fill="none" stroke="#edf2f0" stroke-width="${sw}"/>
        <circle cx="${c}" cy="${c}" r="${a.raio}" fill="none" stroke="${a.cor}" stroke-width="${sw}" stroke-linecap="round" pathLength="100" stroke-dasharray="${p} 100" transform="rotate(-90 ${c} ${c})"/>`;
    })
    .join("");
  const svg = `<svg class="donut" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img">
      ${arcos}
      <text x="${c}" y="${c - 2}" text-anchor="middle" class="donut__val">${fmtPct(pct(aneis[0].val, base))}</text>
      <text x="${c}" y="${c + 15}" text-anchor="middle" class="donut__lbl">${centroLbl}</text>
    </svg>`;
  const segs = aneis.map((a) => ({ label: a.lbl, value: a.val, color: a.cor }));
  return `<div class="grafico-bloco">
      <p class="grafico-bloco__tit">${titulo}</p>
      <div class="grafico">${svg}${legenda(segs, base)}</div>
    </div>`;
}

// Visao Geral: duas roscas — sobre a dotacao (inclui % recebido) e sobre o recebido.
function renderChartExecucao(r) {
  if (!r.dotacao) {
    el("chartExecucao").innerHTML = vazioGraf();
    return;
  }
  const sobreDotacao = blocoAneis(
    "Sobre a dotação",
    r.dotacao,
    [
      { lbl: "Recebido", val: r.recebido, cor: "#2563eb", raio: 70 },
      { lbl: "Empenhado", val: r.empenhado, cor: "#1f8a64", raio: 56 },
      { lbl: "Liquidado", val: r.liquidado, cor: "#d97706", raio: 42 },
      { lbl: "Pago", val: r.pago, cor: "#7c3aed", raio: 28 },
    ],
    "recebido"
  );
  const sobreRecebido = blocoAneis(
    "Sobre o recebido",
    r.recebido,
    [
      { lbl: "Empenhado", val: r.empenhado, cor: "#1f8a64", raio: 66 },
      { lbl: "Liquidado", val: r.liquidado, cor: "#d97706", raio: 50 },
      { lbl: "Pago", val: r.pago, cor: "#7c3aed", raio: 34 },
    ],
    "empenhado"
  );
  el("chartExecucao").innerHTML = `<div class="graficos-2">${sobreDotacao}${sobreRecebido}</div>`;
}

// Rosca da composicao do credito disponivel por Natureza de Despesa.
function ndDonutHTML(linhas) {
  const mapa = new Map();
  for (const x of linhas) {
    const chave = `${x.nd || "—"} ${x.ndNome || ""}`.trim();
    mapa.set(chave, (mapa.get(chave) || 0) + (x.disponivel || 0));
  }
  const segs = [...mapa.entries()]
    .map(([label, value], i) => ({ label, value, color: CORES_GRAF[i % CORES_GRAF.length] }))
    .sort((a, b) => b.value - a.value);
  const total = segs.reduce((a, s) => a + s.value, 0);
  const svg = svgDonut(segs, { size: 150, thickness: 22, centroValor: fmtCompacto(total), centroLabel: "disponível" });
  return svg ? `<div class="grafico">${svg}${legenda(segs, total)}</div>` : vazioGraf("Sem detalhamento por ND.");
}

// Rosca da composicao por Acao Orcamentaria, somando um valor configuravel.
function donutPorAO(linhas, aoNomes, valorFn, centroLabel) {
  const mapa = new Map();
  for (const x of linhas) {
    const v = valorFn(x) || 0;
    if (v) mapa.set(x.ao, (mapa.get(x.ao) || 0) + v);
  }
  const segs = [...mapa.entries()]
    .map(([ao, value], i) => ({
      label: `${ao || "—"} · ${(aoNomes && aoNomes.get(ao)) || ""}`.replace(/ · $/, ""),
      value,
      color: CORES_GRAF[i % CORES_GRAF.length],
    }))
    .sort((a, b) => b.value - a.value);
  const total = segs.reduce((a, s) => a + s.value, 0);
  const svg = svgDonut(segs, { size: 150, thickness: 22, centroValor: fmtCompacto(total), centroLabel });
  return svg ? `<div class="grafico">${svg}${legenda(segs, total)}</div>` : vazioGraf("Sem detalhamento por AO.");
}

// Composicao do credito disponivel por AO (usada nas UGR de Credito).
function aoDonutHTML(linhas, aoNomes) {
  return donutPorAO(linhas, aoNomes, (x) => x.disponivel, "por AO");
}

// Credito: rosca da composicao do credito DIREF por Acao Orcamentaria.
function renderChartCreditoAO(itens, aoNomes) {
  if (!itens.length) {
    el("chartCreditoAO").innerHTML = vazioGraf("Sem crédito DIREF para este filtro.");
    return;
  }
  const mapa = new Map();
  for (const x of itens) mapa.set(x.ao, (mapa.get(x.ao) || 0) + (x.disponivel || 0));
  const segs = [...mapa.entries()]
    .map(([ao, value], i) => ({
      label: `${ao} · ${(aoNomes && aoNomes.get(ao)) || ""}`.trim().replace(/ ·\s*$/, ""),
      value,
      color: CORES_GRAF[i % CORES_GRAF.length],
    }))
    .sort((a, b) => b.value - a.value);
  const total = segs.reduce((a, s) => a + s.value, 0);
  const svg = svgDonut(segs, { centroValor: fmtCompacto(total), centroLabel: "por AO" });
  el("chartCreditoAO").innerHTML = svg
    ? `<div class="grafico">${svg}${legenda(segs, total)}</div>`
    : vazioGraf("Sem crédito DIREF para este filtro.");
}

// Barras horizontais genericas [{label, value, sub?}], cor unica, com destaque opcional.
function barrasHoriz(itens, { cor = "#1f8a64" } = {}) {
  const max = Math.max(...itens.map((i) => i.value), 1);
  return (
    '<div class="hbars">' +
    itens
      .map(
        (i) => `
        <div class="hbar">
          <div class="hbar__head">
            <span class="hbar__lbl">${i.label}</span>
            <span class="hbar__val">${fmtCompacto(i.value)}</span>
          </div>
          <div class="hbar__track">
            <div class="hbar__fill" style="width:${(i.value / max) * 100}%;background:${cor}"></div>
            ${i.sub != null ? `<div class="hbar__fill hbar__fill--sob" style="width:${(i.sub / max) * 100}%"></div>` : ""}
          </div>
        </div>`
      )
      .join("") +
    "</div>"
  );
}

// Execucao: barras de Dotacao por AO. Todas as barras tem a mesma largura
// (100% = a dotacao da propria AO). Dentro: verde claro = recebido e verde
// escuro = empenhado (% da dotacao). Tooltip mostra dotacao, recebido e empenhado.
function renderChartAO(acoes) {
  if (!acoes.length) {
    el("chartAO").innerHTML = vazioGraf();
    return;
  }
  const larg = (v, d) => (d > 0 ? Math.min((v / d) * 100, 100) : 0);
  const linhas = acoes
    .map((a) => {
      const tip =
        `Dotação: ${fmtBRL.format(a.dotacao)}` +
        ` | Recebido: ${fmtBRL.format(a.recebido)} (${fmtPct(pct(a.recebido, a.dotacao))})` +
        ` | Empenhado: ${fmtBRL.format(a.empenhado)} (${fmtPct(pct(a.empenhado, a.dotacao))})`;
      return `
      <div class="hbar">
        <div class="hbar__head">
          <span class="hbar__lbl">${a.codigo} · ${a.nome}</span>
          <span class="hbar__val">${fmtCompacto(a.dotacao)}</span>
        </div>
        <div class="hbar__track hbar__track--multi" title="${tip}">
          <div class="hbar__camada hbar__camada--dot" style="width:100%"></div>
          <div class="hbar__camada hbar__camada--rec" style="width:${larg(a.recebido, a.dotacao)}%"></div>
          <div class="hbar__camada hbar__camada--emp" style="width:${larg(a.empenhado, a.dotacao)}%"></div>
        </div>
      </div>`;
    })
    .join("");
  el("chartAO").innerHTML =
    `<div class="hbars">${linhas}</div>` +
    `<p class="grafico__nota">` +
    `<span class="pontinho pontinho--dot"></span> Dotação &nbsp; ` +
    `<span class="pontinho pontinho--rec"></span> Recebido &nbsp; ` +
    `<span class="pontinho pontinho--emp"></span> Empenhado` +
    `</p>`;
}

// Credito: barras do credito disponivel por UGR (agregando as linhas de cada UGR).
function renderChartUGR(ugrs) {
  if (!ugrs.length) {
    el("chartUGR").innerHTML = vazioGraf("Sem UGR para este filtro.");
    return;
  }
  const itens = agruparPor(ugrs, (x) => x.sigla).map((g) => ({ label: g.chave, value: g.total }));
  el("chartUGR").innerHTML = barrasHoriz(itens, { cor: "#2563eb" });
}

// RAP: barras empilhadas (pago / a pagar / cancelado) por tipo.
function renderChartRAP(itens) {
  if (!itens.length) {
    el("chartRAP").innerHTML = vazioGraf();
    return;
  }
  const partes = [
    { k: "pago", lbl: "Pago", cor: "#7c3aed" },
    { k: "aPagar", lbl: "A pagar", cor: "#b91c1c" },
    { k: "cancelado", lbl: "Cancelado", cor: "#9aa6a1" },
  ];
  const linhas = itens
    .map((r) => {
      const aPagar = r.inscrito - r.cancelado - r.pago;
      const vals = { pago: r.pago, aPagar, cancelado: r.cancelado };
      const total = r.inscrito || 1;
      const segs = partes
        .map(
          (p) =>
            `<div class="stack__seg" style="width:${(vals[p.k] / total) * 100}%;background:${p.cor}" title="${p.lbl}: ${fmtBRL.format(vals[p.k])}"></div>`
        )
        .join("");
      return `
        <div class="stackrow">
          <div class="hbar__head">
            <span class="hbar__lbl">${r.sigla} · ${r.tipo}</span>
            <span class="hbar__val">Inscrito ${fmtCompacto(r.inscrito)}</span>
          </div>
          <div class="stack">${segs}</div>
        </div>`;
    })
    .join("");
  const leg =
    '<p class="grafico__nota">' +
    partes.map((p) => `<span class="pontinho" style="background:${p.cor}"></span> ${p.lbl}`).join(" &nbsp; ") +
    "</p>";
  el("chartRAP").innerHTML = `<div class="stacks">${linhas}</div>${leg}`;
}

// ----- Navegacao por secoes (painel lateral) -----------------------------
const VIEW_PADRAO = "geral";
let viewAtiva = localStorage.getItem("comgap_view") || VIEW_PADRAO;

function selecionarView(view) {
  const existe = document.querySelector(`.view[data-view="${view}"]`);
  viewAtiva = existe ? view : VIEW_PADRAO;
  localStorage.setItem("comgap_view", viewAtiva);

  document.querySelectorAll(".view").forEach((sec) => {
    sec.classList.toggle("view--ativa", sec.dataset.view === viewAtiva);
  });
  document.querySelectorAll(".navitem").forEach((btn) => {
    const ativo = btn.dataset.view === viewAtiva;
    btn.classList.toggle("navitem--ativo", ativo);
    btn.setAttribute("aria-selected", ativo ? "true" : "false");
  });
  // Rola o conteudo para o topo ao trocar de secao.
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ----- Drawer (menu lateral no mobile) -----------------------------------
function abrirMenu() {
  el("sidebar").classList.add("aberta");
  const ov = el("overlay");
  ov.hidden = false;
  requestAnimationFrame(() => ov.classList.add("show"));
  el("menuBtn").setAttribute("aria-expanded", "true");
}
function fecharMenu() {
  el("sidebar").classList.remove("aberta");
  const ov = el("overlay");
  ov.classList.remove("show");
  setTimeout(() => (ov.hidden = true), 220);
  el("menuBtn").setAttribute("aria-expanded", "false");
}

el("menuBtn").addEventListener("click", abrirMenu);
el("sidebarClose").addEventListener("click", fecharMenu);
el("overlay").addEventListener("click", fecharMenu);
el("sidebarNav").addEventListener("click", (e) => {
  const btn = e.target.closest(".navitem");
  if (!btn) return;
  selecionarView(btn.dataset.view);
  fecharMenu();
});

// ----- Exportar PDF (impressao nativa) -----------------------------------
// Monta um cabecalho com os filtros atuais e dispara a impressao. O CSS de
// @media print mostra todas as secoes (com os acordeoes expandidos), gerando
// um relatorio completo que o navegador salva como PDF.
function exportarPDF() {
  if (DATASET) {
    const aoTxt = aoCreditoSel.size ? [...aoCreditoSel].sort().join(", ") : "Todas";
    el("printInfo").innerHTML =
      `<strong>${DATASET.orgaoNome || DATASET.orgao} — Painel Orçamentário</strong>` +
      `<span>Exercício ${anoAtivo}</span>` +
      `<span>Crédito Disponível — AO: ${aoTxt}</span>` +
      `<span class="print-cabecalho__emit">Emitido em ${new Date().toLocaleString("pt-BR")}</span>`;
  }
  window.print();
}
el("pdfBtn").addEventListener("click", exportarPDF);

// ----- Eventos -----------------------------------------------------------
el("reloadBtn").addEventListener("click", (e) => {
  e.currentTarget.classList.add("spin");
  setTimeout(() => e.currentTarget.classList.remove("spin"), 600);
  carregar();
});
el("retryBtn").addEventListener("click", carregar);

selecionarView(viewAtiva);
carregar();
