#!/usr/bin/env python3
"""For each split, find the zero-false-positive operating point: the threshold just
above the highest-scoring approved (non-spam) user, and the spam recall that
survives at that threshold. Also dump the content of the top-scoring approved
users so their labels can be hand-checked (many look like mislabeled spammers).

Usage:
  python3 analyzeZeroFp.py /path/to/spam_users.jsonl
"""

import sys

import numpy as np

from trainSpamClassifier import (
    build_document, featurize, load_data, make_vectorizers, strip_html,
)
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import MaxAbsScaler


def describe_user(u, score):
    print(f"\n  score={score:.4f}  {u.get('displayName')!r} (username={u.get('username')!r}, _id={u['_id']}, created {u['createdAt'][:10]})")
    bio = strip_html(u.get("bio_html"))
    if bio:
        print(f"    bio: {bio[:300]}")
    if u.get("map_location"):
        print(f"    map pin: {u['map_location']}")
    for p in (u.get("posts") or [])[:2]:
        print(f"    post: {p.get('title')!r} | {strip_html(p.get('html'))[:200]}")
    for c in (u.get("comments") or [])[:2]:
        print(f"    comment: {strip_html(c.get('html'))[:200]}")
    for t in (u.get("tag_revisions") or [])[:1]:
        print(f"    tag edit: {strip_html(t.get('html'))[:200]}")


def analyze_split(name, train_users, test_users, n_show=15):
    print(f"\n{'=' * 70}\nSPLIT: {name}  (train={len(train_users)}, test={len(test_users)})")
    train_docs = [build_document(u) for u in train_users]
    test_docs = [build_document(u) for u in test_users]
    y_train = np.array([1 if u["is_spam"] else 0 for u in train_users])
    y_test = np.array([1 if u["is_spam"] else 0 for u in test_users])

    word_vec, char_vec = make_vectorizers()
    scaler = MaxAbsScaler()
    x_train = featurize(word_vec, char_vec, scaler,
                        [d[0] for d in train_docs], [d[1] for d in train_docs], fit=True)
    x_test = featurize(word_vec, char_vec, scaler,
                       [d[0] for d in test_docs], [d[1] for d in test_docs], fit=False)
    model = LogisticRegression(C=1.0, max_iter=2000, solver="liblinear")
    model.fit(x_train, y_train)
    scores = model.predict_proba(x_test)[:, 1]

    ham_scores = scores[y_test == 0]
    spam_scores = scores[y_test == 1]
    max_ham = ham_scores.max()
    zero_fp_threshold = np.nextafter(max_ham, 1.0)
    recall_at_zero_fp = (spam_scores > max_ham).mean()
    n_caught = int((spam_scores > max_ham).sum())
    print(f"  Highest score among approved users: {max_ham:.4f}")
    print(f"  Zero-FP threshold (on this test set): > {zero_fp_threshold:.4f}")
    print(f"  Spam recall at that threshold: {recall_at_zero_fp:.4f} ({n_caught}/{len(spam_scores)})")
    for q in (0.999, 0.995, 0.99):
        t = np.quantile(ham_scores, q)
        r = (spam_scores > t).mean()
        n_fp = int((ham_scores > t).sum())
        print(f"  If we tolerate {n_fp} FPs ({(1 - q) * 100:.1f}% of approved): threshold {t:.4f}, recall {r:.4f}")

    print(f"\n  Top {n_show} highest-scoring APPROVED users (hand-check these labels):")
    order = np.argsort(-scores)
    shown = 0
    for i in order:
        if y_test[i] == 0:
            describe_user(test_users[i], scores[i])
            shown += 1
            if shown >= n_show:
                break


def main():
    users = load_data(sys.argv[1])
    print(f"Loaded {len(users)} users, {sum(1 for u in users if u['is_spam'])} spam")
    users.sort(key=lambda u: u["createdAt"], reverse=True)

    train_alt = [u for i, u in enumerate(users) if i % 2 == 0]
    test_alt = [u for i, u in enumerate(users) if i % 2 == 1]
    analyze_split("alternating (every other user, newest first)", train_alt, test_alt)

    cutoff = len(users) // 5
    analyze_split("temporal (train on oldest 80%, test on newest 20%)",
                  users[cutoff:], users[:cutoff])


if __name__ == "__main__":
    main()
