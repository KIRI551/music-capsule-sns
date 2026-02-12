"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { playOpenSound } from "@/lib/sounds";
import { Post } from "@/types";

interface CapsuleDetailProps {
  post: Post;
  onClose: () => void;
}

export function CapsuleDetail({ post, onClose }: CapsuleDetailProps) {
  const [isOpened, setIsOpened] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    // Start the opening animation after a short delay
    const timer = setTimeout(() => {
      setIsOpened(true);
      playOpenSound();
    }, 100);

    // Fetch like count
    const fetchLikes = async () => {
      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id);
      setLikesCount(count ?? 0);

      // Check if current user has liked
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("likes")
          .select("*")
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .maybeSingle();
        setLiked(!!data);
      }
    };
    fetchLikes();

    return () => clearTimeout(timer);
  }, [post.id]);

  const handleLike = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (liked) {
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", user.id);
      setLiked(false);
      setLikesCount((c) => Math.max(0, c - 1));
    } else {
      await supabase
        .from("likes")
        .insert({ post_id: post.id, user_id: user.id });
      setLiked(true);
      setLikesCount((c) => c + 1);
    }
  };

  const musicLinks = [
    { name: "Spotify", url: post.spotify_link, color: "#1DB954" },
    { name: "Apple Music", url: post.apple_music_link, color: "#FA2D48" },
    { name: "YouTube", url: post.youtube_link, color: "#FF0000" },
  ].filter((l) => l.url);

  return (
    <motion.div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <AnimatePresence>
        {!isOpened ? (
          /* Unopened capsule - spinning ball */
          <motion.div
            key="capsule"
            className="capsule-glow relative h-32 w-32 overflow-hidden rounded-full border-4 border-white/20"
            initial={{ scale: 0.5, rotate: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {post.album_art_url && (
              <img
                src={post.album_art_url}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
            <div className="capsule-shine absolute inset-0 rounded-full" />
          </motion.div>
        ) : (
          /* Opened - detail card */
          <motion.div
            key="detail"
            className="mx-4 w-full max-w-sm overflow-hidden rounded-2xl bg-surface shadow-2xl"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Album art */}
            <div className="relative aspect-square w-full overflow-hidden">
              {post.album_art_url ? (
                <img
                  src={post.album_art_url}
                  alt={post.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface-light text-6xl text-foreground/20">
                  ?
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-surface to-transparent" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm"
              >
                <X size={18} />
              </button>
            </div>

            {/* Info */}
            <div className="p-5">
              <h3 className="text-xl font-bold leading-tight">{post.title}</h3>
              <p className="mt-1 text-sm text-foreground/60">{post.artist}</p>

              {post.description && (
                <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                  {post.description}
                </p>
              )}

              {/* Music service links */}
              {musicLinks.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {musicLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-80"
                      style={{ backgroundColor: link.color }}
                    >
                      <ExternalLink size={12} />
                      {link.name}
                    </a>
                  ))}
                </div>
              )}

              {/* Like button */}
              <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    liked
                      ? "bg-accent/20 text-accent"
                      : "bg-surface-light text-foreground/60 hover:text-foreground"
                  }`}
                >
                  <Heart
                    size={16}
                    fill={liked ? "currentColor" : "none"}
                  />
                  {likesCount > 0 && likesCount}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
