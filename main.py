import flet as ft
import asyncio
import os
import pygame
from game_logic import GameController, TOTAL_ROUNDS

# ── Palette ────────────────────────────────────────────────────────────────
BG       = "#01060F"
MID      = "#0B212D"
SEC      = "#4E7175"
MAIN     = "#8CBAB1"
BTN      = "#CBD5D2"

PLAYER_COLORS = [
    "#D9534F", "#5CB85C", "#5BC0DE", "#F0AD4E", "#8E44AD", "#E67E22", "#E84393", "#00CEC9"
]

ROUND_RULES = [
    "Descreva a palavra sem dizê-la.",
    "Use estritamente UMA palavra.",
    "Apenas gestos — nenhum som.",
    "Apenas sons — sem palavras ou gestos.",
]


def main(page: ft.Page):
    page.title = "Papelito"
    page.bgcolor = BG
    page.padding = 0
    page.window.width = 400
    page.window.height = 780

    # ── Audio ───────────────────────────────────────────────────────────────
    pygame.mixer.init()
    _BASE = os.path.dirname(os.path.abspath(__file__))
    _snd_ticking = pygame.mixer.Sound(os.path.join(_BASE, "ticking.mp3"))
    _snd_beep    = pygame.mixer.Sound(os.path.join(_BASE, "beep.mp3"))

    ctrl = GameController()
    
    _config = {
        "mode": "normal",
        "themes": [],
        "words_per_player": 5,
        "timer_duration": 60
    }
    
    _current_player_idx = [0]
    _turn_hits = [0]
    _timer_token = [0]

    # ── Shared helpers ──────────────────────────────────────────────────────

    def cancel_timer():
        _timer_token[0] += 1
        _snd_ticking.stop()

    def _label(text: str, size: int = 16, color: str = MAIN,
               weight=ft.FontWeight.NORMAL, expand=False, text_align=ft.TextAlign.CENTER) -> ft.Text:
        return ft.Text(
            text, size=size, color=color,
            weight=weight,
            text_align=text_align,
            expand=expand,
        )

    def _btn(text: str, on_click, bgcolor: str = BTN,
             color: str = BG, height: int = 72, disabled: bool = False):
        return ft.Button(
            text,
            on_click=on_click,
            bgcolor=bgcolor,
            color=color,
            height=height,
            disabled=disabled,
            style=ft.ButtonStyle(shape=ft.RoundedRectangleBorder(radius=16)),
        )

    def _score_chip(team: str) -> ft.Container:
        is_active = ctrl.current_team == team
        return ft.Container(
            content=ft.Column(
                [
                    _label(f"Time {team}", size=13, color=SEC),
                    _label(str(ctrl.scores[team]), size=36,
                           color=MAIN if is_active else SEC,
                           weight=ft.FontWeight.BOLD),
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                spacing=2,
            ),
            bgcolor=MID if is_active else BG,
            border=ft.border.all(2, MAIN if is_active else SEC),
            border_radius=14,
            padding=14,
            expand=True,
        )

    # ── Screen builders ─────────────────────────────────────────────────────

    def build_hub():

        return ft.Container(
            expand=True,
            padding=28,
            content=ft.Column(
                [
                    ft.Container(height=80),
                    _label("PAPELITOS", size=48, color=MAIN, weight=ft.FontWeight.BOLD),
                    _label("O Clássico Jogo do Chapéu", size=16, color=SEC),
                    ft.Container(height=80),
                    ft.Container(
                        content=_btn("Jogo Rápido ▶", lambda e: show_config(), height=72),
                        width=float("inf"),
                    ),
                    ft.Container(height=16),
                    ft.Container(
                        content=_btn("Jogar com Temas 🎲", lambda e: show_theme_config(), bgcolor=MID, color=MAIN, height=72),
                        width=float("inf"),
                    ),
                    ft.Container(height=60, expand=True),
                    ft.Container(
                        content=_btn("Como Jogar ℹ️", lambda e: show_help(), bgcolor=BG, color=MAIN, height=50),
                        width=float("inf"),
                    ),
                    ft.Container(height=16),
                ],
                expand=True,
                spacing=0,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
        )

    def build_help():
        return ft.Container(
            expand=True,
            padding=28,
            content=ft.Column(
                [
                    ft.Container(height=20),
                    ft.Row(
                        [
                            ft.IconButton(icon=ft.icons.Icons.ARROW_BACK, icon_color=MAIN, on_click=lambda e: show_hub()),
                            _label("COMO JOGAR", size=24, color=MAIN, weight=ft.FontWeight.BOLD),
                        ],
                        alignment=ft.MainAxisAlignment.START,
                        vertical_alignment=ft.CrossAxisAlignment.CENTER
                    ),
                    ft.Container(height=24),
                    ft.Column(
                        [
                            ft.Text("Visão Geral", size=18, color=MAIN, weight=ft.FontWeight.BOLD),
                            ft.Text("O Papelito é um jogo de equipes! O celular vai passar de mão em mão enquanto os times tentam adivinhar palavras secretas.", size=15, color=BTN),
                            
                            ft.Container(height=16),
                            ft.Text("A Preparação", size=18, color=MAIN, weight=ft.FontWeight.BOLD),
                            ft.Text("Cada jogador escreve algumas palavras. Quando todos terminarem, o jogo mistura tudo em um \"chapéu\" virtual.", size=15, color=BTN),
                            
                            ft.Container(height=16),
                            ft.Text("Como Jogar", size=18, color=MAIN, weight=ft.FontWeight.BOLD),
                            ft.Text("No seu turno, tente fazer sua equipe adivinhar o máximo de palavras antes do tempo acabar!\n• Acertou? A equipe ganha 1 ponto.\n• Não sabe? Pule a palavra, ela volta para o final da fila.", size=15, color=BTN),
                            
                            ft.Container(height=16),
                            ft.Text("As 4 Rodadas", size=18, color=MAIN, weight=ft.FontWeight.BOLD),
                            ft.Text("O jogo fica mais difícil a cada rodada. As mesmas palavras voltam, mas as regras mudam:\n"
                                    "🗣️ 1. Livre: Diga o que quiser para descrever! Só não vale falar a própria palavra ou partes dela.\n"
                                    "☝️ 2. Uma Palavra: Dê apenas UMA única palavra como dica. Escolha bem!\n"
                                    "🤹 3. Mímica: Silêncio total! Use apenas o seu corpo e gestos para explicar.\n"
                                    "🔊 4. Som: Proibido palavras ou gestos! Faça apenas sons e onomatopeias.", 
                                    size=15, color=BTN),
                            ft.Container(height=40),
                        ],
                        scroll=ft.ScrollMode.AUTO,
                        expand=True,
                        spacing=8
                    ),
                ],
                expand=True,
                spacing=0
            ),
        )

    def build_config():
        words_tf = ft.TextField(value=str(_config["words_per_player"]),
                                keyboard_type=ft.KeyboardType.NUMBER,
                                text_align=ft.TextAlign.CENTER, width=100, border_color=SEC, color=MAIN)
        timer_tf = ft.TextField(value=str(_config["timer_duration"]),
                                keyboard_type=ft.KeyboardType.NUMBER,
                                text_align=ft.TextAlign.CENTER, width=100, border_color=SEC, color=MAIN)
                                
        def _prosseguir(e):
            try:
                _config["words_per_player"] = int(words_tf.value)
                _config["timer_duration"] = int(timer_tf.value)
                _current_player_idx[0] = 0
                show_player_setup()
            except ValueError:
                pass
                
        return ft.Container(
            expand=True,
            padding=ft.Padding.all(28),
            content=ft.Column(
                [
                    ft.Container(height=40),
                    _label("PAPELITO", size=36, color=MAIN, weight=ft.FontWeight.BOLD),
                    _label("Configuração Inicial", size=16, color=SEC),
                    ft.Container(height=40),
                    
                    ft.Row([_label("Palavras por jogador:", expand=True, text_align=ft.TextAlign.LEFT), words_tf], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                    ft.Container(height=20),
                    ft.Row([_label("Tempo da rodada (s):", expand=True, text_align=ft.TextAlign.LEFT), timer_tf], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                    
                    ft.Container(height=40, expand=True),
                    ft.Container(
                        content=_btn("Avançar ▶", _prosseguir, height=72),
                        width=float("inf"),
                    ),
                    ft.Container(height=16),
                ],
                expand=True,
                spacing=0,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
        )

    def build_theme_config():
        timer_tf = ft.TextField(value=str(_config["timer_duration"]),
                                keyboard_type=ft.KeyboardType.NUMBER,
                                text_align=ft.TextAlign.CENTER, width=100, border_color=SEC, color=MAIN)
        
        theme_tf = ft.TextField(hint_text="Novo tema...", hint_style=ft.TextStyle(color=SEC),
                                border_color=SEC, color=MAIN, expand=True, on_submit=lambda e: _add_theme())
        
        themes_list = ft.Column(spacing=8, scroll=ft.ScrollMode.AUTO, expand=True)
        
        btn_avancar = _btn("Avançar ▶", lambda e: _prosseguir(e), height=72, disabled=True)
        
        def _update_themes():
            themes_list.controls.clear()
            for i, t in enumerate(_config["themes"]):
                def _remove(e, idx=i):
                    _config["themes"].pop(idx)
                    _update_themes()
                
                themes_list.controls.append(
                    ft.Container(
                        content=ft.Row([
                            _label(t, size=16, color=BTN, expand=True, text_align=ft.TextAlign.LEFT),
                            ft.IconButton(icon=ft.icons.Icons.CLOSE, icon_color="#FF4E4E", on_click=_remove)
                        ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                        bgcolor=MID, border_radius=10, padding=ft.Padding.only(left=16, right=8, top=4, bottom=4)
                    )
                )
            btn_avancar.disabled = len(_config["themes"]) == 0
            btn_avancar.bgcolor = BTN if len(_config["themes"]) > 0 else MID
            btn_avancar.color = BG if len(_config["themes"]) > 0 else SEC
            page.update()
            
            async def _f():
                try: await theme_tf.focus()
                except Exception: pass
            if asyncio.iscoroutinefunction(theme_tf.focus): page.run_task(_f)
            else:
                res = theme_tf.focus()
                if hasattr(res, "__await__"):
                    async def _ar(): await res
                    page.run_task(_ar)

        def _add_theme():
            val = theme_tf.value.strip()
            if val:
                _config["themes"].append(val)
                theme_tf.value = ""
                _update_themes()

        def _prosseguir(e):
            try:
                _config["timer_duration"] = int(timer_tf.value)
                _config["words_per_player"] = len(_config["themes"])
                _current_player_idx[0] = 0
                show_player_setup()
            except ValueError:
                pass
                
        _update_themes()
        
        return ft.Container(
            expand=True,
            padding=ft.Padding.all(28),
            content=ft.Column(
                [
                    ft.Container(height=20),
                    _label("TEMAS", size=24, color=MAIN, weight=ft.FontWeight.BOLD),
                    ft.Container(height=16),
                    ft.Row([theme_tf, ft.IconButton(icon=ft.icons.Icons.ADD, icon_color=MAIN, bgcolor=MID, on_click=lambda e: _add_theme())]),
                    ft.Container(height=16),
                    themes_list,
                    ft.Container(height=16),
                    ft.Row([_label("Tempo da rodada (s):", expand=True, text_align=ft.TextAlign.LEFT), timer_tf], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                    ft.Container(height=24),
                    ft.Container(
                        content=btn_avancar,
                        width=float("inf"),
                    ),
                    ft.Container(height=16),
                ],
                expand=True,
                spacing=0,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
        )

    def build_player_setup():
        p_idx = _current_player_idx[0]
        color_idx = p_idx % len(PLAYER_COLORS)
        p_color = PLAYER_COLORS[color_idx]
        
        N = _config["words_per_player"]
        is_themes = _config.get("mode") == "themes"
        themes = _config.get("themes", [])
        
        current_words = [None] * N
        
        words_row = ft.Row(scroll=ft.ScrollMode.AUTO, spacing=12, expand=True, vertical_alignment=ft.CrossAxisAlignment.START, alignment=ft.MainAxisAlignment.CENTER)
        count_lbl = _label(f"0 / {N} palavras", size=14, color=p_color)
        btn_confirm = _btn("Confirmar Set", lambda e: _confirm(), bgcolor=p_color, color=BG, disabled=True)
        
        tf = ft.TextField(
            hint_style=ft.TextStyle(color=SEC),
            color=p_color,
            bgcolor=MID,
            border_color=SEC,
            focused_border_color=p_color,
            border_radius=14,
            text_align=ft.TextAlign.CENTER,
            height=56,
            autofocus=True,
            on_submit=lambda e: _cadastrar(e),
        )

        def _get_next_empty_idx():
            for i, w in enumerate(current_words):
                if w is None:
                    return i
            return -1

        def _update_view():
            words_row.controls.clear()
            chunk_size = 8
            
            filled_items = [(i, w) for i, w in enumerate(current_words) if w is not None]
            chunks = [filled_items[i:i + chunk_size] for i in range(0, len(filled_items), chunk_size)]
            
            for chunk in chunks:
                col = ft.Column(spacing=6, expand=1)
                for idx, w in chunk:
                    def _edit(e, i=idx, word=w):
                        current_words[i] = None
                        tf.value = word
                        _update_view()
                        
                    display_text = f"{themes[idx]}: {w}" if is_themes else w
                    col.controls.append(
                        ft.Container(
                            content=_label(display_text, size=15, expand=True, text_align=ft.TextAlign.CENTER),
                            border=ft.Border.all(1, p_color),
                            border_radius=10,
                            padding=8,
                            on_click=_edit
                        )
                    )
                words_row.controls.append(col)
                
            count = len(filled_items)
            count_lbl.value = f"{count} / {N} palavras"
            
            next_idx = _get_next_empty_idx()
            if next_idx != -1:
                tf.disabled = False
                tf.hint_text = f"Tema: {themes[next_idx]}" if is_themes else "Digite uma palavra…"
                btn_confirm.disabled = True
                btn_confirm.bgcolor = MID
                btn_confirm.color = SEC
            else:
                tf.disabled = True
                tf.hint_text = "Set completo!"
                btn_confirm.disabled = False
                btn_confirm.bgcolor = p_color
                btn_confirm.color = BG
                
            page.update()
            if not tf.disabled:
                async def _f():
                    try: await tf.focus()
                    except Exception: pass
                if asyncio.iscoroutinefunction(tf.focus): page.run_task(_f)
                else:
                    res = tf.focus()
                    if hasattr(res, "__await__"):
                        async def _ar(): await res
                        page.run_task(_ar)

        def _cadastrar(e):
            val = tf.value.strip()
            next_idx = _get_next_empty_idx()
            if not val or next_idx == -1:
                return
            current_words[next_idx] = val
            tf.value = ""
            _update_view()

        def _confirm():
            final_words = []
            for i, w in enumerate(current_words):
                theme = themes[i] if is_themes else None
                final_words.append((w, theme))
                
            ctrl.add_words(final_words, p_color)
            _current_player_idx[0] += 1
            show_player_setup()

        def _force_start():
            try:
                ctrl.start_game()
            except RuntimeError as ex:
                sb = ft.SnackBar(ft.Text(str(ex), color=BG), bgcolor=BTN, open=True)
                page.overlay.append(sb)
                page.update()
                return
            show_pre_round()

        def _start_game(e):
            filled_count = sum(1 for w in current_words if w is not None)
            if filled_count == N:
                final_words = []
                for i, w in enumerate(current_words):
                    theme = themes[i] if is_themes else None
                    final_words.append((w, theme))
                ctrl.add_words(final_words, p_color)
                _current_player_idx[0] += 1
                _force_start()
            elif filled_count > 0:
                def _yes(e2):
                    alert.open = False
                    page.update()
                    _force_start()

                def _no(e2):
                    alert.open = False
                    page.update()

                alert = ft.AlertDialog(
                    modal=True,
                    title=ft.Text("Palavras Perdidas", color=MAIN),
                    content=ft.Text(f"Você informou {filled_count} palavra(s) mas não confirmou o Set. Elas serão descartadas! Deseja continuar e começar o jogo de qualquer jeito?", color=SEC),
                    actions=[
                        ft.TextButton("Voltar", on_click=_no),
                        ft.TextButton("Sim, prosseguir", on_click=_yes, style=ft.ButtonStyle(color="#FF4E4E")),
                    ],
                    actions_alignment=ft.MainAxisAlignment.END,
                    bgcolor=BG,
                )
                page.overlay.append(alert)
                alert.open = True
                page.update()
            else:
                _force_start()

        _update_view()

        return ft.Container(
            expand=True,
            padding=24,
            content=ft.Column(
                [
                    ft.Row(
                        [
                            _label(f"Jogador {p_idx + 1}", size=28, color=p_color, weight=ft.FontWeight.BOLD),
                            ft.TextButton("▶ Começar Jogo", icon_color=MAIN, style=ft.ButtonStyle(color=MAIN), on_click=_start_game) if len(ctrl.word_pool) > 0 else ft.Container()
                        ], 
                        alignment=ft.MainAxisAlignment.SPACE_BETWEEN
                    ),
                    ft.Container(height=8),
                    _label("Adicione suas palavras", size=14, color=SEC, text_align=ft.TextAlign.LEFT),
                    ft.Container(height=24),
                    tf,
                    ft.Container(height=16),
                    ft.Row([count_lbl], alignment=ft.MainAxisAlignment.CENTER),
                    ft.Container(height=8),
                    words_row,
                    ft.Container(
                        content=btn_confirm,
                        width=float("inf"),
                    ),
                ],
                expand=True,
                spacing=0,
            ),
        )

    def build_pre_round():
        round_num = ctrl.current_round + 1
        rule = ROUND_RULES[ctrl.current_round]

        return ft.Container(
            expand=True,
            padding=ft.padding.all(28),
            content=ft.Column(
                [
                    ft.Container(height=40),
                    _label(f"RODADA {round_num} / {TOTAL_ROUNDS}", size=14, color=SEC,
                            weight=ft.FontWeight.BOLD),
                    ft.Container(height=8),
                    _label(ctrl.round_name().upper(), size=30, color=MAIN,
                            weight=ft.FontWeight.BOLD),
                    ft.Container(height=24),
                    ft.Container(
                        content=_label(rule, size=17, color=BTN),
                        bgcolor=MID,
                        border_radius=16,
                        padding=ft.padding.all(20),
                        width=float("inf"),
                    ),
                    ft.Container(height=40),
                    ft.Row(
                        [_score_chip("A"), ft.Container(width=12), _score_chip("B")],
                        alignment=ft.MainAxisAlignment.CENTER,
                    ),
                    ft.Container(height=40, expand=True),
                    ft.Container(
                        content=_btn(
                            f"Iniciar Turno — Time {ctrl.current_team}",
                            lambda e: show_game(),
                            height=72,
                        ),
                        width=float("inf"),
                    ),
                    ft.Container(height=16),
                ],
                expand=True,
                spacing=0,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
        )

    def build_game():
        _turn_hits[0] = 0
        seconds_left = _config["timer_duration"]
        
        bg_container = ft.Container(
            bgcolor=MID,
            border_radius=16,
            padding=16,
            width=float("inf"),
            border=None
        )

        timer_text = _label(str(seconds_left), size=52, color=MAIN,
                             weight=ft.FontWeight.BOLD)
        
        bg_container.content = ft.Column(
            [
                _label("tempo restante", size=13, color=SEC),
                timer_text,
            ],
            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            spacing=0,
        )                             
                             
        word_val, word_color, _ = ctrl.current_word()
        word_text   = _label(word_val, size=40, color=word_color,
                              weight=ft.FontWeight.BOLD)
        
        async def timer_loop(token):
            nonlocal seconds_left
            while seconds_left > 0 and _timer_token[0] == token:
                await asyncio.sleep(1)
                if _timer_token[0] != token:
                    break
                seconds_left -= 1
                
                color = MAIN if seconds_left > 10 else "#FF4E4E"
                timer_text.value = str(seconds_left)
                timer_text.color = color
                
                if seconds_left <= 10 and seconds_left > 0:
                    bg_container.border = ft.border.all(2, "#FF4E4E")
                if seconds_left == 5:
                    _snd_ticking.play(loops=-1)
                
                page.update()
                
            if seconds_left <= 0 and _timer_token[0] == token:
                _timer_token[0] += 1
                _snd_ticking.stop()
                _snd_beep.play()
                ctrl.end_turn()
                page.update()
                await asyncio.sleep(1)
                show_transition()
                
        def start_timer():
            _timer_token[0] += 1
            page.run_task(timer_loop, _timer_token[0])

        def stop_timer():
            _timer_token[0] += 1
            _snd_ticking.stop()

        def on_hit(e):
            ctrl.hit()
            _turn_hits[0] += 1
            if ctrl.is_round_over():
                stop_timer()
                if ctrl.is_game_over():
                    show_transition(round_over=True)
                else:
                    # Rodada nova! Avança nativamente e cai na tela de instruções da nova regra
                    ctrl.advance_round()
                    show_pre_round()
                return
            word_val, word_color, _ = ctrl.current_word()
            word_text.value = word_val
            word_text.color = word_color
            page.update()

        def on_skip(e):
            ctrl.skip()
            word_val, word_color, _ = ctrl.current_word()
            word_text.value = word_val
            word_text.color = word_color
            page.update()
            
        start_timer()

        return ft.Container(
            expand=True,
            padding=ft.padding.all(24),
            content=ft.Column(
                [
                    ft.Container(height=24),
                    ft.Row(
                        [_score_chip("A"), ft.Container(width=12), _score_chip("B")],
                        alignment=ft.MainAxisAlignment.CENTER,
                    ),
                    ft.Container(height=20),
                    bg_container,
                    ft.Container(height=24),
                    ft.Container(
                        content=ft.Column(
                            [
                                _label("palavra", size=13, color=SEC),
                                ft.Container(height=8),
                                word_text,
                            ],
                            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                            spacing=0,
                        ),
                        bgcolor=MID,
                        border_radius=20,
                        padding=24,
                        width=float("inf"),
                        expand=True,
                    ),
                    ft.Container(height=24),
                    ft.Container(
                        content=_btn("Acertei ✓", on_hit, bgcolor="#2E6B5E", color=BTN, height=80),
                        width=float("inf"),
                    ),
                    ft.Container(height=12),
                    ft.Container(
                        content=_btn("Pular →", on_skip, bgcolor=MID, color=MAIN, height=64),
                        width=float("inf"),
                    ),
                    ft.Container(height=16),
                ],
                expand=True,
                spacing=0,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
        )

    def build_transition(round_over: bool = False):
        if ctrl.is_game_over():
            winner = "A" if ctrl.scores["A"] > ctrl.scores["B"] \
                     else "B" if ctrl.scores["B"] > ctrl.scores["A"] else None
            headline = "Fim de Jogo!"
            sub = f"Vencedor: Time {winner} 🎉" if winner else "Empate! 🤝"
            btn_text = "Jogar Novamente"
        else:
            headline = f"Turno do Time {ctrl.current_team} encerrado"
            sub = f"+{_turn_hits[0]} ponto{'s' if _turn_hits[0] != 1 else ''} neste turno"
            btn_text = "Próximo Jogador ▶"

        def on_next(e):
            if ctrl.is_game_over():
                _restart()
                return
            # Se não é Game Over, aqui cai exclusivamente para troca de turno, 
            # já que round_over salta direto para pre_round no on_hit
            ctrl.switch_team()
            show_pre_round()

        return ft.Container(
            expand=True,
            padding=ft.padding.all(28),
            content=ft.Column(
                [
                    ft.Container(height=60, expand=True),
                    _label(headline, size=28, color=MAIN, weight=ft.FontWeight.BOLD),
                    ft.Container(height=12),
                    _label(sub, size=17, color=SEC) if sub else ft.Container(),
                    ft.Container(height=40),
                    ft.Row(
                        [_score_chip("A"), ft.Container(width=12), _score_chip("B")],
                        alignment=ft.MainAxisAlignment.CENTER,
                    ),
                    ft.Container(height=60, expand=True),
                    ft.Container(
                        content=_btn(btn_text, on_next, height=72),
                        width=float("inf"),
                    ),
                    ft.Container(height=16),
                ],
                expand=True,
                spacing=0,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
        )

    # ── Navigation ──────────────────────────────────────────────────────────

    def _set_view(view: ft.Control):
        page.controls.clear()
        page.controls.append(view)
        page.update()

    def show_hub():
        _set_view(build_hub())

    def show_help():
        _set_view(build_help())

    def show_config():
        _config["mode"] = "normal"
        _set_view(build_config())

    def show_theme_config():
        _config["mode"] = "themes"
        _config["themes"] = []
        _set_view(build_theme_config())

    def show_player_setup():
        _set_view(build_player_setup())
        
    def show_pre_round():
        _set_view(build_pre_round())

    def show_game():
        _set_view(build_game())

    def show_transition(round_over: bool = False):
        cancel_timer()
        _set_view(build_transition(round_over=round_over))

    def _restart():
        nonlocal ctrl
        ctrl = GameController()
        show_hub()

    # ── Boot ────────────────────────────────────────────────────────────────
    show_hub()


if __name__ == "__main__":
    ft.run(main)