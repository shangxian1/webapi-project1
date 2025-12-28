$(async function () {
    
    const loggedInUser = sessionStorage.getItem("username");
    if (loggedInUser) {
        $("#welcomeHeading").text(`Welcome, ${loggedInUser}`);
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('created') === 'true') {
        const statusMsg = $("#statusMessage");
        statusMsg.css("color", "#1DB954").text("Playlist created successfully!");

        
        window.history.replaceState({}, document.title, window.location.pathname);

        
        setTimeout(() => {
            statusMsg.fadeOut(1000);
        }, 3000);
    }

    if (!sessionStorage.token) {
        $(".playlists").append("<p>Please login to see your playlists.</p>");
        return;
    }

    loadPlaylists();
    $("#searchForm").on("submit", searchPlaylists);
});

async function loadPlaylists() {
    let response = await fetch("/api/playlists?token=" + sessionStorage.token);
    if (response.ok) {
        let data = await response.json();
        renderPlaylists(data);
    }
}

async function searchPlaylists(e) {
    e.preventDefault();
    let formData = new FormData(e.target);
    let searchData = Object.fromEntries(formData.entries());

    if (!searchData.name || searchData.name.trim() === "") {
        loadPlaylists();
        return;
    }

    let response = await fetch("/api/playlists/search?token=" + sessionStorage.token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchData)
    });

    if (response.ok) {
        let data = await response.json();
        renderPlaylists(data);
    }
}

async function deletePlaylist(name) {
    const decodedName = decodeURIComponent(name);

    if (!confirm(`Are you sure you want to delete the playlist "${decodedName}"? This cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`/api/playlists/name/${encodeURIComponent(decodedName)}?token=${sessionStorage.token}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            loadPlaylists();
        } else {
            alert("Error: " + result.message);
        }
    } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete playlist.");
    }
}

function renderPlaylists(playlists) {
    $(".playlists").empty(); 

    if (playlists.length > 0) {
        playlists.forEach(p => {
            let collaboratorText = "None";
            if (p.collaborators && p.collaborators.length > 0) {
                collaboratorText = p.collaborators.map(c => c.username).join(", ");
            }

            let playlistHTML = `
                <article class="playlist-card">
                    <div class="playlist-header">
                        <h2>${p.name}</h2>
                        <p class="description">${p.description}</p>
                        <div class="meta-info">
                            <small><b>Created by:</b> ${p.creator?.username || 'Unknown'}</small><br>
                            <small><b>Collaborators:</b> ${collaboratorText}</small>
                        </div>
                    </div>
                    <div class="song-list">
                        <h3>Tracks</h3>
                        <ul>`;

            if (p.songs && p.songs.length > 0) {
                p.songs.forEach(song => {
                    playlistHTML += `
                    <li class="song-item">
                        <div class="song-content">
                            <img src="${song.albumImage || './images/default.png'}" alt="Album Art" class="album-thumb">
                            <div class="song-details">
                                <span class="song-name">${song.name}</span>
                                <span class="song-artist">${song.artist}</span>
                            </div>
                        </div>
                    </li>`;
                });
            } else {
                playlistHTML += `<li class="empty-msg">No songs in this playlist yet.</li>`;
            }

            playlistHTML += `
                </ul>
                </div>
                <div class="playlist-footer">
                    <a href="/playlistDetails.html?name=${encodeURIComponent(p.name)}" class="manage-btn">Manage</a>
                    <a href="/editPlaylist.html?name=${encodeURIComponent(p.name)}" class="edit-btn" style="text-decoration:none">Edit</a>
                    <button class="delete-btn" onclick="deletePlaylist('${encodeURIComponent(p.name)}')">Delete</button>
                </div>
            </article>`;

            $(".playlists").append(playlistHTML); 
        });
    } else {
        $(".playlists").append("<p class='no-results'>No playlists found.</p>"); 
    }
}