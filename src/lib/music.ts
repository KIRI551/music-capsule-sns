import { OdesliResponse } from "@/types";

export async function resolveMusic(url: string): Promise<OdesliResponse> {
  const res = await fetch("/api/resolve-music", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "音楽情報の取得に失敗しました");
  }

  return res.json();
}
