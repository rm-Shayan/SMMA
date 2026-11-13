import re

WORD_RE = re.compile(r"\S+")


def chunk_text(text: str, chunk_words: int = 500, overlap_words: int = 50) -> list[dict]:
    clean = (text or "").replace("\r\n", "\n").strip()
    if not clean:
        return []

    paragraphs = re.split(r"\n{2,}", clean)
    chunks: list[dict] = []
    buffer: list[str] = []
    buffer_words = 0

    def flush() -> None:
        nonlocal buffer, buffer_words
        content = "\n\n".join(buffer).strip()
        if content:
            chunks.append({"content": content, "index": len(chunks)})
        tail = " ".join(buffer)
        words = WORD_RE.findall(tail)
        buffer = words[-overlap_words:] if words else []
        buffer_words = len(buffer)

    for paragraph in paragraphs:
        words = WORD_RE.findall(paragraph)
        if len(words) > chunk_words:
            flush()
            step = max(1, chunk_words - overlap_words)
            for i in range(0, len(words), step):
                chunks.append({"content": " ".join(words[i : i + chunk_words]), "index": len(chunks)})
            buffer = []
            buffer_words = 0
            continue

        if buffer_words + len(words) > chunk_words and buffer_words > 0:
            flush()
        buffer.append(paragraph)
        buffer_words += len(words)

    flush()
    return chunks

