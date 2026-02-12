"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Post, Tag } from "@/types";
import {
  PhysicsContainer,
  PhysicsContainerRef,
} from "./PhysicsContainer";

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long" });
}

function getMonthRange(date: Date): { start: string; end: string } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1).toISOString();
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
  return { start, end };
}

interface TimeStreamProps {
  refreshKey: number;
  onCapsuleClick: (post: Post) => void;
}

export function TimeStream({ refreshKey, onCapsuleClick }: TimeStreamProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(0);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const physicsRef = useRef<PhysicsContainerRef>(null);

  const monthKey = getMonthKey(currentDate);
  const monthLabel = getMonthLabel(currentDate);

  // Fetch tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      const { data } = await supabase.from("tags").select("*").order("name");
      if (data) setTags(data);
    };
    fetchTags();
  }, []);

  // Fetch posts for the current month
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { start, end } = getMonthRange(currentDate);

    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching posts:", error);
        setPosts([]);
      } else {
        setPosts(data ?? []);
      }
    } catch {
      setPosts([]);
    }
    setLoading(false);
  }, [currentDate]);

  useEffect(() => {
    physicsRef.current?.clear();
    fetchPosts();
  }, [monthKey, fetchPosts, refreshKey]);

  // Filter posts by tag
  useEffect(() => {
    if (!selectedTagId) {
      setFilteredPosts(posts);
      return;
    }

    const filterByTag = async () => {
      const postIds = posts.map((p) => p.id);
      if (postIds.length === 0) {
        setFilteredPosts([]);
        return;
      }

      const { data } = await supabase
        .from("post_tags")
        .select("post_id")
        .eq("tag_id", selectedTagId)
        .in("post_id", postIds);

      if (data) {
        const matchingIds = new Set(data.map((d) => d.post_id));
        setFilteredPosts(posts.filter((p) => matchingIds.has(p.id)));
      } else {
        setFilteredPosts(posts);
      }
    };
    filterByTag();
  }, [posts, selectedTagId]);

  // Re-drop capsules when filtered posts change
  useEffect(() => {
    physicsRef.current?.clear();
    // Small delay to allow clear to take effect
    const timer = setTimeout(() => {
      physicsRef.current?.dropCapsules(filteredPosts);
    }, 50);
    return () => clearTimeout(timer);
  }, [filteredPosts]);

  // Navigate months
  const goToPrevMonth = useCallback(() => {
    setDirection(-1);
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    const now = new Date();
    if (
      currentDate.getFullYear() === now.getFullYear() &&
      currentDate.getMonth() === now.getMonth()
    ) {
      return;
    }
    setDirection(1);
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  }, [currentDate]);

  // Swipe handler
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 50;
      if (info.offset.x > threshold) {
        goToPrevMonth();
      } else if (info.offset.x < -threshold) {
        goToNextMonth();
      }
    },
    [goToPrevMonth, goToNextMonth]
  );

  const isCurrentMonth =
    currentDate.getFullYear() === new Date().getFullYear() &&
    currentDate.getMonth() === new Date().getMonth();

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <div className="relative h-full w-full">
      {/* Month indicator */}
      <div className="absolute top-12 left-0 right-0 z-20 flex items-center justify-center gap-3 py-2">
        <button
          onClick={goToPrevMonth}
          className="rounded-full p-1.5 text-foreground/60 transition-colors hover:bg-surface-light hover:text-foreground"
          aria-label="前の月"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="min-w-[160px] text-center">
          <span className="text-sm font-medium text-foreground/80">
            {monthLabel}
          </span>
        </div>

        <button
          onClick={goToNextMonth}
          disabled={isCurrentMonth}
          className="rounded-full p-1.5 text-foreground/60 transition-colors hover:bg-surface-light hover:text-foreground disabled:opacity-30"
          aria-label="次の月"
        >
          <ChevronRight size={20} />
        </button>

        {/* Filter toggle */}
        {tags.length > 0 && (
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`absolute right-4 rounded-full p-1.5 transition-colors ${
              showFilters || selectedTagId
                ? "bg-primary/20 text-primary"
                : "text-foreground/60 hover:bg-surface-light hover:text-foreground"
            }`}
            aria-label="タグフィルター"
          >
            <Filter size={18} />
          </button>
        )}
      </div>

      {/* Tag filter bar */}
      <AnimatePresence>
        {showFilters && tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-[88px] left-0 right-0 z-20 flex gap-2 overflow-x-auto px-4 py-2"
          >
            <button
              onClick={() => setSelectedTagId(null)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !selectedTagId
                  ? "bg-primary text-white"
                  : "bg-surface-light text-foreground/60"
              }`}
            >
              すべて
            </button>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() =>
                  setSelectedTagId(tag.id === selectedTagId ? null : tag.id)
                }
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  tag.id === selectedTagId
                    ? "bg-primary text-white"
                    : "bg-surface-light text-foreground/60"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipeable physics container */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={monthKey}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "tween", duration: 0.3 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="absolute inset-0"
          style={{ top: 0 }}
        >
          {/* Box decoration */}
          <div className="absolute inset-x-2 top-24 bottom-2 rounded-2xl border border-border pointer-events-none z-10" />

          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <PhysicsContainer
              ref={physicsRef}
              posts={filteredPosts}
              onCapsuleClick={onCapsuleClick}
            />
          )}

          {/* Empty state */}
          {!loading && filteredPosts.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-foreground/40 pointer-events-none">
              <p className="text-lg">
                {selectedTagId
                  ? "このタグのカプセルはありません"
                  : "この月にはまだカプセルがありません"}
              </p>
              <p className="text-sm">右下の＋ボタンから音楽を投稿しよう</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
