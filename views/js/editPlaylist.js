$(async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const oldName = urlParams.get('name');
    const token = sessionStorage.token;

    if (!oldName || !token) {
        location.href = "/";
        return;
    }

    try {
        let response = await fetch("/api/playlists?token=" + token);
        if (response.ok) {
            let playlists = await response.json();
            const p = playlists.find(item => item.name === oldName);
            if (p) {
                $("#editName").val(p.name);
                $("#editDescription").val(p.description);
            }
        }
    } catch (err) {
        console.error("Load error:", err);
    }

    // 2. Handle Form Submission
    $("#editPlaylistForm").on("submit", async function (e) {
        e.preventDefault();
        
        const updatedData = {
            name: $("#editName").val(),
            description: $("#editDescription").val()
        };

        try {
            const response = await fetch(`/api/playlists/name/${encodeURIComponent(oldName)}?token=${token}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData)
            });

            if (response.ok) {
                location.href = "/index.html?updated=true";
            } else {
                const result = await response.json();
                $("#statusMessage").css("color", "red").text(result.message);
            }
        } catch (err) {
            $("#statusMessage").css("color", "red").text("Failed to connect to server.");
        }
    });
});