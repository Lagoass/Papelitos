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
