// =============================================================================
// Fonte de dados do Painel Orcamentario do COMGAP
// -----------------------------------------------------------------------------
// Este modulo concentra TODOS os dados exibidos no painel. Em producao, basta
// substituir o conteudo de `dados` por uma carga vinda do Tesouro Gerencial /
// SIAFI (ex.: leitura de planilha, consulta a banco ou chamada de API),
// mantendo o mesmo formato de objeto. O restante do sistema nao precisa mudar.
//
// Todos os valores monetarios estao em Reais (BRL).
// =============================================================================

export const dados = {
  exercicio: 2026,
  orgao: "COMGAP",
  orgaoNome: "Comando-Geral de Apoio",
  atualizadoEm: "2026-06-13T18:00:00-03:00",

  // ---------------------------------------------------------------------------
  // Dotacao do ano por Acao Orcamentaria (AO)
  // recebido = credito descentralizado recebido na UG
  // ---------------------------------------------------------------------------
  acoesOrcamentarias: [
    {
      codigo: "2000",
      nome: "Administracao da Unidade",
      dotacao: 184500000,
      recebido: 121300000,
      empenhado: 98750000,
      liquidado: 71200000,
      pago: 64800000,
    },
    {
      codigo: "20XJ",
      nome: "Adequacao de Organizacoes Militares da Aeronautica",
      dotacao: 96200000,
      recebido: 58400000,
      empenhado: 47100000,
      liquidado: 28900000,
      pago: 24350000,
    },
    {
      codigo: "20X8",
      nome: "Manutencao e Suprimento de Material Aeronautico",
      dotacao: 312800000,
      recebido: 205600000,
      empenhado: 178200000,
      liquidado: 132400000,
      pago: 118900000,
    },
    {
      codigo: "14T5",
      nome: "Adequacao de Infraestrutura Operacional e Logistica",
      dotacao: 74300000,
      recebido: 41200000,
      empenhado: 33600000,
      liquidado: 16800000,
      pago: 14100000,
    },
    {
      codigo: "21D4",
      nome: "Fortalecimento das Capacidades Logisticas de Defesa",
      dotacao: 58900000,
      recebido: 30100000,
      empenhado: 22450000,
      liquidado: 11300000,
      pago: 9750000,
    },
  ],

  // ---------------------------------------------------------------------------
  // Credito disponivel DIREF por detalhes
  // (Acao Orcamentaria, Natureza de Despesa, Fonte, PTRES)
  // disponivel = dotacao - destacado/descentralizado - bloqueado
  // ---------------------------------------------------------------------------
  creditoDirefDetalhes: [
    { ao: "2000", nd: "339030", ndNome: "Material de Consumo", fonte: "1000000000", ptres: "228628", disponivel: 18420000 },
    { ao: "2000", nd: "339039", ndNome: "Outros Serv. de Terceiros - PJ", fonte: "1000000000", ptres: "228628", disponivel: 27650000 },
    { ao: "2000", nd: "339014", ndNome: "Diarias - Pessoal Civil/Militar", fonte: "1000000000", ptres: "228628", disponivel: 4310000 },
    { ao: "20X8", nd: "339030", ndNome: "Material de Consumo", fonte: "1000000000", ptres: "228701", disponivel: 41280000 },
    { ao: "20X8", nd: "449052", ndNome: "Equip. e Material Permanente", fonte: "1000000000", ptres: "228701", disponivel: 53900000 },
    { ao: "20X8", nd: "339039", ndNome: "Outros Serv. de Terceiros - PJ", fonte: "1022000000", ptres: "228701", disponivel: 22150000 },
    { ao: "20XJ", nd: "449051", ndNome: "Obras e Instalacoes", fonte: "1000000000", ptres: "228655", disponivel: 19870000 },
    { ao: "14T5", nd: "449051", ndNome: "Obras e Instalacoes", fonte: "1000000000", ptres: "226004", disponivel: 12640000 },
    { ao: "21D4", nd: "449052", ndNome: "Equip. e Material Permanente", fonte: "1022000000", ptres: "228712", disponivel: 9430000 },
  ],

  // ---------------------------------------------------------------------------
  // Credito disponivel por UGE (Unidade Gestora Executora)
  // ---------------------------------------------------------------------------
  creditoUGE: [
    { codigo: "120085", sigla: "CELOG", nome: "Centro Logistico da Aeronautica", disponivel: 38420000, empenhado: 142800000, recebido: 181220000 },
    { codigo: "120017", sigla: "PAMA-SP", nome: "Parque de Material Aeronautico de Sao Paulo", disponivel: 24150000, empenhado: 88600000, recebido: 112750000 },
    { codigo: "120042", sigla: "GAP-RJ", nome: "Grupamento de Apoio do Rio de Janeiro", disponivel: 11280000, empenhado: 39400000, recebido: 50680000 },
    { codigo: "120018", sigla: "GAP-SP", nome: "Grupamento de Apoio de Sao Paulo", disponivel: 9640000, empenhado: 31200000, recebido: 40840000 },
    { codigo: "120089", sigla: "DIRMAB", nome: "Diretoria de Material Aeronautico e Belico", disponivel: 15870000, empenhado: 45100000, recebido: 60970000 },
    { codigo: "120013", sigla: "PAME-RJ", nome: "Parque de Material de Eletronica do RJ", disponivel: 7330000, empenhado: 22950000, recebido: 30280000 },
  ],

  // ---------------------------------------------------------------------------
  // Restos a Pagar (exercicios anteriores)
  // RPP  = Restos a Pagar Processados (ja liquidados)
  // RPNP = Restos a Pagar Nao Processados (ainda nao liquidados)
  // ---------------------------------------------------------------------------
  restosAPagar: [
    { tipo: "Processados", sigla: "RPP", inscrito: 28640000, cancelado: 1320000, pago: 19880000 },
    { tipo: "Nao Processados", sigla: "RPNP", inscrito: 74250000, cancelado: 6840000, liquidado: 41300000, pago: 33700000 },
  ],
};

// Calcula os totais consolidados a partir das Acoes Orcamentarias, garantindo
// coerencia entre os cards de resumo e o detalhamento.
export function calcularResumo(d = dados) {
  const ao = d.acoesOrcamentarias;
  const soma = (campo) => ao.reduce((acc, x) => acc + (x[campo] || 0), 0);

  const dotacao = soma("dotacao");
  const recebido = soma("recebido");
  const empenhado = soma("empenhado");
  const liquidado = soma("liquidado");
  const pago = soma("pago");

  // Credito disponivel total: soma do disponivel das UGEs.
  const creditoDisponivelUGE = d.creditoUGE.reduce((a, x) => a + (x.disponivel || 0), 0);
  const creditoDisponivelDiref = d.creditoDirefDetalhes.reduce((a, x) => a + (x.disponivel || 0), 0);

  // Restos a Pagar: saldo a pagar = inscrito - cancelado - pago.
  const rapAPagar = d.restosAPagar.reduce(
    (a, r) => a + ((r.inscrito || 0) - (r.cancelado || 0) - (r.pago || 0)),
    0
  );

  return {
    dotacao,
    recebido,
    empenhado,
    liquidado,
    pago,
    aEmpenhar: recebido - empenhado,
    aLiquidar: empenhado - liquidado,
    aPagar: liquidado - pago,
    creditoDisponivelUGE,
    creditoDisponivelDiref,
    rapAPagar,
  };
}
