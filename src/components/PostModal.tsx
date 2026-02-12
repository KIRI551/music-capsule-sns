"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Music, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { resolveMusic } from "@/lib/music";
import { OdesliResponse, Tag } from "@/types";

interface PostModalProps {
  onClose: () => void;
  onPostCreated: () => void;
}

export function PostModal({ onClose, onPostCreated }: PostModalProps) {
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [musicData, setMusicData] = useState<OdesliResponse | null>(null);
  const [resolving, setResolving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      const { data } = await supabase
        .from("tags")
        .select("*")
        .order("name");
      if (data) setTags(data);
    };
    fetchTags();
  }, []);

  // Resolve music URL
  const handleResolve = async () => {
    if (!url.trim()) return;
    setResolving(true);
    setError("");
    setMusicData(null);

    try {
      const data = await resolveMusic(url.trim());
      setMusicData(data);
    } catch (err: any) {
      setError(err.message || "URL の解析に失敗しました");
    }
    setResolving(false);
  };

  // Submit post
  const handleSubmit = async () => {
    if (!musicData) return;
    setPosting(true);
    setError("");

    try {
      // For demo: use anonymous user approach (or real auth)
      // In production, you'd get the actual user from supabase.auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const userId = user?.id;
      if (!userId) {
        setError("投稿するにはログインが必要です");
        setPosting(false);
        return;
      }

      const { data: post, error: insertError } = await supabase
        .from("posts")
        .insert({
          user_id: userId,
          title: musicData.title,
          artist: musicData.artist,
          album_art_url: musicData.albumArtUrl,
          description: description.trim(),
          spotify_link: musicData.spotifyLink,
          apple_music_link: musicData.appleMusicLink,
          youtube_link: musicData.youtubeLink,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Insert post tags
      if (post && selectedTags.length > 0) {
        const tagEntries = selectedTags.map((tagId) => ({
          post_id: post.id,
          tag_id: tagId,
        }));
        await supabase.from("post_tags").insert(tagEntries);
      }

      onPostCreated();
    } catch (err: any) {
      setError(err.message || "投稿に失敗しました");
    }
    setPosting(false);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <motion.div
      className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md rounded-t-2xl bg-surface p-5 sm:rounded-2xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">音楽カプセルを投稿</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-foreground/60 hover:bg-surface-light"
          >
            <X size={20} />
          </button>
        </div>

        {/* URL Input */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm text-foreground/60">
            音楽URL (Spotify / Apple Music / YouTube)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Music
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
              />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://open.spotify.com/track/..."
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground placeholder-foreground/30 outline-none focus:border-primary"
                onKeyDown={(e) => e.key === "Enter" && handleResolve()}
              />
            </div>
            <button
              onClick={handleResolve}
              disabled={resolving || !url.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-40"
            >
              {resolving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="mb-3 text-sm text-red-400">{error}</p>
        )}

        {/* Music Preview */}
        <AnimatePresence>
          {musicData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden rounded-xl bg-background p-3"
            >
              <div className="flex gap-3">
                {musicData.albumArtUrl && (
                  <img
                    src={musicData.albumArtUrl}
                    alt={musicData.title}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{musicData.title}</p>
                  <p className="truncate text-sm text-foreground/60">
                    {musicData.artist}
                  </p>
                  <div className="mt-1 flex gap-2 text-xs text-foreground/40">
                    {musicData.spotifyLink && <span>Spotify</span>}
                    {musicData.appleMusicLink && <span>Apple Music</span>}
                    {musicData.youtubeLink && <span>YouTube</span>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Description */}
        {musicData && (
          <>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm text-foreground/60">
                紹介文
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="この曲のおすすめポイントを書こう..."
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder-foreground/30 outline-none focus:border-primary"
                maxLength={280}
              />
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mb-5">
                <label className="mb-2 block text-sm text-foreground/60">
                  タグ
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        selectedTags.includes(tag.id)
                          ? "bg-primary text-white"
                          : "bg-surface-light text-foreground/60 hover:text-foreground"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={posting}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition-colors hover:bg-primary-light disabled:opacity-40"
            >
              {posting ? (
                <Loader2 size={18} className="mx-auto animate-spin" />
              ) : (
                "カプセルを投下する"
              )}
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
