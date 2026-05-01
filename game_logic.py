from collections import deque
from enum import IntEnum


class Round(IntEnum):
    FREE = 0
    ONE_WORD = 1
    MIME = 2
    SOUND = 3


ROUND_NAMES = {
    Round.FREE: "Livre",
    Round.ONE_WORD: "Uma Palavra",
    Round.MIME: "Mímica",
    Round.SOUND: "Som",
}

TOTAL_ROUNDS = 4


class GameController:
    def __init__(self):
        self.word_pool: list[tuple[str, str, str | None]] = []
        self.round_words: deque[tuple[str, str, str | None]] = deque()
        self.current_round: int = 0
        self.scores: dict[str, int] = {"A": 0, "B": 0}
        self.current_team: str = "A"
        self._game_started: bool = False

    # ── Setup ──────────────────────────────────────────────────────────────

    def add_word(self, word: str, color: str, theme: str | None = None) -> None:
        """Add a word to the global pool. Raises if game already started."""
        if self._game_started:
            raise RuntimeError("Cannot add words after game has started.")
        word = word.strip()
        if not word:
            raise ValueError("Word cannot be empty.")
        self.word_pool.append((word, color, theme))

    def add_words(self, words: list[tuple[str, str | None]], color: str) -> None:
        """Add multiple words to the global pool at once."""
        for word, theme in words:
            self.add_word(word, color, theme)

    def start_game(self) -> None:
        """Initialise round state. Requires at least one word."""
        if not self.word_pool:
            raise RuntimeError("Word pool is empty.")
        self._game_started = True
        self.current_round = 0
        self.scores = {"A": 0, "B": 0}
        self.current_team = "A"
        self._reset_round_words()

    # ── Turn actions ───────────────────────────────────────────────────────

    def current_word(self) -> tuple[str, str, str | None]:
        """Return the word currently in play without removing it."""
        if not self.round_words:
            raise RuntimeError("No words left in round.")
        return self.round_words[0]

    def hit(self) -> None:
        """Current team scored: remove word and award a point."""
        if not self.round_words:
            raise RuntimeError("No words left in round.")
        self.round_words.popleft()
        self.scores[self.current_team] += 1

    def skip(self) -> None:
        """Move current word to end of queue (no point awarded)."""
        if not self.round_words:
            raise RuntimeError("No words left in round.")
        word = self.round_words.popleft()
        self.round_words.append(word)

    def end_turn(self) -> None:
        """Timer expired: current word stays at front (no discard, no point)."""
        # Nothing to do — word remains at round_words[0] for the next turn.
        pass

    # ── Round / game progression ───────────────────────────────────────────

    def is_round_over(self) -> bool:
        return len(self.round_words) == 0

    def is_game_over(self) -> bool:
        return self.current_round >= TOTAL_ROUNDS - 1 and self.is_round_over()

    def advance_round(self) -> None:
        """Move to the next round, restoring the full word pool."""
        if not self.is_round_over():
            raise RuntimeError("Round is not over yet.")
        if self.current_round >= TOTAL_ROUNDS - 1:
            raise RuntimeError("Game is already over.")
        self.current_round += 1
        self._reset_round_words()

    def switch_team(self) -> None:
        """Alternate the active team."""
        self.current_team = "B" if self.current_team == "A" else "A"

    # ── Helpers ────────────────────────────────────────────────────────────

    def round_name(self) -> str:
        return ROUND_NAMES[Round(self.current_round)]

    def _reset_round_words(self) -> None:
        import random
        words = list(self.word_pool)
        random.shuffle(words)
        self.round_words = deque(words)
