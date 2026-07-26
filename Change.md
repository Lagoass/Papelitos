# Change.md — Plano de Migração: Papelito → LaGames

> **Status: PLANEJAMENTO — nada implementado.** Este documento registra a visão e o plano de ação
> para transformar o app Papelito em **LaGames**, um hub de jogos de festa. Ele complementa o
> `content.md` (spec do Papelito, que permanece válida) e deve ser atualizado conforme as fases
> forem executadas. Nenhuma fase deste plano altera a mecânica do Papelito.

---

## 1. Visão

O Papelito deixa de ser *o app* e passa a ser *o primeiro jogo* de um hub chamado **LaGames**:
um único PWA, um único repositório, um único deploy no Cloudflare, contendo múltiplos jogos de
festa organizados em duas categorias com naturezas técnicas distintas.

```
LaGames (PWA — shell compartilhado: home, temas, settings, splash)
├── 📱 Passa o Celular          → 1 telefone, zero rede, 100% offline
│   └── Papelito                → intocado, como é hoje
└── 📶 Todos Conectados         → N telefones na mesma partida, via sala
    └── (futuros: Ludo, Truco, quiz/buzzer...)
```

---

## 2. As duas categorias — separação fundamental

Esta é a decisão arquitetural central do LaGames. As categorias não são apenas rótulos de UI:
são **modelos de execução diferentes**, e cada jogo pertence explicitamente a uma delas.

| | 📱 **Passa o Celular** | 📶 **Todos Conectados** |
|---|---|---|
| Dispositivos | 1 celular compartilhado | 1 celular por jogador |
| Onde roda o reducer | **No telefone** (como o Papelito hoje) | **No servidor** (Durable Object) |
| Rede | Nunca — funciona offline | Obrigatória durante a partida |
| Lobby / sala | **Não existe** — abre e joga | Sim — código de sala + QR |
| Persistência | localStorage do aparelho | Storage do Durable Object |
| Fonte da verdade | O próprio estado local | O servidor (estado autoritativo) |
| Exemplos | Papelito | Ludo, Truco, quiz buzzer |

**Princípio de ouro:** *rede é um custo — só pague quando ela compra algo.* O que ela compra é
sincronização entre dispositivos. Jogo de um telefone só não tem o que sincronizar, portanto
não paga o custo: sem lobby, sem latência, sem dependência de sinal. O offline do Papelito é
uma feature de produto (festa na praia, fazenda, porão sem sinal), não um detalhe técnico.

**Anti-padrão explicitamente rejeitado:** migrar os jogos pass-and-play para Durable Objects
"por consistência". Uniformidade de arquitetura não é valor em si; a arquitetura segue o
problema. Estado local e estado distribuído são problemas diferentes e permanecem separados.

---

## 3. Nova estrutura de pastas

Reorganização em **shell + módulos de jogo**. Mudança de embalagem, não de lógica: o código do
Papelito move de lugar sem alterar um byte de comportamento.

```
lagames/                            ← repo (único — ver seção 7)
├── public/
│   ├── icons/                      ← ícones LaGames (rebrand)
│   └── _redirects
├── src/
│   ├── shell/                      ← tudo que é do HUB, compartilhado entre jogos
│   │   ├── screens/
│   │   │   ├── HomeScreen/         ← NOVA: escolha de categoria + jogo
│   │   │   ├── SettingsScreen/     ← movida do Papelito (temas valem p/ o hub todo)
│   │   │   └── SplashScreen/       ← movida (splash é do app, não do jogo)
│   │   ├── components/             ← Button, InstallBanner e futuros compartilhados
│   │   ├── hooks/                  ← useInstallPrompt e futuros compartilhados
│   │   └── utils/                  ← themes.js e futuros compartilhados
│   │
│   ├── games/
│   │   └── papelito/               ← módulo Papelito — mecânica INTOCADA
│   │       ├── screens/            ← Setup, WordInput, Turn, Results... (como hoje)
│   │       ├── components/         ← WordCard, Timer, ScoreBoard, RoundBadge...
│   │       ├── store/              ← GameContext, gameReducer, initialState
│   │       ├── hooks/              ← useTimer, useWakeLock, useLocalStorage
│   │       ├── utils/              ← shuffle, colors, teams, dev, storage
│   │       └── data/               ← rules.js
│   │
│   ├── App.jsx                     ← roteia: home ↔ jogo ativo
│   ├── index.css
│   └── main.jsx
│
├── server/                         ← FUTURO (fase 3+): Worker + Durable Objects
│   ├── index.js                    ← Worker: rotas /api/room/*, upgrade WebSocket
│   └── rooms/                      ← 1 classe de DO por jogo conectado
│
├── docs/                           ← documentação em 3 camadas (ver 3.1)
│   ├── architecture/               ← os PADRÕES — escritos uma vez, valem p/ todos os jogos
│   │   ├── hub.md                  ← shell, temas, PWA, deploy (nível app)
│   │   ├── pass-phone.md           ← contrato da categoria Passa o Celular
│   │   └── connected.md            ← contrato da categoria Todos Conectados (fase 3+)
│   ├── rulebook/                   ← regras de cada jogo — visão do JOGADOR
│   │   └── papelito.md             ← semeado a partir do rules.md atual
│   └── specs/                      ← só o que é ÚNICO de cada jogo — visão DEV
│       └── papelito.md             ← estado, actions e regras do Papelito (spec fino)
│
├── index.html
├── vite.config.js
├── Change.md                       ← este documento (escopo: o hub / migração)
├── UserInterface.md                ← base de UI do hub + nuances por jogo (na fase 1 move p/ docs/architecture/)
└── progress.md
```

Diretrizes:

- **Critério shell vs jogo:** se dois jogos usariam, é shell. Se é regra/tela de UM jogo, é do
  módulo. Na dúvida, começa no módulo e sobe para o shell quando o segundo jogo precisar.
- **Namespace de storage:** cada jogo prefixa suas chaves (`papelito_*` já segue isso). Chaves
  do hub: `lagames_*` (tema, install banner — migrar as atuais `papelito_theme` e
  `papelito_install_dismissed` com fallback de leitura).
- **Lazy loading:** cada módulo de jogo importado com `React.lazy` na HomeScreen, para o bundle
  inicial do hub não crescer com cada jogo novo.
- **Workspaces (npm) ficam para depois:** pastas simples primeiro; formalizar `packages/*`
  apenas se/quando a complexidade justificar.

### 3.1 Documentação em 3 camadas — padrão de categoria vs spec de jogo

Princípio: **arquitetura é padronizada por CATEGORIA; cada jogo só documenta o que tem de
único.** Todo jogo pass-phone se comporta da mesma forma estrutural; todo jogo conectado
também. O `content.md` atual mistura três níveis — na migração ele é **fatiado, não descartado**:

| Camada | Doc | Escrito | Conteúdo |
|---|---|---|---|
| App | `docs/architecture/hub.md` | 1× | Shell, temas, PWA/manifest, install, deploy Cloudflare |
| Categoria | `docs/architecture/pass-phone.md` | 1× | O CONTRATO dos jogos locais: reducer puro + Context, máquina de fases + mapeamento phase→screen, persistência localStorage (prefixo por jogo, save contínuo, clear em gameOver, modal de retomada), integração com o shell (lazy loading, como o jogo se registra na Home), exigência de offline |
| Categoria | `docs/architecture/connected.md` | 1× | O CONTRATO dos jogos conectados: sala/DO, protocolo de mensagens, reducer no servidor, visão-por-jogador, reconexão (seção 4 deste doc é a semente) |
| Jogo | `docs/specs/<jogo>.md` | por jogo | **Só o que é único**: shape do estado, tabela de actions, regras mapeadas (ex: as 4 rodadas do Papelito, rotação least-turns, modo de teste). Referencia o doc da categoria, não o repete |
| Jogo | `docs/rulebook/<jogo>.md` | por jogo | Regras na visão do jogador (semente: `rules.md` atual) |

Regras do padrão:

- **O doc de categoria é o guia de "como criar um jogo novo"**: seguir o template + escrever
  um spec fino + um rulebook. Se dois specs repetem o mesmo conteúdo, ele pertence à camada
  de cima (categoria ou hub) — promover.
- **Todo jogo novo nasce com rulebook + spec.** Rulebook antes de codar (define o produto);
  spec cresce junto com a implementação.
- **Nada do conteúdo técnico atual é descartado** — o `content.md` é redistribuído entre
  `hub.md`, `pass-phone.md` e `specs/papelito.md`. É esse material que garante consistência
  entre sessões de desenvolvimento.
- **`data/rules.js` de cada jogo (accordion in-app) é derivado do rulebook** — o rulebook é a
  fonte da verdade das regras; o `.js` é a versão resumida para leitura mobile.
- `rules.md` e `content.md` da raiz deixam de existir após a fase 1 (fatiados em `docs/`).

---

## 4. Todos Conectados — arquitetura com Durable Objects

> ⚠️ **Esta seção requer estudo prático antes da implementação** (fase 3). O desenho abaixo é a
> direção validada conceitualmente; números de latência/custo devem ser confirmados com um
> protótipo real. Referência de mercado a estudar: **PartyKit / partyserver** (framework de
> salas multiplayer sobre Durable Objects, absorvido pelo Cloudflare).

### 4.1 Por que Durable Objects

- **Uma sala = um objeto.** DO é uma instância única no mundo, endereçada por chave — a chave é
  o código da sala (`PAPO-42` → sempre o mesmo objeto). Elimina o problema de "em qual servidor
  está minha partida".
- **WebSockets nativos** com estado em memória + storage SQLite embutido (a partida sobrevive a
  hibernação/eviction do objeto).
- **Alarms** para expirar salas abandonadas sem cron externo.
- Mesma origem do PWA (Worker no mesmo domínio) → sem CORS, sem infra própria.
- Custo: free tier deve cobrir uso hobby; plano Workers pago é ~US$5/mês. **[validar limites
  atuais do free tier na fase de estudo]**

Alternativas rejeitadas: WebRTC P2P (precisa signaling + TURN, migração de host é pesadelo),
BaaS externo tipo Firebase (fornecedor extra sem necessidade, já temos Cloudflare), polling em
KV/D1 (KV é eventualmente consistente — inadequado para estado de jogo).

### 4.2 Modelo de execução: reducer autoritativo no servidor

A arquitetura do Papelito (ação → reducer puro → novo estado) **é** o modelo multiplayer
correto — muda apenas onde o reducer executa:

```
celular A ──(action: HIT)──▶ ┌──────────────────────────┐
celular B ◀──(state v42)──── │ Durable Object da sala   │
celular C ◀──(state v42)──── │  • estado autoritativo   │
                             │  • reducer do jogo       │
                             │  • valida + broadcast    │
                             └──────────────────────────┘
```

Clientes são "terminais": enviam ações, recebem estado, renderizam. Toda validação de jogada é
do servidor — resolve trapaça, conflito de ações simultâneas e dessincronização de uma vez.

### 4.3 Protocolo de mensagens (rascunho)

```
cliente → servidor:
  { type: 'JOIN',   room, playerId?, token?, name }     ← playerId/token ausentes = jogador novo
  { type: 'ACTION', seq, action: { type: 'HIT', ... } } ← ação do jogo, opaca p/ o transporte
  { type: 'PING' }

servidor → cliente:
  { type: 'WELCOME',  playerId, token, view, stateVersion }  ← snapshot completo ao entrar/reconectar
  { type: 'STATE',    view, stateVersion }                   ← broadcast após cada ação válida
  { type: 'PRESENCE', players: [{ id, name, online }] }
  { type: 'ERROR',    code, message }
  { type: 'PONG' }
```

- **`stateVersion` (número de sequência):** cliente descarta mensagens com versão menor que a
  atual — imuniza contra entrega fora de ordem/atrasada.
- **`view`, não `state`:** o servidor envia a cada jogador **apenas o que ele pode ver**
  (estado público + informação privada dele). Essencial para jogos com informação oculta
  (mão do Truco): o que não chega ao telefone não pode ser trapaceado via DevTools.

### 4.4 Reconexão — a feature mais importante do multiplayer mobile

Celular apaga tela, troca de aba, oscila o 4G: o WebSocket **vai** morrer o tempo todo
(iOS é especialmente agressivo). Desenhar assumindo conexão descartável:

1. Ao entrar, o jogador recebe `playerId` + `token`, persistidos no localStorage.
2. Reconectou → envia `JOIN` com credenciais → recebe `WELCOME` com snapshot completo
   (o estado é um JSON pequeno; resync integral é barato e elimina bugs de delta).
3. Presença com **período de graça**: jogador cai → marcado offline → nunca removido
   automaticamente por queda momentânea; o jogo espera ou o grupo decide.
4. Heartbeat (PING/PONG) para detectar conexão zumbi.

### 4.5 Boas práticas de latência **[foco do estudo prático]**

- **WebSocket Hibernation API** (não a API clássica): o DO hiberna entre mensagens sem derrubar
  conexões — reduz custo drasticamente e mantém latência de retomada baixa.
- **Localização do DO:** o objeto nasce próximo de quem faz a primeira requisição (o host da
  sala). Para jogo presencial (todos na mesma rede/cidade) isso é ideal por padrão.
  **[estudar `locationHint` para casos remotos]**
- **Estado em memória, storage como backup:** reducer opera sobre o estado em RAM do DO;
  persistir no SQLite embutido a cada ação (barato) para sobreviver a eviction.
- **Snapshot completo vs diffs:** com estado pequeno (caso dos nossos jogos), broadcast do
  snapshot é mais simples e robusto que diffs. Só otimizar se o estado crescer.
- **Sem otimismo no cliente:** jogo de turno espera o servidor confirmar (50–150ms é invisível
  perto da decisão humana). Elimina toda a classe de bugs de rollback/conflito.
- **TTL via alarms:** sala sem atividade por N horas → alarm limpa o objeto.

### 4.6 Ciclo de vida da sala

```
criar (host) → lobby (código + QR na tela do host; jogadores entram, escolhem nome)
            → jogando (reducer autoritativo)
            → encerrada (resultado; sala expira por TTL)
```

- Código de sala: 4–5 caracteres legíveis (sem ambíguos 0/O, 1/I).
- **QR code no lobby** — para jogo presencial é o caminho principal de entrada.

### 4.7 PWA + multiplayer

- Wake Lock durante partida conectada (já dominamos no Papelito).
- **Web Push** ("é a sua vez!") para jogos de turno lento — funciona em PWA instalado inclusive
  no iOS 16.4+. **[fase futura, não-MVP]**

---

## 5. Rebrand: Papelito → LaGames

| Item | Mudança |
|---|---|
| Nome/título | `Papelito` → `LaGames` no manifest, `<title>`, header do hub |
| Ícones | Novos ícones 192/512 do LaGames (o ícone do Papelito vira arte do módulo) |
| Splash | Logo LaGames no splash do app; identidade do Papelito aparece ao abrir o jogo |
| manifest.json | `name`, `short_name`, `description`, ícones |
| Storage do hub | Novas chaves `lagames_*` com migração/fallback das `papelito_*` de shell |

> ⚠️ **Manifest só é lido na instalação:** usuários com o PWA instalado precisarão reinstalar
> para ver nome/ícone novos (o conteúdo atualiza sozinho via service worker, a "casca" não).
> Planejar o rebrand em um único release para pedir reinstalação uma vez só.

---

## 6. Plano de fases — da estrutura atual à nova

Cada fase é entregável e deixa o app funcional. Nenhuma fase quebra o Papelito.

> **Meta atual: Fases 1 e 2** — a transformação em hub (LaGames). As Fases 3 e 4 vêm na
> sequência, quando decidirmos atacar a categoria conectada. A Fase 5 é **meta de longo
> prazo**, registrada aqui apenas para orientar as decisões de arquitetura.

### Fase 1 — Hub + módulo Papelito (sem rede, sem rebrand)
- Criar `src/shell/` e `src/games/papelito/`; mover arquivos conforme seção 3.
- Criar `HomeScreen` (categorias + card do Papelito) e roteamento shell ↔ jogo.
- Mover Settings/Splash/temas/InstallBanner para o shell.
- Reorganizar documentação conforme 3.1: fatiar `content.md` em `docs/architecture/hub.md` +
  `docs/architecture/pass-phone.md` + `docs/specs/papelito.md`; `rules.md` →
  `docs/rulebook/papelito.md`.
- **Critério de aceite:** Papelito joga exatamente como hoje; única diferença visível é a home.
- Risco: baixo (só movimentação). É a fase que valida a estrutura multi-jogos.

### Fase 2 — Rebrand LaGames
- Nome, ícones, manifest, splash, chaves de storage do shell (com migração).
- Comunicar necessidade de reinstalação do PWA.
- **Critério de aceite:** app instala como "LaGames"; Papelito intacto dentro dele.

### Fase 3 — Infra conectada: lobby "hello world" **[após estudo da seção 4]**
- `server/` com Worker + 1 Durable Object de sala genérica.
- Criar sala, código + QR, entrar, presença ao vivo, reconexão com token. **Sem jogo ainda.**
- **Critério de aceite:** 3+ celulares reais na mesma sala vendo presença um do outro,
  sobrevivendo a tela apagada/4G oscilando.
- Este é o degrau que exercita 80% da dificuldade (salas, WebSocket, reconexão) com 0% de
  regra de jogo.

### Fase 4 — Primeiro jogo conectado (o mais simples possível)
- Ex.: quiz buzzer ou votação — poucas regras, estressa o protocolo em uso real.
- Padrão módulo conectado: telas no cliente (`src/games/<jogo>/`), reducer no servidor
  (`server/rooms/<jogo>.js`).
- **Critério de aceite:** partida completa com celulares reais em redes diferentes.

### Fase 5 — Jogo com informação oculta (Ludo/Truco) **[longo prazo]**
- Introduz visão-por-jogador (4.3) de verdade. É o "chefão final" do design conectado.
- Explicitamente fora do escopo atual — só entra em planejamento após as Fases 3–4 rodadas
  e estáveis em uso real.

### Fora de escopo (por ora)
- Contas de usuário, ranking global, histórico entre partidas, matchmaking com desconhecidos
  (LaGames é para jogar com quem está com você), monetização.

---

## 7. Repositório

- **Monorepo — um único repositório** contendo shell, todos os jogos e o `server/`.
- Regra adotada: *fronteira de repositório segue fronteira de deploy e de dono, não fronteira
  conceitual.* Um deploy (Cloudflare), um dono → um repo. Jogo separado = pasta, não repo.
- Mudanças atômicas (shell + jogos no mesmo commit/PR) são o principal benefício prático;
  jogos conectados têm código nos dois lados (cliente + server) e são editados no mesmo PR.
- **Nome do repo: permanece `Papelitos` por ora** — decisão deliberada para não arriscar
  interferência na integração de deploy (Cloudflare) durante a migração. O rebrand do app
  (fase 2) NÃO depende do nome do repo. Um eventual rename `Papelitos` → `LaGames` fica como
  passo opcional futuro, feito isoladamente num momento calmo (o GitHub redireciona
  URLs/remotes do nome antigo automaticamente; conferir o deploy após).
- Repos separados só se um jogo virar produto independente (deploy/dono próprios) — não é o caso.

---

## 8. O que explicitamente NÃO muda

- **Mecânica do Papelito:** reducer, telas, regras, rotação least-turns, modo de teste — zero
  alteração em qualquer fase.
- **Offline do Papelito:** segue 100% local (localStorage), jogável sem nenhum sinal.
- **Sem lobby para jogos Passa o Celular:** abrir → escolher jogo → jogar. Nenhuma etapa nova
  além da HomeScreen.
- **O conteúdo do content.md** — segue sendo fonte da verdade; na fase 1 é fatiado nas 3
  camadas de docs (hub / categoria / jogo) sem perder nada. Este Change.md cobre a migração.
