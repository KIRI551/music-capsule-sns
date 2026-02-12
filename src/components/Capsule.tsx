"use client";

import { Post } from "@/types";

interface CapsuleProps {
  post: Post;
  x: number;
  y: number;
  angle: number;
  radius: number;
}

export function Capsule({ post, x, y, angle, radius }: CapsuleProps) {
  const diameter = radius * 2;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x - radius,
        top: y - radius,
        width: diameter,
        height: diameter,
        transform: `rotate(${angle}rad)`,
        willChange: "left, top, transform",
      }}
    >
      {/* Capsule body */}
      <div className="capsule-glow relative h-full w-full overflow-hidden rounded-full border-2 border-white/20">
        {/* Album art */}
        {post.album_art_url ? (
          <img
            src={post.album_art_url}
            alt={post.title}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-light text-xs text-foreground/50">
            {post.title?.charAt(0) || "?"}
          </div>
        )}

        {/* Plastic shine overlay */}
        <div className="capsule-shine absolute inset-0 rounded-full" />

        {/* Plastic rim */}
        <div className="absolute inset-0 rounded-full border border-white/10" />
      </div>
    </div>
  );
}
