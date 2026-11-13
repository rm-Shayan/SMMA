import hashlib
import math
import re

DIMENSIONS = 1536
_MODEL = None


def _get_model():
    global _MODEL
    if _MODEL is None:
        try:
            from fastembed import TextEmbedding
            _MODEL = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
        except Exception:
            _MODEL = False
    return _MODEL


def embed_text(text: str) -> list[float]:
    model = _get_model()
    if model:
        try:
            embeddings = list(model.embed([text or ""]))
            if embeddings:
                raw = [float(v) for v in embeddings[0]]
                if len(raw) < DIMENSIONS:
                    raw.extend([0.0] * (DIMENSIONS - len(raw)))
                return raw[:DIMENSIONS]
        except Exception:
            pass

    tokens = re.findall(r"[a-z0-9]+", (text or "").lower())[:4000]
    vector = [0.0] * DIMENSIONS
    for token in tokens:
        digest = hashlib.sha1(token.encode("utf-8")).digest()
        h = int.from_bytes(digest[:4], "big")
        vector[h % DIMENSIONS] += 1.0 if h < 0x80000000 else -1.0

    norm = math.sqrt(sum(v * v for v in vector)) or 1.0
    return [v / norm for v in vector]


def cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return (dot / (na * nb)) if na and nb else 0.0


def to_vector_literal(values: list[float]) -> str:
    return "[" + ",".join(f"{v:.8f}" for v in values) + "]"
