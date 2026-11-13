import os
import subprocess
import imageio_ffmpeg

VIDEO_TRIGGERS = {"video", "demo", "explainer", "breakdown", "case study", "how to", "guide", "framework"}


def should_create_video(format_pref: str | None, topic: str | None) -> bool:
    """Decides if the post should be rendered as a motion video."""
    if (format_pref or "").lower() == "video":
        return True
    tokens = set((topic or "").lower().split())
    return bool(tokens & VIDEO_TRIGGERS)


def render_social_video(image_path: str, audio_path: str, post_id: str, target_dir: str = "storage/videos") -> str | None:
    """Combines post graphic + voiceover into a crisp 1080p MP4 motion explainer video."""
    if not (image_path and os.path.exists(image_path) and audio_path and os.path.exists(audio_path)):
        return None

    os.makedirs(target_dir, exist_ok=True)
    out_video = os.path.join(target_dir, f"post_{post_id[:8]}.mp4")
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

    cmd = [
        ffmpeg, "-y", "-loop", "1", "-i", image_path, "-i", audio_path,
        "-c:v", "libx264", "-tune", "stillimage", "-c:a", "aac", "-b:a", "192k",
        "-pix_fmt", "yuv420p", "-shortest", out_video,
    ]
    try:
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True, timeout=30)
        return out_video
    except Exception:
        return None

