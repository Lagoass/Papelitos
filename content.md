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
│   │   ├── WordInputScreen/        → seleção de time + inserção de palavras
│   │   ├── WordInputPassScreen/    → bloqueio entre jogadores no setup
│   │   ├── RouletteScreen/         → animação de sorteio do time inicial
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
│   │   └── useLocalStorage.js      → abstração de save/load/clear do GameState
│   │
│   ├── utils/
│   │   ├── shuffle.js              → Fisher-Yates shuffle
│   │   ├── colors.js               → paleta PLAYER_COLORS + getColor(playerIndex)
│   │   └── storage.js              → exporta STORAGE_KEY + funções serialize/deserialize
│   │                                  (useLocalStorage.js consome este arquivo — não duplicar lógica)
│   │
│   ├── App.jsx                     → renderiza a screen correta baseado em state.phase
│   └── main.jsx                    → monta o app no #root, envolve com GameProvider
│
├── index.html
├── vite.config.js                  → configuração do Vite + vite-plugin-pwa
├── tailwind.config.js
├── postcss.config.js
└── package.json
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
  index:  number,            // 0-based. "Jogador N" = index + 1
  teamId: 'A' | 'B' | null, // null até o jogador escolher o time em wordInput
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
  // 'setup' | 'wordInput' | 'wordInputPass' | 'roulette' |
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
  teams: {
    A: { score: 0, playerIndices: [], queuePos: 0 },
    B: { score: 0, playerIndices: [], queuePos: 0 },
  },

  // Time jogando no turno atual.
  currentTeamId: null,       // 'A' | 'B' — definido após a roulette

  // Time que abriu a rodada atual.
  // Usado para calcular qual time abre a próxima rodada (alternância rígida).
  roundStartTeam: null,      // 'A' | 'B'

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

  // ── DESEMPATE ─────────────────────────────────────────────────────────────
  tiebreakerFormat: null,    // 1 | 2 | 3 | 4 — formato sorteado ou escolhido
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
  ├─[RANDOMIZE_TIEBREAKER_FORMAT]─────────────────→ roulette (sorteia time) → turnPass
  └─[GAME_OVER] (aceitar empate)──────────────────→ gameOver

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
| `ADD_THEME` | `string` | Adiciona ao array `themes`. `wordsPerPlayer` passa a ser `themes.length`. |
| `REMOVE_THEME` | `string` | Remove do array `themes`. Recalcula `wordsPerPlayer`. |
| `SETUP_COMPLETE` | — | Cria apenas o primeiro slot em `players[]`: `{ index: 0, teamId: null }`. `phase → 'wordInput'`. |

### Inserção de Palavras

| Action | Payload | Comportamento |
|--------|---------|---------------|
| `SET_PLAYER_TEAM` | `'A' \| 'B'` | Atualiza `teamId` do objeto em `players[wordInputCurrentIndex]`. O objeto já existe — criado em `SETUP_COMPLETE` ou `NEXT_PLAYER`. |
| `PLAYER_CONFIRMED` | `{ words: [{ text, theme? }] }` | Irreversível. Recebe todas as palavras do jogador em batch. Para cada word, cria `{ id: crypto.randomUUID(), text, theme, playerIndex: wordInputCurrentIndex }` e adiciona ao `pool`. O `teamId` usado é `players[wordInputCurrentIndex].teamId` — atribuído anteriormente via `SET_PLAYER_TEAM`. O botão Confirmar só fica habilitado quando `teamId !== null`, garantindo que nunca seja null aqui. Adiciona o player finalizado ao `teams[teamId].playerIndices`. `phase → 'wordInputPass'`. No Modo Temático, cada word inclui `theme: themes[i]` — montado pela tela antes do dispatch. No Modo Normal, `theme: null`. |
| `NEXT_PLAYER` | — | Incrementa `wordInputCurrentIndex` de N para N+1. Cria o próximo slot em `players[]` com o valor **após** o incremento: `{ index: N+1, teamId: null }`. `phase → 'wordInput'`. |
| `START_GAME` | — | Validação deve passar (ver seção 8.1). Trava o `pool`. `phase → 'roulette'`. |

### Roulette e Início

| Action | Payload | Comportamento |
|--------|---------|---------------|
| `ROULETTE_DONE` | `'A' \| 'B'` | Define `currentTeamId` e `roundStartTeam`. Sempre reconstrói `queue = shuffle([...pool])`, tanto no Round 1 quanto no desempate. Não altera `queuePos` — usa o valor atual. `phase → 'turnPass'`. |

### Turno

| Action | Payload | Comportamento |
|--------|---------|---------------|
| `TURN_CONFIRMED` | — | `currentWord = queue[0]`. `phase → 'playing'`. |
| `HIT` | — | `teams[currentTeamId].score++`. `turnHits++`. Remove `currentWord` da `queue` filtrando por id: `queue.filter(w => w.id !== currentWord.id)`. Verifica se `queue.length === 0` (ver seção 8.2). Caso contrário: `currentWord = queue[0]`. |
| `SKIP` | — | Move `currentWord` para o final de `queue`. `currentWord = queue[0]`. Se `queue.length === 1`, `currentWord` permanece o mesmo objeto — comportamento esperado. O jogador só pode sair dessa situação via `END_TURN`. |
| `END_TURN` | — | Reinsere `currentWord` no final da `queue`. `queue = shuffle(queue)`. Avança `queuePos` do time atual. Alterna `currentTeamId`. `turnHits = 0`. `phase → 'turnPass'`. |

### Rodada

| Action | Payload | Comportamento |
|--------|---------|---------------|
| `ADVANCE_ROUND` | — | `round++`. `roundStartTeam = time oposto ao roundStartTeam atual`. `currentTeamId = novo roundStartTeam`. `queue = shuffle([...pool])`. Avança `queuePos` do time que vai começar. `turnHits = 0`. `phase → 'turnPass'`. |
| `GAME_OVER` | — | `phase → 'gameOver'`. O reducer não toca o localStorage — side effect tratado pelo `GameContext` (ver seção 12). |
| `RESET_GAME` | — | Retorna `initialState` diretamente. Disparado pelo `ResultsScreen` ao confirmar "Nova Partida". O localStorage já foi limpo pelo `GameContext` quando `phase` virou `'gameOver'`. |
| `LOAD_GAME` | `GameState` | Retorna o payload diretamente como novo estado. Disparado pelo `App.jsx` ao confirmar retomada de partida salva. |

### Desempate

| Action | Payload | Comportamento |
|--------|---------|---------------|
| `SELECT_TIEBREAKER_FORMAT` | `1 \| 2 \| 3 \| 4` | `tiebreakerFormat = payload`. `phase → 'roulette'` (sorteia time que começa). |
| `RANDOMIZE_TIEBREAKER_FORMAT` | — | `tiebreakerFormat = random(1,4)`. `phase → 'roulette'`. |

---

## 8. Regras de Negócio — Restrições Críticas

### 8.1 Validação do START_GAME

`START_GAME` só é processado se todas as três condições forem satisfeitas simultaneamente:
- `players.length >= 4`
- `teams.A.playerIndices.length >= 2`
- `teams.B.playerIndices.length >= 2`

O botão "Iniciar Jogo" só é **renderizado** na `WordInputPassScreen` quando essas três condições são verdadeiras. Se o botão não aparece, não há erro — as condições simplesmente ainda não foram atingidas.

### 8.2 Detecção de Fim de Rodada e Fim de Jogo

Após cada `HIT`, verificar na seguinte ordem:

```javascript
// Dentro do case HIT do reducer — após remover currentWord da queue:
const newQueue = state.queue.filter(w => w.id !== state.currentWord.id)

if (newQueue.length === 0) {
  if (state.round === 4) {
    if (state.teams.A.score === state.teams.B.score) {
      return { ...state, queue: newQueue, phase: 'tiebreaker', currentWord: null, tiebreakerFormat: null }
    } else {
      return { ...state, queue: newQueue, phase: 'gameOver', currentWord: null }
    }
  } else {
    return { ...state, queue: newQueue, phase: 'roundTransition', currentWord: null }
  }
}
// Se queue ainda tem palavras, apenas avança:
return { ...state, queue: newQueue, currentWord: newQueue[0] }
```

O reducer nunca chama `dispatch`. Ele recebe estado e action, e retorna novo estado diretamente. Toda transição de fase acontece via `return`. O reset de `tiebreakerFormat: null` ocorre aqui — não via `START_TIEBREAKER`.

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

`roundStartTeam` alterna a cada `ADVANCE_ROUND`. O time que começa a Rodada N+1 é sempre o oposto do que começou a Rodada N. Essa regra tem prioridade sobre a rotação individual de jogadores.

| Rodada | Time que abre |
|--------|--------------|
| 1 | Sorteado pela roulette |
| 2 | Oposto ao da Rodada 1 |
| 3 | Mesmo da Rodada 1 |
| 4 | Mesmo da Rodada 2 |
| Desempate | Sorteado pela roulette |

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

### 8.8 Irreversibilidade da Confirmação de Palavras

`PLAYER_CONFIRMED` não tem ação inversa. Uma vez confirmado, o jogador não pode editar, remover ou adicionar palavras. O reducer não implementa undo para esta action.

---

## 9. Comportamento das Telas

### SetupScreen
- Seletor de modo: Normal ou Temático.
- **Ao abrir, os campos já estão preenchidos com os valores do `initialState`** — não são placeholders, são valores reais e editáveis. O usuário pode iniciar o jogo sem tocar em nada se os padrões servirem.
- **Modo Normal:** campo numérico para `wordsPerPlayer` iniciando em `5` + campo para `turnDuration` iniciando em `60`.
- **Modo Temático:** interface para adicionar/remover temas — inicia vazia (temas são criados pelo grupo). `wordsPerPlayer` é exibido como leitura derivada de `themes.length`, não como input. Campo para `turnDuration` iniciando em `60`.
- Botão "Continuar" dispara `SETUP_COMPLETE`.

### WordInputScreen
- Exibe "Jogador N" (onde N = `wordInputCurrentIndex + 1`) no topo, com a cor `getColor(wordInputCurrentIndex)`. Este `wordInputCurrentIndex` é o `playerIndex` permanente desse jogador — o mesmo valor usado em todas as `Word` que ele criar e em qualquer chamada futura a `getColor()` para exibir sua cor.
- Toggle/seletor de time (A ou B) — obrigatório antes de liberar os campos de palavra.
- Campos de texto: exatamente `wordsPerPlayer` campos.
- **Edição livre:** todos os campos permanecem editáveis até o clique em Confirmar. O jogador pode alterar qualquer palavra quantas vezes quiser enquanto o dispositivo estiver com ele. Confirmar é a única ação que torna as palavras permanentes.
- **Modo Temático:** cada campo exibe `themes[i]` como label fixo acima do input — não como placeholder. O label persiste enquanto o jogador digita. O tema correspondente é incluído automaticamente no batch do `PLAYER_CONFIRMED` via `theme: themes[i]`.
- **Auto-foco:** ao entrar na tela, foco vai para o primeiro campo vazio. Após confirmar cada palavra (Enter ou blur), foco avança para o próximo campo vazio. Se todos preenchidos, foco vai para o botão de confirmar.
- Botão "Confirmar" só fica habilitado quando **todos** os campos estiverem preenchidos e o time estiver selecionado.
- Ao confirmar: a tela monta o array de words em batch — `fields.map((text, i) => ({ text, theme: mode === 'themed' ? themes[i] : null }))` — e dispara `PLAYER_CONFIRMED` com esse payload. `phase → 'wordInputPass'`.

### WordInputPassScreen
- Tela de bloqueio que oculta completamente o que o jogador anterior digitou.
- Exibe: "Passe o celular para o próximo jogador."
- Botão "Próximo Jogador" — sempre visível. Dispara `NEXT_PLAYER`. `phase → 'wordInput'`.
- Botão "Iniciar Jogo" — **renderizado condicionalmente** apenas quando `players.length >= 4 AND teams.A.playerIndices.length >= 2 AND teams.B.playerIndices.length >= 2`.
  - Ao pressionar: abre sobreposição de confirmação (não navega de tela).
  - Sobreposição: "Tem certeza que deseja iniciar o jogo?" + botão "Não" + botão "Sim".
  - Botão "Sim" inicia **travado** com contador regressivo de 5 segundos visível. Só fica ativo após os 5 segundos. Implementado via `CountdownLock` component.
  - Ao confirmar: dispara `START_GAME`.

### RouletteScreen
- O componente gera o time vencedor localmente via `Math.random() < 0.5 ? 'A' : 'B'` antes de iniciar a animação.
- Exibe animação visual de roleta revelando o time sorteado.
- Ao finalizar a animação: dispara `ROULETTE_DONE` com o valor gerado como payload.
- Reutilizada no desempate (mesmo comportamento).

### TurnPassScreen
- Exibe: "Vez do Time [X]" com a cor do time.
- Exibe o placar atual (`ScoreBoard`).
- Exibe `RoundBadge` com as regras da rodada ativa: usa `ROUNDS[tiebreakerFormat]` quando `tiebreakerFormat !== null`, e `ROUNDS[round]` nos demais casos — mesma lógica do `TurnScreen`.
- Botão "Estou pronto" — **sempre visível**. Não há lógica de visibilidade por jogador. O jogo parte do pressuposto social de que o dispositivo já está nas mãos do jogador correto do time indicado. Dispara `TURN_CONFIRMED`.

### TurnScreen
- Exibe `WordCard` com o texto de `currentWord` na cor `getColor(currentWord.playerIndex)`.
- Exibe `Timer` em contagem regressiva a partir de `turnDuration`.
- Exibe `RoundBadge` com as regras da rodada ativa: usa `ROUNDS[tiebreakerFormat]` quando `tiebreakerFormat !== null`, e `ROUNDS[round]` nos demais casos.
- Chama `timer.start()` no `useEffect` de montagem — o timer inicia assim que a tela entra em cena. Chama `timer.reset()` na desmontagem.
- Botão "✅ Acertou" → dispara `HIT`.
- Botão "⏭️ Pular" → dispara `SKIP`.
- Quando o timer zera: `useTimer` dispara `END_TURN` automaticamente via `onEnd`.
- `useWakeLock` ativo nesta tela — solicita Wake Lock ao entrar, libera ao sair.

### RoundTransitionScreen
- Exibe o resultado da rodada que acabou (pontos marcados nela — opcional, se quiser derivar do state).
- Exibe o ícone, número e regra da **próxima** rodada usando `ROUNDS[round + 1]`. Quando esta tela abre, `round` ainda tem o valor da rodada que terminou — `ADVANCE_ROUND` só o incrementa quando o usuário clicar "Continuar".
- Botão "Continuar" → dispara `ADVANCE_ROUND`.

### TiebreakerScreen
- Exibe mensagem de empate com placar.
- Botão "Sortear formato" → dispara `RANDOMIZE_TIEBREAKER_FORMAT`.
- Quatro botões de formato (Livre, Uma Palavra, Mímica, Som) → cada um dispara `SELECT_TIEBREAKER_FORMAT` com o valor correspondente (1, 2, 3, 4).
- Botão "Aceitar Empate" → dispara `GAME_OVER` diretamente. Encerra o jogo com resultado de empate sem jogar mais.

### ResultsScreen
- Exibe placar final de ambos os times.
- Exibe o time vencedor em destaque.
- Botão "Nova Partida" → usa `CountdownLock` de 5 segundos. Ao confirmar: dispara `RESET_GAME`, que retorna o estado para `initialState` e navega para `setup`. O localStorage já foi limpo automaticamente pelo `GameContext` ao entrar em `gameOver`.

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
// utils/colors.js
const PLAYER_COLORS = [
  '#22c55e',  // verde
  '#3b82f6',  // azul
  '#f97316',  // laranja
  '#a855f7',  // roxo
  '#ec4899',  // rosa
  '#eab308',  // amarelo
  '#06b6d4',  // ciano
  '#ef4444',  // vermelho
]

export const getColor = (playerIndex) =>
  PLAYER_COLORS[playerIndex % PLAYER_COLORS.length]
```

A cor de um jogador é sempre derivada de `getColor(player.index)`. Nunca armazenada como estado — é computada sob demanda. O `% PLAYER_COLORS.length` garante que, se houver mais jogadores do que cores, as cores reiniciam ciclicamente.

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
        display:          'standalone',
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

**Por que getColor deriva a cor do índice em vez de armazenar no estado?**
Cores são uma função determinística do índice. Armazenar informação que pode ser computada aumenta a superfície do estado sem necessidade, e cria risco de dessincronização entre o índice e a cor armazenada.