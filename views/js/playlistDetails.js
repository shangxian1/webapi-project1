$(async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const playlistName = urlParams.get('name');

    if (!playlistName || !sessionStorage.token) {
        location.href = "/";
        return;
    }

    loadPlaylistDetails(playlistName);

    $("#addCollaboratorForm").on("submit", function (e) {
        e.preventDefault();
        addCollaborator(playlistName);
    });

    $("#spotifySearchForm").on("submit", function (e) {
        e.preventDefault();
        searchSpotify(playlistName);
    });
});

window.playOnPage = function (uri) {
    if (!uri || uri === "undefined" || uri === "") {
        alert("Spotify URI missing for this track.");
        return;
    }

    const trackId = uri.split(':').pop();
    const embedUrl = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`;

    $("#spotifyEmbed").html(`
        <iframe 
            src="${embedUrl}" 
            width="100%" 
            height="152" 
            frameBorder="0" 
            allowfullscreen="" 
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
            loading="lazy">
        </iframe>
    `);
};
async function loadPlaylistDetails(targetName) {
    try {
        let response = await fetch("/api/playlists?token=" + sessionStorage.token);

        if (response.ok) {
            let playlists = await response.json();
            const p = playlists.find(item => item.name === targetName);

            if (p) {
                $("#displayPlaylistName").text(p.name);
                $("#displayDescription").text(p.description);
                $("#displayCreator").html("<b>Created by: " + (p.creator?.username || "Unknown</b>"));

                renderTracks(p.songs, targetName);
                renderCollaborators(p.collaborators);
            } else {
                $("#songList").html("<p>Playlist details not found.</p>");
            }
        }
    } catch (err) {
        console.error("Error loading playlist:", err);
    }
}

function renderTracks(songs, playlistName) {
    const container = $("#songList");
    container.empty();

    if (songs && songs.length > 0) {
        songs.forEach(song => {
            const encodedTrack = encodeURIComponent(JSON.stringify(song));
            const songName = song.name;
            const songArtist = song.artist;

            container.append(`
            <article class="playlist-card">
                <div class="song-content">
                    <div class="img-container" onclick="playOnPage('${song.spotifyUri}')">
                        <img src="${song.albumImage || './images/default.png'}" alt="Art" class="album-thumb">
                        <div class="play-overlay">▶</div> 
                    </div>
                    <div class="song-details">
                        <span class="song-name">${song.name}</span>
                        <span class="song-artist">${song.artist}</span>
                        <span class="song-artist">Album: ${song.albumName}</span>
                        <button class="small-link" style="text-align: left; margin-top: 5px;" 
                                onclick="getLyrics('${song.spotifyTrackId}', '${songName}', '${songArtist}')">
                            View Lyrics
                        </button>
                    </div>
                </div>
                <div class="track-actions">
                    <button class="btn-like" onclick="likeSong('${encodedTrack}')">❤</button>
                    <button class="btn-remove" onclick="removeSong('${playlistName}', '${song.spotifyTrackId}')">Remove</button>
                </div>
            </article>
            `);
        });
    } else {
        container.append("<p>No songs in this playlist yet.</p>");
    }
}

async function likeSong(encodedSong) {
    const username = sessionStorage.getItem("username");
    const token = sessionStorage.getItem("token");

    if (!username || !token) {
        alert("Please login to like songs.");
        return;
    }

    try {
        const rawSong = JSON.parse(decodeURIComponent(encodedSong));
        
        const songObj = {
            spotifyTrackId: rawSong.spotifyTrackId || rawSong.id,
            name: rawSong.name || rawSong.title,
            artist: rawSong.artist,
            albumName: rawSong.albumName || "Unknown Album",
            albumImage: rawSong.albumImage,
            spotifyUri: rawSong.spotifyUri || rawSong.uri
        };

        const response = await fetch(`/api/users/${username}/like?token=${token}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(songObj)
        });

        if (response.ok) {
            alert(`"${songObj.name}" added to Liked Songs!`);
        } else {
            const err = await response.json();
            alert("Error: " + err.message);
        }
    } catch (err) {
        console.error("Error liking song:", err);
    }
}

function renderCollaborators(collaborators) {
    const container = $("#displayCollaborators");
    container.empty();

    if (collaborators && collaborators.length > 0) {
        const names = collaborators.map(c => c.username).join(", ");
        container.text(names);
    } else {
        container.text("None");
    }
}


async function searchSpotify(playlistName) {
    const query = $("#spotifySearchInput").val();
    if (!query) return;

    try {
        let response = await fetch(`/spotify/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
            let data = await response.json();
            const container = $("#spotifyResults");
            container.empty();

            if (data.tracks && data.tracks.length > 0) {
                data.tracks.forEach(track => {
                    container.append(`
                        <article class="playlist-card">
                            <div class="song-content">
                                <img src="${track.albumImage}" alt="Art" class="album-thumb">
                                <div class="song-details">
                                    <span class="song-name">${track.name}</span>
                                    <span class="song-artist">${track.artist}</span>
                                </div>
                            </div>
                            <div class="track-actions">
                                <button class="btn-add" onclick="addSong('${playlistName}', '${track.spotifyTrackId}')">+ Add</button>
                            </div>
                        </article>
                    `);
                });
            } else {
                container.append("<p>No results found on Spotify.</p>");
            }
        }
    } catch (err) {
        console.error("Spotify search error:", err);
    }
}

async function addSong(playlistName, spotifyId) {
    const token = sessionStorage.token;
    try {
        let response = await fetch(`/api/playlists/name/${encodeURIComponent(playlistName)}/songs?token=${token}`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spotifyId: spotifyId })
        });

        const result = await response.json();

        if (response.ok) {
            $("#spotifyResults").empty();
            $("#spotifySearchInput").val("");
            loadPlaylistDetails(playlistName); 
        } else {
            alert("Error adding song: " + result.message);
        }
    } catch (err) {
        console.error("Add Song Error:", err);
        alert("Could not connect to the server.");
    }
}

async function removeSong(playlistName, spotifyId) {
    if (!confirm("Are you sure you want to remove this song?")) return;

    const token = sessionStorage.getItem("token");

    try {
        const response = await fetch(`/api/playlists/${encodeURIComponent(playlistName)}/songs/${spotifyId}?token=${token}`, {
            method: "DELETE"
        });

        if (response.ok) {
            loadPlaylistDetails(playlistName);
        } else {
            const err = await response.json();
            alert("Error: " + err.message);
        }
    } catch (error) {
        console.error("Delete Error:", error);
    }
}

async function addCollaborator(playlistName) {
    const username = $("#collabUsername").val();

    let response = await fetch(`/api/playlists/${encodeURIComponent(playlistName)}/collaborators?token=${sessionStorage.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username })
    });

    if (response.ok) {
        $("#collabStatus").css("color", "#1DB954").text("Collaborator added successfully!");
        $("#collabUsername").val("");
        loadPlaylistDetails(playlistName);
    } else {
        let err = await response.json();
        $("#collabStatus").css("color", "red").text(err.message);
    }
}

async function getLyrics(spotifyId, title, artist) {
    const lyricsPanel = $("#lyricsPanel");
    const lyricsBody = $("#lyricsBody");

    lyricsPanel.fadeIn(); 
    lyricsBody.html('<p class="loading-text">Fetching lyrics...</p>');

    try {
        const response = await fetch(`/api/lyrics/${spotifyId}`);
        const data = await response.json();

        if (response.ok && data.lyrics) {
            const formattedLyrics = data.lyrics.replace(/\n/g, "<br>");
            lyricsBody.html(`
                <div class="lyrics-meta">
                    <strong>${title}</strong><br>
                    <small>${artist}</small>
                </div>
                <div class="lyrics-text">${formattedLyrics}</div>
            `);
        } else {
            lyricsBody.html('<p class="error-text">Lyrics not available for this track.</p>');
        }
    } catch (err) {
        lyricsBody.html('<p class="error-text">Failed to load lyrics.</p>');
    }
}


$(document).on("click", "#hideLyrics", function() {
    $("#lyricsPanel").fadeOut();
});