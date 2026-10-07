#!/usr/bin/env python3
"""Prepare the LLM-judge eval sample: 150 spam + 150 approved users drawn from the
most recent backtest fold (users the ML model never trained on), each annotated
with the ML classifier's score (trained on all earlier users, matching fold 6 of
backtestAutoPurge.py). Output is JSONL consumed by llmSpamEval.ts.

Usage:
  python3 prepareLlmEvalSample.py /path/to/spam_users.jsonl /path/to/llm_eval_sample.jsonl
"""

import json
import random
import sys

import numpy as np

from backtestAutoPurge import apply_corrections, score_users, train_model
from trainSpamClassifier import load_data

SAMPLE_PER_CLASS = 150
FOLD_FRACTION = 0.1  # last 10% of users = fold 6 of the backtest


def main():
    data_path, out_path = sys.argv[1], sys.argv[2]
    users = load_data(data_path)
    users = apply_corrections(users)
    users.sort(key=lambda u: u["createdAt"])
    n = len(users)
    lo = int(n * (1 - FOLD_FRACTION))
    train_users, fold_users = users[:lo], users[lo:]
    print(f"Training ML model on {len(train_users)} users, sampling from fold of {len(fold_users)}")

    rng = random.Random(20260727)
    spam = [u for u in fold_users if u["is_spam"]]
    ham = [u for u in fold_users if not u["is_spam"]]
    sample = rng.sample(spam, SAMPLE_PER_CLASS) + rng.sample(ham, SAMPLE_PER_CLASS)
    rng.shuffle(sample)

    bundle = train_model(train_users)
    scores = score_users(bundle, sample)

    with open(out_path, "w") as f:
        for u, s in zip(sample, scores):
            f.write(json.dumps({**u, "ml_score": round(float(s), 4)}) + "\n")
    print(f"Wrote {len(sample)} users to {out_path} "
          f"(spam rate {np.mean([u['is_spam'] for u in sample]):.2f})")


if __name__ == "__main__":
    main()
