# Painel Orçamentário — COMGAP

Sistema web **mobile-first** que apresenta um painel orçamentário do **Comando-Geral de Apoio (COMGAP)**. Pensado para ser consultado rapidamente pelo celular (e também pelo computador), exibindo a situação orçamentária do exercício de forma clara e consolidada.

## Funcionalidades

O painel mostra:

- **Dotação do ano por Ação Orçamentária (AO)** — com detalhamento de recebido, empenhado, liquidado, pago e saldo a empenhar (acordeão expansível).
- **Crédito disponível DIREF por detalhes** — por Ação Orçamentária, Natureza de Despesa e Fonte.
- **Crédito disponível UGE** — por Unidade Gestora Executora, com recebido e empenhado.
- **Execução da despesa** — barras de progresso de Recebido → Empenhado → Liquidado → Pago.
- **Restos a Pagar** — Processados (RPP) e Não Processados (RPNP), com inscrito, cancelado, liquidado, pago e saldo a pagar.
- **Cards de resumo** consolidados no topo.

## Tecnologia

- **Backend:** Node.js + Express (API JSON e arquivos estáticos).
- **Frontend:** HTML + CSS + JavaScript puro, responsivo e **sem dependências externas** (funciona offline, sem CDN). Gráficos e barras feitos em CSS.
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
│   └── orcamento.js       # Fonte ÚNICA de dados (substituível) + cálculo do resumo
├── scripts/
│   └── build-data.mjs     # Gera docs/data.json a partir de data/orcamento.js
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

Ao alterar os dados em `data/orcamento.js`, rode `npm run build` para regenerar
`docs/data.json` e faça commit do arquivo atualizado.

## Integração com dados reais

Os dados em `data/orcamento.js` são de **demonstração**. Para usar dados oficiais,
basta substituir o objeto `dados` por uma carga vinda do **Tesouro Gerencial / SIAFI**
(planilha exportada, banco de dados ou API), mantendo o mesmo formato. Nenhuma outra
parte do sistema precisa ser alterada.

### Formato dos dados

- `acoesOrcamentarias[]`: `{ codigo, nome, dotacao, recebido, empenhado, liquidado, pago }`
- `creditoDirefDetalhes[]`: `{ ao, nd, ndNome, fonte, ptres, disponivel }`
- `creditoUGE[]`: `{ codigo, sigla, nome, disponivel, empenhado, recebido }`
- `restosAPagar[]`: `{ tipo, sigla, inscrito, cancelado, liquidado?, pago }`

O resumo consolidado (totais e percentuais) é calculado automaticamente em
`calcularResumo()`.

## API

- `GET /api/orcamento` — retorna todos os dados do painel já com o resumo consolidado.
- `GET /api/health` — verificação de saúde do serviço.

---

> **Aviso:** os números exibidos são fictícios, para fins de demonstração da interface.
> Substitua-os pela fonte oficial antes de uso real.
