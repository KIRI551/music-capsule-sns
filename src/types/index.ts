export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  artist: string;
  album_art_url: string;
  description: string;
  spotify_link: string | null;
  apple_music_link: string | null;
  youtube_link: string | null;
  created_at: string;
  profiles?: Profile;
  likes_count?: number;
  is_liked?: boolean;
}

export interface Like {
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface PostTag {
  post_id: string;
  tag_id: string;
}

export interface OdesliResponse {
  title: string;
  artist: string;
  albumArtUrl: string;
  spotifyLink: string | null;
  appleMusicLink: string | null;
  youtubeLink: string | null;
}
