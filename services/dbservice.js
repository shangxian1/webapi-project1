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
    async addPlaylist(name, description, username) {
        try {

            const creator = await user.findOne({ username: username });
            if (!creator) throw new Error("Creator user not found.");

            await playlist.create({
                name: name,
                description: description,
                creator: creator._id
            });
            return `Playlist ${name} has been added`;
        }
        catch (e) {
            console.log(e.message);
            throw new Error(`Playlist ${name} was not added.`);
        }
    },

    //Retrieve playlists
    async getAllPlaylists() {
        try {
            let results = await playlist.find()
                .populate('creator', 'username')
                .populate('collaborators', 'username'); 
            return results;
        } catch (e) {
            console.log(e.message);
            throw new Error("Error retrieving playlists");
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
    async searchPlaylists(name) {
        try {
            let results = await playlist.find({ name: new RegExp(name, 'i') });
            return results;
        }
        catch (e) {
            console.log(e.message);
            throw new Error(`Unable to retrieve playlists for ${username}`);
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
            return results.likedSongs;
        } catch (e) {
            console.log(e.message);
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
            throw new Error("Unable to add collaborator.");
        }
    }


}

module.exports = db;