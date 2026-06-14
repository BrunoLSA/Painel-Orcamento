// =============================================================================
// Fonte de dados do Painel Orcamentario do COMGAP
// -----------------------------------------------------------------------------
// Este modulo concentra TODOS os dados exibidos no painel. Cada lancamento e
// associado a uma DIRETORIA do COMGAP (DIRMAB, DIRINFRA, DTI, CELOG), o que
// permite filtrar o painel por diretoria. Em producao, basta substituir o
// conteudo de `dados` por uma carga vinda do Tesouro Gerencial / SIAFI,
// mantendo o mesmo formato. Todo o calculo (resumo e agregacoes) e feito no
// frontend, de acordo com o filtro ativo.
//
// Todos os valores monetarios estao em Reais (BRL).
// =============================================================================

export const dados = {
  exercicio: 2026,
  orgao: "COMGAP",
  orgaoNome: "Comando-Geral de Apoio",
  atualizadoEm: "2026-06-13T18:00:00-03:00",

  // Diretorias do COMGAP usadas como filtro.
  diretorias: [
    { sigla: "DIRMAB", nome: "Diretoria de Material Aeronautico e Belico" },
    { sigla: "DIRINFRA", nome: "Diretoria de Infraestrutura da Aeronautica" },
    { sigla: "DTI", nome: "Diretoria de Tecnologia da Informacao" },
    { sigla: "CELOG", nome: "Centro Logistico da Aeronautica" },
  ],

  // ---------------------------------------------------------------------------
  // Execucao orcamentaria por (Diretoria, Acao Orcamentaria)
  // recebido = credito descentralizado recebido; valores acumulados no ano.
  // ---------------------------------------------------------------------------
  execucao: [
    // ---- DIRMAB ----
    { diretoria: "DIRMAB", ao: "2000", aoNome: "Administracao da Unidade", dotacao: 38000000, recebido: 25000000, empenhado: 20000000, liquidado: 14000000, pago: 12000000 },
    { diretoria: "DIRMAB", ao: "20X8", aoNome: "Manutencao e Suprimento de Material Aeronautico", dotacao: 180000000, recebido: 120000000, empenhado: 105000000, liquidado: 78000000, pago: 70000000 },
    { diretoria: "DIRMAB", ao: "20XJ", aoNome: "Adequacao de Organizacoes Militares da Aeronautica", dotacao: 30000000, recebido: 18000000, empenhado: 14000000, liquidado: 9000000, pago: 7500000 },
    { diretoria: "DIRMAB", ao: "21D4", aoNome: "Fortalecimento das Capacidades Logisticas de Defesa", dotacao: 25000000, recebido: 13000000, empenhado: 9000000, liquidado: 5000000, pago: 4000000 },

    // ---- DIRINFRA ----
    { diretoria: "DIRINFRA", ao: "2000", aoNome: "Administracao da Unidade", dotacao: 28000000, recebido: 18000000, empenhado: 14000000, liquidado: 10000000, pago: 9000000 },
    { diretoria: "DIRINFRA", ao: "14T5", aoNome: "Adequacao de Infraestrutura Operacional e Logistica", dotacao: 74300000, recebido: 41200000, empenhado: 33600000, liquidado: 16800000, pago: 14100000 },
    { diretoria: "DIRINFRA", ao: "20XJ", aoNome: "Adequacao de Organizacoes Militares da Aeronautica", dotacao: 50000000, recebido: 30000000, empenhado: 25000000, liquidado: 16000000, pago: 13000000 },

    // ---- DTI ----
    { diretoria: "DTI", ao: "2000", aoNome: "Administracao da Unidade", dotacao: 22000000, recebido: 14000000, empenhado: 11000000, liquidado: 8000000, pago: 7000000 },
    { diretoria: "DTI", ao: "20X3", aoNome: "Tecnologia da Informacao e Comunicacoes", dotacao: 60000000, recebido: 38000000, empenhado: 30000000, liquidado: 18000000, pago: 15000000 },

    // ---- CELOG ----
    { diretoria: "CELOG", ao: "2000", aoNome: "Administracao da Unidade", dotacao: 30000000, recebido: 20000000, empenhado: 16000000, liquidado: 12000000, pago: 10500000 },
    { diretoria: "CELOG", ao: "20X8", aoNome: "Manutencao e Suprimento de Material Aeronautico", dotacao: 132800000, recebido: 85600000, empenhado: 73200000, liquidado: 54400000, pago: 48900000 },
    { diretoria: "CELOG", ao: "21D4", aoNome: "Fortalecimento das Capacidades Logisticas de Defesa", dotacao: 33900000, recebido: 17100000, empenhado: 13450000, liquidado: 6300000, pago: 5750000 },
  ],

  // ---------------------------------------------------------------------------
  // Credito disponivel DIREF por detalhes
  // (Diretoria, Acao Orcamentaria, Natureza de Despesa, Fonte, PTRES)
  // ---------------------------------------------------------------------------
  creditoDiref: [
    { diretoria: "DIRMAB", ao: "20X8", nd: "339030", ndNome: "Material de Consumo", fonte: "1000000000", ptres: "228701", disponivel: 24180000 },
    { diretoria: "DIRMAB", ao: "20X8", nd: "449052", ndNome: "Equip. e Material Permanente", fonte: "1000000000", ptres: "228701", disponivel: 31900000 },
    { diretoria: "DIRMAB", ao: "2000", nd: "339039", ndNome: "Outros Serv. de Terceiros - PJ", fonte: "1000000000", ptres: "228628", disponivel: 9650000 },

    { diretoria: "DIRINFRA", ao: "14T5", nd: "449051", ndNome: "Obras e Instalacoes", fonte: "1000000000", ptres: "226004", disponivel: 12640000 },
    { diretoria: "DIRINFRA", ao: "20XJ", nd: "449051", ndNome: "Obras e Instalacoes", fonte: "1000000000", ptres: "228655", disponivel: 19870000 },
    { diretoria: "DIRINFRA", ao: "2000", nd: "339030", ndNome: "Material de Consumo", fonte: "1000000000", ptres: "228628", disponivel: 5420000 },

    { diretoria: "DTI", ao: "20X3", nd: "449052", ndNome: "Equip. e Material Permanente", fonte: "1000000000", ptres: "228740", disponivel: 18300000 },
    { diretoria: "DTI", ao: "20X3", nd: "339040", ndNome: "Serv. de TIC - PJ", fonte: "1022000000", ptres: "228740", disponivel: 13750000 },

    { diretoria: "CELOG", ao: "20X8", nd: "339030", ndNome: "Material de Consumo", fonte: "1000000000", ptres: "228701", disponivel: 17100000 },
    { diretoria: "CELOG", ao: "21D4", nd: "449052", ndNome: "Equip. e Material Permanente", fonte: "1022000000", ptres: "228712", disponivel: 9430000 },
    { diretoria: "CELOG", ao: "2000", nd: "339014", ndNome: "Diarias - Pessoal Civil/Militar", fonte: "1000000000", ptres: "228628", disponivel: 3210000 },
  ],

  // ---------------------------------------------------------------------------
  // Credito disponivel por UGE (Unidade Gestora Executora), por diretoria
  // ---------------------------------------------------------------------------
  creditoUGE: [
    { diretoria: "DIRMAB", codigo: "120089", sigla: "DIRMAB", nome: "Diretoria de Material Aeronautico e Belico", disponivel: 15870000, empenhado: 45100000, recebido: 60970000 },
    { diretoria: "DIRMAB", codigo: "120017", sigla: "PAMA-SP", nome: "Parque de Material Aeronautico de Sao Paulo", disponivel: 24150000, empenhado: 88600000, recebido: 112750000 },
    { diretoria: "DIRMAB", codigo: "120013", sigla: "PAME-RJ", nome: "Parque de Material de Eletronica do RJ", disponivel: 7330000, empenhado: 22950000, recebido: 30280000 },

    { diretoria: "DIRINFRA", codigo: "120042", sigla: "GAP-RJ", nome: "Grupamento de Apoio do Rio de Janeiro", disponivel: 11280000, empenhado: 39400000, recebido: 50680000 },
    { diretoria: "DIRINFRA", codigo: "120018", sigla: "GAP-SP", nome: "Grupamento de Apoio de Sao Paulo", disponivel: 9640000, empenhado: 31200000, recebido: 40840000 },

    { diretoria: "DTI", codigo: "120094", sigla: "DTI", nome: "Diretoria de Tecnologia da Informacao", disponivel: 18300000, empenhado: 30000000, recebido: 48300000 },
    { diretoria: "DTI", codigo: "120097", sigla: "CCA-BR", nome: "Centro de Computacao da Aeronautica de Brasilia", disponivel: 6450000, empenhado: 11200000, recebido: 17650000 },

    { diretoria: "CELOG", codigo: "120085", sigla: "CELOG", nome: "Centro Logistico da Aeronautica", disponivel: 38420000, empenhado: 142800000, recebido: 181220000 },
  ],

  // ---------------------------------------------------------------------------
  // Restos a Pagar (exercicios anteriores), por diretoria e tipo
  // RPP  = Restos a Pagar Processados (ja liquidados)
  // RPNP = Restos a Pagar Nao Processados (ainda nao liquidados)
  // ---------------------------------------------------------------------------
  restosAPagar: [
    { diretoria: "DIRMAB", tipo: "Processados", sigla: "RPP", inscrito: 12640000, cancelado: 520000, pago: 9880000 },
    { diretoria: "DIRMAB", tipo: "Nao Processados", sigla: "RPNP", inscrito: 31250000, cancelado: 2840000, liquidado: 18300000, pago: 14700000 },
    { diretoria: "DIRINFRA", tipo: "Processados", sigla: "RPP", inscrito: 6420000, cancelado: 310000, pago: 4180000 },
    { diretoria: "DIRINFRA", tipo: "Nao Processados", sigla: "RPNP", inscrito: 18900000, cancelado: 1640000, liquidado: 9300000, pago: 7200000 },
    { diretoria: "DTI", tipo: "Processados", sigla: "RPP", inscrito: 3180000, cancelado: 190000, pago: 2120000 },
    { diretoria: "DTI", tipo: "Nao Processados", sigla: "RPNP", inscrito: 8400000, cancelado: 760000, liquidado: 4100000, pago: 3300000 },
    { diretoria: "CELOG", tipo: "Processados", sigla: "RPP", inscrito: 6400000, cancelado: 300000, pago: 3700000 },
    { diretoria: "CELOG", tipo: "Nao Processados", sigla: "RPNP", inscrito: 15700000, cancelado: 1600000, liquidado: 9600000, pago: 8500000 },
  ],
};

// Metadados/configuracao do painel, reutilizados pelo conversor quando os dados
// vem das planilhas oficiais (data/fonte/*.csv). Ajuste `exercicio` e a lista de
// `diretorias` aqui caso mudem; os valores em si vem das planilhas.
export const config = {
  exercicio: dados.exercicio,
  orgao: dados.orgao,
  orgaoNome: dados.orgaoNome,
  diretorias: dados.diretorias,
};
