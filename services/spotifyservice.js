import axios from "axios";
import qs from "qs";
import dotenv from "dotenv";

dotenv.config();

let spotifyToken = null;
let tokenExpiresAt = 0;

async function getSpotifyToken() {
    const now = Date.now();

    if (spotifyToken && now < tokenExpiresAt) return spotifyToken;

    const tokenUrl = "https://accounts.spotify.com/api/token";
    const data = qs.stringify({ grant_type: "client_credentials" });

    const response = await axios.post(tokenUrl, data, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + Buffer.from(
                process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
            ).toString("base64")
        }
    });

    spotifyToken = response.data.access_token;
    tokenExpiresAt = now + response.data.expires_in * 1000;

    return spotifyToken;
}

export async function getTrack(trackId) {
    const token = await getSpotifyToken();
    const res = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const track = res.data;

    // Map exactly to your playlist schema
    return {
        spotifyTrackId: track.id,
        name: track.name,
        artist: track.artists.length > 0 ? track.artists[0].name : "Unknown Artist",
        previewUrl: track.preview_url || null,
        durationMs: track.duration_ms || null,
        albumImage: track.album?.images?.[0]?.url || null,
        spotifyUri: track.uri
    };
}