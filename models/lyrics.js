const mongoose = require('mongoose');

const lyricsSchema = new mongoose.Schema({
  spotifyTrackId: String,    
  lyrics: String,            
  cachedAt: Date             
});

module.exports = mongoose.model('lyrics', lyricsSchema);