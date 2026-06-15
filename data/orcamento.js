// =============================================================================
// Configuracao e dados de DEMONSTRACAO (fallback) do Painel Orcamentario da DIRMAB
// -----------------------------------------------------------------------------
// O painel e alimentado pelas planilhas em data/fonte/*.csv (ver build-data.mjs).
// Este modulo fornece:
//  - `config`: metadados do orgao (exercicio padrao, sigla e nome);
//  - `dados`:  um conjunto de DEMONSTRACAO usado apenas se as planilhas faltarem.
//
// Todos os valores monetarios estao em Reais (BRL).
// =============================================================================

export const config = {
  exercicio: 2026,
  orgao: "DIRMAB",
  orgaoNome: "Diretoria de Material Aeronáutico e Bélico",
};

export const dados = {
  exercicio: config.exercicio,
  orgao: config.orgao,
  orgaoNome: config.orgaoNome,
  atualizadoEm: "2026-06-15T11:00:00-03:00",

  // Execucao orcamentaria por Acao Orcamentaria (AO).
  execucao: [
    { ao: "2000", aoNome: "Administração da Unidade", dotacao: 38000000, recebido: 25000000, empenhado: 20000000, liquidado: 14000000, pago: 12000000, cambio: 8000000 },
    { ao: "20X8", aoNome: "Manutenção e Suprimento de Material Aeronáutico", dotacao: 180000000, recebido: 120000000, empenhado: 105000000, liquidado: 78000000, pago: 70000000, cambio: 45000000 },
    { ao: "20XJ", aoNome: "Adequação de Organizações Militares da Aeronáutica", dotacao: 30000000, recebido: 18000000, empenhado: 14000000, liquidado: 9000000, pago: 7500000, cambio: 6000000 },
    { ao: "21D4", aoNome: "Fortalecimento das Capacidades Logísticas de Defesa", dotacao: 25000000, recebido: 13000000, empenhado: 9000000, liquidado: 5000000, pago: 4000000, cambio: 4000000 },
  ],

  // Credito disponivel DIREF por detalhes (AO, Natureza de Despesa, Fonte).
  creditoDiref: [
    { ao: "20X8", nd: "339030", ndNome: "Material de Consumo", fonte: "1000000000", ptres: "228701", disponivel: 24180000 },
    { ao: "20X8", nd: "449052", ndNome: "Equip. e Material Permanente", fonte: "1000000000", ptres: "228701", disponivel: 31900000 },
    { ao: "2000", nd: "339039", ndNome: "Outros Serv. de Terceiros - PJ", fonte: "1000000000", ptres: "228628", disponivel: 9650000 },
  ],

  // Credito disponivel por UGR (Unidade Gestora Responsavel) x AO.
  creditoUGR: [
    { codigo: "120089", sigla: "DIRMAB", nome: "Diretoria de Material Aeronáutico e Bélico", ao: "20X8", disponivel: 13870000 },
    { codigo: "120017", sigla: "PAMA-SP", nome: "Parque de Material Aeronáutico de São Paulo", ao: "20X8", disponivel: 21150000 },
    { codigo: "120013", sigla: "PAME-RJ", nome: "Parque de Material de Eletrônica do RJ", ao: "20X8", disponivel: 7330000 },
  ],

  // Restos a Pagar por tipo.
  restosAPagar: [
    { tipo: "Processados", sigla: "RPP", inscrito: 12640000, cancelado: 520000, pago: 9880000 },
    { tipo: "Não Processados", sigla: "RPNP", inscrito: 31250000, cancelado: 2840000, liquidado: 18300000, pago: 14700000 },
  ],

  // Restos a Pagar por UGR x AO (saldo a pagar).
  restosAPagarUGR: [
    { codigo: "120089", sigla: "DIRMAB", nome: "Diretoria de Material Aeronáutico e Bélico", ao: "20X8", aPagar: 6000000 },
    { codigo: "120017", sigla: "PAMA-SP", nome: "Parque de Material Aeronáutico de São Paulo", ao: "20X8", aPagar: 6950000 },
    { codigo: "120013", sigla: "PAME-RJ", nome: "Parque de Material de Eletrônica do RJ", ao: "20X8", aPagar: 3000000 },
  ],

  // Execucao por UGR (recebido/empenhado/liquidado/pago).
  execucaoUGR: [
    { codigo: "120017", sigla: "PAMA-SP", nome: "Parque de Material Aeronáutico de São Paulo", recebido: 90000000, empenhado: 78000000, liquidado: 56000000, pago: 50000000 },
    { codigo: "120089", sigla: "DIRMAB", nome: "Diretoria de Material Aeronáutico e Bélico", recebido: 60000000, empenhado: 52000000, liquidado: 38000000, pago: 33500000 },
    { codigo: "120013", sigla: "PAME-RJ", nome: "Parque de Material de Eletrônica do RJ", recebido: 26000000, empenhado: 18000000, liquidado: 12000000, pago: 10000000 },
  ],
};
