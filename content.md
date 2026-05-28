# Papelito — Especificação Técnica do Projeto

Este documento é a fonte única de verdade para a implementação do Papelito. Cada decisão de arquitetura, regra de negócio e comportamento esperado do sistema está descrito aqui com precisão suficiente para implementação direta. Não tome decisões arquiteturais fora do escopo deste documento sem sinalizar explicitamente.

---

## 1. O que é o Papelito

Papelito é um **PWA** (Progressive Web App) de jogo de festa (*party game*) presencial, estilo *pass-and-play*, com um único dispositivo compartilhado. Dois times se alternam em turnos cronometrados tentando adivinhar palavras secretas.

O diferencial central: as mesmas palavras percorrem **4 rodadas** com regras de comunicação progressivamente mais restritivas. Na Rodada 1, comunicação livre. Na Rodada 4, apenas sons. A memória coletiva construída nas rodadas anteriores é a mecânica principal.

---

## 2. Stack

```
Runtime:       React 18 + Vite
Estilização:   Tailwind CSS (apenas classes utilitárias do core)
PWA:           vite-plugin-pwa (gera Service Worker e manifest)
Deploy:        Cloudflare Pages
Persistência:  localStorage (apenas partida em andamento)
Gerenciamento
de estado:     Context API + useReducer
```

Sem Next.js. Sem SSR. A aplicação é 100% client-side. Sem backend.

---

## 3. Estrutura de Pastas

```
papelito/
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   └── _redirects                  → "/* /index.html 200" (obrigatório para Cloudflare Pages)
│
├── src/
│   ├── screens/
│   │   ├── SetupScreen/            → configuração do modo, tempo e palavras/temas
│   │   ├── SettingsScreen/         → overlay de configurações (tema + regras) acessível por ⚙️ no Setup
│   │   ├── WordInputScreen/        → seleção de time + inserção de palavras
│   │   ├── WordInputPassScreen/    → bloqueio entre jogadores no setup
│   │   ├── RouletteScreen/         → animação de sorteio do time inicial
│   │   ├── FormatRouletteScreen/   → animação de sorteio do formato do desempate (RANDOMIZE_TIEBREAKER_FORMAT)
│   │   ├── TurnPassScreen/         → tela de passagem do dispositivo entre turnos
│   │   ├── TurnScreen/             → palavra ativa + timer + botões Hit/Skip
│   │   ├── RoundTransitionScreen/  → fim de rodada + exibição da nova regra
│   │   ├── TiebreakerScreen/       → seleção do formato do desempate
│   │   └── ResultsScreen/          → placar final
│   │
│   ├── components/
│   │   ├── WordCard/               → exibe a palavra com a cor do jogador que a criou
│   │   ├── Timer/                  → cronômetro visual do turno
│   │   ├── ScoreBoard/             → placar em tempo real dos dois times
│   │   ├── RoundBadge/             → ícone + nome da rodada atual
│   │   ├── Button/                 → botão padrão reutilizável
│   │   ├── InstallBanner/          → banner dismissível com prompt de instalação do PWA (ver seção 19)
│   │   └── CountdownLock/          → botão com travamento regressivo. Recebe `seconds: number` como prop (padrão: `5`). Usado com `seconds={5}` em todos os contextos atuais.
│   │
│   ├── store/
│   │   ├── GameContext.jsx         → Context + Provider que envolve o app
│   │   ├── gameReducer.js          → todas as actions e transições de estado
│   │   └── initialState.js         → estado zero antes de qualquer configuração
│   │
│   ├── hooks/
│   │   ├── useTimer.js             → lógica do cronômetro (start, pause, reset, onEnd)
│   │   ├── useWakeLock.js          → Wake Lock API — impede a tela de apagar durante o turno
│   │   ├── useInstallPrompt.js     → captura beforeinstallprompt + detecta iOS/standalone (ver seção 19)
│   │   └── useLocalStorage.js      → abstração de save/load/clear do GameState
│   │
│   ├── utils/
│   │   ├── shuffle.js              → Fisher-Yates shuffle
│   │   ├── colors.js               → paleta PLAYER_COLORS (12 cores) + getColor(playerIndex)
│   │   ├── teams.js                → TEAM_IDS, TEAM_SYMBOLS, teamIdsFor(n), buildTeams(n)
│   │   ├── themes.js               → THEMES, getTheme, applyTheme, cycleTheme (persistência via localStorage)
│   │   ├── dev.js                  → TEST_MODE (boolean) + FAKE_WORDS (pool de teste)
│   │   └── storage.js              → exporta STORAGE_KEY + funções serialize/deserialize
│   │                                  (useLocalStorage.js consome este arquivo — não duplicar lógica)
│   │
│   ├── data/
│   │   └── rules.js                → array RULES exibido no SettingsScreen (accordion de regras)
│   │
│   ├── App.jsx                     → renderiza a screen correta baseado em state.phase
│   ├── index.css                   → Tailwind + overrides CSS por tema (body.theme-{id})
│   └── main.jsx                    → monta o app no #root, envolve com GameProvider, aplica tema salvo
│
├── index.html
├── vite.config.js                  → configuração do Vite + vite-plugin-pwa
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── content.md                      → especificação técnica completa do projeto (fonte de verdade para o agente)
├── rules.md                        → regras oficiais do jogo (referência humana)
└── progress.md                     → log de progresso por fase — enviar junto com content.md em cada sessão
```

---

## 4. Tipos Base

```javascript
// Word — unidade do pool de palavras
{
  id:          string,     // gerado com crypto.randomUUID() no momento da inserção
  text:        string,     // a palavra digitada pelo jogador
  theme:       string | null, // tema correspondente (null no Modo Normal)
  playerIndex: number,     // índice 0-based do jogador que criou — determina a cor
}

// Player — criado incrementalmente conforme cada jogador passa pelo dispositivo.
// Primeiro slot criado em SETUP_COMPLETE. Slots subsequentes criados em NEXT_PLAYER.
{
  index:  number,                          // 0-based. "Jogador N" = index + 1
  teamId: 'A' | 'B' | 'C' | 'D' | null,    // null até o jogador escolher o time em wordInput
  name:   string,                          // '' por padrão. Preenchido opcionalmente via SET_PLAYER_NAME.
                                           // Fallback para exibição: name.trim() || `Jogador ${index + 1}`
  // cor não é armazenada — sempre derivada via getColor(index) sob demanda (ver seção 11)
}

// TeamState — estado de cada time
{
  score:         number,   // pontuação acumulada nas 4 rodadas
  playerIndices: number[], // índices dos jogadores deste time (referência a players[])
  queuePos:      number,   // posição atual na fila circular de jogadores do time
}
```

---

## 5. GameState Completo

```javascript
const initialState = {

  // ── FASE ──────────────────────────────────────────────────────────────────
  // Controla qual screen o App.jsx renderiza.
  phase: 'setup',
  // Valores possíveis:
  // 'setup' | 'wordInput' | 'wordInputPass' | 'roulette' | 'formatRoulette' |
  // 'turnPass' | 'playing' | 'roundTransition' | 'tiebreaker' | 'gameOver'

  // ── CONFIGURAÇÃO ──────────────────────────────────────────────────────────
  mode:           'normal',  // 'normal' | 'themed'
  turnDuration:   60,        // segundos por turno — definido pelo grupo
  wordsPerPlayer: 5,         // no Modo Normal: configurado manualmente
                             // no Modo Temático: sempre === themes.length
  themes:         [],        // [] no Modo Normal. No Modo Temático, cada string é um tema.

  // ── JOGADORES ─────────────────────────────────────────────────────────────
  // Primeiro slot criado em SETUP_COMPLETE. Cada NEXT_PLAYER cria o próximo.
  // teamId é preenchido pelo próprio jogador durante wordInput via SET_PLAYER_TEAM.
  players: [],               // Player[] — cresce incrementalmente durante wordInput

  // Índice do jogador atualmente inserindo palavras.
  // Incrementado a cada NEXT_PLAYER.
  wordInputCurrentIndex: 0,

  // ── TIMES ─────────────────────────────────────────────────────────────────
  numTeams: 2,               // 2 | 3 | 4 — definido no SetupScreen
  teams: {                   // construído dinamicamente via buildTeams(numTeams). Default = 2 times.
    A: { score: 0, playerIndices: [], queuePos: 0 },
    B: { score: 0, playerIndices: [], queuePos: 0 },
  },

  // Ordem cíclica de jogada — definida pela RouletteScreen via shuffle de teamIdsFor(numTeams).
  // teamOrder[0] === currentTeamId após ROULETTE_DONE. Usada em END_TURN e ADVANCE_ROUND para
  // calcular o próximo time ciclicamente.
  teamOrder: [],             // ('A' | 'B' | 'C' | 'D')[]

  // Time jogando no turno atual.
  currentTeamId: null,       // 'A' | 'B' | 'C' | 'D' — definido após a roulette

  // Time que abriu a rodada atual.
  // Usado para calcular qual time abre a próxima rodada via teamOrder.
  roundStartTeam: null,      // 'A' | 'B' | 'C' | 'D'

  // ── POOL E FILA ───────────────────────────────────────────────────────────
  // pool: IMUTÁVEL após START_GAME. Nunca é modificado durante o jogo.
  // É a fonte da verdade para reconstruir a queue a cada nova rodada.
  pool:  [],                 // Word[]

  // queue: fila ativa da rodada. É a cópia embaralhada do pool no início de
  // cada rodada, ou o restante após END_TURN (com a palavra ativa reinserida
  // no final antes de reembaralhar).
  queue: [],                 // Word[]

  // ── RODADA E TURNO ────────────────────────────────────────────────────────
  round:       1,            // 1 | 2 | 3 | 4
  currentWord: null,         // Word | null — palavra visível na TurnScreen
  turnHits:    0,            // acertos do turno em andamento (para display)
  turnSkips:   0,            // palavras puladas no turno em andamento — habilita o botão BACK

  // ── DESEMPATE ─────────────────────────────────────────────────────────────
  tiebreakerFormat: null,    // 1 | 2 | 3 | 4 — formato sorteado ou escolhido
  tiebreakerTeams:  [],      // IDs dos times empatados no topo após Rodada 4.
                             // Apenas esses times disputam o desempate; os demais assistem.
}
```

---

## 6. Máquina de Estados — Transições de Fase

```
setup
  └─[SETUP_COMPLETE]──────────────────────────────→ wordInput

wordInput
  └─[PLAYER_CONFIRMED]────────────────────────────→ wordInputPass

wordInputPass
  ├─[NEXT_PLAYER]─────────────────────────────────→ wordInput
  └─[START_GAME] (validado)───────────────────────→ roulette

roulette
  └─[ROULETTE_DONE]───────────────────────────────→ turnPass

turnPass
  └─[TURN_CONFIRMED]──────────────────────────────→ playing

playing
  ├─[HIT] queue.length > 0────────────────────────→ playing (próxima palavra)
  ├─[HIT] queue.length === 0, round < 4───────────→ roundTransition
  ├─[HIT] queue.length === 0, round === 4─────────→ gameOver OU tiebreaker
  ├─[SKIP]────────────────────────────────────────→ playing (palavra vai pro fim da queue)
  └─[END_TURN]────────────────────────────────────→ turnPass

roundTransition
  └─[ADVANCE_ROUND]───────────────────────────────→ turnPass

tiebreaker
  ├─[SELECT_TIEBREAKER_FORMAT]────────────────────→ roulette (sorteia time) → turnPass
  ├─[RANDOMIZE_TIEBREAKER_FORMAT]─────────────────→ formatRoulette (anima sorteio do formato)
  └─[GAME_OVER] (aceitar empate)──────────────────→ gameOver

formatRoulette
  └─[FORMAT_ROULETTE_DONE]────────────────────────→ roulette (sorteia time) → turnPass

gameOver
  └─ estado terminal. localStorage limpo via GameContext useEffect (ver seção 12).
```

---

## 7. Actions do Reducer

### Setup

| Action | Payload | Comportamento |
|--------|---------|---------------|
| `SET_MODE` | `'normal' \| 'themed'` | Atualiza `mode`. Ao trocar para `normal`: reseta `themes: []` e `wordsPerPlayer: 5`. Ao trocar para `themed`: reseta `themes: []` e `wordsPerPlayer: 0` (será derivado de `themes.length` conforme temas forem adicionados). |
| `SET_TURN_DURATION` | `number` | Atualiza `turnDuration`. |
| `SET_WORDS_PER_PLAYER` | `number` | Só válido no Modo Normal. |
| `SET_NUM_TEAMS` | `2 \| 3 \| 4` | Atualiza `numTeams` e reconstrói `teams` via `buildTeams(n)`. Disponível apenas no setup. |
| `ADD_THEME` | `string` | Adiciona ao array `themes`. `wordsPerPlayer` passa a ser `themes.length`. |
| `REMOVE_THEME` | `string` | Remove do array `themes`. Recalcula `wordsPerPlayer`. |
| `SETUP_COMPLETE` | — | Cria o primeiro slot em `players[]`: `{ index: 0, teamId: null, name: '' }`. Reconstrói `teams` via `buildTeams(numTeams)` (garante consistência caso o usuário tenha mudado `numTeams` após criar players em um setup anterior). `phase → 'wordInput'`. |
| `TEST_QUICK_START` | — | **Modo de teste** (ver seção 17). Força `mode: 'normal'`, gera `2 × numTeams` jogadores nomeados "Teste N" distribuídos uniformemente entre os times, popula o `pool` com palavras de `FAKE_WORDS` (com sufixo numérico se sair do pool), `phase → 'roulette'`. Dispatched pela `SetupScreen` no lugar de `SETUP_COMPLETE` quando `TEST_MODE === true`. |

### Inserção de Palavras

| Action | Payload | Comportamento |
|--------|---------|---------------|
| `SET_PLAYER_NAME` | `string` | Atualiza `name` do objeto em `players[wordInputCurrentIndex]`. Disparado a cada keystroke no campo de nome da `WordInputScreen`. |
| `SET_PLAYER_TEAM` | `'A' \| 'B' \| 'C' \| 'D'` | Atualiza `teamId` do objeto em `players[wordInputCurrentIndex]`. O objeto já existe — criado em `SETUP_COMPLETE` ou `NEXT_PLAYER`. IDs válidos limitados aos times ativos (`teamIdsFor(numTeams)`). |
| `PLAYER_CONFIRMED` | `{ words: [{ text, theme? }] }` | Irreversível. Recebe todas as palavras do jogador em batch. Para cada word, cria `{ id: crypto.randomUUID(), text, theme, playerIndex: wordInputCurrentIndex }` e adiciona ao `pool`. O `teamId` usado é `players[wordInputCurrentIndex].teamId` — atribuído anteriormente via `SET_PLAYER_TEAM`. O botão Confirmar só fica habilitado quando `teamId !== null`, garantindo que nunca seja null aqui. Adiciona o player finalizado ao `teams[teamId].playerIndices`. `phase → 'wordInputPass'`. No Modo Temático, cada word inclui `theme: themes[i]` — montado pela tela antes do dispatch. No Modo Normal, `theme: null`. |
| `NEXT_PLAYER` | — | Incrementa `wordInputCurrentIndex` de N para N+1. Cria o próximo slot em `players[]` com o valor **após** o incremento: `{ index: N+1, teamId: null }`. `phase → 'wordInput'`. |
| `START_GAME` | — | Validação deve passar (ver seção 8.1). Trava o `pool`. `phase → 'roulette'`. |

### Roulette e Início

| Action | Payload | Comportamento |
|--------|---------|---------------|
| `ROULETTE_DONE` | `{ teamOrder, firstTeam }` | `teamOrder` é a ordem cíclica completa (shuffle de `teamIdsFor(numTeams)`, ou de `tiebreakerTeams` durante desempate). `firstTeam === teamOrder[0]`. Define `currentTeamId` e `roundStartTeam` como `firstTeam`. Sempre reconstrói `queue = shuffle([...pool])`, tanto no Round 1 quanto no desempate. Não altera `queuePos` — usa o valor atual. `phase → 'turnPass'`. |

### Turno

| Action | Payload | Comportamento |
|--------|---------|---------------|
| `TURN_CONFIRMED` | — | `currentWord = queue[0]`. `turnSkips = 0`. `phase → 'playing'`. |
| `HIT` | — | `teams[currentTeamId].score++`. `turnHits++`. Remove `currentWord` da `queue` filtrando por id: `queue.filter(w => w.id !== currentWord.id)`. Verifica se `queue.length === 0` (ver seção 8.2). Caso contrário: `currentWord = queue[0]`. |
| `SKIP` | — | Move `currentWord` para o final de `queue`. `currentWord = queue[0]`. `turnSkips++`. Se `queue.length === 1`, `currentWord` permanece o mesmo objeto — comportamento esperado. O jogador só pode sair dessa situação via `END_TURN`. |
| `BACK` | — | Só opera se `turnSkips > 0` e `queue.length > 1`. A última palavra pulada está sempre no final da `queue` (SKIP sempre appenda ao fim, sem reembaralhar). Remove-a do final, coloca-a na posição 0 como novo `currentWord`, e move o `currentWord` anterior para a posição 1. `turnSkips--`. |
| `END_TURN` | — | **Guard:** retorna `state` inalterado se `currentWord === null` ou `phase !== 'playing'` (proteção contra reentrância). Reinsere `currentWord` no final da `queue`. `queue = shuffle(queue)`. Avança `queuePos` do time atual. `nextTeamId = teamOrder[(idx + 1) % teamOrder.length]` onde `idx = teamOrder.indexOf(currentTeamId)`. `turnHits = 0`. `turnSkips = 0`. `phase → 'turnPass'`. |

### Rodada

| Action | Payload | Comportamento |
|--------|---------|---------------|
| `ADVANCE_ROUND` | — | `round++`. `roundStartTeam = teamOrder[(idx + 1) % teamOrder.length]` onde `idx = teamOrder.indexOf(roundStartTeam)`. `currentTeamId = novo roundStartTeam`. `queue = shuffle([...pool])`. Avança `queuePos` do time que vai começar. `turnHits = 0`. `turnSkips = 0`. `phase → 'turnPass'`. |
| `GAME_OVER` | — | `phase → 'gameOver'`. O reducer não toca o localStorage — side effect tratado pelo `GameContext` (ver seção 12). |
| `RESET_GAME` | — | Retorna `initialState` diretamente. Disparado pelo `ResultsScreen` ao confirmar "Nova Partida". O localStorage já foi limpo pelo `GameContext` quando `phase` virou `'gameOver'`. |
| `LOAD_GAME` | `GameState` | Retorna o payload diretamente como novo estado. Disparado pelo `App.jsx` ao confirmar retomada de partida salva. |

### Desempate

| Action | Payload | Comportamento |
|--------|---------|---------------|
| `SELECT_TIEBREAKER_FORMAT` | `1 \| 2 \| 3 \| 4` | `tiebreakerFormat = payload`. `phase → 'roulette'` (sorteia time que começa). |
| `RANDOMIZE_TIEBREAKER_FORMAT` | — | `phase → 'formatRoulette'`. O formato é sorteado e definido pela `FormatRouletteScreen` via `FORMAT_ROULETTE_DONE`. |
| `FORMAT_ROULETTE_DONE` | `1 \| 2 \| 3 \| 4` | `tiebreakerFormat = payload`. `phase → 'roulette'` (sorteia time que começa). |

---

## 8. Regras de Negócio — Restrições Críticas

### 8.1 Validação do START_GAME

`START_GAME` só é processado se ambas as condições forem satisfeitas simultaneamente:
- `players.length >= 2 * numTeams`
- Para cada `id` em `teamIdsFor(numTeams)`: `teams[id].playerIndices.length >= 2`

O botão "Iniciar Jogo" só é **renderizado** na `WordInputPassScreen` quando essas condições são verdadeiras. Se o botão não aparece, não há erro — as condições simplesmente ainda não foram atingidas.

### 8.2 Detecção de Fim de Rodada e Fim de Jogo

Após cada `HIT`, verificar na seguinte ordem:

```javascript
// Dentro do case HIT do reducer — após remover currentWord da queue:
const newQueue = state.queue.filter(w => w.id !== state.currentWord.id)
const ids = teamIdsFor(state.numTeams)

if (newQueue.length === 0) {
  if (state.round === 4) {
    // Detecta empate considerando N times: pega o(s) time(s) com maxScore
    const maxScore = Math.max(...ids.map(id => newTeams[id].score))
    const tied = ids.filter(id => newTeams[id].score === maxScore)
    if (tied.length > 1) {
      return {
        ...state,
        queue: newQueue,
        phase: 'tiebreaker',
        currentWord: null,
        tiebreakerFormat: null,
        tiebreakerTeams: tied,
      }
    }
    return { ...state, queue: newQueue, phase: 'gameOver', currentWord: null }
  }
  return { ...state, queue: newQueue, phase: 'roundTransition', currentWord: null }
}
// Se queue ainda tem palavras, apenas avança:
return { ...state, queue: newQueue, currentWord: newQueue[0] }
```

O reducer nunca chama `dispatch`. Ele recebe estado e action, e retorna novo estado diretamente. Toda transição de fase acontece via `return`. O reset de `tiebreakerFormat: null` e a definição de `tiebreakerTeams` ocorrem aqui.

### 8.3 Imutabilidade do Pool e Distinção Round vs Turno

`pool` é preenchido durante `wordInput` e travado em `START_GAME`. **Nunca é modificado após isso.** Toda manipulação de palavras ocorre exclusivamente em `queue`.

A distinção entre fim de turno e fim de rodada é crítica:

| Evento | Comportamento da queue |
|--------|----------------------|
| `END_TURN` (fim de turno) | Queue **não reseta**. As palavras restantes — incluindo a palavra ativa reinserida no final — são reembaralhadas entre si: `queue = shuffle(queue)`. O pool não é tocado. |
| `ADVANCE_ROUND` (fim de rodada) | Queue **reseta completamente**. É reconstruída do zero: `queue = shuffle([...pool])`. |
| `ROULETTE_DONE` (Round 1 ou desempate) | Mesmo comportamento do `ADVANCE_ROUND`: `queue = shuffle([...pool])`. |

### 8.4 Comportamento do END_TURN

A palavra visível no momento em que `END_TURN` é disparado **não é descartada**. Ela é reinserida no final da `queue` antes do shuffle. O shuffle ocorre sobre toda a `queue` restante, incluindo essa palavra.

### 8.5 Alternância de Times por Rodada

`teamOrder` é definido pela roleta no início da partida (e regenerado no desempate apenas com os times empatados). O time que abre a próxima rodada é sempre o **próximo na `teamOrder` ciclicamente** após o `roundStartTeam` atual. Essa regra tem prioridade sobre a rotação individual de jogadores — a unidade competitiva é o time.

Com `numTeams = 2`, a regra equivale ao antigo "oposto da rodada anterior". Com `numTeams = 3` ou `4`, todos os times rodam ciclicamente.

| Rodada | Time que abre |
|--------|--------------|
| 1 | `teamOrder[0]` (sorteado pela roleta) |
| 2 | Próximo cíclico na `teamOrder` após o que abriu a Rodada 1 |
| 3 | Próximo cíclico após o que abriu a Rodada 2 |
| 4 | Próximo cíclico após o que abriu a Rodada 3 |
| Desempate | Novo `teamOrder` gerado pela roleta com apenas os `tiebreakerTeams`; `teamOrder[0]` abre |

**Consequência:** com `numTeams = 4` em 4 rodadas, cada time abre exatamente uma rodada. Com `numTeams = 3` em 4 rodadas, um time abre duas (o que ocupa o primeiro slot da `teamOrder`).

### 8.6 Rotação de Jogadores por Time

Cada time tem uma fila circular independente. O jogador atual de um time é:

```javascript
const currentPlayer = (team) => {
  const { playerIndices, queuePos } = team
  return playerIndices[queuePos % playerIndices.length]
}
```

`queuePos` é incrementado em:
- `END_TURN` → para o time que acabou de jogar.
- `ADVANCE_ROUND` → para o time que vai abrir a próxima rodada.

`queuePos` **nunca é resetado** — nem na virada de rodada, nem no desempate. `ROULETTE_DONE` não altera `queuePos`. O jogador que abre qualquer rodada (incluindo o desempate) é sempre `playerIndices[queuePos % playerIndices.length]` do time sorteado, garantindo continuidade absoluta da rotação.

### 8.7 Timer

O timer é responsabilidade exclusiva de `useTimer`. O reducer não sabe que o tempo acabou. Quando o timer chega a zero, o hook dispara `END_TURN`. O reducer responde à action, não ao evento de tempo.

O timer reinicia integralmente a cada turno porque `TurnScreen` desmonta e remonta a cada transição de fase. O `start()` chamado no `useEffect` de montagem garante sempre o tempo cheio — não há reset explícito necessário em `TURN_CONFIRMED`. Tempo restante de turnos anteriores não acumula nem transfere.

**Arquitetura interna (anti-double-fire):** o `setInterval` interno apenas atualiza `timeLeft` via updater puro. A detecção de `timeLeft === 0` e o disparo de `onEnd` vivem em um `useEffect` separado, protegido por um `endedRef` que garante invocação única. Esta separação é necessária porque React StrictMode (dev) invoca updater functions duas vezes, e callbacks impuros dentro de updaters causariam dispatch duplicado de `END_TURN`. Também blinda contra `currentWord === null` no reducer via guard em `END_TURN`.

### 8.8 Irreversibilidade da Confirmação de Palavras

`PLAYER_CONFIRMED` não tem ação inversa. Uma vez confirmado, o jogador não pode editar, remover ou adicionar palavras. O reducer não implementa undo para esta action.

---

## 9. Comportamento das Telas

### SetupScreen
- **Título:** "Papelito" em produção; "Teste Papelito" quando `TEST_MODE === true` (ver seção 17).
- **Botão de configurações (⚙️)** posicionado à direita do título — abre `SettingsScreen` como overlay (ver seção 18).
- Seletor de modo: Normal ou Temático. Em `TEST_MODE`, o botão "Temático" fica desabilitado com ícone 🔒 (cadeado).
- Seletor de **quantidade de times**: botões `2` / `3` / `4`. Dispara `SET_NUM_TEAMS`.
- **Ao abrir, os campos já estão preenchidos com os valores do `initialState`** — não são placeholders, são valores reais e editáveis. O usuário pode iniciar o jogo sem tocar em nada se os padrões servirem.
- **Modo Normal:** campo numérico para `wordsPerPlayer` iniciando em `5` + campo para `turnDuration` iniciando em `60`.
- **Modo Temático:** interface para adicionar/remover temas — inicia vazia (temas são criados pelo grupo). `wordsPerPlayer` é exibido como leitura derivada de `themes.length`, não como input. Campo para `turnDuration` iniciando em `60`.
- **Inputs numéricos com validação diferida:** os campos `turnDuration` e `wordsPerPlayer` mantêm estado local (`durationInput`, `wordsInput` como strings), permitindo limpeza completa durante a edição. `onChange` apenas atualiza o estado local; a validação e o `dispatch` para o reducer ocorrem somente no `onBlur`. Valores inválidos, vazios ou abaixo do mínimo são resetados para os defaults (`10` para duração, `1` para palavras). Um `useEffect` sincroniza mudanças externas (ex: `SET_MODE` resetando `wordsPerPlayer`) de volta para os inputs locais. Isso evita o anti-padrão de forçar mínimos a cada keystroke.
- Botão "Continuar":
  - Em modo normal: dispara `SETUP_COMPLETE`.
  - Em `TEST_MODE`: dispara `TEST_QUICK_START` direto, pulando todo o fluxo de inserção de palavras.

### WordInputScreen
- **Header seamless:** o "Jogador N" tradicional foi substituído por um `input` transparente estilizado como título (text-2xl, font-bold) com a cor `getColor(wordInputCurrentIndex)`. O placeholder é `Jogador ${index + 1}` e herda a cor do elemento (via classe `.placeholder-inherit` em `index.css`). Cada keystroke dispara `SET_PLAYER_NAME`. Se deixado em branco, o jogador é exibido como "Jogador N" em todo o jogo. Não bloqueia o botão Confirmar. Este `wordInputCurrentIndex` é o `playerIndex` permanente desse jogador — o mesmo valor usado em todas as `Word` que ele criar e em qualquer chamada futura a `getColor()` para exibir sua cor.
- Seletor de time — obrigatório antes de liberar os campos de palavra. Renderiza um botão por time ativo (`teamIdsFor(numTeams)`) exibindo o `TEAM_SYMBOLS[id]` grande. Layout: 2 times = 2 colunas, 3 times = 3 colunas, 4 times = grid 2×2.
- Campos de texto: exatamente `wordsPerPlayer` campos.
- **Edição livre:** todos os campos permanecem editáveis até o clique em Confirmar. O jogador pode alterar qualquer palavra quantas vezes quiser enquanto o dispositivo estiver com ele. Confirmar é a única ação que torna as palavras permanentes.
- **Modo Temático:** cada campo exibe `themes[i]` como label fixo acima do input — não como placeholder. O label persiste enquanto o jogador digita. O tema correspondente é incluído automaticamente no batch do `PLAYER_CONFIRMED` via `theme: themes[i]`.
- **Auto-foco:** ao entrar na tela, foco vai para o primeiro campo vazio. Após confirmar cada palavra (Enter ou blur), foco avança para o próximo campo vazio. Se todos preenchidos, foco vai para o botão de confirmar.
- Botão "Confirmar" só fica habilitado quando **todos** os campos estiverem preenchidos e o time estiver selecionado.
- Ao confirmar: a tela monta o array de words em batch — `fields.map((text, i) => ({ text, theme: mode === 'themed' ? themes[i] : null }))` — e dispara `PLAYER_CONFIRMED` com esse payload. `phase → 'wordInputPass'`.

### WordInputPassScreen
- Tela de bloqueio que oculta completamente o que o jogador anterior digitou.
- Exibe: "Passe o celular para o próximo jogador."
- Contagem dinâmica por time: lista `TEAM_SYMBOLS[id] N` para cada `id` em `teamIdsFor(numTeams)`.
- Botão "Próximo Jogador" — sempre visível. Dispara `NEXT_PLAYER`. `phase → 'wordInput'`.
- Botão "Iniciar Jogo" — **renderizado condicionalmente** apenas quando `players.length >= 2 * numTeams` E cada time ativo tem `playerIndices.length >= 2`.
  - Ao pressionar: abre sobreposição de confirmação (não navega de tela).
  - Sobreposição: "Tem certeza que deseja iniciar o jogo?" + botão "Não" + botão "Sim, iniciar".
  - Ambos são `Button` simples (não mais `CountdownLock` — removido por feedback de UX).
  - Ao confirmar: dispara `START_GAME`.

### RouletteScreen
- Determina o conjunto de times elegíveis: `tiebreakerTeams` se for desempate (`tiebreakerFormat !== null && tiebreakerTeams.length > 0`); senão `teamIdsFor(numTeams)`.
- Gera **toda a `teamOrder`** localmente via `shuffle([...eligibleIds])` antes de iniciar a animação (padrão `useRef`). `firstTeam = teamOrder[0]`.
- A animação cicla entre os símbolos dos times elegíveis com `SPIN_DELAYS` decrescentes (slot machine), aterrissando em `firstTeam`.
- Após o pouso, exibe "{símbolo} começa!" e logo abaixo, se houver mais de 1 time, "Ordem: ■ → ▲ → ★" mostrando a `teamOrder` completa.
- Dispara `ROULETTE_DONE` com payload `{ teamOrder, firstTeam }`.
- Reutilizada no desempate, automaticamente filtrando para os times empatados.

### TurnPassScreen
- Exibe `TEAM_SYMBOLS[currentTeamId]` gigante em branco (símbolos são neutros — não há cores de time).
- Exibe o nome do jogador (`players[currentPlayerIndex].name` com fallback `Jogador N`) na cor `getColor(currentPlayerIndex)`.
- Exibe o placar atual (`ScoreBoard`), com o time atual destacado via prop `highlight`.
- Exibe `RoundBadge` com as regras da rodada ativa: usa `ROUNDS[tiebreakerFormat]` quando `tiebreakerFormat !== null`, e `ROUNDS[round]` nos demais casos — mesma lógica do `TurnScreen`.
- Botão "Estou pronto" — **sempre visível**. Não há lógica de visibilidade por jogador. O jogo parte do pressuposto social de que o dispositivo já está nas mãos do jogador correto do time indicado. Dispara `TURN_CONFIRMED`.

### TurnScreen
- Exibe `WordCard` com o texto de `currentWord` na cor `getColor(currentWord.playerIndex)`.
- Exibe `Timer` em contagem regressiva a partir de `turnDuration`.
- Exibe `RoundBadge` com as regras da rodada ativa: usa `ROUNDS[tiebreakerFormat]` quando `tiebreakerFormat !== null`, e `ROUNDS[round]` nos demais casos.
- Chama `timer.start()` no `useEffect` de montagem — o timer inicia assim que a tela entra em cena. Chama `timer.reset()` na desmontagem.
- Botão "✅ Acertou" → dispara `HIT`. Ocupa linha inteira acima dos outros botões.
- Botões "↩️ Voltar" e "⏭️ Pular" → exibidos lado a lado (grid 2 colunas) abaixo do Hit. "Voltar" dispara `BACK` e fica desabilitado enquanto `turnSkips === 0`. "Pular" dispara `SKIP`.
- Quando o timer zera: `useTimer` dispara `END_TURN` automaticamente via `onEnd`.
- `useWakeLock` ativo nesta tela — solicita Wake Lock ao entrar, libera ao sair.

### RoundTransitionScreen
- Exibe o resultado da rodada que acabou (pontos marcados nela — opcional, se quiser derivar do state).
- Exibe o ícone, número e regra da **próxima** rodada usando `ROUNDS[round + 1]`. Quando esta tela abre, `round` ainda tem o valor da rodada que terminou — `ADVANCE_ROUND` só o incrementa quando o usuário clicar "Continuar".
- Botão "Continuar" → dispara `ADVANCE_ROUND`.

### FormatRouletteScreen
- Exibida quando `RANDOMIZE_TIEBREAKER_FORMAT` é disparado.
- O formato vencedor é gerado localmente via `Math.floor(Math.random() * 4) + 1` antes de iniciar a animação (padrão `useRef`, mesmo da `RouletteScreen`).
- Anima ciclicamente pelos 4 formatos (ícone + label) com delays decrescentes (slot machine), aterrissando no formato sorteado.
- Ao finalizar a animação: exibe nome e regra do formato sorteado, depois dispara `FORMAT_ROULETTE_DONE` com o valor.
- Reutiliza os mesmos `SPIN_DELAYS` da `RouletteScreen`.

### TiebreakerScreen
- Exibe mensagem listando os times empatados via `tiebreakerTeams.map(id => TEAM_SYMBOLS[id]).join(' e ')` + score compartilhado.
- Exibe `ScoreBoard` com todos os times (não filtra — apenas os empatados disputam, mas os scores de todos são visíveis).
- Botão "Sortear formato" → dispara `RANDOMIZE_TIEBREAKER_FORMAT`.
- Quatro botões de formato (Livre, Uma Palavra, Mímica, Som) → cada um dispara `SELECT_TIEBREAKER_FORMAT` com o valor correspondente (1, 2, 3, 4).
- Botão "Aceitar Empate" → dispara `GAME_OVER` diretamente. Encerra o jogo com resultado de empate sem jogar mais.
- A `RouletteScreen` subsequente automaticamente filtra apenas os `tiebreakerTeams`.

### ResultsScreen
- Determina vitória e empate dinamicamente:
  - `ranked = teamIdsFor(numTeams).map(id => ({ id, score })).sort((a,b) => b.score - a.score)`
  - `maxScore = ranked[0].score`
  - `winners = ranked.filter(t => t.score === maxScore)`
  - Empate quando `winners.length > 1`.
- Exibe troféu 🏆 + símbolo do vencedor isolado, OU 🤝 + símbolos empatados.
- Exibe **ranking ordenado por score** — uma linha por time com posição (1º, 2º…), `TEAM_SYMBOLS[id]` e score. O 1º colocado tem borda branca quando não há empate no topo.
- Botão "Nova Partida" → `Button` simples (não mais `CountdownLock`). Dispara `RESET_GAME`, que retorna o estado para `initialState` e navega para `setup`. O localStorage já foi limpo automaticamente pelo `GameContext` ao entrar em `gameOver`.

---

## 10. As Quatro Rodadas — Mapeamento Técnico

```javascript
const ROUNDS = {
  1: {
    label: 'Livre',
    icon:  '🗣️',
    rule:  'Use qualquer descrição. Proibido dizer a palavra, traduções ou derivações.',
  },
  2: {
    label: 'Uma Palavra',
    icon:  '☝️',
    rule:  'Diga exatamente uma palavra como dica. Proibido gestos ou sons.',
  },
  3: {
    label: 'Mímica',
    icon:  '🤹',
    rule:  'Apenas gestos e expressões. Proibido qualquer som.',
  },
  4: {
    label: 'Som',
    icon:  '🔊',
    rule:  'Apenas sons, barulhos e onomatopeias. Proibido palavras e gestos explicativos.',
  },
}
```

---

## 11. Sistema de Cores dos Jogadores

```javascript
// utils/colors.js — 12 cores distintas, suficientes para 4 times × 3 jogadores sem repetição.
// Ordem alternada por matiz para reduzir colisão visual entre jogadores consecutivos.
const PLAYER_COLORS = [
  '#22c55e',  // 0  verde
  '#3b82f6',  // 1  azul
  '#f97316',  // 2  laranja
  '#a855f7',  // 3  roxo
  '#ec4899',  // 4  rosa
  '#eab308',  // 5  amarelo
  '#06b6d4',  // 6  ciano
  '#ef4444',  // 7  vermelho
  '#84cc16',  // 8  lima
  '#6366f1',  // 9  índigo
  '#14b8a6',  // 10 teal
  '#d97706',  // 11 âmbar
]

export const getColor = (playerIndex) =>
  PLAYER_COLORS[playerIndex % PLAYER_COLORS.length]
```

A cor de um jogador é sempre derivada de `getColor(player.index)`. Nunca armazenada como estado — é computada sob demanda. O `% PLAYER_COLORS.length` garante que, se houver mais jogadores do que cores (>12), as cores reiniciam ciclicamente.

---

## 11.1 Sistema de Times

```javascript
// utils/teams.js
export const TEAM_IDS = ['A', 'B', 'C', 'D']

export const TEAM_SYMBOLS = {
  A: '■',  // quadrado
  B: '●',  // círculo
  C: '▲',  // triângulo
  D: '★',  // estrela
}

export const teamIdsFor = (numTeams) => TEAM_IDS.slice(0, numTeams)

export const buildTeams = (numTeams) => {
  const result = {}
  for (const id of teamIdsFor(numTeams)) {
    result[id] = { score: 0, playerIndices: [], queuePos: 0 }
  }
  return result
}
```

**Convenções:**
- IDs internos são sempre as letras `A..D`. Toda exibição usa `TEAM_SYMBOLS[id]`.
- **Times não têm cor.** A diferenciação visual entre times é feita exclusivamente pelos símbolos. Isso libera a paleta de cores integralmente para jogadores e evita colisão visual entre cor de time × cor de jogador.
- `numTeams` é fixado no `SetupScreen` e nunca muda durante a partida.
- A ordem de jogada (`teamOrder`) é sorteada pela `RouletteScreen` e armazenada em `state.teamOrder`. O `ScoreBoard` renderiza os times nessa ordem.

---

## 12. Hooks

### useTimer
```javascript
// Contrato da interface
const { timeLeft, isRunning, start, pause, reset } = useTimer({
  duration:  number,   // segundos
  onEnd:     () => void, // chamado quando timeLeft chega a 0 — dispara END_TURN
})
```
- Usa `setInterval` internamente.
- `reset()` restaura `timeLeft` para `duration` e para o intervalo.
- O timer não reinicia automaticamente — é iniciado pela `TurnScreen` via `start()` no `useEffect` de montagem do componente. Quando `TurnScreen` desmonta, o timer deve ser pausado ou resetado via `reset()`.

### useWakeLock
```javascript
const { isActive } = useWakeLock(enabled: boolean)
```
- Solicita `navigator.wakeLock.request('screen')` quando `enabled === true`.
- Libera o lock quando `enabled === false` ou o componente desmonta.
- Trata graciosamente navegadores que não suportam a API (sem erro — apenas `isActive = false`).

### useLocalStorage
```javascript
const { save, load, clear } = useLocalStorage(key: string)
```
- Consome `STORAGE_KEY`, `serialize` e `deserialize` de `utils/storage.js` — não reimplementa serialização.
- `save(state)` → chama `serialize(state)` e persiste no localStorage.
- `load()` → lê do localStorage, chama `deserialize()` e retorna o estado ou `null` se não existir.
- `clear()` → remove a chave do localStorage.

Duas responsabilidades distintas, em lugares distintos:

**`GameContext.jsx` — save contínuo:**
```javascript
useEffect(() => {
  if (state.phase === 'gameOver') {
    clear()  // limpa storage ao encerrar — não salva o estado final
  } else if (state.phase !== 'setup') {
    save(state)  // nunca salva o estado inicial — evita sobrescrever partida salva na montagem
  }
}, [state])
```
Roda após cada render onde `state` mudou. Mantém o localStorage sincronizado sem violar a pureza do reducer. O reducer nunca chama `clear()` ou `save()` diretamente.

**`App.jsx` — load único na inicialização:**
```javascript
useEffect(() => {
  const saved = load()
  if (saved && saved.phase !== 'setup' && saved.phase !== 'gameOver') {
    // exibe modal de retomada com duas opções:
    // "Retomar" → dispatch({ type: 'LOAD_GAME', payload: saved })
    // "Nova Partida" → clear() + permanece em setup (com CountdownLock de 5s)
  }
}, []) // array vazio → roda apenas uma vez, na montagem
```

---

## 13. Persistência

- **Chave:** `'papelito_game_state'`
- **Quando salvar:** após cada dispatch de qualquer action.
- **Quando limpar:** quando `phase === 'gameOver'` (detectado via `useEffect` no `GameContext`, ver seção 12) e ao iniciar nova partida.
- **O que persiste:** o `GameState` completo, serializado via `JSON.stringify`.
- **O que não persiste:** histórico de partidas anteriores, configurações entre sessões.
- **Ao abrir o app:** se `localStorage` contém estado com `phase` diferente de `'setup'` e `'gameOver'`, exibir um **modal de retomada** sobre o `SetupScreen` com duas opções: **"Retomar partida"** (carrega o estado salvo e navega para a phase correspondente) e **"Nova partida"** (usa `CountdownLock` de 5 segundos — ao confirmar, limpa o storage e permanece no `SetupScreen`). O travamento evita que uma partida em andamento seja perdida por toque acidental.

---

## 14. Configuração PWA — vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name:             'Papelito',
        short_name:       'Papelito',
        description:      'O jogo de palavras em 4 rodadas',
        theme_color:      '#000000',
        background_color: '#000000',
        display:          'fullscreen',
        display_override: ['fullscreen', 'standalone', 'minimal-ui'],
        orientation:      'portrait',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
})
```

---

## 15. Cloudflare Pages

**Build settings:**
```
Build command:  npm run build
Output dir:     dist
Node version:   18
```

**`public/_redirects`:**
```
/* /index.html 200
```

Este arquivo é obrigatório. Sem ele, qualquer navegação direta a uma rota que não seja `/` retorna 404 em produção.

---

## 16. Decisões de Design Técnico — Justificativas

**Por que pool é imutável?**
A mecânica central do jogo depende de que as mesmas palavras retornem intactas nas 4 rodadas. Qualquer mutação acidental do pool quebraria a progressão. A imutabilidade é uma garantia, não uma convenção.

**Por que o timer vive no hook e não no reducer?**
O reducer deve ser uma função pura e síncrona. Gerenciar `setInterval` dentro de um reducer viola esse princípio. O hook encapsula o efeito colateral e comunica com o reducer exclusivamente através de actions.

**Por que a confirmação de palavras é irreversível?**
Em um jogo pass-and-play com um único dispositivo, permitir edição após confirmação criaria oportunidade de um jogador ver as palavras de outro. A irreversibilidade é uma decisão de segurança do jogo, não uma limitação técnica.

**Por que a alternância de times tem prioridade sobre a rotação de jogadores?**
A pontuação é acumulada por time, não por jogador. A unidade competitiva é o time. Garantir que cada time abra o mesmo número de rodadas é mais justo do que garantir que cada jogador jogue o mesmo número de turnos.

**Por que times usam símbolos e não cores?**
Com até 4 times × 3 jogadores, são 12 cores ocupadas. Adicionar cor de time sobre cor de jogador criaria sobreposição visual confusa (jogador verde do time azul, jogador amarelo do time laranja…). Símbolos (■ ● ▲ ★) são monocromáticos, universalmente reconhecíveis e não competem com o sistema de cores dos jogadores.

**Por que `teamOrder` é sorteado em vez de definido manualmente pelo grupo?**
Em uma versão inicial considerou-se uma `TeamOrderScreen` tap-to-pick. Foi abandonada porque (a) randomização é mais justa — elimina viés de "quem joga primeiro define o ritmo", (b) remove uma tela do fluxo, e (c) a roleta já entrega o suspense esperado. O grupo não perde agência relevante: a ordem só afeta sequência de turnos, não regras nem pontuação.

**Por que getColor deriva a cor do índice em vez de armazenar no estado?**
Cores são uma função determinística do índice. Armazenar informação que pode ser computada aumenta a superfície do estado sem necessidade, e cria risco de dessincronização entre o índice e a cor armazenada.

---

## 17. Modo de Teste

`src/utils/dev.js` controla um modo que pula o setup de jogadores e palavras, gerando estado completo automaticamente e indo direto pra roleta.

### 17.1 Persistência da flag

O estado do `TEST_MODE` vive em `localStorage` sob a chave `'papelito_test_mode'`, persistindo entre sessões. Para usuários que nunca alternaram, a constante interna `DEFAULT_TEST_MODE` (em `dev.js`) define o valor padrão — deve ser `false` em produção.

```javascript
export const isTestMode = () => { /* lê localStorage com fallback DEFAULT_TEST_MODE */ }
export const setTestMode = (value) => { /* persiste em localStorage */ }
```

A `SetupScreen` lê o estado uma vez na montagem via `useState(() => isTestMode())` e mantém uma cópia local que reage ao toggle.

### 17.2 Combo secreto de toggle

Como não há UI dedicada para alternar o modo (intencional — é um atalho de dev), o toggle acontece via combo de valores no Setup:

```javascript
export const TOGGLE_COMBO = {
  numTeams: 4,
  turnDuration: 44,
  wordsPerPlayer: 4,
}
```

Quando o usuário clica em "Continuar" com **todos esses três valores ativos simultaneamente**, em vez de iniciar a partida o app:
1. Alterna o `TEST_MODE` (chama `setTestMode(!current)`).
2. Atualiza o state local da `SetupScreen` (título e cadeado refletem imediatamente).
3. Exibe um toast no rodapé: "Modo de teste ativado" ou "Modo de teste desativado", auto-dismissado em 2 segundos.
4. **Não dispara** `SETUP_COMPLETE` nem `TEST_QUICK_START` — o usuário precisa ajustar os valores e clicar de novo para iniciar.

O combo exige 3 mudanças deliberadas (default é `2 / 60 / 5`), tornando colisão acidental improvável.

### 17.3 Efeitos quando ativado

1. **SetupScreen:** título vira "Teste Papelito"; botão "Temático" fica desabilitado com 🔒 (cadeado). Modo é forçado para normal.
2. **Botão "Continuar":** dispara `TEST_QUICK_START` em vez de `SETUP_COMPLETE` (exceto quando o combo está aplicado — nesse caso, apenas alterna a flag).
3. **Action `TEST_QUICK_START`:**
   - Força `mode: 'normal'`, `themes: []`.
   - Cria `2 × numTeams` jogadores nomeados `Teste 1`, `Teste 2`, ..., distribuídos circularmente entre os times (`teamIds[i % numTeams]`).
   - Popula o `pool` com `wordsPerPlayer` palavras por jogador, sorteadas de um shuffle de `FAKE_WORDS`. Se o pool fake esgotar, anexa sufixo numérico (`Banana 2`, `Cadeira 2`, etc).
   - `wordInputCurrentIndex = totalPlayers - 1` (último jogador).
   - `phase → 'roulette'`.

### 17.4 Disclaimers

- Modo de teste **não** é uma feature de produção — é puramente para acelerar iterações de desenvolvimento. Como vive em localStorage, um usuário curioso que descobrir o combo pode ativá-lo, mas o impacto é limitado (apenas pula o setup; o jogo funciona normalmente).
- O fluxo de validação de `START_GAME` é pulado: `TEST_QUICK_START` confia que `2 × numTeams >= 2 * 2` (sempre verdadeiro) e que cada time terá exatamente 2 jogadores (sempre verdadeiro pela distribuição).
- A chave `'papelito_test_mode'` é separada da chave `'papelito_game_state'` do save de partida — alternar TEST_MODE não afeta partidas em andamento.

---

## 18. Configurações e Sistema de Temas

### 18.1 SettingsScreen

Overlay full-screen acessível pelo botão ⚙️ posicionado à direita do título da `SetupScreen`. Não é uma `phase` do `GameState` — é controlado por estado local (`showSettings`) na `SetupScreen` e renderizado condicionalmente. Não interfere no fluxo do jogo.

Estrutura:
- **Header:** botão de voltar (←) + título "Configurações". O botão de voltar chama `onClose`, propriedade recebida da `SetupScreen`.
- **Seção Tema:** botão único que exibe o nome do tema atual e cicla para o próximo a cada toque, via `cycleTheme(activeTheme)`. A mudança é aplicada imediatamente no `<body>` e persistida em localStorage. O preview é instantâneo — não é necessário sair da tela.
- **Seção Regras:** accordion construído a partir de `data/rules.js`. Cada regra é um objeto `{ title, body }` e abre/fecha individualmente (estado local `openRule` armazena o índice ativo, ou `null` se nenhum). O `body` usa `whitespace-pre-line` para preservar quebras de linha do conteúdo.

### 18.2 Sistema de Temas

Os temas são aplicados via classe no `<body>` (`theme-{id}`) e os overrides de cor vivem em `index.css`. O `main.jsx` chama `applyTheme(getTheme())` antes do `createRoot`, garantindo que a página já carregue com o tema correto (sem flash de cor).

**Temas disponíveis** (em `utils/themes.js`):

| ID | Label | Paleta |
|----|-------|--------|
| `mono` | Mono | Default — preto/branco/zinc (sem overrides) |
| `synthwave` | Synthwave | Violeta profundo + magenta/teal |
| `minimal` | Minimal | Quase-preto + amarelo elétrico |
| `casino` | Casino | Esmeralda + âmbar |
| `junina` | Junina | Vinho/marrom + âmbar + tons quentes |
| `light` | Light | Creme claro + texto escuro + laranja |

**API (`utils/themes.js`):**
```javascript
getTheme()                    // → id atual (lê localStorage, fallback 'mono')
applyTheme(id)                // persiste e aplica classe no <body>
cycleTheme(currentId)         // → próximo id; já aplica
themeLabel(id)                // → label para exibição
THEMES                        // array de { id, label }
DEFAULT_THEME                 // 'mono'
```

**Chave de persistência:** `'papelito_theme'` em localStorage — separada das chaves de partida e TEST_MODE. Trocar de tema nunca afeta partida em andamento.

**Como funciona o override:**
Cada tema declara em `index.css` regras como:
```css
body.theme-synthwave .bg-black     { background-color: #0f0820 !important; }
body.theme-synthwave .bg-zinc-800  { background-color: #1a0f3a !important; }
body.theme-synthwave .text-zinc-400 { color: #a78bfa !important; }
/* ...e assim por diante */
```
Os componentes continuam usando as classes Tailwind padrão (`bg-black`, `bg-zinc-800`, `text-zinc-400`, `bg-white`, `text-black`, `border-white`, etc). O CSS resolve a aparência final baseado na classe ativa no body. **Importante:** ao introduzir nova classe Tailwind de cor em componentes, considere se ela precisa de override por tema — caso contrário, ficará "vazando" a cor mono em todos os temas.

### 18.3 data/rules.js

Array de objetos `{ title, body }` com as regras do jogo em formato curto, adequado para leitura mobile. É a versão "exibível" do `rules.md` (que serve como referência humana mais longa). Conteúdo cobre: o que é o Papelito, jogadores e times, modos Normal vs Temático, dinâmica de turno, as 4 rodadas, ordem dos times, rotação de jogadores, vitória e empate, persistência.

Adicionar/remover/editar regras é puro — basta editar o array; o accordion se reconstrói automaticamente.

---

## 19. PWA Fullscreen e Prompt de Instalação

### 19.1 Fullscreen real

O manifest usa `display: 'fullscreen'` com `display_override: ['fullscreen', 'standalone', 'minimal-ui']`. Quando o app é aberto pelo ícone na tela inicial (instalado como PWA), o navegador esconde:
- Address bar do Chrome/Samsung Internet
- Barra de status do sistema
- **Botões de navegação do Android** (voltar, home, recentes) — incluindo os do Samsung

`display_override` fornece uma lista ordenada de fallbacks para dispositivos que não suportem fullscreen completo.

**Limitação intransponível:** essas regras só valem quando o app está rodando standalone (instalado). Em uma aba normal de browser, a address bar e os controles do sistema permanecem visíveis — é uma decisão de segurança do Chrome/Safari, não há contorno técnico. Por isso o prompt de instalação (seção 19.3) é parte essencial da experiência.

### 19.2 Meta tags em `index.html`

```html
<meta name="viewport" content="...,viewport-fit=cover" />
<meta name="theme-color" content="#000000" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Papelito" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

- `viewport-fit=cover`: permite que o conteúdo se estenda sob notches e safe areas
- Tags `apple-*`: equivalentes iOS do manifest (Safari não lê o `manifest.json` para PWA fullscreen)
- `apple-touch-icon`: ícone usado quando o usuário adiciona à tela inicial pelo iOS

### 19.3 Hook `useInstallPrompt`

```javascript
const { canShow, ios, installed, dismissed, promptInstall, dismiss } = useInstallPrompt()
```

Responsabilidades:
- Escuta `beforeinstallprompt` (Chrome/Edge/Samsung Internet) — armazena o evento em state com `e.preventDefault()` para poder disparar manualmente depois.
- Escuta `appinstalled` — marca como instalado e limpa o evento.
- Detecta iOS via UA — Safari não dispara `beforeinstallprompt`, então a flag `ios` sinaliza necessidade de instruções manuais.
- Detecta se já roda standalone via `matchMedia('(display-mode: standalone)')` e variantes — esconde o banner quando o app já está instalado.
- Persiste dismissal em `localStorage` sob chave separada `'papelito_install_dismissed'`.

`canShow` é verdadeiro quando: não está rodando standalone, não foi dispensado, **e** (há evento nativo disponível **ou** é iOS).

`promptInstall()` dispara o prompt nativo e retorna `'accepted' | 'dismissed'` do `userChoice`.

### 19.4 Componente `InstallBanner`

Renderizado no fim da `SetupScreen` (após `SettingsScreen`), posição `fixed bottom-4 left-4 right-4 z-40`. Aparece apenas quando `canShow === true`.

Estrutura: título "Instalar Papelito" + descrição curta + botão ✕ de dispensa + botão "Instalar".

Fluxo por plataforma:
- **Android (Chrome/Samsung Internet):** clique em "Instalar" → `promptInstall()` dispara o prompt nativo do sistema. Se o usuário dispensar, marca como `dismissed`.
- **iOS Safari:** clique em "Instalar" → abre modal de instruções (`IOSInstructions`) com passo-a-passo: Compartilhar ⬆️ → Adicionar à Tela de Início → Adicionar.

### 19.5 Chaves de localStorage usadas pelo app

| Chave | Conteúdo | Reset |
|-------|----------|-------|
| `papelito_game_state` | GameState serializado da partida em andamento | Limpa em `gameOver` |
| `papelito_test_mode` | `'1'` quando TEST_MODE ativo | Toggle via combo secreto |
| `papelito_theme` | ID do tema ativo (`mono`, `synthwave`, etc) | Trocado via SettingsScreen |
| `papelito_install_dismissed` | `'1'` quando o usuário dispensou o banner de instalação | Não há reset programático — usuário precisa limpar manualmente |

Todas as chaves são independentes — mexer em uma nunca afeta as outras.

### 19.6 Como verificar em desenvolvimento

PWA install só funciona em build de produção servida por HTTPS:
1. `npm run build && npm run preview` localmente, ou
2. Deploy no Cloudflare Pages (já HTTPS por default).

Critérios mínimos do Chrome para disparar `beforeinstallprompt`: manifest válido, service worker registrado, ícone 192px e 512px, servido em HTTPS, usuário interagiu com a página por pelo menos 30 segundos. O `vite-plugin-pwa` já garante manifest e service worker.