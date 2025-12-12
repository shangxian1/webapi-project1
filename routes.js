const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const db = require("./services/dbservice.js");
const { getTrack } = require("./services/spotifyservice.js");
const crypto = require('crypto');
const spotifyService = require("./services/spotifyservice.js");
const lyricsService = require("./services/lyricsservice.js");

db.connect()
    .then(function (response) {
        console.log(response);
    })
    .catch(function (error) {
        console.log(error.message);
    });

router.use(express.urlencoded({
    extended: true
}));

router.post('/api/playlists', authenticationCheck); // add playlist
router.post('/api/playlists/name/:playlistName/songs', authenticationCheck); // add song to playlist
router.delete('/api/playlists/:playlistName/songs/:spotifyId', authenticationCheck); // remove song from playlist
router.post('/api/users/:username/like', authenticationCheck); // like a song
router.get('/api/users/:username/likes', authenticationCheck); // view liked songs
router.post('/api/playlists/:playlistName/collaborators', authenticationCheck); // add collaborator
router.get('/api/user/logout', authenticationCheck); // logout

router.get('/api/playlists', authenticationCheck); // retrieve playlists of logged-in user

//route for registering user
router.post('/api/users', function (req, res) {
    let data = req.body;
    db.addUser(data.username, data.email, data.password)
        .then(function (response) {
            res.status(200).json({ "message": response });
        })
        .catch(function (error) {
            res.status(500).json({ "message": error.message });
        });
})

//route for add playlist
router.post('/api/playlists', function (req, res) {
    let userId = res.locals.userId; // obtained from authenticationCheck
    let { name, description } = req.body;

    db.addPlaylist(userId, name, description)
        .then(function (response) {
            res.status(200).json({ message: response });
        })
        .catch(function (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        });
})

//route for retrieving all playlists
router.get('/api/playlists', function (req, res) {
    let userId = res.locals.userId; // set by authenticationCheck

    db.getPlaylists(userId)
        .then(function (response) {
            res.status(200).json(response);
        })
        .catch(function (error) {
            console.error(error);
            res.status(500).json({ "message": "Error retrieving user's playlists" });
        });
})

//route for updating playlist by name
router.put('/api/playlists/name/:value', function (req, res) {
    const playlistName = req.params.value;
    const { name, description } = req.body;
    const userId = mongoose.Types.ObjectId(res.locals.userId); // convert to ObjectId

    db.updatePlaylist(
        { name: playlistName, creator: userId },
        { name, description }
    )
    .then(function(response) {
        if (response === "Unable to find playlist to update.") {
            res.status(403).json({ message: "You are not authorized to update this playlist or it does not exist." });
        } else {
            res.status(200).json({ message: response });
        }
    })
    .catch(function(error) {
        res.status(500).json({ message: error.message });
    });
})

//route for deleting playlist by name
router.delete('/api/playlists/name/:value', function (req, res) {
    let value = req.params.value;
    db.deleteEvent({ name: value })
        .then(function (response) {
            res.status(200).json({ "message": response });
        })
        .catch(function (error) {
            res.status(500).json({ "message": error.message });
        });
})

//route for searching playlists
router.post('/api/playlists/search', function (req, res) {
    let data = req.body;
    db.searchPlaylists(data.name)
        .then(function (response) {
            res.status(200).json(response);
        })
        .catch(function (error) {
            res.status(500).json({ "message": error.message });
        });
})

//login
router.post('/api/user/login', function (req, res) {
    let data = req.body;
    db.getUser(data.username, data.password)
        .then(function (response) {
            if (!response) {
                res.status(401).json({ "message": "Login unsuccessful. Please try again later." });
            }
            else {
                let strToHash = response.username + Date.now();
                let token = crypto.createHash('md5').update(strToHash).digest('hex');
                db.updateToken(response._id, token)
                    .then(function (response) {
                        res.status(200).json({ 'message': 'Login successful', 'token': token });
                    })
                    .catch(function (error) {
                        res.status(500).json({ "message": error.message });
                    })
            }
        })
        .catch(function (error) {
            res.status(500).json({ "message": error.message });
        })
})

router.get('/api/user/logout', function (req, res) {
    let id = res.locals.userId;
    db.removeToken(id)
        .then(function (response) {
            res.status(200).json({ "message": "Logout successful." });
        })
        .catch(function (error) {
            res.status(500).json({ "message": error.message });
        })
})

router.post("/api/playlists/name/:playlistName/songs", async (req, res) => {
    const playlistName = req.params.playlistName;
    const { spotifyId } = req.body;

    if (!spotifyId) {
        return res.status(400).json({ message: "spotifyId is required." });
    }

    try {
        const songObj = await getTrack(spotifyId); // already mapped to schema

        const updated = await db.addSongToPlaylistByName(playlistName, songObj);

        res.status(200).json({
            message: `Song added to playlist '${playlistName}'`,
            playlist: updated
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.delete("/api/playlists/:playlistName/songs/:spotifyId", async (req, res) => {
    const { playlistName, spotifyId } = req.params;

    try {
        const updatedPlaylist = await db.removeSong(playlistName, spotifyId);

        res.status(200).json({
            message: `Song removed from playlist '${playlistName}'`,
            playlist: updatedPlaylist
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

//route for liking songs
router.post('/api/users/:username/like', function (req, res) {
    db.likeSong(req.params.username, req.body)
        .then(function (response) {
            res.status(200).json(response);
        })
        .catch(function (error) {
            res.status(500).json({ "message": error.message });
        });
});

//route for retrieving liked songs
router.get('/api/users/:username/likes', function (req, res) {
    db.getLikedSongs(req.params.username)
        .then(function (response) {
            res.status(200).json(response);
        })
        .catch(function (error) {
            res.status(500).json({ "message": error.message });
        });
});

//route for adding collaborator to playlist
router.post('/api/playlists/:playlistName/collaborators', function (req, res) {
    const playlistName = req.params.playlistName;
    const username = req.body.username;
    db.addCollaborators(playlistName, username)
        .then(function (response) {
            res.status(200).json(response);
        })
        .catch(function (error) {
            res.status(500).json({ "message": error.message });
        });
});

router.get("/spotify/search", async (req, res) => {
    try {
        const query = req.query.q;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;

        if (!query) {
            return res.status(400).json({
                error: "Missing required query parameter: q"
            });
        }

        const results = await spotifyService.searchTracks(query, limit);

        return res.json({
            success: true,
            count: results.length,
            tracks: results
        });

    } catch (err) {
        console.error("Error in /spotify/search:", err);
        return res.status(500).json({
            error: "Failed to search tracks",
            details: err.message
        });
    }
});

// GET /api/spotify/track/:id
router.get("/api/spotify/track/:id", async (req, res) => {
    try {
        const track = await getTrack(req.params.id);
        res.status(200).json(track);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

function authenticationCheck(req, res, next) {
    let token = req.query.token;
    if (!token) {
        res.status(401).json({ "message": "No tokens are provided." });
    } else {
        db.checkToken(token)
            .then(function (response) {
                if (response) {
                    res.locals.userId = response._id;
                    next();
                } else {
                    res.status(401).json({ "message": "Invalid token provided." });
                }
            })
            .catch(function (error) {
                res.status(500).json({ "message": error.message });
            });
    }
}

router.get("/api/lyrics/:spotifyId", async (req, res) => {
    try {
        const trackId = req.params.spotifyId;

        const track = await getTrack(trackId);

        if (!track) {
            return res.status(404).json({ message: "Track not found." });
        }

        // Extract artist + title for lyrics.ovh
        const { name, artist } = track;

        const lyrics = await lyricsService.getLyrics(trackId, artist, name);

        return res.status(200).json({
            trackId,
            title: name,
            artist,
            lyrics
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to get lyrics." });
    }
});

module.exports = router;

