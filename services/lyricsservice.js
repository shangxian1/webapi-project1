const axios = require("axios");
const lyricsModel = require("../models/lyrics.js");

const lyricsService = {

    async getLyrics(spotifyTrackId, artist, title) {
        try {
            // Check cached lyrics
            const cached = await lyricsModel.findOne({ spotifyTrackId });
            if (cached) return cached.lyrics;

            // Call lyrics.ovh
            const url = `https://api.lyrics.ovh/v1/${artist}/${title}`;
            const response = await axios.get(url);

            const lyrics = response.data?.lyrics || "Lyrics not found.";

            // Cache it into DB
            await lyricsModel.create({
                spotifyTrackId,
                lyrics,
                cachedAt: new Date()
            });

            return lyrics;

        } catch (err) {
            console.error("Lyrics.ovh error:", err.message);
            return "Lyrics not available.";
        }
    }

};

module.exports = lyricsService;