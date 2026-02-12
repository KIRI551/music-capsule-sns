"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, LogIn, LogOut, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { TimeStream } from "@/components/TimeStream";
import { PostModal } from "@/components/PostModal";
import { CapsuleDetail } from "@/components/CapsuleDetail";
import { AuthModal } from "@/components/AuthModal";
import { Post } from "@/types";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export default function Home() {
  const [showPostModal, setShowPostModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePostCreated = useCallback(() => {
    setShowPostModal(false);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleCapsuleClick = useCallback((post: Post) => {
    setSelectedPost(post);
  }, []);

  const handleFabClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowPostModal(true);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-3 pb-2">
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          Music Capsule
        </h1>

        {user ? (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-foreground/60">
              <User size={14} />
              {user.user_metadata?.user_name || user.email?.split("@")[0]}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-full p-1.5 text-foreground/50 transition-colors hover:bg-surface-light hover:text-foreground"
              aria-label="ログアウト"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-1.5 rounded-full bg-surface-light px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            <LogIn size={14} />
            ログイン
          </button>
        )}
      </header>

      {/* Main - Physics container with month navigation */}
      <TimeStream
        refreshKey={refreshKey}
        onCapsuleClick={handleCapsuleClick}
      />

      {/* FAB - Post button */}
      <button
        onClick={handleFabClick}
        className="absolute bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="投稿する"
      >
        <Plus size={28} />
      </button>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={() => setShowAuthModal(false)}
        />
      )}

      {/* Post Modal */}
      {showPostModal && (
        <PostModal
          onClose={() => setShowPostModal(false)}
          onPostCreated={handlePostCreated}
        />
      )}

      {/* Capsule Detail Modal */}
      {selectedPost && (
        <CapsuleDetail
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
}
