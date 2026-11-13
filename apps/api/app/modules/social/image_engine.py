import os
import urllib.parse
import urllib.request

DIMENSIONS = {
    "linkedin": (1080, 1080),
    "twitter": (1200, 675),
    "facebook": (1200, 630),
    "instagram": (1080, 1080),
}


def generate_social_image(prompt: str, post_id: str, platform: str = "linkedin", target_dir: str = "storage/images") -> str:
    """Generates a high-res marketing graphic via free Flux/SDXL neural engine."""
    os.makedirs(target_dir, exist_ok=True)
    w, h = DIMENSIONS.get(platform.lower(), (1080, 1080))
    encoded = urllib.parse.quote(prompt[:250])
    image_url = f"https://image.pollinations.ai/prompt/{encoded}?width={w}&height={h}&nologo=true&model=flux"
    local_path = os.path.join(target_dir, f"post_{post_id[:8]}.jpg")

    try:
        req = urllib.request.Request(image_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as response, open(local_path, "wb") as out_file:
            out_file.write(response.read())
        return local_path
    except Exception:
        # Fallback to direct web CDN link if local write is interrupted
        return image_url

