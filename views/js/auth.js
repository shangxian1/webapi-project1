$(function () {
    if (sessionStorage.getItem("token")) {
        $(".unauthenticatedSection").hide();
        $(".authenticatedSection").show();
    } else {
        $(".unauthenticatedSection").show();
        $(".authenticatedSection").hide();
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('registered')) {
        $("#statusMessage")
            .css("color", "#1DB954")
            .text("Account created! Please log in to continue.");
    }

    // Event Listeners
    $("#loginForm").on("submit", login);
    $("#registerForm").on("submit", register);
    $("#logoutLink").on("click", logout);
});

async function register(e) {
    e.preventDefault();
    
    let data = new FormData(e.target);
    let registerEntries = Object.fromEntries(data.entries());

    try {
        let response = await fetch("/api/users", {
            method: "POST",
            body: JSON.stringify(registerEntries),
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            location.href = "/login.html?registered=true";
        } else {
            let result = await response.json();
            $("#statusMessage").css("color", "red").text(result.message || "Registration failed.");
        }
    } catch (error) {
        console.error("Registration Error:", error);
        $("#statusMessage").css("color", "red").text("Server connection failed.");
    }
}

async function login(e) {
    e.preventDefault();
    
    let data = new FormData(e.target);
    let loginEntries = Object.fromEntries(data.entries());
    const typedUsername = loginEntries.username;

    try {
        let response = await fetch("/api/user/login", {
            method: "POST",
            body: JSON.stringify(loginEntries),
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            const result = await response.json();

            sessionStorage.setItem("token", result.token);
            sessionStorage.setItem("username", typedUsername);

            console.log("Session saved for user:", typedUsername);
            location.href = "/"; 
        } else {
            let err = await response.json();
            $("#statusMessage").css("color", "red").text(err.message);
        }
    } catch (error) {
        console.error("Login Error:", error);
        $("#statusMessage").text("Server connection failed.");
    }
}

async function logout(e) {
    e.preventDefault();
    const token = sessionStorage.getItem("token");
    
    let response = await fetch("/api/user/logout?token=" + token);

    if (response.ok) {
        sessionStorage.clear();
        location.href = "/login.html";
    } else {
        alert("Unable to logout properly.");
    }
}