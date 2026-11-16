import re

WORD_RE = re.compile(r"\S+")


def sliding_window_split(text: str, window_size: int = 350, overlap: int = 50) -> list[dict]:
    """Divides text into sequential overlapping sliding windows with index and metadata."""
    clean = (text or "").replace("\r\n", "\n").strip()
    if not clean:
        return []
    words = WORD_RE.findall(clean)
    if len(words) <= window_size:
        return [{"content": clean, "index": 0, "start": 0, "end": len(words), "overlap": 0}]

    stride = max(1, window_size - overlap)
    windows = []
    for i in range(0, len(words), stride):
        window_words = words[i : i + window_size]
        content = " ".join(window_words).strip()
        if content:
            windows.append({
                "content": content,
                "index": len(windows),
                "start": i,
                "end": min(len(words), i + window_size),
                "overlap": overlap if i > 0 else 0,
            })
        if i + window_size >= len(words):
            break
    return windows


def chunk_text(text: str, chunk_words: int = 400, overlap_words: int = 50) -> list[dict]:
    """Generates overlapping sliding window chunks for vector embeddings."""
    return sliding_window_split(text, window_size=chunk_words, overlap=overlap_words)
