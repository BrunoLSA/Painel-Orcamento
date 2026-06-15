# Painel Orçamentário — DIRMAB

Sistema web **mobile-first** que apresenta um painel orçamentário da **Diretoria de Material Aeronáutico e Bélico (DIRMAB)**. Pensado para ser consultado rapidamente pelo celular (e também pelo computador), exibindo a situação orçamentária do exercício de forma clara e consolidada.

## Funcionalidades

O painel mostra:

- **Exportar PDF** — botão no cabeçalho que gera um relatório completo (todas as seções, com os gráficos e acordeões expandidos) via impressão do navegador (“Salvar como PDF”), respeitando os filtros ativos.
- **Seletor de exercício (ano)** — alterna o ano exibido; todas as seções são recalculadas.
- **Dotação do ano por Ação Orçamentária (AO)** — com detalhamento de recebido, empenhado, liquidado, pago e saldo a empenhar (acordeão expansível).
- **Crédito disponível DIREF por detalhes** — por Ação Orçamentária, Natureza de Despesa e Fonte.
- **Crédito disponível UGR** — por Unidade Gestora Responsável, com gráfico de rosca por Ação Orçamentária.
- **Execução da despesa** — barras de progresso de Recebido → Empenhado → Liquidado → Pago.
- **Restos a Pagar** — Processados (RPP) e Não Processados (RPNP); saldo a pagar **por AO** e **por UGR** (este com gráfico de rosca por Ação Orçamentária).
- **Cards de resumo** consolidados no topo (inclui **Destaques** — crédito recebido por destaque).

## Filtros

- **Exercício (ano):** seletor no topo; troca o ano e recalcula todas as seções.
- **Ação Orçamentária (AO):** chips de multisseleção (uma ou várias AOs) nas seções
  **Visão Geral** e **Crédito Disponível** (filtros independentes entre si).

A filtragem, a agregação por AO/tipo e o cálculo do resumo são feitos **no
frontend**, de modo que o painel se comporta de forma idêntica como site estático
(GitHub Pages) e via servidor local.

## Tecnologia

- **Backend:** Node.js + Express (serve a API JSON e os arquivos estáticos) — uso local.
- **Frontend:** HTML + CSS + JavaScript puro, responsivo e **sem dependências externas** (funciona offline, sem CDN). Gráficos e barras feitos em CSS; filtro e cálculos no cliente.
- Formatação em Real (BRL) e Português do Brasil.

## Como executar

```bash
npm install
npm start
```

Acesse: <http://localhost:3000>

Variável de ambiente opcional: `PORT` (padrão `3000`).

## Estrutura

```
.
├── server.js              # Servidor Express (API + estáticos) — uso local
├── data/
│   ├── orcamento.js       # Config (exercício, órgão) + dados de DEMONSTRAÇÃO (fallback)
│   └── fonte/             # Planilhas OFICIAIS (Tesouro Gerencial) em CSV
│       ├── execucao.csv
│       ├── credito_diref.csv
│       ├── credito_ugr.csv
│       ├── restos_a_pagar.csv
│       └── rap_ugr.csv
├── scripts/
│   └── build-data.mjs     # Converte data/fonte/*.csv → docs/data.json (ou usa o fallback)
├── docs/                  # Site estático (publicado pelo GitHub Pages)
│   ├── index.html         # Estrutura da página
│   ├── css/styles.css     # Estilos mobile-first
│   ├── js/app.js          # Busca data.json e renderiza o painel
│   └── data.json          # Dados estáticos (gerado por `npm run build`)
└── package.json
```

## Hospedagem no GitHub Pages

O painel funciona como **site 100% estático** — ideal para acessar pelo celular
sem instalar nada. Para publicar:

1. No GitHub, vá em **Settings → Pages**.
2. Em **Build and deployment → Source**, escolha **Deploy from a branch**.
3. Selecione a branch (`main` ou a branch deste trabalho) e a pasta **`/docs`**.
4. Salve. Em alguns minutos o painel ficará disponível em:
   `https://brunolsa.github.io/Painel-Orcamento/`

Ao atualizar as planilhas em `data/fonte/`, rode `npm run build` para regenerar
`docs/data.json` e faça commit do arquivo atualizado (ver seção de dados oficiais abaixo).

## Dados oficiais (Tesouro Gerencial / SIAFI)

O painel é alimentado por **planilhas CSV** exportadas do **Tesouro Gerencial / SIAFI**,
colocadas em `data/fonte/`. No `npm run build`, o conversor lê esses CSVs e gera o
`docs/data.json`. **Se as quatro planilhas existirem, valem os dados oficiais;** caso
contrário, usa-se o conjunto de demonstração de `data/orcamento.js`.

> Os CSVs versionados hoje contêm **dados de exemplo** — substitua-os pelas suas
> exportações reais (mantendo os cabeçalhos das colunas).

### Como atualizar os dados

1. No Tesouro Gerencial, gere/abra as quatro visões e **exporte cada uma como CSV**.
2. Salve sobre os arquivos em `data/fonte/` (mantendo os nomes e os cabeçalhos, incluindo a coluna `ano`).
3. Rode `npm run build` e faça commit do `docs/data.json` atualizado (e dos CSVs).
4. Os exercícios do seletor vêm da coluna `ano`; edite `data/orcamento.js` (config) se mudar o exercício padrão ou o nome do órgão.

O conversor aceita separador `;` ou `,` e números em formato brasileiro
(`1.234.567,89`), simples (`1234567.89`) ou inteiros, com ou sem `R$`.

### Planilhas e colunas (`data/fonte/`)

Coluna `ano` é o exercício (ex.: `2026`).
Para incluir mais de um exercício, basta acrescentar linhas com o `ano` correspondente
(em todas as planilhas) — o **seletor de ano** do painel é montado a partir dos anos presentes.

- **`execucao.csv`** — `ano;acao;acao_nome;dotacao;recebido;empenhado;liquidado;pago;destaque`
- **`credito_diref.csv`** — `ano;acao;nd;nd_nome;fonte;ptres;disponivel`
- **`credito_ugr.csv`** — `ano;ugr_codigo;ugr_sigla;ugr_nome;acao;disponivel` (uma linha por UGR × AO)
- **`restos_a_pagar.csv`** — `ano;tipo;sigla;inscrito;cancelado;liquidado;pago`
  (deixe `liquidado` vazio para os Processados/RPP)
- **`rap_ugr.csv`** — `ano;ugr_codigo;ugr_sigla;ugr_nome;acao;a_pagar` (saldo a pagar por UGR × AO)

### Formato do `data.json` gerado

Há a lista de `exercicios` disponíveis e cada registro inclui o campo `exercicio`:

- `exercicios[]`: anos disponíveis (mais recente primeiro) · `exercicioPadrao`: ano inicial
- `execucao[]`: `{ exercicio, ao, aoNome, dotacao, recebido, empenhado, liquidado, pago, destaque }`
- `creditoDiref[]`: `{ exercicio, ao, nd, ndNome, fonte, ptres, disponivel }`
- `creditoUGR[]`: `{ exercicio, codigo, sigla, nome, ao, disponivel }`
- `restosAPagar[]`: `{ exercicio, tipo, sigla, inscrito, cancelado, liquidado?, pago }`
- `restosAPagarUGR[]`: `{ exercicio, codigo, sigla, nome, ao, aPagar }`

O resumo consolidado (totais e percentuais), a agregação por AO e a filtragem por
**exercício** (e **AO** no Crédito) são calculados no frontend (`docs/js/app.js`), conforme os filtros ativos.

## API

- `GET /api/orcamento` — retorna o dataset bruto.
- `GET /api/health` — verificação de saúde do serviço.

---

> **Aviso:** os números exibidos são fictícios, para fins de demonstração da interface.
> Substitua-os pela fonte oficial antes de uso real.
