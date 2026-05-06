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
│   │   └── CountdownLock/          → botão com travamento regressivo de N segundos
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
│   │   └── storage.js              → chave e serialização do localStorage
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

// Player — 4 slots criados em SETUP_COMPLETE (mínimo obrigatório).
// Slots adicionais criados via NEXT_PLAYER conforme mais jogadores entram.
{
  index:  number,          // 0-based. "Jogador N" = index + 1
  teamId: 'A' | 'B' | null, // null até o jogador escolher o time em wordInput
  color:  string,          // PLAYER_COLORS[index] — atribuído automaticamente na criação
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
  // 4 slots criados em SETUP_COMPLETE com teamId: null e color atribuída.
  // Slots adicionais criados em NEXT_PLAYER se mais jogadores quiserem entrar.
  // teamId é preenchido pelo próprio jogador durante wordInput via SET_PLAYER_TEAM.
  players: [],               // Player[] — populado em SETUP_COMPLETE (4 slots iniciais)

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
  └─[TIEBREAKER_FORMAT_SELECTED]──────────────────→ roulette (sorteia time) → turnPass

gameOver
  └─ estado terminal. localStorage é limpo.
```

---

## 7. Actions do Reducer

### Setup

| Action | Payload | Comportamento |
|--------|---------|---------------|
| `SET_MODE` | `'normal' \| 'themed'` | Atualiza `mode`. Se themed, zera `wordsPerPlayer` (será derivado de `themes.length`). |
| `SET_TURN_DURATION` | `number` | Atualiza `turnDuration`. |
| `SET_WORDS_PER_PLAYER` | `number` | Só válido no Modo Normal. |
| `ADD_THEME` | `string` | Adiciona ao array `themes`. `wordsPerPlayer` passa a ser `themes.length`. |
| `REMOVE_THEME` | `string` | Remove do array `themes`. Recalcula `wordsPerPlayer`. |
| `SETUP_COMPLETE` | — | Cria 4 slots em `players[]` com `index: 0–3`, `teamId: null`, `color: getColor(index)`. `phase → 'wordInput'`. |

### Inserção de Palavras

| Action | Payload | Comportamento |
|--------|---------|---------------|
| `SET_PLAYER_TEAM` | `'A' \| 'B'` | Atualiza `teamId` do objeto em `players[wordInputCurrentIndex]`. O objeto já existe — criado em `SETUP_COMPLETE` ou `NEXT_PLAYER`. |
| `ADD_WORD` | `{ text, theme? }` | Cria uma `Word` com `id = crypto.randomUUID()`, `playerIndex = wordInputCurrentIndex`. No Modo Temático, `theme` é passado pela tela com base no índice do campo (`themes[i]`). Adiciona ao `pool`. |
| `PLAYER_CONFIRMED` | — | Irreversível. Adiciona o player finalizado ao `teams[teamId].playerIndices`. `phase → 'wordInputPass'`. |
| `NEXT_PLAYER` | — | Incrementa `wordInputCurrentIndex`. Cria novo slot em `players[]` com `index: wordInputCurrentIndex`, `teamId: null`, `color: getColor(index)`. `phase → 'wordInput'`. |
| `START_GAME` | — | Validação deve passar (ver seção 8.1). Trava o `pool`. `phase → 'roulette'`. |

### Roulette e Início

| Action | Payload | Comportamento |
|--------|---------|---------------|
| `ROULETTE_DONE` | `'A' \| 'B'` | Define `currentTeamId` e `roundStartTeam`. Sempre reconstrói `queue = shuffle([...pool])`, tanto no Round 1 quanto no desempate. Não altera `queuePos` — usa o valor atual. `phase → 'turnPass'`. |

### Turno

| Action | Payload | Comportamento |
|--------|---------|---------------|
| `TURN_CONFIRMED` | — | `currentWord = queue[0]`. `phase → 'playing'`. |
| `HIT` | — | `teams[currentTeamId].score++`. `turnHits++`. Remove `currentWord` da `queue`. Verifica se `queue.length === 0` (ver seção 8.2). Caso contrário: `currentWord = queue[0]`. |
| `SKIP` | — | Move `currentWord` para o final de `queue`. `currentWord = queue[0]`. |
| `END_TURN` | — | Reinsere `currentWord` no final da `queue`. `queue = shuffle(queue)`. Avança `queuePos` do time atual. Alterna `currentTeamId`. `turnHits = 0`. `phase → 'turnPass'`. |

### Rodada

| Action | Payload | Comportamento |
|--------|---------|---------------|
| `ADVANCE_ROUND` | — | `round++`. `roundStartTeam = time oposto ao roundStartTeam atual`. `currentTeamId = novo roundStartTeam`. `queue = shuffle([...pool])`. Avança `queuePos` do time que vai começar. `phase → 'turnPass'`. |
| `GAME_OVER` | — | `phase → 'gameOver'`. Limpa `localStorage`. |

### Desempate

| Action | Payload | Comportamento |
|--------|---------|---------------|
| `START_TIEBREAKER` | — | `phase → 'tiebreaker'`. |
| `SELECT_TIEBREAKER_FORMAT` | `1 \| 2 \| 3 \| 4` | `tiebreakerFormat = payload`. `phase → 'roulette'` (sorteia time que começa). |
| `RANDOMIZE_TIEBREAKER_FORMAT` | — | `tiebreakerFormat = random(1,4)`. `phase → 'roulette'`. |

---

## 8. Regras de Negócio — Restrições Críticas

### 8.1 Validação do START_GAME

`START_GAME` só é processado se:
- `players.length >= 4`
- `teams.A.playerIndices.length >= 2`
- `teams.B.playerIndices.length >= 2`

O botão "Iniciar Jogo" só é **renderizado** na `WordInputPassScreen` quando essas três condições são satisfeitas simultaneamente. Se o botão não aparece, não há erro — a condição simplesmente não foi atingida ainda.

### 8.2 Detecção de Fim de Rodada e Fim de Jogo

Após cada `HIT`, verificar na seguinte ordem:

```javascript
if (queue.length === 0) {
  if (round === 4) {
    if (teams.A.score === teams.B.score) {
      dispatch('START_TIEBREAKER')
    } else {
      dispatch('GAME_OVER')
    }
  } else {
    phase → 'roundTransition'
  }
}
```

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

O timer é sempre reiniciado integralmente no início de cada turno (`TURN_CONFIRMED`). Tempo restante de turnos anteriores não acumula nem transfere.

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
- Exibe "Jogador N" (onde N = `wordInputCurrentIndex + 1`) no topo, com a cor `PLAYER_COLORS[wordInputCurrentIndex]`.
- Toggle/seletor de time (A ou B) — obrigatório antes de liberar os campos de palavra.
- Campos de texto: exatamente `wordsPerPlayer` campos.
- **Modo Temático:** cada campo exibe `themes[i]` como label fixo acima do input — não como placeholder. O label persiste enquanto o jogador digita. Ao disparar `ADD_WORD`, a tela passa `theme: themes[i]` no payload com base no índice do campo.
- **Auto-foco:** ao entrar na tela, foco vai para o primeiro campo vazio. Após confirmar cada palavra (Enter ou blur), foco avança para o próximo campo vazio. Se todos preenchidos, foco vai para o botão de confirmar.
- Botão "Confirmar" só fica habilitado quando **todos** os campos estiverem preenchidos e o time estiver selecionado.
- Ao confirmar: dispara `PLAYER_CONFIRMED`. `phase → 'wordInputPass'`.

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
- Animação visual de roleta sorteando "Time A" ou "Time B".
- Ao finalizar a animação: dispara `ROULETTE_DONE` com o resultado.
- Reutilizada no desempate (mesmo comportamento).

### TurnPassScreen
- Exibe: "Vez do Time [X]" com a cor do time.
- Exibe o placar atual (`ScoreBoard`).
- Exibe a rodada atual (`RoundBadge`).
- Botão "Estou pronto" — **sempre visível**. Não há lógica de visibilidade por jogador. O jogo parte do pressuposto social de que o dispositivo já está nas mãos do jogador correto do time indicado. Dispara `TURN_CONFIRMED`.

### TurnScreen
- Exibe `WordCard` com o texto de `currentWord` na cor `PLAYER_COLORS[currentWord.playerIndex]`.
- Exibe `Timer` em contagem regressiva a partir de `turnDuration`.
- Botão "✅ Acertou" → dispara `HIT`.
- Botão "⏭️ Pular" → dispara `SKIP`.
- Quando o timer zera: `useTimer` dispara `END_TURN` automaticamente.
- `useWakeLock` ativo nesta tela — solicita Wake Lock ao entrar, libera ao sair.

### RoundTransitionScreen
- Exibe o resultado da rodada que acabou (pontos marcados nela — opcional, se quiser derivar do state).
- Exibe o ícone, número e regra da próxima rodada.
- Botão "Continuar" → dispara `ADVANCE_ROUND`.

### TiebreakerScreen
- Exibe mensagem de empate com placar.
- Botão "Sortear formato" → dispara `RANDOMIZE_TIEBREAKER_FORMAT`.
- Quatro botões de formato (Livre, Uma Palavra, Mímica, Som) → cada um dispara `SELECT_TIEBREAKER_FORMAT` com o valor correspondente (1, 2, 3, 4).

### ResultsScreen
- Exibe placar final de ambos os times.
- Exibe o time vencedor em destaque.
- Botão "Nova Partida" → usa `CountdownLock` de 5 segundos. Ao confirmar: limpa `localStorage`, reseta o estado para `initialState` e navega para `setup`.

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
- O timer não reinicia automaticamente — deve ser iniciado explicitamente via `start()` em `TURN_CONFIRMED`.

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
- `save(state)` → serializa e persiste o `GameState` completo.
- `load()` → desserializa e retorna o estado ou `null` se não existir.
- `clear()` → remove a chave.
- Chamado em `App.jsx`: ao inicializar, tenta `load()`. Se encontrar estado salvo com `phase !== 'gameOver'` e `phase !== 'setup'`, oferece retomada.
- O reducer chama `save` após cada action via middleware/efeito no `GameContext`.

---

## 13. Persistência

- **Chave:** `'papelito_game_state'`
- **Quando salvar:** após cada dispatch de qualquer action.
- **Quando limpar:** na action `GAME_OVER` e ao iniciar nova partida.
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