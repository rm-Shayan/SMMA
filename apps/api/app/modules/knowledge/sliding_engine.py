from ...core.llm import generate_text
from .chunker import sliding_window_split


def analyze_with_sliding_window(text: str, goal: str = "Extract key operational rules and summary", window_size: int = 400, overlap: int = 60) -> dict:
    """Processes large documents step-by-step through overlapping sliding windows and synthesizes results."""
    windows = sliding_window_split(text, window_size=window_size, overlap=overlap)
    if not windows:
        return {"summary": "Document is empty.", "windows": 0, "findings": []}

    window_insights = []
    for win in windows:
        prompt = (
            f"You are an expert document analyst. Analyze this window ({win['index'] + 1}/{len(windows)}) of a larger document.\n"
            f"Goal: {goal}\n\n"
            f"Text Window:\n{win['content']}\n\n"
            "Extract 2-3 key bullet points or facts found in this specific window. Concise and factual."
        )
        res = generate_text(prompt, system_prompt="Concise analytical AI.", max_tokens=150)
        if res and len(res.strip()) > 10:
            window_insights.append({"windowIndex": win["index"], "insights": res.strip()})

    combined = "\n\n".join(f"Window {w['windowIndex'] + 1}:\n{w['insights']}" for w in window_insights)
    synthesis_prompt = (
        f"Synthesize the following sliding-window extractions from a multi-page document into a final cohesive operational briefing.\n"
        f"Goal: {goal}\n\n"
        f"Window Extractions:\n{combined}\n\n"
        "Provide: 1. Executive Summary, 2. Key Actionable Rules/Policies. Professional and well-structured."
    )
    final_res = generate_text(synthesis_prompt, system_prompt="Chief Operations AI Analyst.", max_tokens=400)
    summary = final_res.strip() if final_res and len(final_res.strip()) > 30 else (combined or "Document processed.")

    return {
        "summary": summary,
        "totalWindows": len(windows),
        "windowInsights": window_insights,
    }
