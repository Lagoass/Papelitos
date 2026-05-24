# Papelito

**[papelitos.pages.dev](https://papelitos.pages.dev)**

Um PWA de jogo de festa onde dois times competem em 4 rodadas com regras de comunicação progressivamente mais restritivas.

## Como Funciona

Dois times se alternam tentando adivinhar palavras secretas criadas por todos os jogadores no início da partida. As mesmas palavras se repetem nas **4 rodadas**, cada uma com uma restrição de comunicação mais severa:

| Rodada | Regra |
|--------|-------|
| 1 — Livre | Descrição livre. Proibido dizer a palavra, traduções ou derivações. |
| 2 — Uma Palavra | Exatamente uma palavra como dica. Proibido gestos ou sons. |
| 3 — Mímica | Apenas gestos e expressões. Proibido qualquer som. |
| 4 — Som | Apenas sons e onomatopeias. Proibido palavras e gestos explicativos. |

A memória coletiva construída nas rodadas anteriores é a mecânica principal — na Rodada 4, os times adivinham palavras apenas por sons.

## Stack

- **React 18 + Vite** — 100% client-side, sem backend
- **Tailwind CSS** — apenas classes utilitárias
- **vite-plugin-pwa** — Service Worker + manifest instalável
- **Context API + useReducer** — gerenciamento de estado global
- **localStorage** — persistência de partida em andamento
- **Cloudflare Pages** — destino de deploy

## Modos de Jogo

**Normal:** Os jogadores inserem um número configurável de palavras por jogador (padrão: 5) sem restrição de tema.

**Temático:** O grupo define temas previamente. Cada jogador escreve uma palavra por tema. A quantidade de palavras é derivada do número de temas.

## Instalação

```bash
npm install
npm run dev
```

## Build e Deploy

```bash
npm run build
```

Faça o deploy da pasta `dist/` no Cloudflare Pages com:
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 18

O arquivo `public/_redirects` (`/* /index.html 200`) é obrigatório para que o roteamento client-side funcione no Cloudflare Pages.

## Estrutura do Projeto

```
src/
├── screens/          # Um componente por fase do jogo
├── components/       # UI compartilhada (WordCard, Timer, ScoreBoard, etc.)
├── store/            # GameContext, gameReducer, initialState
├── hooks/            # useTimer, useWakeLock, useLocalStorage
└── utils/            # shuffle, colors, storage
```

## Fluxo do Jogo

```
Configuração → Inserção de Palavras (por jogador) → Roleta → Passagem de Turno → Jogando
                                                                        ↓
                                                          Transição de Rodada → (repete)
                                                                        ↓
                                                               Fim de Jogo / Desempate
```

- Mínimo de 4 jogadores, 2 por time para iniciar
- Dispositivo único passado entre os jogadores (pass-and-play)
- Timer por turno (padrão: 60s), configurável na tela inicial
- Wake Lock ativo durante os turnos para evitar que a tela apague
- Estado da partida salvo automaticamente no localStorage; retomável ao reabrir o app

## Regras Importantes

- As palavras são travadas após cada jogador confirmar — sem edição posterior (evita espiar)
- O pool de palavras nunca muda entre rodadas; apenas a fila ativa é reconstruída
- A alternância de times por rodada é rígida: se o Time A abre a Rodada 1, o Time B abre a Rodada 2
- A rotação de jogadores dentro de cada time é circular e nunca reseta, nem na virada de rodada
- Em caso de empate após a Rodada 4, os times escolhem ou sorteiam um formato de desempate e jogam mais uma rodada
