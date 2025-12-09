const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    username: {
        type: String,
        unique: true
    },
    email: {
        type: String,
        unique: true
    },
    password: String,   

    likedSongs: [{
        songId: String,
        title: String,
        artist: String
    }],

    createdAt: { type: Date, default: Date.now },
    token: String
})
module.exports = mongoose.model('users', userSchema);