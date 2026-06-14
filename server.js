// =============================================================================
// Servidor do Painel Orcamentario do COMGAP
// Serve a API JSON e os arquivos estaticos do frontend (mobile-first).
// =============================================================================
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dados, calcularResumo } from "./data/orcamento.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

// ----- API ------------------------------------------------------------------
// Endpoint unico que devolve tudo o que o painel precisa, ja com o resumo
// consolidado calculado a partir das Acoes Orcamentarias.
app.get("/api/orcamento", (_req, res) => {
  res.json({
    exercicio: dados.exercicio,
    orgao: dados.orgao,
    orgaoNome: dados.orgaoNome,
    atualizadoEm: dados.atualizadoEm,
    resumo: calcularResumo(dados),
    acoesOrcamentarias: dados.acoesOrcamentarias,
    creditoDirefDetalhes: dados.creditoDirefDetalhes,
    creditoUGE: dados.creditoUGE,
    restosAPagar: dados.restosAPagar,
  });
});

// Verificacao simples de saude (util para monitoramento/deploy).
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ----- Frontend estatico -----------------------------------------------------
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`Painel Orcamentario do COMGAP rodando em http://localhost:${PORT}`);
});
