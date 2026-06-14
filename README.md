# Painel Orçamentário — COMGAP

Sistema web **mobile-first** que apresenta um painel orçamentário do **Comando-Geral de Apoio (COMGAP)**. Pensado para ser consultado rapidamente pelo celular (e também pelo computador), exibindo a situação orçamentária do exercício de forma clara e consolidada.

## Funcionalidades

O painel mostra:

- **Filtro por diretoria do COMGAP** — barra de chips no topo (**Todas · DIRMAB · DIRINFRA · DTI · CELOG**) que recalcula **todas** as seções para a diretoria selecionada.
- **Dotação do ano por Ação Orçamentária (AO)** — com detalhamento de recebido, empenhado, liquidado, pago e saldo a empenhar (acordeão expansível).
- **Crédito disponível DIREF por detalhes** — por Ação Orçamentária, Natureza de Despesa e Fonte.
- **Crédito disponível UGE** — por Unidade Gestora Executora, com recebido e empenhado.
- **Execução da despesa** — barras de progresso de Recebido → Empenhado → Liquidado → Pago.
- **Restos a Pagar** — Processados (RPP) e Não Processados (RPNP), com inscrito, cancelado, liquidado, pago e saldo a pagar.
- **Cards de resumo** consolidados no topo.

## Filtro por diretoria

Cada lançamento do dataset (execução, DIREF, UGE e Restos a Pagar) é associado a
uma **diretoria do COMGAP**. Ao selecionar um chip:

- na visão **Todas**, os dados são consolidados (somados) entre as diretorias, e a
  origem aparece como etiqueta/coluna de diretoria nas tabelas;
- ao escolher uma diretoria, todas as seções passam a exibir apenas os dados dela.

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
│   ├── orcamento.js       # Config (exercício, diretorias) + dados de DEMONSTRAÇÃO (fallback)
│   └── fonte/             # Planilhas OFICIAIS (Tesouro Gerencial) em CSV
│       ├── execucao.csv
│       ├── credito_diref.csv
│       ├── credito_uge.csv
│       └── restos_a_pagar.csv
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
2. Salve sobre os arquivos em `data/fonte/` (mantendo os nomes e os cabeçalhos).
3. Rode `npm run build` e faça commit do `docs/data.json` atualizado (e dos CSVs).
4. Em `data/orcamento.js`, ajuste `exercicio` e a lista de `diretorias` se necessário.

O conversor aceita separador `;` ou `,` e números em formato brasileiro
(`1.234.567,89`), simples (`1234567.89`) ou inteiros, com ou sem `R$`.

### Planilhas e colunas (`data/fonte/`)

Coluna `diretoria` aceita `DIRMAB | DIRINFRA | DTI | CELOG`.

- **`execucao.csv`** — `diretoria;acao;acao_nome;dotacao;recebido;empenhado;liquidado;pago`
- **`credito_diref.csv`** — `diretoria;acao;nd;nd_nome;fonte;ptres;disponivel`
- **`credito_uge.csv`** — `diretoria;ug_codigo;ug_sigla;ug_nome;disponivel;empenhado;recebido`
- **`restos_a_pagar.csv`** — `diretoria;tipo;sigla;inscrito;cancelado;liquidado;pago`
  (deixe `liquidado` vazio para os Processados/RPP)

### Formato do `data.json` gerado

Cada registro inclui o campo `diretoria` (`"DIRMAB" | "DIRINFRA" | "DTI" | "CELOG"`):

- `diretorias[]`: `{ sigla, nome }`
- `execucao[]`: `{ diretoria, ao, aoNome, dotacao, recebido, empenhado, liquidado, pago }`
- `creditoDiref[]`: `{ diretoria, ao, nd, ndNome, fonte, ptres, disponivel }`
- `creditoUGE[]`: `{ diretoria, codigo, sigla, nome, disponivel, empenhado, recebido }`
- `restosAPagar[]`: `{ diretoria, tipo, sigla, inscrito, cancelado, liquidado?, pago }`

O resumo consolidado (totais e percentuais), a agregação por AO e a filtragem por
diretoria são calculados no frontend (`docs/js/app.js`), conforme o filtro ativo.

## API

- `GET /api/orcamento` — retorna o dataset bruto (com a dimensão `diretoria`).
- `GET /api/health` — verificação de saúde do serviço.

---

> **Aviso:** os números exibidos são fictícios, para fins de demonstração da interface.
> Substitua-os pela fonte oficial antes de uso real.
