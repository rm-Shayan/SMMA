import json
import re
from ...core.llm import generate_text

PLATFORM_GUIDELINES = {
    "linkedin": {
        "rules": "Professional, insightful, short 1-line paragraphs with spacing for readability. 2-3 clean emojis (📌, 🚀, 💡). Exactly 3 to 5 targeted B2B hashtags at the end. Conclude with an open discussion question.",
        "fallback_body": "Scaling operations in 2026 isn't about working more hours—it's about intelligent workflow orchestration.\n\nThree shifts high-performing teams are making right now:\n\n📌 1. Autonomous inbox triage over manual clearing\n💡 2. Real-time RAG operations over static documentation\n🚀 3. Pre-flight credit guards on all AI executions\n\nWhat is your team's biggest operational bottleneck this quarter? Drop your thoughts below.\n\n#AI #SaaS #WorkflowAutomation #Productivity #Operations",
    },
    "twitter": {
        "rules": "Punchy, bold, maximum 250 characters. 1 emoji maximum. Exactly 1-2 relevant hashtags.",
        "fallback_body": "Stop doing manual operations in 2026.\n\nIntelligent multi-agent teams with strict credit guards now execute workflows 10x faster. ⚡\n\n#SaaS #AI",
    },
    "facebook": {
        "rules": "Engaging community tone, conversational story, 3-5 expressive emojis, 5-8 hashtags at bottom.",
        "fallback_body": "Building a modern SaaS in 2026 requires speed and precision! 🚀 We just rolled out autonomous multi-agent pipelines to eliminate repetitive operational work.\n\nCurious how your team handles daily workflows? Let us know in the comments! 👇\n\n#SaaS #Productivity #TechNews #Innovation #Software",
    },
}


def craft_social_post(platform: str, topic: str, tone: str = "professional") -> dict:
    plat_key = platform.lower()
    guideline = PLATFORM_GUIDELINES.get(plat_key, PLATFORM_GUIDELINES["linkedin"])

    prompt = (
        f"You are a master social strategist. Apply deep strategic reasoning: "
        f"1. Reason through the core psychological hook for audience interested in '{topic}'. "
        f"2. Write a high-converting {plat_key} post with {guideline['rules']}. Zero sterile AI buzzwords. "
        f"3. Generate an evocative, hyper-realistic graphic prompt tailored for Flux image generation model. "
        "Return strictly raw JSON format with two keys: "
        "'content' (the complete post text with hashtags/emojis), 'imagePrompt' (detailed prompt for graphic generator)."
    )
    res = generate_text(prompt, system_prompt="You are an elite copywriter. You return raw JSON only, no backticks, no prose.", max_tokens=500)
    if res:
        try:
            match = re.search(r"\{.*\}", res, re.DOTALL)
            if match:
                parsed = json.loads(match.group(0))
                if parsed.get("content"):
                    return parsed
        except Exception:
            pass

    return {
        "content": guideline["fallback_body"],
        "imagePrompt": f"Modern minimalist 3D isometric render showing {topic}, cinematic studio lighting, 8k resolution",
    }
