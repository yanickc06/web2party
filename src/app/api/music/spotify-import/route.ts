import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const SPOTIFY_CLIENT_ID =
  process.env.SPOTIFY_CLIENT_ID || "6fd6133f681f4c17b1f0c548ab145a58";
const SPOTIFY_CLIENT_SECRET =
  process.env.SPOTIFY_CLIENT_SECRET || "4ad648fd11d0492aa96cf0e42ee8e919";

async function getSpotifyToken(): Promise<string> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString(
          "base64",
        ),
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error("Spotify-Token konnte nicht abgerufen werden");
  const data = await res.json();
  return data.access_token;
}

interface SpotifyTrack {
  title: string;
  artist: string;
  album: string | null;
  duration: number;
}

// POST - Spotify Playlist Tracks abrufen
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const { playlistUrl } = await request.json();

    if (
      !playlistUrl?.includes("spotify.com") &&
      !playlistUrl?.includes("spotify:")
    ) {
      return NextResponse.json(
        { error: "Ungültige Spotify-URL" },
        { status: 400 },
      );
    }

    // Playlist-ID extrahieren
    const playlistId = playlistUrl.split("/").pop()?.split("?")[0];
    if (!playlistId) {
      return NextResponse.json(
        { error: "Playlist-ID konnte nicht extrahiert werden" },
        { status: 400 },
      );
    }

    const token = await getSpotifyToken();

    // Playlist-Info abrufen
    const playlistRes = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}?fields=name,description`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!playlistRes.ok) {
      return NextResponse.json(
        { error: "Playlist nicht gefunden oder nicht öffentlich" },
        { status: 404 },
      );
    }

    const playlistInfo = await playlistRes.json();

    // Alle Tracks mit Pagination abrufen
    const tracks: SpotifyTrack[] = [];
    let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

    while (nextUrl) {
      const tracksRes: Response = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!tracksRes.ok) break;

      const data: { items: Array<{ track: { name: string; artists: Array<{ name: string }>; album: { name: string }; duration_ms: number } | null }>; next: string | null } = await tracksRes.json();

      for (const item of data.items) {
        const track = item?.track;
        if (!track) continue;

        tracks.push({
          title: track.name,
          artist: track.artists?.[0]?.name || "Unknown",
          album: track.album?.name || null,
          duration: Math.round((track.duration_ms || 0) / 1000),
        });
      }

      nextUrl = data.next;
    }

    return NextResponse.json({
      playlist_name: playlistInfo.name,
      total: tracks.length,
      tracks,
    });
  } catch (error) {
    console.error("[Spotify Import] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Fehler beim Laden der Playlist",
      },
      { status: 500 },
    );
  }
}
