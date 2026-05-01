# Projeto: Papelito Digital — Fonte Única de Verdade (SSoT)

> Este documento é a referência canônica do projeto. Qualquer LLM lendo este arquivo deve ser capaz de compreender a arquitetura, as regras de negócio e o estado atual da aplicação integralmente.

---

## 1. Visão Geral

**Papelito** é uma adaptação digital do "The Hat Game" (jogo do chapéu). Um único dispositivo circula entre os jogadores (pass-and-play). Cada jogador contribui palavras secretas para um pool compartilhado; durante o jogo, os times se alternam tentando adivinhar as palavras em 4 rodadas progressivamente mais difíceis.

- **Plataforma:** Desktop Windows (executado via `python main.py`)
- **Framework UI:** [Flet](https://flet.dev/) `>=0.80`
- **Linguagem:** Python 3.10+
- **Áudio:** `pygame-ce` — cross-platform, MP3 local (ticking.mp3, beep.mp3)

---

## 2. Estrutura de Arquivos

```
Papelitos/
├── main.py          # Toda a lógica de UI, navegação e timer
├── game_logic.py    # GameController — estado puro do jogo (sem UI)
├── test_game.py     # Testes unitários com PyTest (cobertura da lógica)
├── context.md       # Este arquivo — SSoT do projeto
├── requirements.txt     # pygame-ce
├── ticking.mp3          # loop nos últimos 5s do timer
└── beep.mp3             # toca uma vez ao zerar o timer
```

---

## 3. Arquitetura

### Separação de camadas

| Arquivo | Responsabilidade |
|---|---|
| `game_logic.py` | Estado do jogo: pool de palavras, scores, rodadas, ações de turno |
| `main.py` | Construtores de tela (`build_*`), navegação (`show_*`), timer assíncrono |

### Padrão de Navegação (`main.py`)

A UI funciona como um **router de tela única**: `page.controls` é limpo e substituído a cada transição.

```python
def _set_view(view: ft.Control):
    page.controls.clear()
    page.controls.append(view)
    page.update()
```

Cada tela é construída por uma função `build_*()` que retorna um `ft.Container` com `expand=True`. A navegação acontece pelas funções `show_*()` que chamam `_set_view(build_*())`.

### Estado Global na `main()`

```python
ctrl = GameController()      # instância do controlador de jogo
_config = {                  # configurações da sessão
    "words_per_player": 5,
    "timer_duration": 60
}
_current_player_idx = [0]   # índice do jogador no setup (lista para mutabilidade)
_turn_hits = [0]            # acertos neste turno (exibido na transição)
_timer_token = [0]          # token único de versão do timer — impede tasks zumbis
```

> **Por que listas?** Closures Python não permitem reatribuição de primitivos capturados. Wrapping em lista (`[valor]`) contorna isso sem `nonlocal`.

> **Timer Token Pattern:** Cada `start_timer()` incrementa `_timer_token[0]`. A corrotina `timer_loop(token)` só executa enquanto `_timer_token[0] == token`. Isso garante que cliques rápidos não acumulem loops concorrentes.

---

## 4. `game_logic.py` — GameController

### Estado interno

```python
word_pool: list[tuple[str, str, str | None]]    # todas as palavras, cores e temas (imutável após start_game)
round_words: deque[tuple[str, str, str | None]] # fila da rodada atual (reduz ao longo do turno)
current_round: int          # índice 0–3
scores: dict[str, int]      # {"A": N, "B": N}
current_team: str           # "A" ou "B"
_game_started: bool         # trava adição de palavras após início
```

### Ações e contratos

| Método | Efeito | Raises |
|---|---|---|
| `add_word(w, c, t)` | Adiciona ao `word_pool` com sua cor e tema associado | `RuntimeError` se jogo iniciado; `ValueError` se string vazia |
| `add_words(ws, c)` | Lote de `add_word` (espera tuplas `(w, t)`) | Idem acima |
| `start_game()` | Inicia jogo, zera scores, embaralha `round_words` | `RuntimeError` se pool vazio |
| `current_word()` | Retorna a tupla `(palavra, cor, tema)` em `round_words[0]` sem remover | `RuntimeError` se round vazio |
| `hit()` | Remove `round_words[0]`, pontua `current_team` | `RuntimeError` se round vazio |
| `skip()` | Move `round_words[0]` para o **final** da fila | `RuntimeError` se round vazio |
| `end_turn()` | No-op — palavra permanece na frente da fila (timer expirou) | — |
| `advance_round()` | Incrementa `current_round`, re-embaralha `round_words` | `RuntimeError` se round não terminou ou jogo acabou |
| `switch_team()` | Alterna `current_team` entre "A" e "B" | — |
| `is_round_over()` | `True` se `round_words` vazia | — |
| `is_game_over()` | `True` se estiver na última rodada e `round_words` vazia | — |

### Embaralhamento

A cada `_reset_round_words()`, o `word_pool` completo é copiado, embaralhado com `random.shuffle()` e convertido em `deque`. Isso garante ordem aleatória por rodada sem modificar o pool original.

### Rodadas

```python
TOTAL_ROUNDS = 4

class Round(IntEnum):
    FREE = 0       # Descrever a palavra sem dizê-la
    ONE_WORD = 1   # Apenas uma palavra
    MIME = 2       # Apenas gestos
    SOUND = 3      # Apenas sons/onomatopéias
```

---

## 5. Fluxo de Telas

Diagrama de navegação — **de onde estou → para onde vou → quando**:

```
[boot]
  └─► show_hub()
        │
        ├─► [Como Jogar ℹ️] ──► show_help() ──► [Voltar ↩] ──► show_hub()
        │
        ├─► [Jogar com Temas 🎲] ──► show_theme_config()
        │                              │
        │                              │  [Avançar ▶]
        │                              ▼
        └─► [Jogo Rápido ▶] ───────► show_config()
                                       │
                                       │  [Avançar ▶]
                                       ▼
  show_player_setup()  ◄──────────────────────────────────────┐
        │                                                      │
        │  [Confirmar Set]  → adiciona palavras ao ctrl       │
        │                   → _current_player_idx += 1        │
        │                   → show_player_setup() (próximo)   │
        │                                                      │
        │  [▶ Começar Jogo]  (visível se ctrl.word_pool > 0)  │
        │    ├─ SE há N palavras (set completo) → salva e inicia│
        │    ├─ SE há < N palavras não confirmadas → AlertDialog│
        │    │     ├─ [Voltar] → fecha dialog                  │
        │    │     └─ [Sim, prosseguir] → _force_start()       │
        │    └─ SE sem palavras pendentes → _force_start()     │
        │                                                      │
        ▼                                                      │
  show_pre_round()                                            │
        │                                                      │
        │  [Iniciar Turno — Time X]                           │
        ▼                                                      │
  show_game()  (timer inicia aqui)                            │
        │                                                      │
        │  [Acertei ✓] → ctrl.hit()                           │
        │    ├─ SE round_over + game_over → show_transition(round_over=True) → Fim de Jogo
        │    ├─ SE round_over → ctrl.advance_round() → show_pre_round()
        │    └─ SE não → atualiza word_text                    │
        │                                                      │
        │  [Pular →] → ctrl.skip() → atualiza word_text       │
        │                                                      │
        │  [Timer = 0] → ctrl.end_turn() → show_transition()  │
        ▼                                                      │
  show_transition()                                           │
        │                                                      │
        │  SE game_over → mostra placar final                  │
        │    └─ [Jogar Novamente] → _restart() → show_hub()    │
        │                                                      │
        │  SE turno normal                                     │
        │    └─ [Próximo Jogador ▶] → ctrl.switch_team()      │
        │                           → show_pre_round() ────────┘
```

> **Nota:** A tela de "Rodada Encerrada" foi **removida**. Ao esgotar o pool no meio de um turno via `hit()`, o jogo avança diretamente para `show_pre_round()` da nova rodada sem tela intermediária redundante.

---

## 6. UI — Padrões de Interface

### Paleta de Cores

| Variável | Hex | Uso |
|---|---|---|
| `BG` | `#01060F` | Fundo geral da página |
| `MID` | `#0B212D` | Superfícies secundárias (cards, containers) |
| `SEC` | `#4E7175` | Textos secundários, bordas inativas |
| `MAIN` | `#8CBAB1` | Textos primários, destaques ativos |
| `BTN` | `#CBD5D2` | Texto sobre botões principais |

### Cores por Jogador (Setup)

Cada jogador recebe uma cor cíclica do array `PLAYER_COLORS` (baseada em `player_idx % len(PLAYER_COLORS)`):
```
["#D9534F", "#5CB85C", "#5BC0DE", "#F0AD4E", "#8E44AD", "#E67E22", "#E84393", "#00CEC9"]
```
Essa cor é aplicada ao nome do jogador, borda do input e botão "Confirmar Set". Além disso, as palavras cadastradas pelo jogador são atreladas a essa cor no `GameController`, garantindo que durante a partida a palavra digitada apareça na tela usando a exata cor do respectivo autor.

### Componentes Compartilhados

- **`_label()`** — wrapper de `ft.Text` com defaults do tema
- **`_btn()`** — wrapper de `ft.Button` com `RoundedRectangleBorder(radius=16)`
- **`_score_chip()`** — card de pontuação do time; o time ativo recebe `bgcolor=MID` e borda `MAIN`

### Regras de Estado Visual

- **Lista de Palavras (Setup):** Em vez de uma única coluna vertical longa gerando rolagem infinita, a listagem sofre fragmentação automática em lotes de 8. Cada lote preenche uma nova coluna renderizada lado-a-lado usando um container responsivo do tipo `ft.Row`, distribuindo o conteúdo pelo espaço horizontal sem afetar o workflow.
- **Botão "Confirmar Set":** Desabilitado visualmente (`bgcolor=MID`, `color=SEC`) até atingir `N` palavras. Ao atingir, recebe `bgcolor=p_color` e `color=BG`.
- **Timer crítico (≤ 10s):** Texto do timer muda para `#FF4E4E`, container recebe borda vermelha e `winsound.Beep(800, 100)` é disparado em thread daemon a cada segundo.
- **Timer zerado:** `winsound.Beep(400, 800)` em thread daemon.
- **Hub Principal (`build_hub`):** A tela inicial do app. Contém o logo `PAPELITO` seguido de 3 ações: "Jogo Rápido" (→ `show_config()`), "Jogar com Temas" (SnackBar "Em breve!") e "Como Jogar" (→ `show_help()`). Ao final de uma partida, `_restart()` também retorna ao Hub.
- **Tutorial (`build_help`):** Tela de ajuda com hierarquia visual clara. Utiliza múltiplos `ft.Text` distintos por cor e tamanho (títulos em `MAIN`/bold, corpo em `BTN`) envolvidos em `ft.Column(scroll=AUTO, expand=True)`, garantindo scroll completo do conteúdo. O cabeçalho usa `ft.IconButton(icon=ft.icons.Icons.ARROW_BACK)` para retornar ao Hub.

### Autofoco no Setup

O `TextField` do setup usa `autofocus=True`. Após cada `Enter`, a lógica redispacha o foco via `page.run_task()` para contornar a API assíncrona do Flet `>=0.80`:

```python
async def _f():
    await tf.focus()
page.run_task(_f)
```

---

## 7. Testes (`test_game.py`)

Cobertura com **PyTest** exclusivamente da camada `GameController`. A UI não é testada.

| Classe de Teste | O que valida |
|---|---|
| `TestWordEntry` | Adição, validação e restrições do pool |
| `TestRoundInit` | Estado inicial após `start_game()` |
| `TestHit` | Pontuação, remoção e times |
| `TestSkip` | Comportamento da fila (move para o final) |
| `TestEndTurn` | Timer expirado não descarta nem pontua |
| `TestRoundProgression` | Esgotamento da rodada, `advance_round`, `is_game_over` |
| `TestScoreAccuracy` | Acúmulo correto de pontos entre rodadas e times |
| `TestQueueManagement` | Integridade da fila sem duplicatas após skips |

> **Atenção:** As asserções de ordem de `round_words` usam `set()` em vez de `list()` comparado a `word_pool`, pois o embaralhamento é aleatório.

---

## 8. Restrições e Decisões Técnicas Conhecidas

| Tema | Decisão |
|---|---|
| **Áudio** | `winsound` removido (Windows-only). Substituído por `pygame-ce` com `ticking.mp3` (loop, últimos 5s) e `beep.mp3` (uma vez, timer zero). Dependência em `requirements.txt`. |
| **`ft.icons.*`** | O acesso direto `ft.icons.NOME` está quebrado no Flet `>=0.80`. Para `ft.IconButton`, a sintaxe correta é `icon=ft.icons.Icons.NOME` (ex: `ft.icons.Icons.ARROW_BACK`). Strings literais como `icon="arrow_back"` **não são mais válidas** e causam o erro em runtime `IconButton must have either icon or a visible content specified`. |
| **Deprecações ativas** | `ft.padding.all()`, `ft.border.all()` emitem warnings no `>=0.80`. A API correta é `ft.Padding.all()` e `ft.Border.all()`, mas a funcionalidade não é afetada. |
| **Janela fixa** | `page.window.width = 400 / height = 780` — simula proporção de celular no desktop. |
| **Reinício** | `_restart()` cria nova instância de `GameController` e redireciona para `show_hub()`, zerando todo o estado. |