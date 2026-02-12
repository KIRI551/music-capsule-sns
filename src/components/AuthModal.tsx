"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AuthModalProps {
  onClose: () => void;
  onAuthSuccess: () => void;
}

export function AuthModal({ onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { user_name: username || email.split("@")[0] },
          },
        });
        if (signUpError) throw signUpError;
        setMessage("確認メールを送信しました。メールを確認してください。");
        // Some Supabase configs auto-confirm, so also try to proceed
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          onAuthSuccess();
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message || "エラーが発生しました");
    }
    setLoading(false);
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
        className="w-full max-w-sm rounded-t-2xl bg-surface p-6 sm:rounded-2xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {mode === "login" ? "ログイン" : "アカウント作成"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-foreground/60 hover:bg-surface-light"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-sm text-foreground/60">
                ユーザー名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="表示名"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-foreground/30 outline-none focus:border-primary"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-foreground/60">
              メールアドレス
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground placeholder-foreground/30 outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-foreground/60">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6文字以上"
              required
              minLength={6}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-foreground/30 outline-none focus:border-primary"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-green-400">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition-colors hover:bg-primary-light disabled:opacity-40"
          >
            {loading ? (
              <Loader2 size={18} className="mx-auto animate-spin" />
            ) : mode === "login" ? (
              "ログイン"
            ) : (
              "アカウント作成"
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
              setMessage("");
            }}
            className="text-sm text-primary-light hover:underline"
          >
            {mode === "login"
              ? "アカウントをお持ちでない方はこちら"
              : "既にアカウントをお持ちの方はこちら"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
