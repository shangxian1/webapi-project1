$(function () {
    $("#addPlaylistForm").on("submit", addPlaylist);
});

async function addPlaylist(e) {
    e.preventDefault();

    let token = sessionStorage.token;
    if (!token) {
        $("#statusMessage").css("color", "red").text("You must be logged in.");
        return;
    }

    let formData = new FormData(e.target);
    let playlistData = Object.fromEntries(formData.entries());

    try {
        let response = await fetch(`/api/playlists?token=${token}`, {
            method: "POST",
            body: JSON.stringify(playlistData),
            headers: { "Content-Type": "application/json" }
        });

        let result = await response.json();

        
        if (response.ok) {
            location.href = "/index.html?created=true";
        } else {
            $("#statusMessage").css("color", "red").text(result.message);
        }
    } catch (error) {
        console.error("Error:", error);
        $("#statusMessage").css("color", "red").text("Server error occurred.");
    }
}