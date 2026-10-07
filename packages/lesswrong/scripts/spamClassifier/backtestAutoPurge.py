#!/usr/bin/env python3
"""Backtest an auto-purge policy: walk forward through time in folds, training only
on users created before each fold, and count what an auto-purge rule at various
thresholds would have done to that fold's users.

The question this answers: "If auto-purge at threshold T had been running for the
last few years, how many real users would we have wrongly purged, and how much
spam would have been handled without a moderator?"

Known label corrections (hand-checked from analyzeZeroFp.py output):
  - a few users are labeled approved but are plainly spam a mod mis-approved;
    these are flipped to spam
  - test accounts are excluded

Usage:
  python3 backtestAutoPurge.py /path/to/spam_users.jsonl
"""

import sys

import numpy as np

from trainSpamClassifier import (
    build_document, featurize, load_data, make_vectorizers, strip_html,
)
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import MaxAbsScaler

# Hand-checked label corrections. "spam": labeled approved, but content is
# unambiguous commercial spam (see analyzeZeroFp.py output). "exclude": test
# accounts, not meaningful either way.
LABEL_CORRECTIONS = {
    "RfNPLPavKfeGb9Htn": "spam",     # kulsumpapri3: freelancer/SEO/email-marketing bio
    "q3KRo5ihtNZPSBp4G": "spam",     # Greenapple22: bulk yoga clothes
    "LvS8vKekQNduMiD52": "spam",     # markjohn9643: assignment-writing service
    "8S3z7Y6qPJER6qXYa": "spam",     # ashleylop899: wholesale gemstone jewelry
    "asiyEttG2dh5eMLQD": "spam",     # signaturesplendor: apartments for sale
    "msccw4mNw9kngkNvj": "spam",     # veerajbh10: pure link-drop bio+comment
    "ezxzs2E965qbhpMiE": "exclude",  # habrykaTest123: staff test account
}

THRESHOLDS = [0.90, 0.95, 0.97, 0.98, 0.99, 0.995]
N_FOLDS = 6
BACKTEST_FRACTION = 0.6  # walk-forward over the most recent 60% of users


def apply_corrections(users):
    out = []
    flipped = 0
    for u in users:
        fix = LABEL_CORRECTIONS.get(u["_id"])
        if fix == "exclude":
            continue
        if fix == "spam" and not u["is_spam"]:
            u = {**u, "is_spam": True}
            flipped += 1
        out.append(u)
    print(f"Label corrections: flipped {flipped} approved->spam, "
          f"excluded {sum(1 for v in LABEL_CORRECTIONS.values() if v == 'exclude')} test accounts")
    return out


def train_model(train_users):
    docs = [build_document(u) for u in train_users]
    y = np.array([1 if u["is_spam"] else 0 for u in train_users])
    word_vec, char_vec = make_vectorizers()
    scaler = MaxAbsScaler()
    x = featurize(word_vec, char_vec, scaler,
                  [d[0] for d in docs], [d[1] for d in docs], fit=True)
    model = LogisticRegression(C=1.0, max_iter=2000, solver="liblinear")
    model.fit(x, y)
    return model, word_vec, char_vec, scaler


def score_users(bundle, users):
    model, word_vec, char_vec, scaler = bundle
    docs = [build_document(u) for u in users]
    x = featurize(word_vec, char_vec, scaler,
                  [d[0] for d in docs], [d[1] for d in docs], fit=False)
    return model.predict_proba(x)[:, 1]


def main():
    users = load_data(sys.argv[1])
    users = apply_corrections(users)
    users.sort(key=lambda u: u["createdAt"])  # oldest first
    n = len(users)
    start = int(n * (1 - BACKTEST_FRACTION))
    fold_bounds = np.linspace(start, n, N_FOLDS + 1).astype(int)
    print(f"{n} users; backtesting folds over users {start}..{n} "
          f"({users[start]['createdAt'][:10]} .. {users[-1]['createdAt'][:10]})")

    # per threshold: [spam_purged, spam_total, real_purged, real_total]
    totals = {t: [0, 0, 0, 0] for t in THRESHOLDS}
    would_be_fps = {t: [] for t in THRESHOLDS}

    for k in range(N_FOLDS):
        lo, hi = fold_bounds[k], fold_bounds[k + 1]
        train_users, test_users = users[:lo], users[lo:hi]
        bundle = train_model(train_users)
        scores = score_users(bundle, test_users)
        y = np.array([1 if u["is_spam"] else 0 for u in test_users])
        period = f"{test_users[0]['createdAt'][:10]}..{test_users[-1]['createdAt'][:10]}"
        max_ham = scores[y == 0].max() if (y == 0).any() else float("nan")
        print(f"\nFold {k + 1}: train={lo}, test={hi - lo} ({period}), "
              f"spam rate {y.mean():.2f}, max approved-user score {max_ham:.4f}")
        for t in THRESHOLDS:
            purged = scores >= t
            sp, st = int((purged & (y == 1)).sum()), int((y == 1).sum())
            rp, rt = int((purged & (y == 0)).sum()), int((y == 0).sum())
            totals[t][0] += sp
            totals[t][1] += st
            totals[t][2] += rp
            totals[t][3] += rt
            print(f"    T={t}: auto-purged {sp}/{st} spam ({sp / max(st, 1):.1%}), "
                  f"{rp}/{rt} real users")
            for i in np.where(purged & (y == 0))[0]:
                would_be_fps[t].append((scores[i], test_users[i]))

    print(f"\n{'=' * 70}\nAGGREGATE over backtest period:")
    for t in THRESHOLDS:
        sp, st, rp, rt = totals[t]
        print(f"  T={t}: auto-purged {sp}/{st} spam ({sp / max(st, 1):.1%}); "
              f"wrongly purged {rp}/{rt} real users ({rp / max(rt, 1):.3%})")

    for t in THRESHOLDS:
        fps = would_be_fps[t]
        if not fps:
            print(f"\nReal users that T={t} would have purged: none")
            continue
        print(f"\nReal users that T={t} would have purged ({len(fps)}) — hand-check:")
        for s, u in sorted(fps, key=lambda x: -x[0]):
            bio = strip_html(u.get("bio_html"))[:150]
            first_post = (u.get("posts") or [{}])[0]
            post = f"{first_post.get('title') or ''} | {strip_html(first_post.get('html'))[:120]}"
            first_comment = strip_html((u.get("comments") or [{}])[0].get("html"))[:120]
            print(f"  {s:.4f} {u.get('displayName')!r} (_id={u['_id']}, {u['createdAt'][:10]})")
            if bio:
                print(f"         bio: {bio}")
            if post.strip(" |"):
                print(f"         post: {post}")
            if first_comment:
                print(f"         comment: {first_comment}")


if __name__ == "__main__":
    main()
