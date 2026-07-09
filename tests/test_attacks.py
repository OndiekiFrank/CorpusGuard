"""Tests for CorpusGuard attack modules."""

import pytest
from corpusguard.attacks.qtpi import QTPIAttack, QTPIConfig


class TestQTPIAttack:

    def test_generates_adversarial_documents(self):
        attack = QTPIAttack()
        doc = attack.generate_adversarial_document(1)
        assert "id" in doc
        assert "content" in doc
        assert "source" in doc
        assert "sha256" in doc

    def test_simulation_degrades_f1(self):
        config = QTPIConfig(injection_budget=50)
        attack = QTPIAttack(config)
        result = attack.run(simulate=True)
        assert result.baseline_f1 == 0.919
        assert result.attacked_f1 < result.baseline_f1
        assert result.degradation_pct > 80

    def test_zero_log_anomalies(self):
        attack = QTPIAttack()
        result = attack.run(simulate=True)
        assert result.log_anomalies == 0

    def test_larger_budget_more_degradation(self):
        small = QTPIAttack(QTPIConfig(injection_budget=10))
        large = QTPIAttack(QTPIConfig(injection_budget=100))
        r_small = small.run(simulate=True)
        r_large = large.run(simulate=True)
        assert r_large.degradation_pct >= r_small.degradation_pct
