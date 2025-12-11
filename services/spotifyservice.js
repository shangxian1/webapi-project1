const SpotifyWebApi = require('spotify-web-api-node');

require("dotenv").config();
// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});


// Token management
let tokenRefreshTimeout = null;

const refreshAccessToken = async () => {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    
    console.log(`Access token refreshed. Expires in ${data.body['expires_in']} seconds`);
    
    if (tokenRefreshTimeout) clearTimeout(tokenRefreshTimeout);

    tokenRefreshTimeout = setTimeout(
      refreshAccessToken,
      (data.body['expires_in'] - 60) * 1000
    );

  } catch (error) {
    console.error('Error refreshing access token:', error.message);
    setTimeout(refreshAccessToken, 30000);
  }
};

// Initialize first token
refreshAccessToken().catch(console.error);

// ───────────────────────────────────────────────
// SERVICE METHODS
// ───────────────────────────────────────────────
const spotifyService = {

  // Search songs and return in your exact schema
  async searchTracks(query, limit = 10) {
    try {
      const res = await spotifyApi.searchTracks(query, {
        limit: limit,
        market: "US"
      });

      const items = res.body?.tracks?.items || [];

      return items.map(track => ({
        spotifyTrackId: track.id,
        name: track.name,
        artist: track.artists?.[0]?.name || "Unknown Artist",
        previewUrl: track.preview_url || null,
        durationMs: track.duration_ms || null,
        albumImage: track.album?.images?.[0]?.url || null,
        spotifyUri: track.uri
      }));

    } catch (err) {
      console.error("Error searching Spotify:", err);
      throw err;
    }
  }

};

module.exports = spotifyService;