# Papelito — Progress Log

Este documento registra o progresso da implementação fase a fase. É atualizado ao final de cada fase pelo agente que a executou. Deve ser enviado junto com o `content.md` em todas as sessões para garantir continuidade e evitar contradições entre sessões.

---

## Fase 1 — Esqueleto e Configuração

**Status:** `[ ] Pendente` `[ ] Em andamento` `[x] Concluída`
**Data de conclusão:** —

### O que foi implementado
- [ ] Estrutura de pastas completa
- [ ] `package.json` com dependências
- [ ] `vite.config.js` com vite-plugin-pwa configurado
- [ ] `tailwind.config.js` + `postcss.config.js`
- [ ] `index.html`
- [ ] `public/_redirects`
- [ ] `public/icons/` (placeholders)
- [ ] `initialState.js`
- [ ] `utils/colors.js` — paleta + `getColor()`
- [ ] `utils/shuffle.js` — Fisher-Yates
- [ ] `utils/storage.js` — `STORAGE_KEY` + `serialize`/`deserialize`
- [ ] `store/gameReducer.js` — estrutura base (sem lógica ainda)
- [ ] `store/GameContext.jsx` — estrutura base
- [ ] `App.jsx` — estrutura base (renderiza setup por padrão)
- [ ] `main.jsx`
- [ ] Projeto abre no browser sem erros

### Decisões tomadas fora do content.md
*(Registrar aqui qualquer decisão que o agente tomou por conta própria durante a implementação — bibliotecas extras, estruturas alternativas, ajustes de configuração, etc.)*
—

### Problemas encontrados e como foram resolvidos
—

### Estado atual
—

---

## Fase 2 — Estado e Reducer

**Status:** `[ ] Pendente` `[ ] Em andamento` `[x] Concluída`
**Data de conclusão:** —

### O que foi implementado
- [ ] `gameReducer.js` completo — todas as actions
- [ ] `GameContext.jsx` completo — Provider + useEffect de save/clear
- [ ] `hooks/useLocalStorage.js`
- [ ] `store/initialState.js` finalizado
- [ ] Actions testadas no console (HIT, SKIP, END_TURN, ADVANCE_ROUND, ROULETTE_DONE, PLAYER_CONFIRMED, RESET_GAME, LOAD_GAME)
- [ ] Lógica de 8.2 (fim de rodada / fim de jogo / tiebreaker) funcionando
- [ ] Lógica de 8.6 (rotação circular de jogadores) funcionando
- [ ] Persistência funcionando — save após cada action, clear em gameOver

### Decisões tomadas fora do content.md
—

### Problemas encontrados e como foram resolvidos
—

### Estado atual
—

---

## Fase 3 — Hooks e Telas de Setup

**Status:** `[ ] Pendente` `[ ] Em andamento` `[x] Concluída`
**Data de conclusão:** —

### O que foi implementado
- [ ] `hooks/useTimer.js` — start, pause, reset, onEnd
- [ ] `hooks/useWakeLock.js`
- [ ] `components/Button/`
- [ ] `components/CountdownLock/` — prop `seconds` com padrão 5
- [ ] `screens/SetupScreen/` — valores padrão preenchidos (5 palavras, 60s)
- [ ] `screens/WordInputScreen/` — seleção de time, batch confirm, auto-foco, labels temáticos
- [ ] `screens/WordInputPassScreen/` — bloqueio, botão condicional "Iniciar Jogo" com CountdownLock
- [ ] `screens/RouletteScreen/` — sorteio local + animação + ROULETTE_DONE
- [ ] Fluxo setup → wordInput → wordInputPass → roulette validado de ponta a ponta
- [ ] Modal de retomada no App.jsx funcionando (LOAD_GAME)

### Decisões tomadas fora do content.md
—

### Problemas encontrados e como foram resolvidos
—

### Estado atual
—

---

## Fase 4 — Telas de Jogo e Finalização

**Status:** `[ ] Pendente` `[ ] Em andamento` `[x] Concluída`
**Data de conclusão:** —

### O que foi implementado
- [ ] `components/WordCard/` — cor via getColor(playerIndex)
- [ ] `components/Timer/` — visual do cronômetro
- [ ] `components/ScoreBoard/`
- [ ] `components/RoundBadge/` — lógica tiebreakerFormat vs round
- [ ] `screens/TurnPassScreen/` — RoundBadge com lógica de tiebreaker
- [ ] `screens/TurnScreen/` — timer start/reset na montagem, WakeLock
- [ ] `screens/RoundTransitionScreen/` — ROUNDS[round + 1]
- [ ] `screens/TiebreakerScreen/` — Sortear, Escolher, Aceitar Empate
- [ ] `screens/ResultsScreen/` — vitória/empate, CountdownLock no "Nova Partida"
- [ ] PWA instalável testado (manifest + Service Worker)
- [ ] Wake Lock testado em dispositivo real
- [ ] Deploy no Cloudflare Pages configurado e funcionando
- [ ] Jogo completo jogável do início ao fim

### Decisões tomadas fora do content.md
—

### Problemas encontrados e como foram resolvidos
—

### Estado atual
—

---

## Notas Gerais

*(Espaço para observações que atravessam fases — padrões adotados, convenções de código, decisões de estilo que valem para o projeto inteiro.)*
—
