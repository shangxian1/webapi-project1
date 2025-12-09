const axios = require("axios");
const Lyrics = require("../models/lyrics.js");
const { getTrack } = require("./spotifyservice.js");

async function getLyrics(trackId) {
    // Check cache
    const cached = await Lyrics.findById(trackId);
    if (cached) return cached;

    // Get song info from Spotify
    const track = await getTrack(trackId);
    const artist = track.artists[0].name;
    const title = track.name;

    // Fetch lyrics
    const url = `https://api.lyrics.ovh/v1/${artist}/${title}`;
    const res = await axios.get(encodeURI(url));

    const lyricsObj = {
        _id: trackId,
        title,
        artist,
        lyrics: res.data.lyrics,
        lastFetched: new Date()
    };

    await Lyrics.create(lyricsObj);
    return lyricsObj;
}

module.exports = { getLyrics };