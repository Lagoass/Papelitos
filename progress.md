# Papelito — Progress Log

Este documento registra o progresso da implementação fase a fase. É atualizado ao final de cada fase pelo agente que a executou. Deve ser enviado junto com o `content.md` em todas as sessões para garantir continuidade e evitar contradições entre sessões.

---

## Fase 1 — Esqueleto e Configuração

**Status:** `[ ] Pendente` `[ ] Em andamento` `[x] Concluída`
**Data de conclusão:** 2026-05-06

### O que foi implementado
- [x] Estrutura de pastas completa (screens, components, hooks, store, utils + subdiretórios)
- [x] `package.json` com dependências (React 18, Vite 5, Tailwind 3, vite-plugin-pwa)
- [x] `vite.config.js` com vite-plugin-pwa configurado conforme seção 14
- [x] `tailwind.config.js` + `postcss.config.js`
- [x] `index.html` (viewport com user-scalable=no para mobile)
- [x] `public/_redirects` com `/* /index.html 200`
- [x] `public/icons/` (diretório criado — ícones reais serão adicionados antes do deploy)
- [x] `src/store/initialState.js` conforme seção 5
- [x] `src/utils/colors.js` — paleta PLAYER_COLORS + getColor()
- [x] `src/utils/shuffle.js` — Fisher-Yates (cria cópia do array antes de shuffle)
- [x] `src/utils/storage.js` — STORAGE_KEY + serialize/deserialize
- [x] `src/store/gameReducer.js` — estrutura base com todos os cases declarados retornando state; RESET_GAME retorna initialState, LOAD_GAME retorna payload
- [x] `src/store/GameContext.jsx` — Context + Provider com useReducer + hook useGame()
- [x] `src/App.jsx` — renderiza SetupScreen placeholder via useGame
- [x] `src/main.jsx` — monta app no #root, envolve com GameProvider
- [x] `src/index.css` — diretivas Tailwind (@tailwind base/components/utilities)

### Decisões tomadas fora do content.md
- `src/index.css` criado com as diretivas Tailwind (necessário para Tailwind funcionar com Vite, não mencionado explicitamente na seção 3 mas obrigatório).
- `user-scalable=no` no viewport do `index.html` — padrão para PWA mobile que evita zoom acidental durante o jogo.
- `useGame()` exportado do `GameContext.jsx` — não mencionado explicitamente no content.md mas implícito pelo uso nas telas.
- `RESET_GAME` e `LOAD_GAME` já implementados no reducer (lógica trivial — retornam initialState e payload respectivamente) mesmo sendo Fase 1.

### Problemas encontrados e como foram resolvidos
- Nenhum problema encontrado. Projeto está pronto para `npm install` seguido de `npm run dev`.

### Estado atual
Fase 1 concluída. Estrutura completa criada. Próximo passo: implementar a lógica completa de todas as actions no `gameReducer.js` e os hooks (Fase 2).

---

## Fase 2 — Estado e Reducer

**Status:** `[ ] Pendente` `[ ] Em andamento` `[x] Concluída`
**Data de conclusão:** 2026-05-06

### O que foi implementado
- [x] `gameReducer.js` completo — todas as 18 actions com lógica real
- [x] `GameContext.jsx` completo — Provider + `useEffect` de save/clear conforme seção 12
- [x] `hooks/useLocalStorage.js` — save/load/clear consumindo serialize/deserialize de storage.js
- [x] `store/initialState.js` — não alterado (já estava correto na Fase 1)
- [x] Lógica de 8.1 (validação START_GAME: players >= 4, cada time >= 2) implementada
- [x] Lógica de 8.2 (detecção de fim de rodada/jogo/tiebreaker no HIT com newQueue) implementada
- [x] Lógica de 8.3 (distinção END_TURN vs ADVANCE_ROUND vs ROULETTE_DONE na queue) implementada
- [x] Lógica de 8.4 (reinserção de currentWord no final antes do shuffle no END_TURN) implementada
- [x] Lógica de 8.5 (alternância rígida de roundStartTeam no ADVANCE_ROUND) implementada
- [x] Lógica de 8.6 (queuePos circular contínuo, nunca resetado; incrementado em END_TURN e ADVANCE_ROUND, não em ROULETTE_DONE) implementada
- [x] Persistência: save após cada mudança de phase != 'setup', clear em phase === 'gameOver'
- [x] GameContext expõe `{ state, dispatch, load, clear }` para uso do App.jsx

### Decisões tomadas fora do content.md
- **Verificação de empate pós-incremento:** A seção 8.2 mostra `state.teams.A.score === state.teams.B.score` com o estado original, mas o HIT deve incrementar o score antes de checar empate (caso contrário, o último ponto nunca seria contado). O reducer constrói `newTeams` com o score incrementado e usa `newTeams.A.score === newTeams.B.score` na comparação. Isso é semanticamente correto para o jogo.
- **`currentWord: null` no END_TURN:** O spec não menciona explicitamente, mas faz sentido limpar `currentWord` ao sair de `playing`. É reatribuído em TURN_CONFIRMED.
- **eslint-disable no useEffect de save/clear:** O array de dependências `[state]` é intencional conforme spec seção 12. As funções `save` e `clear` são omitidas propositalmente para evitar loop.
- **GameContext expõe `load` e `clear`** (além de `state` e `dispatch`) para que App.jsx possa implementar o modal de retomada sem importar useLocalStorage diretamente.
- **`useLocalStorage` sem memoização:** As funções retornadas são recriadas a cada render mas são puras (apenas chamam localStorage), então não causam loops nem side effects.

### Problemas encontrados e como foram resolvidos
- Nenhum problema de implementação. A ambiguidade do score no tiebreaker (pré vs pós incremento) foi resolvida optando pelo pós-incremento, que é o comportamento correto do jogo.

### Estado atual
Fase 2 concluída. O reducer está completo e correto. Próximo passo: hooks de timer e wake lock, componentes base (Button, CountdownLock) e telas de setup/wordInput/roulette (Fase 3).

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
