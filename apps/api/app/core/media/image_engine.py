import hashlib
from urllib.parse import quote

PALETTE = ["#0f172a", "#1e293b", "#3b82f6", "#8b5cf6", "#22c55e"]


def generate_image(prompt: str, company_id: str, aspect_ratio: str = "1:1") -> str:
    """Deterministic local placeholder (swap with a real image provider later)."""
    seed = int(hashlib.sha1(f"{company_id}:{prompt}".encode()).hexdigest(), 16)
    width, height = (1024, 1024) if aspect_ratio == "1:1" else (1280, 720)
    bg = PALETTE[seed % len(PALETTE)]
    accent = PALETTE[(seed >> 3) % len(PALETTE)]

    svg = (
        f"<svg xmlns='http://www.w3.org/2000/svg' width='{width}' height='{height}'>"
        f"<rect width='100%' height='100%' fill='{bg}'/>"
        f"<circle cx='{width // 2}' cy='{height // 2}' r='{min(width, height) // 4}' fill='{accent}' opacity='0.85'/>"
        f"<text x='50%' y='92%' font-family='sans-serif' font-size='28' fill='#e2e8f0' text-anchor='middle'>"
        f"{prompt[:90]}</text></svg>"
    )
    return "data:image/svg+xml;utf8," + quote(svg)