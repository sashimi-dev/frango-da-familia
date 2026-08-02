# 🍗 Frango da Família

Site institucional + cardápio para o **Frango da Família** (comida/frango para retirada, Palmas - TO).
Feito em **Astro** (saída 100% estática), com um painel de edição **Sveltia CMS** em `/admin` para o dono atualizar o cardápio e as imagens **sem mexer no código**.

- Pedidos pelo **WhatsApp** (botão em destaque + botão em cada item).
- Conteúdo todo em **português do Brasil**.
- Deploy gratuito no **Cloudflare Pages** conectado ao GitHub.

---

## 1. Rodar localmente

Pré-requisito: **Node.js 18+** (recomendado 20 ou 22).

```bash
npm install      # instala as dependências (só na primeira vez)
npm run dev      # inicia em http://localhost:4321
```

Outros comandos:

```bash
npm run build    # gera o site estático na pasta dist/
npm run preview  # pré-visualiza o resultado do build
```

> O painel `/admin` **não** funciona 100% no `localhost` por padrão (o login usa GitHub).
> Para editar conteúdo, use o `/admin` do site já publicado. Veja a seção 4.

---

## 2. Estrutura do projeto

```
frango-da-familia/
├── astro.config.mjs        # output: 'static'
├── package.json
├── public/
│   ├── admin/
│   │   ├── index.html       # carrega o Sveltia CMS
│   │   └── config.yml       # coleções do painel (cardápio + info)
│   ├── images/              # imagens (hero, promo, fotos dos pratos, uploads do /admin)
│   └── favicon.svg
└── src/
    ├── content/
    │   ├── config.ts        # esquema das coleções (validação)
    │   ├── menu/*.md         # 1 arquivo por prato
    │   └── site/info.json    # WhatsApp, endereço, horários, promoção
    ├── components/           # Hero, MenuSection, MenuItem, Promo, Info, TopBar
    ├── layouts/Base.astro
    ├── pages/index.astro     # página única com âncoras (#cardapio, #promo, #info)
    ├── lib/whatsapp.ts       # monta o link https://wa.me/...
    └── styles/global.css     # visual (mobile-first, tons quentes)
```

**Onde fica cada conteúdo:**

| O quê | Arquivo |
|---|---|
| Pratos do cardápio | `src/content/menu/*.md` (campos: `nome`, `descricao`, `preco`, `categoria`, `foto`, `ordem`, `disponivel`) |
| WhatsApp, telefone, endereço, mapa, horários, promoção, imagens | `src/content/site/info.json` |
| Imagens | `public/images/` (referenciadas por caminho, ex.: `/images/menu/arroz.svg`) |

Todo o conteúdo atual é **placeholder** — troque pelos dados reais (veja seção 5).

---

## 3. Publicar no Cloudflare Pages

### 3.1 Enviar para o GitHub

```bash
git init
git add .
git commit -m "Site Frango da Família"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/frango-da-familia.git
git push -u origin main
```

### 3.2 Criar o projeto no Cloudflare Pages

No painel da Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**, escolha o repositório e use **exatamente** estas configurações:

| Campo | Valor |
|---|---|
| **Framework preset** | `Astro` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | *(deixe em branco)* |
| **Node version** | `20` *(opcional; defina a variável de ambiente `NODE_VERSION = 20` se o build falhar)* |

Clique em **Save and Deploy**. Cada `git push` na branch `main` publica automaticamente.
Seu site ficará em `https://SEU-PROJETO.pages.dev`.

---

## 4. Login do dono (`/admin`)

O painel `/admin` grava as alterações **direto no GitHub** (que dispara um novo deploy). Para o dono conseguir entrar, é preciso configurar uma vez o login com GitHub. Existem **duas opções**:

### Opção A — Login com OAuth (recomendada para o dono não-técnico)

O dono entra clicando em "Login with GitHub" e digitando usuário/senha do GitHub. Requer um pequeno "porteiro" OAuth hospedado num **Cloudflare Worker** gratuito (o `sveltia-cms-auth`).

**Passo 1 — Criar um GitHub OAuth App**
1. GitHub → *Settings → Developer settings → OAuth Apps → New OAuth App*.
2. Preencha:
   - **Application name:** `Frango da Família CMS`
   - **Homepage URL:** `https://SEU-PROJETO.pages.dev`
   - **Authorization callback URL:** `https://sveltia-cms-auth.SEU-SUBDOMINIO.workers.dev/callback`
     *(você confirma essa URL no passo 2; pode voltar e ajustar)*
3. Guarde o **Client ID** e gere um **Client Secret**.

**Passo 2 — Publicar o Worker de autenticação**
1. Repositório oficial: <https://github.com/sveltia/sveltia-cms-auth>.
2. Faça deploy dele na sua conta Cloudflare (o README do projeto tem um botão "Deploy to Cloudflare" ou use `wrangler deploy`).
3. No Worker, defina as variáveis de ambiente:
   - `GITHUB_CLIENT_ID` = o Client ID do passo 1
   - `GITHUB_CLIENT_SECRET` = o Client Secret do passo 1
4. Anote a URL do Worker: `https://sveltia-cms-auth.SEU-SUBDOMINIO.workers.dev`.
5. Volte no GitHub OAuth App e confirme que o **callback** é essa URL + `/callback`.

**Passo 3 — Apontar o painel para o Worker**
No arquivo `public/admin/config.yml`, ajuste:
```yaml
backend:
  name: github
  repo: SEU-USUARIO/frango-da-familia   # usuário/repositório
  branch: main
  base_url: https://sveltia-cms-auth.SEU-SUBDOMINIO.workers.dev
```
Faça `git push`. Pronto: o dono acessa `https://SEU-PROJETO.pages.dev/admin/` e clica em **Login with GitHub**.

> O dono precisa ter uma conta no GitHub **com acesso ao repositório** (peça para ele criar uma conta gratuita e adicione-o como *Collaborator* em *Settings → Collaborators*).

### Opção B — Login com token (mais simples, ideal para você/desenvolvedor)

O Sveltia CMS também aceita entrar com um **Personal Access Token (PAT)** do GitHub, sem Worker nenhum. Na tela de login do `/admin`, escolha a opção de token e cole um PAT com permissão no repositório. É a via mais rápida se **você** for quem edita. Para o dono não-técnico, a Opção A é mais amigável.

---

## 5. Como o dono usa o `/admin`

Depois de configurado (seção 4), o dia a dia é simples:

1. Acessar `https://SEU-PROJETO.pages.dev/admin/` e clicar em **Login with GitHub**.
2. **Editar o cardápio** → coleção **"Cardápio"**:
   - *Novo item:* botão **"New Item do cardápio"**, preencher nome, descrição, preço, categoria, foto e salvar/publicar.
   - *Alterar preço ou foto:* abrir o item, editar, publicar.
   - *Esconder um item temporariamente:* desmarcar **"Disponível?"** (ele some do site sem ser apagado).
   - *Ordem:* o campo **"Ordem de exibição"** controla a posição dentro da categoria (menor primeiro).
3. **Trocar imagem de marketing / promoção** → coleção **"Informações do negócio" → "Dados, horários e promoção"**: alterar **Promoção — imagem/título/texto** e a **Imagem principal (hero)**.
4. **Atualizar horários, endereço, WhatsApp** → mesma tela de "Informações do negócio".
5. Clicar em **Publish**. Em ~1 minuto o Cloudflare Pages republica e o site é atualizado.

> Toda alteração vira um commit no GitHub — dá para desfazer qualquer coisa pelo histórico do repositório.

---

## 6. Trocar os placeholders

- **Número do WhatsApp:** `src/content/site/info.json` → campo `whatsapp` (formato `55` + DDD + número, só dígitos. Ex.: `5563999999999`). Também editável pelo `/admin`.
- **Fotos dos pratos e do hero/promoção:** substitua os arquivos em `public/images/` (mantendo os nomes) **ou** envie novas pelo `/admin`.
- **Endereço e link do mapa:** `info.json` (`endereco`, `mapa_url`).
- **Domínio próprio:** em `astro.config.mjs`, ajuste `site:` para o domínio final; no Cloudflare Pages, adicione o domínio em *Custom domains*.

---

## Notas técnicas

- **Sem runtime de servidor:** `output: 'static'` gera apenas HTML/CSS/JS. O `/admin` é uma página estática que fala com o GitHub via API — nada roda no servidor do site.
- **WhatsApp:** links no formato `https://wa.me/55DDDNUMERO?text=<mensagem>` (montados em `src/lib/whatsapp.ts`).
- **Validação de conteúdo:** `src/content/config.ts` valida os campos no build — se um item ficar com dado inválido, o build acusa o erro.
