from urllib.parse import quote


def render_motion_video(headline: str, subtext: str, company_id: str, duration: int = 5) -> str:
    """Local animated-SVG fallback for motion posters."""
    svg = (
        "<svg xmlns='http://www.w3.org/2000/svg' width='1280' height='720'>"
        "<rect width='100%' height='100%' fill='#0b1120'/>"
        f"<text x='640' y='330' font-family='sans-serif' font-size='64' fill='#e2e8f0' text-anchor='middle'>{headline[:70]}</text>"
        f"<text x='640' y='410' font-family='sans-serif' font-size='28' fill='#94a3b8' text-anchor='middle'>{subtext[:90]}</text>"
        f"<text x='640' y='650' font-family='sans-serif' font-size='20' fill='#475569' text-anchor='middle'>{duration}s • {company_id[:8]}</text>"
        "</svg>"
    )
    return "data:image/svg+xml;utf8," + quote(svg)