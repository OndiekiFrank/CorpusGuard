from __future__ import annotations
"""
Statistical Retrieval Anomaly Detection (SRAD)
================================================
Module 3 of the Memory Hygiene Layer.

KS-test on retrieval score distributions over a 500-query sliding window.
Detects corpus-level anomalies that individual document checks miss.
"""

import time
from collections import deque
from dataclasses import dataclass

import numpy as np
from scipy import stats


@dataclass
class SRADResult:
    anomaly_score: float
    is_anomalous: bool
    ks_statistic: float
    p_value: float
    window_size: int
    reason: str


class StatisticalRetrievalAnomalyDetector:
    """
    Monitors retrieval score distributions for corpus-level anomalies.

    Maintains a 500-query sliding window of retrieval scores.
    Uses Kolmogorov-Smirnov test to detect distribution shifts caused
    by systematic corpus poisoning — catching attacks that individual
    document checks might miss.
    """

    def __init__(self, window_size: int = 500, anomaly_threshold: float = 0.05):
        self.window_size = window_size
        self.anomaly_threshold = anomaly_threshold
        self._baseline_scores: deque = deque(maxlen=window_size)
        self._current_scores: deque = deque(maxlen=window_size)
        self._initialized = False
        self._initialize_baseline()

    def _initialize_baseline(self):
        """Initialize with synthetic baseline retrieval score distribution."""
        rng = np.random.default_rng(42)
        baseline = rng.normal(loc=0.72, scale=0.12, size=self.window_size)
        baseline = np.clip(baseline, 0.0, 1.0)
        self._baseline_scores.extend(baseline.tolist())
        self._initialized = True

    def record_retrieval(self, score: float):
        """Record a retrieval similarity score."""
        self._current_scores.append(float(score))

    def check(self, document: dict) -> SRADResult:
        """Check if a document's retrieval pattern indicates corpus anomaly."""
        retrieval_score = document.get("_retrieval_score", np.random.normal(0.72, 0.12))
        retrieval_score = float(np.clip(retrieval_score, 0.0, 1.0))
        self._current_scores.append(retrieval_score)

        if len(self._current_scores) < 30:
            return SRADResult(
                anomaly_score=0.0,
                is_anomalous=False,
                ks_statistic=0.0,
                p_value=1.0,
                window_size=len(self._current_scores),
                reason="Insufficient data for KS test",
            )

        baseline = np.array(list(self._baseline_scores))
        current = np.array(list(self._current_scores))

        ks_stat, p_value = stats.ks_2samp(baseline, current)

        is_anomalous = p_value < self.anomaly_threshold
        anomaly_score = 1.0 - p_value

        reason = (
            f"Distribution shift detected (KS={ks_stat:.3f}, p={p_value:.4f})"
            if is_anomalous
            else "Normal retrieval distribution"
        )

        return SRADResult(
            anomaly_score=round(anomaly_score, 3),
            is_anomalous=is_anomalous,
            ks_statistic=round(ks_stat, 4),
            p_value=round(p_value, 4),
            window_size=len(self._current_scores),
            reason=reason,
        )
