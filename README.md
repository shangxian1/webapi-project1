# MusicCloud – A Spotify-Integrated Web Application

**Name:** Shang Xian  
**Module Group:** L2  

---

## Project Overview

**MusicCloud** is a full-stack web application that integrates the **Spotify Web API** and **lyrics.ovh API** to enable users to explore music seamlessly.  
Users can create, customize, and manage their playlists with full CRUD functionality, while also collaborating with others on shared playlists for a more connected and engaging music discovery journey.

---

## Project Objectives

- Provide a simple and interactive interface for music discovery  
- Allow users to manage and personalize their playlists  
- Integrate real-time music data from Spotify  
- Support collaboration and personalization features  

---

## Key Features

### User Management
1. User registration  
2. User login  
3. User logout  

### Playlist Management
4. Create playlists  
5. Retrieve playlists  
6. Update playlists  
7. Delete playlists  
8. Search playlists by name  

### Additional Features
9. Like songs  
10. Collaborative playlists  

---

## External APIs Used

### **1. Spotify Web API**  
Used for searching tracks, retrieving artist/album details, playlist actions, and more.  
https://developer.spotify.com/documentation/web-api

### **2. Lyrics.ovh API**  
Used to retrieve song lyrics.  
https://lyricsovh.docs.apiary.io/#

---

## Node Modules Used

| Module | Purpose |
|--------|---------|
| **axios** | To send HTTP requests to Spotify API & Lyrics API |
| **dotenv** | To securely load environment variables |

---

## References

- **Postman Documentation:**  
  https://documenter.getpostman.com/view/22496603/2sB3dPTWb2  
- **Spotify Web API:**  
  https://developer.spotify.com/documentation/web-api  
- **Lyrics.ovh API:**  
  https://lyricsovh.docs.apiary.io/#  
- **axios:**  
  https://www.npmjs.com/package/axios  
- **dotenv:**  
  https://www.npmjs.com/package/dotenv  

---

## Important Note

This project includes a `.gitignore` file that **prevents large or unnecessary files (especially `node_modules`) from being committed**.  
**Do NOT remove the `.gitignore` file**, as it helps keep the repository clean and optimized.

---
