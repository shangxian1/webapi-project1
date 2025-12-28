const mongoose = require('mongoose');
const playlist = require("../models/playlist.js");
const user = require("../models/user.js");
const lyrics = require("../models/lyrics.js");

let db = {
    async connect() {
        try {
            await mongoose.connect('mongodb://127.0.0.1:27017/shangxianProjectDB');
            return "Connected to Mongo DB";
        }
        catch (e) {
            console.log(e.message);
            throw new Error("Error connecting to Mongo DB");
        }
    },

    // register user
    async addUser(username, email, password, likedSongs = []) {
        try {
            await user.create({
                username: username,
                email: email,
                password: password,
                likedSongs: likedSongs
            })
            return `${username} has been registered.`;
        }
        catch (e) {
            console.log(e.message);
            throw new Error(`Unable to register ${username} to the system.`);
        }
    },

    //Add Playlist
    async addPlaylist(userId, name, description) {
        try {
            await playlist.create({
                name: name,
                description: description,
                creator: userId
            });
            return `Playlist '${name}' has been added.`;
        } catch (e) {
            console.error(e.message);
            throw new Error(`Playlist '${name}' could not be added.`);
        }
    },

    //Retrieve playlists
    async getPlaylists(userId) {
        try {
            const playlists = await playlist.find({ creator: userId })
                .populate('creator', 'username')
                .populate('collaborators', 'username');
            return playlists;
        } catch (e) {
            console.error(e.message);
            throw new Error("Error retrieving user's playlists");
        }
    },

    //Update playlists
    async updatePlaylist(conditions, updates) {
        try {
            let result = await playlist.findOneAndUpdate(conditions, updates)
            if (!result) return "Unable to find playlist to update.";
            else return "Playlist is updated!";
        }
        catch (e) {
            console.log(e.message);
            throw new Error("Error updating event");
        }
    },

    //Delete playlists
    async deleteEvent(conditions) {
        try {
            let result = await playlist.findOneAndDelete(conditions);
            if (!result) return "Unable to find a playlist to delete.";
            else return "Playlist is deleted!";
        }
        catch (e) {
            console.log(e.message);
            throw new Error("Error deleting event");
        }
    },

    //search playlists
    async searchPlaylists(userId, name) {
        try {
            let results = await playlist.find({
                name: new RegExp(name, 'i'),
                creator: userId
            })
                .populate('creator', 'username')
                .populate('collaborators', 'username'); 

            return results;
        }
        catch (e) {
            console.log(e.message);
            throw new Error(`Unable to perform search.`);
        }
    },

    async getUser(username, password) {
        try {
            let result = await user.findOne({ username: username, password: password });
            return result;
        }
        catch (e) {
            console.log(e.message);
            throw new Error("Error retrieving user info.");
        }
    },
    async updateToken(id, token) {
        try {
            await user.findByIdAndUpdate(id, { token: token });
            return;
        }
        catch (e) {
            console.log(e.message);
            throw new Error("Error at the server. Please try again later.");
        }
    },
    async checkToken(token) {
        try {
            let result = await user.findOne({ token: token });
            return result;
        }
        catch (e) {
            console.log(e.message);
            throw new Error("Error at the server. Please try again later.");
        }
    },
    async removeToken(id) {
        try {
            await user.findByIdAndUpdate(id, { $unset: { token: 1 } });
            return;
        }
        catch (e) {
            console.log(e.message);
            throw new Error("Error at the server. Please try again later.");
        }
    },

    // Get playlist by name
    async getPlaylistByName(name) {
        try {
            const result = await playlist.findOne({ name: name })
                .populate('creator', 'username')
                .populate('collaborators', 'username')
                .lean(); 
            return result;
        } catch (e) {
            console.log(e.message);
            throw new Error(`Unable to retrieve playlist ${name}.`);
        }
    },

    // Add song to a playlist by name
    async addSongToPlaylistByName(playlistName, songObj) {
        try {
            const updatedPlaylist = await playlist.findOneAndUpdate(
                { name: playlistName },
                { $push: { songs: songObj } },
                { new: true }
            )
                .populate('creator', 'username')
                .populate('collaborators', 'username');
            if (!updatedPlaylist) throw new Error("Playlist not found.");
            return updatedPlaylist;
        } catch (e) {
            console.log(e.message);
            throw new Error(`Unable to add song to playlist ${playlistName}.`);
        }
    },

    //remove song
    async removeSong(playlistName, spotifyId) {
        try {
            const updatedPlaylist = await playlist.findOneAndUpdate(
                { name: playlistName },
                { $pull: { songs: { spotifyTrackId: spotifyId } } }, 
                { new: true }
            )
                .populate('creator', 'username')
                .populate('collaborators', 'username');

            if (!updatedPlaylist) throw new Error("Playlist not found.");
            return updatedPlaylist;
        } catch (e) {
            console.log(e.message);
            throw new Error(`Unable to remove song from playlist ${playlistName}.`);
        }
    },


    //additional feature 1: Like songs
    async likeSong(username, trackData) {
        try {
            await user.findOneAndUpdate(
                { username: username },
                { $push: { likedSongs: trackData } }
            );
            return "Song liked.";
        } catch (e) {
            console.log(e.message);
            throw new Error("Unable to like song.");
        }
    },

    //show liked songs
    async getLikedSongs(username) {
        try {
            let results = await user.findOne({ username: username });

            if (!results) {
                console.log(`User ${username} not found in database.`);
                return [];
            }

            return results.likedSongs || [];

        } catch (e) {
            console.error("DB Error in getLikedSongs:", e.message);
            throw new Error("Unable to retrieve liked songs.");
        }
    },

    //additional feature 2: Playlist collaboration
    async addCollaborators(playlistName, username) {
        try {
            const collaborator = await user.findOne({ username: username });
            if (!collaborator) throw new Error("Collaborator user not found.");

            const result = await playlist.findOneAndUpdate(
                { name: playlistName },
                { $addToSet: { collaborators: collaborator._id } },
                { new: true }
            );

            if (!result) throw new Error("Playlist not found.");

            return "Collaborator added.";
        } catch (e) {
            console.log(e.message);
            throw new Error("Unable to find collaborator.");
        }
    },


async unlikeSong(username, idToDelete) {
    try {
        const result = await user.findOneAndUpdate(
            { username: username },
            { 
                $pull: { 
                    likedSongs: { 
                        $or: [
                            { spotifyTrackId: idToDelete },
                            { songId: idToDelete },
                            { _id: idToDelete } 
                        ]
                    } 
                } 
            },
            { new: true }
        );

        if (!result) throw new Error("User not found");
        return "Song unliked successfully";
    } catch (e) {
        console.error("Database Error:", e.message);
        throw e;
    }
}

}

module.exports = db;