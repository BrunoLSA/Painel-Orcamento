// =============================================================================
// Gera docs/data.json — consumido pelo frontend (GitHub Pages e servidor local).
//
// FONTE DOS DADOS:
//  - Se existirem as planilhas oficiais em data/fonte/*.csv (exportadas do
//    Tesouro Gerencial / SIAFI), elas sao convertidas para o data.json.
//  - Caso contrario, usa os dados de demonstracao de data/orcamento.js.
//
// As planilhas usam ";" ou "," como separador e aceitam numeros no formato
// brasileiro (ex.: "1.234.567,89") ou simples (ex.: "1234567.89").
// Rode: `npm run build`.
// =============================================================================
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dados, config } from "../data/orcamento.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raizFonte = path.join(__dirname, "..", "data", "fonte");
const destino = path.join(__dirname, "..", "docs", "data.json");

// ----- Parser CSV (sem dependencias) ----------------------------------------
function parseCSV(texto) {
  texto = texto.replace(/^﻿/, ""); // remove BOM
  const primeira = texto.split(/\r?\n/).find((l) => l.trim().length) || "";
  const delim = primeira.split(";").length > primeira.split(",").length ? ";" : ",";

  const linhas = [];
  let campo = "";
  let linha = [];
  let emAspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (emAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; } else emAspas = false;
      } else campo += c;
    } else if (c === '"') {
      emAspas = true;
    } else if (c === delim) {
      linha.push(campo); campo = "";
    } else if (c === "\n") {
      linha.push(campo); linhas.push(linha); linha = []; campo = "";
    } else if (c !== "\r") {
      campo += c;
    }
  }
  if (campo.length || linha.length) { linha.push(campo); linhas.push(linha); }

  const header = (linhas.shift() || []).map((h) => h.trim().toLowerCase());
  return linhas
    .filter((l) => l.some((c) => c.trim().length))
    .map((l) => Object.fromEntries(header.map((h, i) => [h, (l[i] ?? "").trim()])));
}

// Converte texto numerico para Number, resolvendo a ambiguidade entre os
// formatos brasileiro (1.234.567,89) e simples/US (1234567.89). Otimizado para
// valores monetarios (2 casas decimais), como os exportados do Tesouro Gerencial.
function num(v) {
  if (v == null) return 0;
  let s = String(v).replace(/r\$/gi, "").replace(/\s/g, "").replace(/[^\d.,-]/g, "");
  if (!s) return 0;

  const temPonto = s.includes(".");
  const temVirgula = s.includes(",");

  if (temPonto && temVirgula) {
    // O separador que aparece por ultimo e o decimal; o outro e de milhar.
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (temVirgula) {
    const partes = s.split(",");
    // Varias virgulas, ou uma virgula seguida de 3 digitos -> separador de milhar.
    if (partes.length > 2 || partes[1]?.length === 3) s = s.replace(/,/g, "");
    else s = s.replace(",", ".");
  } else if (temPonto) {
    const partes = s.split(".");
    // Varios pontos, ou um ponto seguido de 3 digitos -> separador de milhar (ex.: 9.880.000).
    if (partes.length > 2 || partes[1]?.length === 3) s = s.replace(/\./g, "");
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function lerCSV(nome) {
  const p = path.join(raizFonte, nome);
  return existsSync(p) ? parseCSV(readFileSync(p, "utf8")) : null;
}

// Converte o ano (exercicio) para inteiro.
function ano(v) {
  const n = parseInt(String(v ?? "").trim(), 10);
  return Number.isFinite(n) ? n : null;
}

// ----- Montagem do dataset --------------------------------------------------
const exec = lerCSV("execucao.csv");
const diref = lerCSV("credito_diref.csv");
const ugr = lerCSV("credito_ugr.csv");
const rap = lerCSV("restos_a_pagar.csv");

let dataset;
if (exec && diref && ugr && rap) {
  // Data de atualizacao = mtime mais recente entre as planilhas.
  const arquivos = ["execucao.csv", "credito_diref.csv", "credito_ugr.csv", "restos_a_pagar.csv"];
  const maisRecente = Math.max(...arquivos.map((f) => statSync(path.join(raizFonte, f)).mtimeMs));

  const execucao = exec.map((r) => ({
    exercicio: ano(r.ano) ?? config.exercicio,
    diretoria: r.diretoria,
    ao: r.acao,
    aoNome: r.acao_nome,
    dotacao: num(r.dotacao),
    recebido: num(r.recebido),
    empenhado: num(r.empenhado),
    liquidado: num(r.liquidado),
    pago: num(r.pago),
  }));
  const creditoDiref = diref.map((r) => ({
    exercicio: ano(r.ano) ?? config.exercicio,
    diretoria: r.diretoria,
    ao: r.acao,
    nd: r.nd,
    ndNome: r.nd_nome,
    fonte: r.fonte,
    ptres: r.ptres,
    disponivel: num(r.disponivel),
  }));
  const creditoUGR = ugr.map((r) => ({
    exercicio: ano(r.ano) ?? config.exercicio,
    diretoria: r.diretoria,
    codigo: r.ugr_codigo,
    sigla: r.ugr_sigla,
    nome: r.ugr_nome,
    ao: r.acao,
    disponivel: num(r.disponivel),
  }));
  const restosAPagar = rap.map((r) => {
    const o = {
      exercicio: ano(r.ano) ?? config.exercicio,
      diretoria: r.diretoria,
      tipo: r.tipo,
      sigla: r.sigla,
      inscrito: num(r.inscrito),
      cancelado: num(r.cancelado),
      pago: num(r.pago),
    };
    // liquidado so existe para Restos a Pagar Nao Processados (RPNP).
    if (String(r.liquidado ?? "").trim() !== "") o.liquidado = num(r.liquidado);
    return o;
  });

  // Exercicios disponiveis (mais recente primeiro); padrao = mais recente.
  const exercicios = [...new Set(execucao.map((e) => e.exercicio))].sort((a, b) => b - a);

  dataset = {
    orgao: config.orgao,
    orgaoNome: config.orgaoNome,
    atualizadoEm: new Date(maisRecente).toISOString(),
    exercicios,
    exercicioPadrao: exercicios[0],
    diretorias: config.diretorias,
    execucao,
    creditoDiref,
    creditoUGR,
    restosAPagar,
  };
  console.log(
    `Fonte: planilhas oficiais em data/fonte/ ` +
      `(exercicios: ${exercicios.join(", ")}; ${execucao.length} execucao, ` +
      `${creditoDiref.length} DIREF, ${creditoUGR.length} UGR, ${restosAPagar.length} RAP).`
  );
} else {
  // Fallback de demonstracao: normaliza para o mesmo formato (um unico exercicio).
  const comAno = (arr) => arr.map((x) => ({ exercicio: dados.exercicio, ...x }));
  dataset = {
    orgao: dados.orgao,
    orgaoNome: dados.orgaoNome,
    atualizadoEm: dados.atualizadoEm,
    exercicios: [dados.exercicio],
    exercicioPadrao: dados.exercicio,
    diretorias: dados.diretorias,
    execucao: comAno(dados.execucao),
    creditoDiref: comAno(dados.creditoDiref),
    creditoUGR: comAno(dados.creditoUGE || []),
    restosAPagar: comAno(dados.restosAPagar),
  };
  console.log(
    "Fonte: dados de DEMONSTRACAO (data/orcamento.js). " +
      "Adicione as planilhas em data/fonte/ para usar os dados oficiais."
  );
}

mkdirSync(path.dirname(destino), { recursive: true });
writeFileSync(destino, JSON.stringify(dataset, null, 2) + "\n");
console.log("Gerado:", destino);
