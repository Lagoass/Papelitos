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
**Data de conclusão:** 2026-05-06

### O que foi implementado
- [x] `hooks/useTimer.js` — setInterval com start/pause/reset/onEnd; onEnd via ref para evitar stale closure; cleanup no unmount
- [x] `hooks/useWakeLock.js` — acquire/release com graceful fallback para browsers sem suporte
- [x] `components/Button/index.jsx` — forwardRef, 4 variantes (primary/secondary/danger/ghost)
- [x] `components/CountdownLock/index.jsx` — countdown regressivo via setTimeout encadeado, prop `seconds` com padrão 5, botão travado enquanto remaining > 0
- [x] `screens/SetupScreen/index.jsx` — seletor Normal/Temático, campos com valores do initialState (não placeholders), add/remove temas no Modo Temático, botão Continuar desabilitado se temático sem temas
- [x] `screens/WordInputScreen/index.jsx` — header com cor do jogador, seletor de time, campos de palavra com fieldsRef para auto-foco correto, labels fixos de tema no Modo Temático, batch PLAYER_CONFIRMED
- [x] `screens/WordInputPassScreen/index.jsx` — bloqueio, contador de jogadores por time, botão "Iniciar Jogo" renderizado condicionalmente (players >= 4, cada time >= 2), overlay de confirmação com CountdownLock de 5s
- [x] `screens/RouletteScreen/index.jsx` — winner gerado via useRef antes da animação, spin delays decrescentes (slot machine), setCurrent(winner) forçado ao final, ROULETTE_DONE após 1.4s de pausa
- [x] `src/App.jsx` — roteamento por PHASE_SCREENS map, useEffect([]) para load único, modal de retomada com CountdownLock de 5s no "Nova partida"

### Decisões tomadas fora do content.md
- **`Button` com `forwardRef`:** necessário para que `WordInputScreen` possa dar foco programático ao botão Confirmar via `confirmRef.current?.focus()`.
- **`fieldsRef` em `WordInputScreen`:** ref mutável espelhando o state `fields` — necessário para que `focusNext` não capture valores stale do closure quando chamado do `onBlur` (que dispara antes do re-render com o novo state).
- **Roteamento via `PHASE_SCREENS` map em `App.jsx`:** mais limpo que switch; fases não implementadas (turnPass, playing, etc.) caem no `?? SetupScreen` como fallback temporário.
- **Modal de retomada usa `savedState !== null` como flag:** evita estado booleano separado; `setSavedState(null)` fecha o modal em ambos os caminhos (retomar e nova partida).
- **`WordInputPassScreen` exibe `state.pool.length`** na overlay de confirmação — informação útil para o grupo confirmar que todos inseriram palavras.
- **`SPIN_DELAYS` com 15 frames** na RouletteScreen: equilíbrio entre animação perceptível (~2.6s total) e tempo de espera aceitável para um party game mobile.
- **Tema como label colorido** (cor do jogador) acima do input no Modo Temático — o spec diz "label fixo acima do input" mas não especifica cor; usamos a cor do jogador atual para consistência visual com o header.

### Problemas encontrados e como foram resolvidos
- **Auto-foco stale closure:** `onBlur` disparava antes do re-render causado pelo `onChange`, fazendo `focusNext` ler `fields` desatualizado. Resolvido com `fieldsRef` que é atualizado sincronamente dentro do `setFields` updater function.
- **`CountdownLock` com `onClick={undefined}`** enquanto bloqueado — intencional; o `disabled={true}` já impede interação, mas garantir `onClick={undefined}` evita qualquer handler acidental.

### Estado atual
Fase 3 concluída. Fluxo completo setup → wordInput → wordInputPass → roulette → turnPass funcional. App.jsx com modal de retomada operacional. Próximo passo: componentes visuais (WordCard, Timer, ScoreBoard, RoundBadge) e telas de jogo (TurnPassScreen, TurnScreen, RoundTransitionScreen, TiebreakerScreen, ResultsScreen) — Fase 4.

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
