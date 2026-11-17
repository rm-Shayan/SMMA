import React from "react";
import { Image as ImageIcon, Video } from "lucide-react";

export interface MediaPreviewProps {
  url: string;
  type?: "image" | "video";
  alt?: string;
  className?: string;
}

export function MediaPreview({
  url,
  type = "image",
  alt = "Creative Media",
  className,
}: MediaPreviewProps) {
  if (type === "video") {
    return (
      <div className={`relative rounded-xl overflow-hidden bg-muted aspect-video flex items-center justify-center ${className || ""}`}>
        <video src={url} controls className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden bg-muted aspect-video flex items-center justify-center ${className || ""}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <ImageIcon className="w-8 h-8 text-muted-foreground/60" />
      )}
    </div>
  );
}
