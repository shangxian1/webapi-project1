const express = require('express');
const router = express.Router();
const db = require("./services/dbservice.js");
const { getTrack } = require("./services/spotifyservice.js");
const crypto = require('crypto');

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

router.get('/api/user/logout', authenticationCheck);

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
    let data = req.body;
    db.addPlaylist(data.name, data.description, data.username)
        .then(function (response) {
            res.status(200).json({ "message": response });
        })
        .catch(function (error) {
            res.status(500).json({ "message": error.message });
        });
})

//route for retrieving all playlists
router.get('/api/playlists', function (req, res) {
    db.getAllPlaylists()
        .then(function (response) {
            res.status(200).json(response);
        })
        .catch(function (error) {
            res.status(500).json({ "message": error.message });
        });
})

//route for updating playlist by name
router.put('/api/playlists/name/:value', function (req, res) {
    let value = req.params.value;
    let data = req.body;
    db.updatePlaylist({ name: value }, { name: data.name, description: data.description })
        .then(function (response) {
            res.status(200).json({ "message": response });
        })
        .catch(function (error) {
            res.status(500).json({ "message": error.message });
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
router.post('/api/playlists/:playlistName/collaborators', function(req, res) {
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

module.exports = router;

