// =============================================================================
// Servidor do Painel Orcamentario da DIRMAB
// Serve a API JSON e os arquivos estaticos do frontend (mobile-first).
// =============================================================================
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dados } from "./data/orcamento.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

// ----- API ------------------------------------------------------------------
// Devolve o dataset bruto (com a dimensao "diretoria"). A filtragem por
// diretoria e o calculo do resumo/agregacoes sao feitos no frontend, para que
// o painel funcione identico como site estatico (GitHub Pages) e via servidor.
app.get("/api/orcamento", (_req, res) => res.json(dados));

// Verificacao simples de saude (util para monitoramento/deploy).
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ----- Frontend estatico -----------------------------------------------------
// Servimos a mesma pasta `docs/` que o GitHub Pages publica, garantindo que o
// site rode identico nos dois ambientes (inclui o data.json estatico).
app.use(express.static(path.join(__dirname, "docs")));

app.listen(PORT, () => {
  console.log(`Painel Orcamentario da DIRMAB rodando em http://localhost:${PORT}`);
});
