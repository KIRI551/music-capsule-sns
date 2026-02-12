# 音楽カプセルSNS: 実装タスク一覧

このタスクリストは、AIエージェント (Claude Code) が順不同に実行するためのものです。「音楽カプセルSNS」を構築するため、上から順に作業を進めてください。

## プロジェクト設定とインフラ
- [ ] Next.js プロジェクトの初期化 (App Router, TypeScript, Tailwind CSS)
- [ ] 必要なライブラリのインストール: `framer-motion`, `matter-js`, `lucide-react`, `@supabase/supabase-js`, `axios` (API呼び出し用)
- [ ] Supabase プロジェクトのセットアップと環境変数の設定 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [ ] Supabase データベーススキーマの定義 (SQLエディタでテーブル作成)
    - `users`: id, username, avatar_url
    - `posts`: id, user_id, spotify_url, youtube_url, apple_music_url, title, artist, album_art_url, description, created_at
    - `likes`: user_id, post_id
    - `tags`: id, name
    - `post_tags`: post_id, tag_id
- [ ] 音楽リンク変換ユーティリティ関数の作成 (Odesli APIを使用し、Spotify/Apple/YouTubeなど任意のURLから全プラットフォームのリンクを取得する)

## コア機能と画面実装
- [ ] モバイルファーストな基本レイアウトの作成
- [ ] `Capsule` コンポーネントの実装
    - アルバムアートを円形に表示
    - クリックイベントのハンドリング
- [ ] `PhysicsContainer` コンポーネントの実装 (`matter-js` 利用)
    - 画面サイズに応じた「壁」と「床」の作成
    - カプセルを上から落とすロジック
    - 積み重なる挙動の実装
- [ ] `TimeStream` (月別ナビゲーション) コンポーネントの実装
    - 横スワイプで現在表示する「月」を切り替える機能
    - 月ごとに投稿データをフィルタリングして再取得・再ドロップする処理

## インタラクションと機能追加
- [ ] `PostModal` (投稿フォーム) の実装
    - URL入力欄 (Spotify/Apple/YouTube 対応)
    - メタデータ自動取得機能の統合 (タイトル、アーティスト、アートワーク)
    - 紹介文とタグの入力
    - 投稿実行ロジック (他サービスリンク生成 + DB保存)
- [ ] `CapsuleDetail` (開封モーダル) の実装
    - 大きなアートワーク、曲情報、紹介文の表示
    - 各音楽サービスへのリンクボタン
    - 「いいね」ボタンの動作
- [ ] 「いいね」機能とユーザーごとのコレクション表示
- [ ] タグフィルター機能の実装 (UIでタグ選択 -> 物理ワールド内のカプセルをフィルタリング)

## 仕上げと調整
- [ ] サウンドエフェクトの追加 (カプセル落下音、開封音) ※推奨
- [ ] 物理演算のパフォーマンス最適化 (静止したボディのSleep処理)
- [ ] UI/UXの最終調整 (ガシャポン風の質感、ドラッグ操作など)
