# UserInterface.md — Base de UI do LaGames

> **Propósito:** este documento é a fonte da verdade de interface do LaGames — o "como o app
> se parece, se move e fala". Vale para o hub e para todos os jogos; cada jogo adiciona apenas
> suas nuances (seção 8). Complementa o `Change.md` (migração) e, na reorganização de docs da
> Fase 1, passa a viver em `docs/architecture/`. Documento vivo: atualizar quando um padrão
> novo for adotado ou um existente cair.
>
> Base: pesquisa de referências (Jackbox, Kahoot, Duolingo, Poki, Netflix Games, Heads Up!,
> Gartic Phone, Discord, Nintendo, Headspace, Slack) — fontes na seção 2.

---

## 1. Filosofia — UI "à prova de festa"

O contexto de uso manda em tudo: **festa, pouca atenção, celular a um braço de distância,
passando de mão em mão, ambiente barulhento, celular no silencioso, às vezes álcool.**
Todo pixel do LaGames responde a esse cenário. Seis princípios:

1. **Uma tela = uma decisão.** (Jack Principles, Jackbox) Uma tarefa por vez, escolhas
   limitadas, o jogador sempre sabe o que fazer. Vocabulário de interação minúsculo:
   apertar botão gigante, ler, digitar. Nada de gestos escondidos.
2. **Legível a um braço de distância.** Tipografia gigante nos momentos-chave, contraste
   7:1 no que é crítico (CTA, timer), diferenciação por matiz (hue) — cor é lida mais rápido
   que texto de relance.
3. **Juice com exagero seletivo.** Interações frequentes recebem micro-feedback (~200ms);
   os efeitos grandes (confete + som + vibração + shake) são reservados para 2–3 momentos-
   clímax. Juice em tudo = ruído; juice no clímax = gritaria na festa.
4. **Feedback redundante e multicanal.** Toda informação tem canal visual garantido; som e
   vibração são bônus (celular no silencioso é o caso padrão, iPhone não vibra na web).
5. **Velocidade é parte do charme.** (Nintendo) Da home ao "tá divertido" em menos de 60s
   e 1–2 toques. Zero telas mortas: espera mostra progresso ou vira palco.
6. **Hub neutro, jogos gritam.** (Jackbox picker) O shell é sóbrio (dark + zinc); cada jogo
   tem identidade visual própria e contrastante que "vaza" do card para dentro do jogo.

A interface se comporta como um **apresentador de programa de TV**, não como um formulário:
puxa o jogador, comenta, reage inclusive à inação ("Cadê você, Ana?").

---

## 2. Referências — o que roubar de quem

| Referência | O que roubar |
|---|---|
| [Jack Principles (Jellyvision/Jackbox)](https://medium.com/the-charming-device/please-read-the-jack-principles-4a7ee4820875) | Uma tarefa por tela; avisar que o jogo está esperando; reagir à inação; timeouts que seguem o jogo sozinhos; pacing de TV |
| [Jackbox — design do picker (PP10)](https://www.jackboxgames.com/blog/behind-the-scenes-of-pp10-art) | Hub estrutural neutro + cada jogo com identidade própria contrastante |
| [Kahoot (Mobbin/brand)](https://mobbin.com/colors/brand/kahoot) | Cor+forma como identidade funcional; pódio revelado em etapas (3º → 2º → 1º) com confete; placar como show |
| Heads Up! ([TechCrunch](https://techcrunch.com/2013/05/02/heads-up-game-from-impending-shows-how-branded-can-be-beatiful/)) | Carta fullscreen: palavra gigante, zero cromo de app durante o turno |
| Gartic Phone ([análise](https://dev.to/adzhydra/comparing-drawing-game-architectures-skribbl-gartic-phone-and-artbitrator-36j2)) | Espera é o inimigo nº 1: encurtar interstícios, dar a quem espera algo pra ver |
| ["Juice it or lose it" / game feel](https://thedesignlab.blog/2025/01/06/making-gameplay-irresistibly-satisfying-using-game-juice/) | Mais output do que o input merece; squash & stretch; repertório de juice em CSS |
| [canvas-confetti](https://github.com/catdad/canvas-confetti) | Partículas leves: emoji via `shapeFromText()`, `disableForReducedMotion`, `useWorker`, <100 partículas |
| [View Transitions API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) | Transições de fase nativas (Baseline out/2025); guard de 3 linhas como fallback |
| [Tier list de performance de animação (Motion.dev)](https://motion.dev/magazine/web-animation-performance-tier-list) | Animar só `transform`/`opacity`; barra de timer com `scaleX`, nunca `width` |
| [PWA Power Tips (firt.dev)](https://firt.dev/pwa-design-tips/) | Kit CSS app-like completo (seção 6.3) |
| [Thumb zone (Smashing)](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/) | Ação primária embaixo no centro; destrutivas no topo (proteção natural) |
| [Poki — thumbnail guidelines](https://sdk.poki.com/game-thumbnail) | Arte de card sem texto; um "personagem" dominante (emoji); nome fora da arte |
| Netflix ([análise de cards](https://medium.com/throughdesign/netflix-a-house-of-cards-1e9fb0580082)) | Card inteiro é o botão; tamanho = importância; skeleton na geometria do card |
| [Time to Fun (Jon Lai)](https://www.jonlai.co/time-to-fun) | <60s até a diversão; "Continuar partida" com 1 toque; adiar configuração |
| [Duolingo — streak milestones](https://blog.duolingo.com/streak-milestone-design-animation) | Celebração como power-up; iterar no TIMING antes de adicionar elementos |
| [Duolingo — microinterações](https://medium.com/@Docs_API/little-touches-big-impact-the-micro-interactions-on-duolingo-d8377876f682) | Sons distintos por resultado + sempre com redundância visual; barra que pulsa |
| [Slack — voz da marca](https://slack.design/articles/thevoiceofthebrand-5principles/) | Humor de UMA linha ou nada; clareza vence a piada |
| [Headspace (case)](https://neointeraction-design.medium.com/headspace-a-case-study-on-successful-emotion-driven-ui-ux-design-ef582a130c87) | UMA cor saturada por tela reservada ao CTA; neutros levemente quentes |
| [Game UI Database](https://www.gameuidatabase.com/) | Biblioteca viva de referência (55k+ screenshots) para consultar ao desenhar telas novas |
| Estilos 2024–26 ([neubrutalism vs demais](https://www.cccreative.design/blogs/differences-in-ui-design-trends-neumorphism-glassmorphism-and-neubrutalism), [clay](https://superdesign.dev/styles/claymorphism), [grain](https://followupmedia.com/textured-grains-design-trend-2025/)) | Dark neubrutalism nos CTAs (contraste nativo); grain overlay global; clay só rederivado pro dark |

---

## 3. Fundamentos — tokens do sistema

### 3.1 Cor — hierarquia em 4 camadas

Todo tema (os 6 existentes e futuros) se organiza em 4 camadas:

| Token | Papel | Hoje (mono) | Diretriz |
|---|---|---|---|
| `--bg` | Fundo profundo | `#000` | Migrar para charcoal `#0E0E0E` — preto puro achata; charcoal cria profundidade |
| `--panel` | Cards e painéis | `zinc-800/900` | Pode virar glass (`bg-white/5 backdrop-blur-md`) quando houver blobs atrás |
| `--muted` | Texto/ícone secundário | `zinc-400/500` | Nunca usar para ação |
| `--accent` | A ÚNICA cor vívida da tela | `white` | Contraste ≥7:1; reservada a CTA + timer |

Regras:
- **Uma cor saturada dominante por tela** (Headspace). Em tela de turno, o accent é **a cor
  do jogador da vez** (`--player-color`, as 12 cores existentes) — tinge CTA, borda do timer
  e glow do card. Resto neutro.
- **Cada jogo tem `--game-accent` fixo** (independente do tema do usuário): a cor de
  identidade que aparece no card da home e vaza para o header/CTA dentro do jogo.
- **Identidade dupla cor+símbolo** (Kahoot): jogador = cor + emoji fixo, par usado em toda
  superfície (placar, vez, toasts). Times já usam símbolos ■●▲★ — manter.

### 3.2 Tipografia

- **Display** (títulos, número do timer, placar, nome do jogador na vez): adotar **Fredoka**
  (Google Fonts, variable, self-hosted no PWA, pesos 500–700, `font-display: swap`, ~40KB).
  Personalidade instantânea sem mudança estrutural.
- **Corpo:** sans atual (system). A fonte divertida NUNCA no corpo — só em headline/números.
- **Logo "LaGames":** candidatas Luckiest Guy / Bungee (avaliar no rebrand, Fase 2).
- **Inputs sempre `text-base` (≥16px)** — abaixo disso o Safari iOS dá auto-zoom na tela.
- Escala de festa: o dado principal da tela (palavra, nome, placar) em `text-5xl`–`text-8xl`
  `font-black`. Se dá pra ler do sofá, está certo.

### 3.3 Forma e textura

- **Cantos:** manter a escala atual — `rounded-xl` (controles), `rounded-2xl` (cards),
  `rounded-3xl` (cartas de jogo/hero). Nada de canto reto.
- **Botões primários em dark neubrutalism:** borda 2px + sombra dura deslocada na cor do
  accent (`shadow-[4px_4px_0_var(--accent)]`); no toque a sombra colapsa
  (`active:translate-x-1 active:translate-y-1 active:shadow-none`) — o botão "afunda"
  fisicamente. Feedback óbvio até de longe, funciona em todos os temas via variável.
- **Grain overlay global:** `body::after` com SVG `feTurbulence` inline em data-URI,
  `opacity ~0.05`, `mix-blend-mode: overlay`, `pointer-events: none`. Mata o ar
  corporativo/estéril do dark flat em todos os temas, sem assets externos, custo ~zero.
- **Fundo vivo:** 1–2 blobs de `radial-gradient` na cor do contexto (jogador da vez no
  turno; game-accent na home), opacidade 8–12%, `blur-3xl`, animados com keyframes lentos
  (~20s). A tela "respira" parada. Transição de cor entre turnos ~800ms.
- **Glassmorphism só como camada** (painel sobre blobs), nunca como estilo dominante.
  **Neumorphism proibido** (baixo contraste — péssimo pra festa).

### 3.4 Motion

| Classe de animação | Duração | Uso |
|---|---|---|
| Micro-feedback (press, pop) | 100–200ms | Toda interação frequente |
| Transição de elemento/tela | 200–350ms | Troca de fase, entrada de card |
| Celebração | 400–800ms | Clímax apenas (seção 4) |

- **Easing assinatura:** `cubic-bezier(.34,1.56,.64,1)` (easeOutBack) — tudo que "pipoca"
  usa overshoot elástico. É o sotaque do app.
- **Regra de performance:** animar SOMENTE `transform` e `opacity` (S-tier). Barra de timer
  = `transform: scaleX()`, nunca `width`. `will-change` só no elemento animando naquele
  momento, nunca global. Blur animado >10px é caro.
- **Transições de fase com View Transitions API** (Baseline desde out/2025): helper
  `transition(fn)` com guard `document.startViewTransition ? ... : fn()`. Elementos
  persistentes (placar, header) ganham `view-transition-name` para "voar" entre telas.
- **`motion-reduce:` sempre:** shake/confete/pulse viram mudança de cor/borda ou fade.
  Reduzir movimento ≠ remover feedback.

### 3.5 Som e vibração — progressive enhancement, nunca canal único

- **Som:** desligado por padrão; toggle 🔊/🔇 persistido (`lagames_sound`). Gerado via Web
  Audio (`OscillatorNode` — zero assets): 3 bleeps <300ms distintos — acerto (chime), pulo
  (boing), vitória (fanfarra curta). `AudioContext` criado/resumido no primeiro toque
  (política de autoplay). Som em interação trivial = ruído; não fazer.
- **Vibração:** `navigator.vibrate?.()` — funciona só em Android/Chrome; iOS web não vibra
  (o hack do checkbox foi corrigido no iOS 26.5). Usar como bônus: `vibrate(10)` em CTA,
  `vibrate(30)` nos segundos finais do timer. iPhone compensa com mais feedback visual.

---

## 4. Vocabulário de interação — o catálogo de juice

Interações nomeadas e reutilizáveis. Jogo novo escolhe daqui antes de inventar.

| Nome | Receita | Quando |
|---|---|---|
| **Press** | `active:scale-95` + `touch-manipulation` + `vibrate?.(10)` | Todo botão |
| **Pop** | keyframe `scale 0.95→1.03→1`, ~180ms, easeOutBack, no release | Botões primários |
| **Afundar** | sombra dura colapsa + translate 1px | CTAs neubrutalistas |
| **Count-up** | número sobe com rAF, 600–800ms, desaceleração + pop no final | Pontos no placar |
| **Stagger** | `animation-delay: calc(i * 60ms)`, fadeUp, `fill-mode: both` | Listas, placar, cards da home |
| **Reveal escalonado** | linhas do último → primeiro, atraso dramático no top-3 | Placar de fim de rodada, pódio |
| **Burst** | canvas-confetti: `particleCount≤40, spread 70`, cores do jogador, origem no botão | Acerto |
| **Chuva** | canvas-confetti: `shapeFromText` com emojis 🎉🏆, ≤100 partículas, `useWorker` | Vitória (uma vez) |
| **Pulso de urgência** | `animate-pulse` + scale 1→1.06→1 + migração de cor | Timer nos segundos finais |
| **Shake** | keyframes `translate3d ±6px`, 400ms | Fim do tempo, erro. `motion-reduce:` → borda vermelha |
| **Respiração** | blobs radial-gradient animados ~20s | Fundos de tela |
| **Wiggle idle** | micro-rotação a cada ~8s | Mascote/emoji parado |

**Orçamento de clímax** (regra dura): efeito grande = combinação de 3+ canais (partícula +
som + vibração + shake). Permitido APENAS em:
1. **Acerto** → burst pequeno (barato, frequente)
2. **Fim de rodada** → reveal escalonado do placar + count-up
3. **Vitória** → chuva de confete + pódio em etapas + fanfarra

Todo o resto recebe só micro-feedback. Quando tudo grita, nada grita.

---

## 5. A voz do LaGames — microcopy

- **Todas as strings de UI centralizadas** (`copy.js` por jogo + do shell), com a regra
  escrita no topo: *"humor de 1 linha; clareza vence a piada"* (Slack). Teste de cada
  string: *isso atrasa a leitura de alguém distraído numa festa?*
- **Variação aleatória** (Duolingo): arrays de frases por situação — celebração
  ("LAVOU!", "Massacre.", "Que time!"), estado vazio ("Ninguém aqui ainda… chama a galera"),
  fim de tempo. Nunca repetir a mesma frase duas vezes seguidas.
- **Reagir à inação** (Jackbox): ~10s parado na tela de passagem → o texto muda
  ("Cadê você, {nome}?"). Custa zero e dá vida imediata.
- **Mascote barato:** emoji promovido a personagem com estados
  (`idle | correct | skip | celebrate`) → troca de emoji + micro-animação. Personalidade
  vem do mapeamento estado→reação, não de ilustração cara.
- Tom: brasileiro, casual, de mesa de bar — nunca corporativo, nunca infantilizado.

---

## 6. Padrões de tela

### 6.1 Home do hub (Fase 1 do Change.md)

- **Layout bento, não grid uniforme:** Papelito como card-herói full-width
  (`aspect-[16/10] rounded-3xl`); futuros jogos em `grid-cols-2 aspect-square`. Máximo
  1 card fantasma "Em breve" (borda tracejada, sem onClick) — nem tela vazia, nem
  cemitério de placeholders.
- **Arte do card sem texto dentro** (Poki): gradiente de identidade do jogo
  (`--game-accent`) + emoji gigante como personagem (`text-7xl`, `rotate-[-8deg]`,
  `drop-shadow`) sangrando na borda. Nome + metadados (`👥 4–12 · ⏱ ~20min`) num rodapé
  do card, fora da arte.
- **Card inteiro é o botão** (Netflix/Fitts): nunca botãozinho dentro do card.
  `active:scale-[0.97]`.
- **Duas categorias = seções empilhadas no mesmo scroll**, headers pequenos uppercase
  ("📱 UM CELULAR" / "📶 CADA UM NO SEU"). **Nunca tabs** — com 2–6 jogos, tabs escondem
  metade do catálogo e custam um toque.
- **Time-to-fun <60s:** partida salva → card "Continuar — rodada 3" ACIMA do herói, com
  glow pulsante, retomada em 1 toque. "Jogar de novo" reaproveita a config anterior.
- **Entrada com stagger** nos cards; skeleton (se precisar) na geometria exata do card.

### 6.2 Telas de jogo — anatomia padrão

- **Ação primária: embaixo, no centro** (zona verde do polegar), `min-h-14`+ (56–64px),
  full-width, com `pb-[env(safe-area-inset-bottom)]`. **Ações destrutivas/raras
  (encerrar, resetar, settings): no topo** — a zona de difícil alcance é proteção natural
  contra toque acidental no calor do jogo.
- **Tela de passagem = palco, não interstício:** fundo fullscreen tingido pela cor do
  próximo jogador, nome em `text-6xl/7xl font-black`, UM botão ("Sou eu!"). Quem espera
  nunca vê duas opções.
- **Espera nunca morta:** sempre mostrar placar parcial, quem está jogando, quanto falta.
- **Momento de foco = zero cromo** (Heads Up!): durante o turno, a palavra domina a tela;
  nada de header/menu visível.
- **Timer legível de longe:** anel SVG de progresso (stroke-dashoffset via transition) em
  volta do número. 3 faixas: neutro → **âmbar** (últimos ~20s) → **vermelho + pulso +
  vibração** (últimos 10s). Shake curto da tela no zero.
- **Placar é show, não tabela:** reveal escalonado + count-up entre rodadas; pódio final
  revelado em etapas (3º → 2º → 1º) com confete.

### 6.3 Kit CSS app-like (base obrigatória do shell)

```css
body { overscroll-behavior-y: none; }               /* mata pull-to-refresh */
.game-ui {
  user-select: none; -webkit-user-select: none;      /* sem seleção acidental */
  -webkit-touch-callout: none;                       /* sem popup de long-press iOS */
  -webkit-tap-highlight-color: transparent;
}
/* botões: touch-action: manipulation (Tailwind: touch-manipulation)
   — elimina double-tap zoom e delay de toque com timer rodando */
```

- Safe areas: `viewport-fit=cover` (já temos) + `pt-[env(safe-area-inset-top)]` /
  `pb-[env(safe-area-inset-bottom)]` em barras fixas.
- Portrait: `"orientation": "portrait"` no manifest (Android respeita; iOS ignora) +
  overlay via `@media (orientation: landscape)` pedindo pra virar o aparelho.

---

## 7. O que NÃO fazer

- ❌ Juice em toda interação — clímax só nos 3 momentos do orçamento (seção 4).
- ❌ Animação decorativa em loop chamando atenção (exceto a "respiração" sutil de fundo).
- ❌ Som como canal único de informação, ou som ligado por padrão.
- ❌ Animar `width`/`height`/`margin`/variáveis CSS herdadas; `will-change` global.
- ❌ Neumorphism; clay pastel copiado pro dark ("clay sujo"); texto dentro da arte do card.
- ❌ Tabs para 2 categorias; botão dentro de card clicável.
- ❌ Ação primária no topo da tela; destrutiva ao alcance do polegar.
- ❌ Piada de duas linhas; mensagem genérica de sistema ("Operação concluída").
- ❌ Duas cores saturadas competindo na mesma tela.
- ❌ Input com fonte <16px (auto-zoom iOS).

---

## 8. Nuances por jogo

### 8.1 Papelito

- **Protagonista visual: a cor do jogador.** A cor de quem criou a palavra já colore o
  WordCard; a cor de quem está jogando tinge a tela da vez, o CTA, o anel do timer e os
  blobs de fundo. Elevar de detalhe a sistema.
- **Identidade dupla:** jogador = cor + emoji fixo (novo); time = símbolo ■●▲★ (mantém).
- **Turno = zero cromo:** palavra gigante fullscreen, timer-anel, 3 botões
  (Acertou herói embaixo; Voltar/Pular secundários) — nada mais na tela.
- **Clímax mapeados:** acerto → burst na cor do criador da palavra; fim de rodada →
  reveal do placar + count-up; fim de jogo → pódio em etapas + chuva de confete com
  emojis + frase aleatória de celebração + "compartilhar resultado" (Web Share API).
- **Roleta** já é momento de show — manter e amplificar com o vocabulário da seção 4
  (pulso no pouso, stagger na ordem revelada).
- **Microcopy reativa** na TurnPassScreen (inação ~10s → "Cadê você, {nome}?").

### 8.2 Template para jogos futuros (preencher ao criar)

| Campo | Pergunta |
|---|---|
| `--game-accent` + gradiente | Qual a cor de identidade (fixa, independe do tema)? |
| Personagem do card | Qual emoji representa o jogo na home? |
| Momento de foco | Qual tela é "zero cromo"? |
| 3 clímax | Quais eventos merecem efeito grande? (máx. 3) |
| Identidade do jogador | Como cor/emoji/símbolo aparecem neste jogo? |
| Copy própria | Frases de celebração/vazio/erro no tom do jogo |

---

## 9. Roadmap de adoção

Ordem que maximiza percepção de melhoria por esforço:

1. **Quick wins no Papelito atual** (não dependem da migração): kit CSS app-like (6.3),
   timer com 3 faixas de urgência + anel, Pop/Afundar nos botões, count-up + stagger no
   placar, confete na vitória, microcopy com variação.
2. **Na Fase 1 do Change.md** (hub): home bento com card-herói, `--game-accent`,
   grain overlay, charcoal `#0E0E0E`, blobs de fundo, Fredoka nos displays.
3. **Na Fase 2** (rebrand): fonte do logo, ícones, refinamento dos 6 temas nas 4 camadas.
4. **Contínuo:** View Transitions nas trocas de fase, som opcional, mascote com estados.
