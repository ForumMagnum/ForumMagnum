#!/usr/bin/env python3
"""Train a spam classifier over new-user data extracted by extractSpamClassifierData.ts.

Input: JSONL, one user per line, with fields:
  _id, username, displayName, createdAt, bio_html, map_location, map_marker_text,
  is_spam, posts[], comments[], tag_revisions[]

Evaluates on two splits:
  - alternating: users sorted by createdAt descending, every other user is train,
    the rest test
  - temporal: oldest 80% train, newest 20% test (robustness check: spam campaigns
    cluster in time, so the alternating split can leak near-duplicate campaign
    content between train and test)

Then fits a final model on all data and saves it with joblib.

Usage:
  python3 trainSpamClassifier.py /path/to/spam_users.jsonl --model-out /path/to/model.joblib
"""

import argparse
import html as html_module
import json
import re
import sys
from urllib.parse import urlparse

import numpy as np
from scipy.sparse import hstack, csr_matrix
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    confusion_matrix,
    precision_recall_curve,
    roc_auc_score,
)
from sklearn.preprocessing import MaxAbsScaler

TAG_RE = re.compile(r"<[^>]+>")
HREF_RE = re.compile(r'(?:href|src)\s*=\s*["\']([^"\']+)["\']', re.IGNORECASE)
BARE_URL_RE = re.compile(r'https?://[^\s"\'<>]+')
PHONE_RE = re.compile(r"\+?\d[\d\-\s().]{7,}\d")
WHITESPACE_RE = re.compile(r"\s+")


def strip_html(h):
    if not h:
        return ""
    text = TAG_RE.sub(" ", h)
    text = html_module.unescape(text)
    return WHITESPACE_RE.sub(" ", text).strip()


def extract_domains(h):
    if not h:
        return []
    urls = HREF_RE.findall(h) + BARE_URL_RE.findall(h)
    domains = []
    for u in urls:
        try:
            netloc = urlparse(u).netloc.lower()
        except ValueError:
            continue
        if netloc:
            domains.append(netloc)
    return domains


def build_document(user):
    """Concatenate all text inputs with field markers; return (text, numeric_features)."""
    parts = []
    all_html = []

    username = user.get("username") or ""
    display_name = user.get("displayName") or ""
    parts.append(f"xxusername {username}")
    parts.append(f"xxdisplayname {display_name}")

    bio_html = user.get("bio_html") or ""
    all_html.append(bio_html)
    bio_text = strip_html(bio_html)
    if bio_text:
        parts.append(f"xxbio {bio_text}")

    map_location = user.get("map_location") or ""
    map_marker = strip_html(user.get("map_marker_text") or "")
    if map_location or map_marker:
        parts.append(f"xxmappin {map_location} {map_marker}")
    all_html.append(user.get("map_marker_text") or "")

    posts = user.get("posts") or []
    for p in posts:
        all_html.append(p.get("html") or "")
        parts.append(f"xxpost {p.get('title') or ''} {strip_html(p.get('html'))}")

    comments = user.get("comments") or []
    for c in comments:
        all_html.append(c.get("html") or "")
        parts.append(f"xxcomment {strip_html(c.get('html'))}")

    tag_revisions = user.get("tag_revisions") or []
    for t in tag_revisions:
        all_html.append(t.get("html") or "")
        parts.append(
            f"xxtagedit {t.get('commitMessage') or ''} {strip_html(t.get('html'))}"
        )

    domains = []
    for h in all_html:
        domains.extend(extract_domains(h))
    if domains:
        parts.append("xxdomains " + " ".join(domains))

    text = "\n".join(parts)
    plain_text = strip_html("\n".join(all_html))

    n_nonascii = sum(1 for ch in plain_text if ord(ch) > 127)
    numeric = [
        len(posts),
        len(comments),
        len(tag_revisions),
        1.0 if bio_text else 0.0,
        min(len(bio_text), 5000) / 5000.0,
        1.0 if (map_location or map_marker) else 0.0,
        min(len(domains), 50) / 50.0,
        min(len(set(domains)), 20) / 20.0,
        min(len(PHONE_RE.findall(plain_text)), 5) / 5.0,
        sum(ch.isdigit() for ch in username) / max(len(username), 1),
        min(len(username), 40) / 40.0,
        1.0 if username.lower() == display_name.lower() else 0.0,
        n_nonascii / max(len(plain_text), 1),
        1.0 if not plain_text and not bio_text else 0.0,
    ]
    return text, numeric


NUMERIC_FEATURE_NAMES = [
    "n_posts", "n_comments", "n_tag_revisions", "has_bio", "bio_len",
    "has_map_pin", "n_links", "n_distinct_domains", "n_phone_numbers",
    "username_digit_frac", "username_len", "username_eq_displayname",
    "nonascii_frac", "no_content",
]


def load_data(path):
    users = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                users.append(json.loads(line))
    return users


def make_vectorizers():
    word_vec = TfidfVectorizer(
        lowercase=True, ngram_range=(1, 2), min_df=3, max_features=200_000,
        sublinear_tf=True,
    )
    char_vec = TfidfVectorizer(
        lowercase=True, analyzer="char_wb", ngram_range=(3, 5), min_df=3,
        max_features=200_000, sublinear_tf=True,
    )
    return word_vec, char_vec


def featurize(word_vec, char_vec, scaler, texts, numerics, fit):
    if fit:
        xw = word_vec.fit_transform(texts)
        xc = char_vec.fit_transform(texts)
        xn = scaler.fit_transform(csr_matrix(np.array(numerics)))
    else:
        xw = word_vec.transform(texts)
        xc = char_vec.transform(texts)
        xn = scaler.transform(csr_matrix(np.array(numerics)))
    return hstack([xw, xc, xn]).tocsr()


def recall_at_precision(y_true, y_score, target_precision):
    precisions, recalls, _thresholds = precision_recall_curve(y_true, y_score)
    best_recall = 0.0
    for p, r in zip(precisions, recalls):
        if p >= target_precision:
            best_recall = max(best_recall, r)
    return best_recall


def threshold_for_precision(y_true, y_score, target_precision):
    precisions, recalls, thresholds = precision_recall_curve(y_true, y_score)
    best = None
    for p, r, t in zip(precisions[:-1], recalls[:-1], thresholds):
        if p >= target_precision and (best is None or r > best[1]):
            best = (t, r, p)
    return best


def evaluate_split(name, train_users, test_users):
    print(f"\n{'=' * 70}\nSPLIT: {name}  (train={len(train_users)}, test={len(test_users)})")
    train_docs = [build_document(u) for u in train_users]
    test_docs = [build_document(u) for u in test_users]
    y_train = np.array([1 if u["is_spam"] else 0 for u in train_users])
    y_test = np.array([1 if u["is_spam"] else 0 for u in test_users])
    print(f"  train spam rate: {y_train.mean():.3f}, test spam rate: {y_test.mean():.3f}")

    word_vec, char_vec = make_vectorizers()
    scaler = MaxAbsScaler()
    x_train = featurize(word_vec, char_vec, scaler,
                        [d[0] for d in train_docs], [d[1] for d in train_docs], fit=True)
    x_test = featurize(word_vec, char_vec, scaler,
                       [d[0] for d in test_docs], [d[1] for d in test_docs], fit=False)

    model = LogisticRegression(C=1.0, max_iter=2000, solver="liblinear")
    model.fit(x_train, y_train)
    scores = model.predict_proba(x_test)[:, 1]

    auc = roc_auc_score(y_test, scores)
    ap = average_precision_score(y_test, scores)
    preds = (scores >= 0.5).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_test, preds).ravel()
    print(f"  ROC AUC:            {auc:.4f}")
    print(f"  PR AUC (avg prec):  {ap:.4f}")
    print(f"  At threshold 0.5:   precision={tp / max(tp + fp, 1):.4f} recall={tp / max(tp + fn, 1):.4f}  (tp={tp} fp={fp} fn={fn} tn={tn})")
    for target in (0.99, 0.995, 0.999):
        info = threshold_for_precision(y_test, scores, target)
        if info:
            t, r, p = info
            print(f"  Precision >= {target}: recall={r:.4f} at threshold {t:.4f} (actual precision {p:.4f})")
        else:
            print(f"  Precision >= {target}: unattainable on this test set")

    print("\n  Worst false positives (approved users scored most spammy):")
    order = np.argsort(-scores)
    shown = 0
    for i in order:
        if y_test[i] == 0 and scores[i] >= 0.5:
            u = test_users[i]
            print(f"    {scores[i]:.3f}  {u.get('displayName')!r} (_id={u['_id']}, created {u['createdAt'][:10]})")
            shown += 1
            if shown >= 10:
                break
    if shown == 0:
        print("    (none above 0.5)")

    print("\n  Worst false negatives (spammers scored least spammy):")
    shown = 0
    for i in order[::-1]:
        if y_test[i] == 1 and scores[i] < 0.5:
            u = test_users[i]
            print(f"    {scores[i]:.3f}  {u.get('displayName')!r} (_id={u['_id']}, created {u['createdAt'][:10]})")
            shown += 1
            if shown >= 10:
                break
    if shown == 0:
        print("    (none below 0.5)")

    return {"auc": auc, "ap": ap}


def top_features(model, word_vec, char_vec, n=25):
    names = list(word_vec.get_feature_names_out()) + \
        [f"char:{c!r}" for c in char_vec.get_feature_names_out()] + \
        NUMERIC_FEATURE_NAMES
    coefs = model.coef_[0]
    order = np.argsort(coefs)
    print("\nTop spam-indicating features:")
    for i in order[::-1][:n]:
        print(f"  {coefs[i]:+.3f}  {names[i]}")
    print("\nTop ham-indicating features:")
    for i in order[:n]:
        print(f"  {coefs[i]:+.3f}  {names[i]}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("data")
    parser.add_argument("--model-out", default=None)
    args = parser.parse_args()

    users = load_data(args.data)
    print(f"Loaded {len(users)} users, {sum(1 for u in users if u['is_spam'])} spam")

    # Newest first, so "every other user going backwards in time" is even indices
    users.sort(key=lambda u: u["createdAt"], reverse=True)
    train_alt = [u for i, u in enumerate(users) if i % 2 == 0]
    test_alt = [u for i, u in enumerate(users) if i % 2 == 1]
    evaluate_split("alternating (every other user, newest first)", train_alt, test_alt)

    cutoff = len(users) // 5
    test_temporal = users[:cutoff]
    train_temporal = users[cutoff:]
    evaluate_split("temporal (train on oldest 80%, test on newest 20%)",
                   train_temporal, test_temporal)

    if args.model_out:
        print(f"\n{'=' * 70}\nFitting final model on all {len(users)} users...")
        docs = [build_document(u) for u in users]
        y = np.array([1 if u["is_spam"] else 0 for u in users])
        word_vec, char_vec = make_vectorizers()
        scaler = MaxAbsScaler()
        x = featurize(word_vec, char_vec, scaler,
                      [d[0] for d in docs], [d[1] for d in docs], fit=True)
        model = LogisticRegression(C=1.0, max_iter=2000, solver="liblinear")
        model.fit(x, y)
        top_features(model, word_vec, char_vec)

        import joblib
        joblib.dump({
            "model": model,
            "word_vec": word_vec,
            "char_vec": char_vec,
            "scaler": scaler,
        }, args.model_out)
        print(f"Saved model to {args.model_out}")


if __name__ == "__main__":
    sys.exit(main())
