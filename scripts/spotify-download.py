#!/usr/bin/env python3
"""
Spotify Playlist Downloader for web2party.
Downloads tracks from a Spotify playlist as MP3 files.

Usage: python3 spotify-download.py <spotify_playlist_url> <output_dir>
Output: JSON with download results to stdout
"""

import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import yt_dlp
import sys
import os
import json
import re

# Spotify API Credentials
CLIENT_ID = os.environ.get('SPOTIFY_CLIENT_ID', '6fd6133f681f4c17b1f0c548ab145a58')
CLIENT_SECRET = os.environ.get('SPOTIFY_CLIENT_SECRET', '4ad648fd11d0492aa96cf0e42ee8e919')


def get_spotify_tracks(playlist_url):
    """Reads tracks from a Spotify playlist and returns metadata."""
    auth_manager = SpotifyClientCredentials(client_id=CLIENT_ID, client_secret=CLIENT_SECRET)
    sp = spotipy.Spotify(auth_manager=auth_manager)

    try:
        playlist_id = playlist_url.split('/')[-1].split('?')[0]
        
        # Get playlist info
        playlist_info = sp.playlist(playlist_id, fields='name,description')
        playlist_name = playlist_info.get('name', 'Unknown Playlist')

        # Get all tracks (handle pagination)
        results = sp.playlist_tracks(playlist_id)
        all_items = results['items']
        
        while results.get('next'):
            results = sp.next(results)
            all_items.extend(results['items'])
        
    except Exception as e:
        return None, [], str(e)

    tracks = []
    for item in all_items:
        track = item.get('track')
        if track is None:
            continue
        
        name = track.get('name', 'Unknown')
        artists = [a['name'] for a in track.get('artists', [])]
        artist = artists[0] if artists else 'Unknown'
        album = track.get('album', {}).get('name')
        duration_ms = track.get('duration_ms', 0)
        
        tracks.append({
            'title': name,
            'artist': artist,
            'album': album,
            'duration': round(duration_ms / 1000),
            'search_query': f"{artist} - {name}",
        })

    return playlist_name, tracks, None


def sanitize_filename(name):
    """Remove invalid characters from filename."""
    return re.sub(r'[^\w\s\-.]', '', name).strip()


def download_track(search_query, output_dir, index):
    """Downloads a track from YouTube as MP3. Returns the output filename."""
    # Use a predictable filename pattern
    safe_name = sanitize_filename(search_query)[:100]
    output_template = os.path.join(output_dir, f"{index:03d}-{safe_name}.%(ext)s")
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_template,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'quiet': True,
        'no_warnings': True,
        'default_search': 'ytsearch',
        'noplaylist': True,
        'socket_timeout': 30,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"ytsearch1:{search_query}", download=True)
            if info and 'entries' in info:
                info = info['entries'][0]
            
            # Find the downloaded file
            expected_mp3 = output_template.replace('.%(ext)s', '.mp3')
            if os.path.exists(expected_mp3):
                return expected_mp3, None
            
            # Search for the file in output dir
            for f in os.listdir(output_dir):
                if f.startswith(f"{index:03d}-") and f.endswith('.mp3'):
                    return os.path.join(output_dir, f), None
            
            return None, "Downloaded file not found"
    except Exception as e:
        return None, str(e)


def progress_update(message, data=None):
    """Print a JSON progress update to stderr (stdout reserved for final result)."""
    update = {"type": "progress", "message": message}
    if data:
        update.update(data)
    print(json.dumps(update), file=sys.stderr, flush=True)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: spotify-download.py <playlist_url> <output_dir>"}))
        sys.exit(1)

    playlist_url = sys.argv[1]
    output_dir = sys.argv[2]

    # Validate Spotify URL
    if 'spotify.com' not in playlist_url and 'spotify:' not in playlist_url:
        print(json.dumps({"error": "Invalid Spotify URL"}))
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    progress_update("Connecting to Spotify...")
    playlist_name, tracks, error = get_spotify_tracks(playlist_url)

    if error:
        print(json.dumps({"error": f"Spotify error: {error}"}))
        sys.exit(1)

    if not tracks:
        print(json.dumps({"error": "No tracks found in playlist"}))
        sys.exit(1)

    progress_update(f"Found {len(tracks)} tracks in '{playlist_name}'", {
        "total": len(tracks),
        "playlist_name": playlist_name,
        "tracks": tracks,
    })

    results = []
    for i, track in enumerate(tracks):
        progress_update(f"Downloading {i+1}/{len(tracks)}: {track['search_query']}", {
            "current": i + 1,
            "total": len(tracks),
        })

        filepath, dl_error = download_track(track['search_query'], output_dir, i)
        
        result = {
            "title": track['title'],
            "artist": track['artist'],
            "album": track['album'],
            "duration": track['duration'],
            "success": filepath is not None,
        }
        
        if filepath:
            result["filepath"] = filepath
        if dl_error:
            result["error"] = dl_error
        
        results.append(result)

    success_count = sum(1 for r in results if r['success'])
    
    # Final JSON result to stdout
    print(json.dumps({
        "playlist_name": playlist_name,
        "total": len(tracks),
        "success_count": success_count,
        "fail_count": len(tracks) - success_count,
        "results": results,
    }))
