// =============================================================================
// Gera o arquivo estatico docs/data.json a partir da fonte unica de dados
// (data/orcamento.js). Esse JSON e consumido pelo frontend tanto no GitHub
// Pages (site estatico) quanto localmente. O frontend faz a filtragem por
// diretoria e os calculos de resumo/agregacao. Rode: `npm run build`.
// =============================================================================
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dados } from "../data/orcamento.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const destino = path.join(__dirname, "..", "docs", "data.json");

mkdirSync(path.dirname(destino), { recursive: true });
writeFileSync(destino, JSON.stringify(dados, null, 2) + "\n");
console.log("Gerado:", destino);
