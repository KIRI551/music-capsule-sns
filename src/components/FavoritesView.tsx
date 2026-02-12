"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Heart, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Post } from "@/types";

interface FavoritesViewProps {
  onClose: () => void;
  onSelectPost: (post: Post) => void;
}

export function FavoritesView({ onClose, onSelectPost }: FavoritesViewProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get liked post IDs
      const { data: likes } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!likes || likes.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const postIds = likes.map((l) => l.post_id);

      // Fetch the actual posts
      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .in("id", postIds);

      if (postsData) {
        // Maintain the liked order
        const postMap = new Map(postsData.map((p) => [p.id, p]));
        const ordered = postIds
          .map((id) => postMap.get(id))
          .filter(Boolean) as Post[];
        setPosts(ordered);
      }
      setLoading(false);
    };

    fetchFavorites();
  }, []);

  return (
    <motion.div
      className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="flex h-[85dvh] w-full max-w-md flex-col rounded-t-2xl bg-surface sm:h-[70dvh] sm:rounded-2xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-accent" fill="currentColor" />
            <h2 className="text-lg font-bold">お気に入り</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-foreground/60 hover:bg-surface-light"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-foreground/40">
              <Heart size={32} />
              <p>まだお気に入りがありません</p>
              <p className="text-sm">カプセルを開いてハートを押してみよう</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {posts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => {
                    onSelectPost(post);
                    onClose();
                  }}
                  className="flex items-center gap-3 rounded-xl bg-background p-3 text-left transition-colors hover:bg-surface-light"
                >
                  {/* Album art thumbnail */}
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white/10">
                    {post.album_art_url ? (
                      <img
                        src={post.album_art_url}
                        alt={post.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-surface-light text-foreground/30">
                        ?
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {post.title}
                    </p>
                    <p className="truncate text-sm text-foreground/50">
                      {post.artist}
                    </p>
                  </div>

                  {/* Quick links */}
                  <div className="flex shrink-0 gap-1.5">
                    {post.spotify_link && (
                      <a
                        href={post.spotify_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-full bg-[#1DB954]/20 p-1.5 text-[#1DB954]"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                    {post.apple_music_link && (
                      <a
                        href={post.apple_music_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-full bg-[#FA2D48]/20 p-1.5 text-[#FA2D48]"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                    {post.youtube_link && (
                      <a
                        href={post.youtube_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-full bg-[#FF0000]/20 p-1.5 text-[#FF0000]"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
