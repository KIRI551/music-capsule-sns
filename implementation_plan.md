# Music Capsule SNS - 実装計画書 (Implementation Plan)

このドキュメントでは、「音楽カプセルSNS」の構築に向けた技術的なアプローチと仕様を定義します。

## 1. テクノロジースタック
- **フロントエンドフレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **物理エンジン**: `matter-js` (カプセルの落下・積み上げ動作の実装)
- **バックエンド/DB**: Supabase (PostgreSQL, Auth, Storage)
- **アイコン**: Lucide React
- **音楽メタデータ取得**: Odesli API (Songlink)
    - **機能**: Spotify, Apple Music, YouTubeなど、どのプラットフォームのURLが入力されても、自動的にタイトル・アーティスト・アルバムアートを取得し、他プラットフォームへのリンクも生成します。

## 2. コアコンポーネント設計 (Core Architecture)

### 2.1. 物理演算コンテナ (`components/PhysicsContainer.tsx`)
「今月の箱」を表示するメイン画面です。
- **初期化**:
    -   `Matter.Engine` と `Matter.Render` (またはReact/Canvasによるカスタム描画) をセットアップします。
    -   **ボディ (剛体)**:
        -   静的ボディ（Static）: 壁（左右・下）。画面サイズに合わせてレスポンシブに調整します。
        -   動的ボディ（Dynamic）: カプセル（円形）。
- **カプセルの描画**:
    -   `Matter.Events.on(engine, 'afterUpdate')` を使用して物理演算の位置情報をReactの状態、またはDOM要素に同期させます。
    -   各カプセルは反発係数（restitution: ~0.3）と摩擦（friction: ~0.5）を持つ円として定義します。
    -   **テクスチャ**: アルバムアートを円形ボディにマッピングして表示します。
- **インタラクション**:
    -   カプセルをクリックすると物理演算を一時停止（または干渉しないように制御）し、詳細モーダルを開きます。
    -   （オプション）`Matter.MouseConstraint` を導入して、カプセルを指でかき混ぜたり投げたりできるようにします。

### 2.2. カプセルUI (`components/Capsule.tsx`)
-   曲を視覚的に表現するコンポーネントです。
-   完全な円形 (border-radius: 50%)。
-   「ガチャガチャ」の質感を出すため、光沢のあるオーバーレイやプラスチック風の枠線をCSSで表現します。

### 2.3. 月別ナビゲーション (`components/TimeStream.tsx`)
-   コンセプト: 画面全体が「現在の月」の箱を表します。
-   左右のスワイプ（Framer Motionの `drag` またはタッチイベント）で `currentMonth` ステートを切り替えます。
-   **切り替え時の挙動**:
    -   現在の物理演算ワールドをクリアします。
    -   Supabaseの `posts` テーブルから、対象月の期間（例: 2024-02-01 〜 2024-02-29）に投稿された曲を取得します。
    -   新しいカプセルを画面上部から落下させます。
    -   「過去ログが見にくい」問題を解決するため、月単位で箱を分けるアプローチです。

### 2.4. 投稿機能 (`components/PostModal.tsx`)
-   ユーザーが音楽のURLを入力します（Spotify / Apple Music / YouTube どれでも可）。
-   **バックエンド処理 (Next.js API Route)**:
    -   URLを受け取る。
    -   Odesli API (`https://api.song.link/v1-alpha.1/links?url=...`) を呼び出す。
    -   メタデータ（タイトル、アーティスト、アートワーク）と、**各プラットフォームのリンク（Spotify, Apple Music, YouTube）** を取得して返します。
-   ユーザーが紹介文（Description）とタグを入力します。
-   Supabaseに保存します。

### 2.5. 詳細モーダル・開封 (`components/CapsuleDetail.tsx`)
-   「未開封」状態からクリックで「開封」するアニメーション。
-   大きなジャケット画像、タイトル、アーティスト、紹介文を表示。
-   各音楽アプリへのリンクボタンを表示（Spotify, Apple Music, YouTubeなど）。
-   「いいね」ボタン。

## 3. データベーススキーマ (Supabase)

### Table: `profiles`
- `id` (uuid, references auth.users): ユーザーID
- `username` (text): 表示名
- `avatar_url` (text): アバター画像

### Table: `posts`
- `id` (uuid, primary key): 投稿ID
- `user_id` (uuid, references profiles.id): 投稿者
- `title` (text): 曲名
- `artist` (text): アーティスト名
- `album_art_url` (text): ジャケット画像URL
- `description` (text): 紹介文
- `spotify_link` (text): Spotifyリンク
- `apple_music_link` (text): Apple Musicリンク
- `youtube_link` (text): YouTubeリンク
- `created_at` (timestamptz): 投稿日時

### Table: `likes`
- `user_id` (uuid): いいねしたユーザー
- `post_id` (uuid): いいねされた投稿
- `created_at` (timestamptz): 日時

### Table: `tags`
- `id` (uuid): タグID
- `name` (text): タグ名（例: "Chill", "Upbeat", "作業用"）

### Table: `post_tags`
- `post_id` (uuid): 投稿ID
- `tag_id` (uuid): タグID

## 4. 詳細実装ステップ (Step-by-Step)

### Phase 1: セットアップとデータベース
1.  Next.js プロジェクトの初期化。
2.  Supabase クライアントの設定。
3.  Supabase SQL Editor でテーブル作成。
4.  TypeScriptの型定義 (`Post`, `Profile` など)。

### Phase 2: 物理演算エンジンの実装
1.  空のCanvas/コンテナを作成。
2.  `matter-js` をデバッグレンダラー付きで稼働させる。
3.  画面サイズに応じた「壁」と「床」を作成（レスポンシブ対応）。
4.  関数 `dropCapsule(x, y, data)` を作成し、物理ボディを追加できるようにする。
5.  物理ボディとReactコンポーネントの位置を同期させる（クリックイベントやCSSスタイリングのため）。

### Phase 3: データ連携と表示
1.  Supabaseから投稿データをfetchする処理。
2.  取得したデータを `dropCapsule` で画面に投入するループ処理。
3.  「月」フィルターの実装（スワイプで月を変更し、データを再取得して再ドロップ）。
4.  タグフィルターの実装（選択したタグにマッチするカプセルのみを表示/強調）。

### Phase 4: 投稿と開封体験
1.  `PostModal` フォームの作成。
2.  Odesli (Songlink) API を用いたメタデータ・リンク取得機能の実装。
    -   **重要**: 入力されたURLがどのサービスのものであっても、他サービスのリンクを可能な限り取得するロジックを確認する。
3.  `CapsuleDetail` モーダルの実装（開封アニメーション）。
4.  「いいね」機能の実装。

## 5. UI/UX の考慮事項
-   **ガチャ感**: 落ちる時の音（カラン！）、開ける時の音（ポン！）などのSE（Sound Effects）を追加推奨。
-   **パフォーマンス**:
    -   1つの月に曲が大量（100曲以上など）にある場合、物理演算が重くなる可能性があります。
    -   対策: 一定時間経過後、静止したカプセルを物理演算から除外し（Sleep）、静的な描画に切り替える。
    -   対策: 表示数を最新50件に制限し、「もっと見る」で追加ロードする。
