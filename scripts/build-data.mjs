// =============================================================================
// Gera o arquivo estatico docs/data.json a partir da fonte unica de dados
// (data/orcamento.js). Esse JSON e consumido pelo frontend tanto no GitHub
// Pages (site estatico) quanto localmente. Rode: `npm run build`.
// =============================================================================
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dados, calcularResumo } from "../data/orcamento.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const destino = path.join(__dirname, "..", "docs", "data.json");

const payload = {
  exercicio: dados.exercicio,
  orgao: dados.orgao,
  orgaoNome: dados.orgaoNome,
  atualizadoEm: dados.atualizadoEm,
  resumo: calcularResumo(dados),
  acoesOrcamentarias: dados.acoesOrcamentarias,
  creditoDirefDetalhes: dados.creditoDirefDetalhes,
  creditoUGE: dados.creditoUGE,
  restosAPagar: dados.restosAPagar,
};

mkdirSync(path.dirname(destino), { recursive: true });
writeFileSync(destino, JSON.stringify(payload, null, 2) + "\n");
console.log("Gerado:", destino);
