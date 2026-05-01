import pytest
from game_logic import GameController, TOTAL_ROUNDS


# ── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture
def ctrl():
    return GameController()


@pytest.fixture
def started(ctrl):
    for w in ["apple", "banana", "cherry"]:
        ctrl.add_word(w, "#000")
    ctrl.start_game()
    return ctrl


# ── Word entry ───────────────────────────────────────────────────────────────

class TestWordEntry:
    def test_add_word(self, ctrl):
        ctrl.add_word("dog", "#000")
        assert ("dog", "#000", None) in ctrl.word_pool

    def test_add_strips_whitespace(self, ctrl):
        ctrl.add_word("  cat  ", "#000")
        assert ("cat", "#000", None) in ctrl.word_pool

    def test_add_empty_raises(self, ctrl):
        with pytest.raises(ValueError):
            ctrl.add_word("   ", "#000")

    def test_add_after_start_raises(self, ctrl):
        ctrl.add_word("fox", "#000")
        ctrl.start_game()
        with pytest.raises(RuntimeError):
            ctrl.add_word("bear", "#000")

    def test_start_empty_pool_raises(self, ctrl):
        with pytest.raises(RuntimeError):
            ctrl.start_game()


# ── Round initialisation ─────────────────────────────────────────────────────

class TestRoundInit:
    def test_round_starts_at_zero(self, started):
        assert started.current_round == 0

    def test_round_words_match_pool(self, started):
        assert set(started.round_words) == set(started.word_pool)

    def test_scores_initialised_to_zero(self, started):
        assert started.scores == {"A": 0, "B": 0}

    def test_first_team_is_a(self, started):
        assert started.current_team == "A"


# ── Hit (acerto) ─────────────────────────────────────────────────────────────

class TestHit:
    def test_hit_removes_word_from_round(self, started):
        word = started.current_word()
        started.hit()
        assert word not in started.round_words

    def test_hit_increments_score(self, started):
        started.hit()
        assert started.scores["A"] == 1

    def test_hit_scores_current_team(self, started):
        started.switch_team()
        started.hit()
        assert started.scores["B"] == 1
        assert started.scores["A"] == 0

    def test_hit_on_empty_raises(self, ctrl):
        ctrl.add_word("solo", "#000")
        ctrl.start_game()
        ctrl.hit()
        with pytest.raises(RuntimeError):
            ctrl.hit()


# ── Skip (pulo) ──────────────────────────────────────────────────────────────

class TestSkip:
    def test_skip_moves_word_to_end(self, started):
        word = started.current_word()
        started.skip()
        assert started.round_words[-1] == word

    def test_skip_does_not_score(self, started):
        started.skip()
        assert started.scores["A"] == 0
        assert started.scores["B"] == 0

    def test_skip_preserves_word_count(self, started):
        count_before = len(started.round_words)
        started.skip()
        assert len(started.round_words) == count_before

    def test_next_word_after_skip_is_different(self, started):
        first = started.current_word()
        started.skip()
        # Only valid when pool has more than 1 word
        assert started.current_word() != first

    def test_skip_on_empty_raises(self, ctrl):
        ctrl.add_word("solo", "#000")
        ctrl.start_game()
        ctrl.hit()
        with pytest.raises(RuntimeError):
            ctrl.skip()


# ── Timer end ────────────────────────────────────────────────────────────────

class TestEndTurn:
    def test_end_turn_keeps_word_at_front(self, started):
        word = started.current_word()
        started.end_turn()
        assert started.current_word() == word

    def test_end_turn_does_not_score(self, started):
        started.end_turn()
        assert started.scores["A"] == 0
        assert started.scores["B"] == 0

    def test_end_turn_preserves_word_count(self, started):
        count_before = len(started.round_words)
        started.end_turn()
        assert len(started.round_words) == count_before


# ── Round progression ────────────────────────────────────────────────────────

class TestRoundProgression:
    def _exhaust_round(self, ctrl):
        while not ctrl.is_round_over():
            ctrl.hit()

    def test_round_over_when_pool_empty(self, started):
        self._exhaust_round(started)
        assert started.is_round_over()

    def test_advance_round_increments_index(self, started):
        self._exhaust_round(started)
        started.advance_round()
        assert started.current_round == 1

    def test_advance_round_restores_word_pool(self, started):
        self._exhaust_round(started)
        started.advance_round()
        assert set(started.round_words) == set(started.word_pool)

    def test_advance_round_when_not_over_raises(self, started):
        with pytest.raises(RuntimeError):
            started.advance_round()

    def test_game_not_over_mid_game(self, started):
        assert not started.is_game_over()

    def test_game_over_after_all_rounds(self, started):
        for _ in range(TOTAL_ROUNDS):
            self._exhaust_round(started)
            if not started.is_game_over():
                started.advance_round()
        assert started.is_game_over()

    def test_advance_beyond_last_round_raises(self, started):
        for _ in range(TOTAL_ROUNDS - 1):
            self._exhaust_round(started)
            started.advance_round()
        self._exhaust_round(started)
        with pytest.raises(RuntimeError):
            started.advance_round()


# ── Score accuracy ───────────────────────────────────────────────────────────

class TestScoreAccuracy:
    def test_cumulative_score_across_hits(self, started):
        started.hit()
        started.hit()
        assert started.scores["A"] == 2

    def test_scores_independent_per_team(self, started):
        started.hit()
        started.switch_team()
        started.hit()
        started.hit()
        assert started.scores["A"] == 1
        assert started.scores["B"] == 2

    def test_score_preserved_across_rounds(self, started):
        started.hit()
        while not started.is_round_over():
            started.hit()
        score_after_r1 = started.scores["A"]
        started.advance_round()
        assert started.scores["A"] == score_after_r1


# ── Queue integrity ──────────────────────────────────────────────────────────

class TestQueueManagement:
    def test_no_duplicates_within_round_on_skip(self, started):
        # Skip all words once; each should still appear exactly once
        n = len(started.round_words)
        for _ in range(n):
            started.skip()
        assert len(started.round_words) == n
        assert len(set(started.round_words)) == n

    def test_order_recovers_after_full_skip_cycle(self, started):
        original_order = list(started.round_words)
        n = len(original_order)
        for _ in range(n):
            started.skip()
        assert list(started.round_words) == original_order
