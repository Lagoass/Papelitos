# Hub (Shell) — Arquitetura do App

> **Escopo:** tudo que é do APP e compartilhado entre jogos — shell, registry, temas, PWA,
> instalação, splash e deploy. O contrato dos jogos locais vive em `pass-phone.md`; o spec
> de cada jogo em `../specs/<jogo>.md`; a base de UI em `UserInterface.md`.

---

## 1. Stack

```
Runtime:       React 18 + Vite
Estilização:   Tailwind CSS (utilitárias do core + keyframes próprios em index.css)
Fonte display: Fredoka Variable via @fontsource-variable/fredoka (self-hosted no bundle)
PWA:           vite-plugin-pwa (Service Worker + manifest, registerType: autoUpdate)
Deploy:        Cloudflare Pages
Persistência:  localStorage (por jogo + chaves do shell)
Estado:        cada jogo tem seu Context + useReducer; o shell não tem estado de jogo
```

Sem Next.js. Sem SSR. 100% client-side. Sem backend (até a categoria conectada — Change.md fase 3+).

## 2. Estrutura de Pastas

```
src/
├── shell/                          ← tudo do HUB, compartilhado entre jogos
│   ├── games.js                    ← REGISTRY: a costura shell ↔ jogos (ver §3)
│   ├── screens/
│   │   ├── HomeScreen/             ← home bento (UserInterface.md §6.1) + ⚙️ + InstallBanner
│   │   ├── SettingsScreen/         ← tema (cycle) + regras por jogo (via registry)
│   │   └── SplashScreen/           ← splash interno (delay 800–2000ms; pulado com save)
│   ├── components/
│   │   ├── Button/                 ← botão padrão (squash & stretch, vibração)
│   │   └── InstallBanner/          ← prompt de instalação PWA
│   ├── hooks/useInstallPrompt.js
│   └── utils/
│       ├── themes.js               ← THEMES, getTheme, applyTheme, cycleTheme
│       └── confetti.js             ← canvas próprio, zero deps, paleta espelhada
├── games/
│   └── papelito/                   ← módulo do jogo (ver pass-phone.md + specs/papelito.md)
│       └── index.jsx               ← entry: PapelitoGame({ onExit, autoResume })
├── App.jsx                         ← roteia home ↔ jogo ativo; React.lazy por jogo
├── index.css                       ← Tailwind + kit app-like + vocabulário de animação + temas
└── main.jsx                        ← fredoka + tema no boot + createRoot
```

**Aliases Vite** (`vite.config.js`): `@shell` → `src/shell`, `@games` → `src/games`.
Módulos de jogo importam do shell APENAS via `@shell/...`; o shell importa de jogo apenas
dentro de `games.js` (o registry é a única costura permitida).

**Critério shell vs jogo:** se dois jogos usariam, é shell. Na dúvida, nasce no módulo e
sobe quando o segundo jogo precisar.

## 3. Registry de jogos (`shell/games.js`)

Cada jogo declara: `id`, `name`, `emoji` (personagem do card), `category`
(`pass` | `connected`), `accent` (cor de identidade fixa, independe do tema), `gradient`
(arte do card), `meta` (linha `👥 · ⏱`), `saveKey` (chave localStorage do save) e `rules`
(array `{title, body}` exibido no SettingsScreen).

Helpers: `getSavedGame(game)` lê o save e retorna `null` se `phase` for `setup`/`gameOver`
(acoplamento documentado: o shell só conhece `{ phase, round }` do save de um jogo —
o suficiente para o card "Continuar partida"); `hasAnyOngoingGame()` decide o skip do splash.

## 4. App.jsx — roteamento do shell

- `active = null` → `HomeScreen`; `active = { id, resume }` → componente do jogo.
- Jogos são `React.lazy` — o bundle inicial é só o hub; o chunk do jogo baixa ao entrar.
- Contrato com o módulo: `<Game onExit={voltar à home} autoResume={retomada em 1 toque} />`.
- Splash: renderizado por cima de tudo em abertura "limpa"; pulado quando
  `hasAnyOngoingGame()` (o usuário quer voltar rápido — o card Continuar está a 1 toque).

## 5. Sistema de Temas

Aplicados via classe `theme-{id}` em `<html>` E `<body>` (html cobre a safe-area do recorte
da câmera — sem isso há "costura" visível no topo). Overrides CSS em `index.css`.

| ID | Label | bg |
|----|-------|-----|
| `mono` (default) | Mono | `#0E0E0E` (charcoal — UserInterface.md §3.1) |
| `synthwave` | Synthwave | `#0f0820` |
| `minimal` | Minimal | `#09090b` |
| `casino` | Casino | `#052e16` |
| `junina` | Junina | `#1c0a0a` |
| `light` | Light | `#fef9f0` |

**API (`shell/utils/themes.js`):** `getTheme()`, `applyTheme(id)` (persiste, aplica classes
e sincroniza `<meta name="theme-color">` com o bg — alguns Androids pintam a safe-area com
esse valor), `cycleTheme(currentId)`, `themeLabel(id)`, `THEMES`, `DEFAULT_THEME`.

**Boot sem flash:** script inline no `<head>` do `index.html` lê o localStorage e aplica
classe + meta + background-color no `<html>` ANTES do bundle carregar. O mapa de cores do
script inline DEVE ficar em sincronia com `THEMES` (dois pontos de verdade deliberados —
o script não pode importar o módulo).

**Override de componentes:** os componentes usam classes Tailwind padrão (`bg-black`,
`bg-zinc-800`, `text-zinc-400`...) e cada tema as sobrescreve via
`body.theme-X .bg-black { ... !important }`. Ao introduzir classe nova de cor, avaliar se
precisa de override por tema. O grain overlay global (body::after, feTurbulence) vale para
todos os temas.

## 6. PWA — manifest, instalação e splash

**Manifest (vite.config.js):** `display: 'fullscreen'` + `display_override:
['fullscreen','standalone','minimal-ui']` — esconde address bar E botões de navegação do
Android quando instalado. **Só é lido na instalação**: mudanças de nome/ícone/display exigem
reinstalar o PWA. Em aba de navegador, nada disso se aplica (decisão do browser).

**Meta tags (`index.html`):** `viewport-fit=cover`, `mobile-web-app-capable`, `apple-mobile-
web-app-capable/status-bar-style/title`, `apple-touch-icon` (iOS não lê manifest p/ isso).

**Instalação (`useInstallPrompt` + `InstallBanner` na HomeScreen):** captura
`beforeinstallprompt` (Chrome/Edge/Samsung), detecta iOS (sem evento → modal de instruções
Compartilhar → Adicionar à Tela de Início), detecta standalone via `display-mode`, persiste
dispensa. Critérios do Chrome p/ prompt: manifest válido + SW + ícones 192/512 + HTTPS +
~30s de interação.

**Splash interno (`SplashScreen`):** logo com rounded + spinner, delay aleatório 800–2000ms,
fade-out 300ms. Cobre a transição rígida do splash nativo do Android.

## 7. Chaves de localStorage

| Chave | Dono | Conteúdo |
|-------|------|----------|
| `papelito_game_state` | jogo Papelito | save da partida em andamento (limpo em gameOver) |
| `papelito_test_mode` | jogo Papelito | flag do modo de teste (combo secreto) |
| `lagames_theme` | shell | id do tema ativo (migra de `papelito_theme` com fallback de leitura) |
| `lagames_install_dismissed` | shell | dispensa do banner de instalação (fallback da chave antiga) |

Todas independentes. Prefixo por dono: chaves do shell usam `lagames_*`; chaves de jogo
usam `<gameId>_*`. O script inline do `index.html` também lê `lagames_theme` com fallback.

## 8. Deploy — Cloudflare Pages

```
Build command:  npm run build
Output dir:     dist
Node version:   18
```

`public/_redirects` com `/* /index.html 200` é obrigatório (SPA fallback).
Conteúdo (JS/CSS/HTML) atualiza sozinho via Service Worker (`autoUpdate` — pode exigir
abrir o app duas vezes); a "casca" instalada (manifest) não.
