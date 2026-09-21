#!/usr/bin/env python3
"""Score users against a trained spam model.

Input is JSONL in the same shape as extractSpamClassifierData.ts output
(is_spam may be absent). Prints one line per user: score, display name, _id.

Usage:
  python3 scoreSpamUser.py /path/to/model.joblib /path/to/users.jsonl
"""

import json
import sys

import joblib
import numpy as np
from scipy.sparse import hstack, csr_matrix

from trainSpamClassifier import build_document


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        return 1
    model_path, data_path = sys.argv[1], sys.argv[2]
    bundle = joblib.load(model_path)
    model = bundle["model"]
    word_vec = bundle["word_vec"]
    char_vec = bundle["char_vec"]
    scaler = bundle["scaler"]

    users = []
    with open(data_path) as f:
        for line in f:
            line = line.strip()
            if line:
                users.append(json.loads(line))

    docs = [build_document(u) for u in users]
    texts = [d[0] for d in docs]
    numerics = [d[1] for d in docs]
    x = hstack([
        word_vec.transform(texts),
        char_vec.transform(texts),
        scaler.transform(csr_matrix(np.array(numerics))),
    ]).tocsr()
    scores = model.predict_proba(x)[:, 1]

    for u, s in sorted(zip(users, scores), key=lambda t: -t[1]):
        print(f"{s:.4f}\t{u.get('displayName')!r}\t{u.get('_id')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
