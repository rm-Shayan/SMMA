import base64
import struct
import wave
from io import BytesIO


def generate_speech(text: str, company_id: str, voice: str = "ur-PK-UzmaNeural") -> str:
    """Local silent WAV fallback; replace with Azure/ElevenLabs for real speech."""
    buffer = BytesIO()
    with wave.open(buffer, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(16000)
        frames = int(16000 * min(10, max(1, len(text) / 80)))
        wav.writeframes(b"\x00\x00" * frames)
    return "data:audio/wav;base64," + base64.b64encode(buffer.getvalue()).decode()