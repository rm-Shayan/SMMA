import asyncio
import os
import re
import uuid
import edge_tts

VOICE_MAP = {
    "en": "en-US-JennyNeural",
    "ur": "ur-PK-AsadNeural",
    "roman_urdu": "ur-PK-AsadNeural",
    "hi": "hi-IN-MadhurNeural",
    "es": "es-ES-AlvaroNeural",
    "ar": "ar-SA-HamedNeural",
}

AI_WORDS_REGEX = re.compile(
    r"\b(delve|tapestry|testament|furthermore|moreover|game-changer|cutting-edge|in conclusion|pleased to assist|hope this email finds you well|as an ai)\b",
    re.IGNORECASE,
)

ROMAN_URDU_WORDS = {
    "kya", "kia", "hai", "hain", "haan", "theek", "kaise", "kese", "karo", "krdo", "krna",
    "bhejo", "mujhe", "ap", "aap", "hum", "kal", "parson", "shukriya", "batao", "btao",
    "konsa", "kahan", "kitna", "kitne", "acha", "achha", "sath", "saat", "lekin", "chahiye",
    "bhai", "mera", "meri", "mere", "wala", "wali", "wale", "kuch", "zaroorat", "masla"
}


def detect_language(text_val: str) -> str:
    tokens = set(re.findall(r"[a-z]+", (text_val or "").lower()))
    if tokens & ROMAN_URDU_WORDS:
        return "roman_urdu"
    return "en"


def humanize_text(text_val: str) -> str:
    cleaned = AI_WORDS_REGEX.sub("", text_val or "")
    return re.sub(r"\s{2,}", " ", cleaned).strip()


async def _generate_voice_file(text_val: str, voice: str, output_path: str) -> str:
    communicate = edge_tts.Communicate(text_val, voice=voice, rate="-4%", pitch="+0Hz")
    await communicate.save(output_path)
    return output_path


def synthesize_human_voice(text_val: str, lang: str = "en", target_dir: str = "storage/audio") -> str:
    os.makedirs(target_dir, exist_ok=True)
    out_file = os.path.join(target_dir, f"voice_{uuid.uuid4().hex[:8]}.mp3")
    voice = VOICE_MAP.get(lang.lower(), VOICE_MAP["en"])
    clean_text = humanize_text(text_val)

    try:
        asyncio.run(_generate_voice_file(clean_text, voice, out_file))
        return out_file
    except RuntimeError:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(_generate_voice_file(clean_text, voice, out_file))
        return out_file


def should_reply_with_voice(inbound_type: str, body: str, lead_score: int = 50) -> bool:
    if inbound_type in ("voice_note", "audio", "whatsapp_audio"):
        return True
    lower = (body or "").lower()
    voice_triggers = ["voice note", "audio", "voice bhej", "call me", "say it", "voice me", "bol k"]
    return any(t in lower for t in voice_triggers) or (lead_score >= 85 and len(body.split()) < 30)
