import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

interface OdesliPlatformLink {
  url: string;
  entityUniqueId: string;
}

interface OdesliEntity {
  title?: string;
  artistName?: string;
  thumbnailUrl?: string;
}

interface OdesliApiResponse {
  entityUniqueId: string;
  linksByPlatform: Record<string, OdesliPlatformLink>;
  entitiesByUniqueId: Record<string, OdesliEntity>;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URLが必要です" },
        { status: 400 }
      );
    }

    const odesliRes = await axios.get<OdesliApiResponse>(
      "https://api.song.link/v1-alpha.1/links",
      {
        params: { url, userCountry: "JP" },
        timeout: 10000,
      }
    );

    const data = odesliRes.data;
    const entityId = data.entityUniqueId;
    const entity = data.entitiesByUniqueId[entityId];

    const title = entity?.title ?? "Unknown Title";
    const artist = entity?.artistName ?? "Unknown Artist";
    const albumArtUrl = entity?.thumbnailUrl ?? "";

    const spotifyLink = data.linksByPlatform?.spotify?.url ?? null;
    const appleMusicLink = data.linksByPlatform?.appleMusic?.url ?? null;
    const youtubeLink =
      data.linksByPlatform?.youtube?.url ??
      data.linksByPlatform?.youtubeMusic?.url ??
      null;

    return NextResponse.json({
      title,
      artist,
      albumArtUrl,
      spotifyLink,
      appleMusicLink,
      youtubeLink,
    });
  } catch (error) {
    console.error("Odesli API error:", error);
    return NextResponse.json(
      { error: "音楽情報の取得に失敗しました。URLを確認してください。" },
      { status: 500 }
    );
  }
}
