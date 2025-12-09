const mongoose = require('mongoose');
const user = require('./user.js');

const playlistSchema = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    name: { type: String, required: true },
    description: String,
    songs: [{
        spotifyTrackId: { type: String, required: true },
        name: { type: String, required: true },
        artist: { type: String, required: true },
        durationMs: Number,
        albumImage: String,
        spotifyUri: { type: String, required: true }
    }],

    collaborators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }],

    createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('playlists', playlistSchema);