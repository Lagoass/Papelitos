# Passa o Celular — Contrato da Categoria

> **Escopo:** como TODO jogo local (um celular, pass-and-play) é estruturado no LaGames.
> Este é o guia de "como criar um jogo novo" da categoria. O que for específico de um jogo
> (estado, actions, regras) vive no spec dele (`../specs/<jogo>.md`).

---

## 1. Princípios inegociáveis

1. **Zero rede.** O jogo funciona 100% offline — rede é um custo que esta categoria não
   paga (Change.md §2). Nenhum fetch, nenhuma dependência de sinal, nunca.
2. **Sem lobby.** Abrir → jogar. Nenhuma etapa entre a home do hub e o setup do jogo.
3. **Estado local, reducer puro.** Toda a lógica vive num reducer síncrono e determinístico;
   efeitos colaterais ficam em hooks/Provider.
4. **O reducer é a fonte da verdade.** Telas são funções do estado; nenhuma regra de jogo
   vive em componente.

## 2. Anatomia de um módulo

```
src/games/<jogo>/
├── index.jsx        ← entry: <Jogo onExit autoResume /> — o ÚNICO export que o shell vê
├── screens/         ← uma pasta por tela; App interno roteia por state.phase
├── components/      ← componentes do jogo (WordCard, Timer...)
├── store/
│   ├── GameContext.jsx   ← Provider (useReducer + persistência) + hook useGame()
│   ├── gameReducer.js    ← todas as actions e transições — função pura
│   └── initialState.js   ← estado zero
├── hooks/           ← efeitos colaterais (timer, wake lock, storage)
├── utils/           ← puras (shuffle, cores...) + storage.js (chave + serialize)
└── data/            ← conteúdo (rules.js p/ o registry, copy.js com a voz do jogo)
```

## 3. Contrato com o shell

- **Entry:** `export default ({ onExit, autoResume }) => <GameProvider>...</GameProvider>`.
  O Provider do jogo vive NO MÓDULO — o shell não conhece estado de jogo.
- **`onExit`:** volta à home. Oferecido apenas em telas onde sair é seguro (ex: setup).
  Durante a partida não há saída — fechar o app é seguro porque o save restaura tudo.
- **`autoResume`:** true quando o usuário tocou "Continuar partida" na home → o módulo
  despacha `LOAD_GAME` direto, sem modal. Sem a flag, entrar com save existente mostra o
  modal Retomar/Nova partida.
- **Registro:** adicionar entrada em `shell/games.js` (id, emoji, accent, gradient, meta,
  saveKey, rules). O shell NUNCA importa nada do módulo fora do registry.
- **Imports:** o módulo usa `@shell/...` para Button/confetti/etc. Nunca caminho relativo
  cruzando a fronteira.

## 4. Máquina de fases

- `state.phase` (string) controla a tela ativa; o entry mapeia `phase → Screen` num objeto
  `PHASE_SCREENS` com fallback para a tela inicial.
- O reducer nunca chama `dispatch` nem toca em storage/DOM — transições acontecem por
  `return` de novo estado.
- Timer/tempo: o reducer não sabe que tempo passou; um hook dispara a action (ex:
  `useTimer.onEnd → END_TURN`). Guards de reentrância no reducer (StrictMode double-invoke).

## 5. Persistência (o save é sagrado)

- `utils/storage.js`: exporta `STORAGE_KEY` (`<gameId>_game_state`) + serialize/deserialize.
- **Save contínuo** no Provider: após cada mudança de estado, `save(state)` — exceto em
  `setup` (não sobrescrever save existente na montagem) e `gameOver` (limpa).
- **Load único** na montagem do entry; retomada via `LOAD_GAME` (payload = estado completo).
- `LOAD_GAME` **normaliza saves antigos**: todo campo novo de estado ganha default ali —
  uma partida salva antes de um update nunca pode quebrar.
- O shell lê o save só para o card "Continuar" (`{ phase, round }` via registry).

## 6. UI da categoria

Segue `UserInterface.md` na íntegra. Pontos que são CONTRATO aqui:
- Ação primária embaixo (thumb zone), min-h 56px+; destrutivas no topo.
- Tela de passagem de celular = palco (uma decisão por tela) com reação à inação.
- Timer com faixas de urgência; vibração como bônus (`navigator.vibrate?.()`).
- Clímax (confete/pódio) apenas nos 3 momentos do orçamento (§4).
- `prefers-reduced-motion`: movimento vira cor — feedback nunca some.

## 7. Checklist de jogo novo

1. Rulebook primeiro (`docs/rulebook/<jogo>.md`) — define o produto.
2. Módulo com a anatomia do §2; reducer + initialState antes das telas.
3. Entrada no registry + template de UI (`UserInterface.md` §8.2).
4. Spec técnico (`docs/specs/<jogo>.md`) crescendo junto com a implementação.
5. Verificação: partida completa dirigida no browser + build + save/retomada.
