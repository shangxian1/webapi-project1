$(async function () {
    const token = sessionStorage.getItem("token");
    const username = sessionStorage.getItem("username");

    if (!username || username === "undefined") {
        console.error("Critical Error: Username is missing from sessionStorage.");
        alert("Your session has expired. Please log in again to view your liked songs.");
        location.href = "/login.html";
        return;
    }

    console.log("Loading likes for:", username);
    loadLikedSongs(username, token);
});

async function loadLikedSongs(username, token) {
    try {
        const response = await fetch(`/api/users/${username}/likes?token=${token}`);

        if (response.ok) {
            const likedSongs = await response.json();
            console.log("Liked Songs Data:", likedSongs); 
            renderLikedSongs(likedSongs);
        } else {
            const errorData = await response.json();
            console.error("Backend Error:", errorData.message);
            $("#likedSongsList").html(`<p>Error: ${errorData.message}</p>`);
        }
    } catch (err) {
        console.error("Fetch failed:", err);
        $("#likedSongsList").html("<p>Network error. Is the server running?</p>");
    }
}


async function removeLikedSong(spotifyId) {
    const username = sessionStorage.getItem("username");
    const token = sessionStorage.getItem("token");

    const url = `/api/users/${username}/likes/${spotifyId}?token=${token}`;
    console.log("Attempting DELETE to:", url);

    if (!confirm("Remove this song from your likes?")) return;

    try {
        const response = await fetch(url, {
            method: "DELETE"
        });

        if (response.ok) {
            loadLikedSongs(username, token);
        } else {
            const errText = await response.text();
            console.error("Server error text:", errText);
            alert("Failed to remove song. Check console.");
        }
    } catch (err) {
        console.error("Fetch error:", err);
    }
}


function renderLikedSongs(songs) {
    const container = $("#likedSongsList");
    container.empty();

    if (songs && songs.length > 0) {
        songs.forEach(song => {            const sId = song.spotifyTrackId || song.songId || song._id;

            container.append(`
                <article class="playlist-card">
                    <div class="song-content">
                        <img src="${song.albumImage || ''}" class="album-thumb">
                        <div class="song-details">
                            <span class="song-name">${song.name || "Unknown"}</span>
                            <span class="song-artist">${song.artist}</span>
                        </div>
                    </div>
                    <div class="track-actions">
                        <button class="btn-remove" onclick="removeLikedSong('${sId}')">Remove</button>
                    </div>
                </article>
            `);
        });
    }
}



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
window.likeSong = async function (song) {
    const username = sessionStorage.getItem("username");
    const token = sessionStorage.getItem("token");

    const songToLike = {
        spotifyTrackId: song.spotifyTrackId,
        name: song.name,           
        artist: song.artist,
        albumName: song.albumName,
        albumImage: song.albumImage,
        spotifyUri: song.spotifyUri,
        previewUrl: song.previewUrl
    };

    try {
        const response = await fetch(`/api/users/${username}/like?token=${token}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(songToLike)
        });

        if (response.ok) {
            alert("Added to Liked Songs!");
        }
    } catch (err) {
        console.error("Error liking song:", err);
    }
};