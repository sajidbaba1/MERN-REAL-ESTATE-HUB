# Complete Project Setup Guide (Frontend & Node.js Backend)

This guide provides step-by-step instructions to set up the **React Frontend** and **Node.js Backend** for the Real Estate project in VS Code.

## 1. Prerequisites (Install these first)
*   **VS Code:** [Download Here](https://code.visualstudio.com/)
*   **Node.js (v16+):** [Download Here](https://nodejs.org/) - This is the engine for both the backend and frontend.
*   **Git:** [Download Here](https://git-scm.com/)

### Recommended VS Code Extensions
*   **ES7+ React/Redux/React-Native snippets**
*   **Prettier - Code formatter**
*   **Tailwind CSS IntelliSense**

---

## 2. Project Structure
The relevant folders for this setup are:
1.  **`backend-nodejs/`:** The backend server handling real-time chat, notifications, AI, and uploads.
2.  **`frontend/`:** The React user interface application.

---

## 3. Step-by-Step Setup

extract the folder and open it in vs code

### B. Setup Backend (Node.js)
1.  **Navigate:**
    Open the terminal and run: `cd backend-nodejs`
2.  **Install Dependencies:**
    Run: `npm install`
3.  **Configuration:**
    *   Find the file named `.env.example`.
    *   Rename it to `.env`.
    *   Open it and fill in your keys (see Section 4).
4.  **Run the Server:**
    Run: `npm run dev`
    *   *The server will start at:* `http://localhost:8889`

### C. Setup Frontend (React)
1.  **Navigate:**
    Open a **new** terminal (keep the backend running) and run: `cd frontend`
2.  **Install Dependencies:**
    Run: `npm install`
3.  **Configuration:**
    *   Find the file named `.env.example`.
    *   Rename it to `.env.local`.
    *   Open it and ensure `VITE_API_BASE_URL` matches your backend port (usually `http://localhost:8889/api`).
    *   Add your Google Maps Key here.
4.  **Run the App:**
    Run: `npm run dev`
    *   *The app will open at:* `http://localhost:5173`

---

## 4. API Keys & Credentials Guide

### 📍 Google Maps API
*   **Used for:** Displaying maps and location search in the Frontend.
*   **How to get:**
    1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
    2.  Create a Project.
    3.  Enable **Maps JavaScript API** and **Geocoding API**.
    4.  Create Credentials > API Key.
*   *Video Guide:* [Get Google Maps API Key](https://www.youtube.com/results?search_query=get+google+maps+api+key+react)

### 🤖 Gemini / OpenAI (For AI Chatbot)
*   **Used for:** The AI assistant in the Node.js backend.
*   **How to get:**
    1.  Go to [Google AI Studio](https://aistudio.google.com/) for Gemini OR [OpenAI Platform](https://platform.openai.com/) for GPT.
    2.  Get your API Key.
*   *Video Guide:* [Get Gemini API Key](https://www.youtube.com/results?search_query=how+to+get+gemini+api+key)

### 🍃 MongoDB (For Backend Database)
*   **Used for:** Storing chats, notifications, and wallet data.
*   **How to get:**
    1.  Go to [MongoDB Atlas](https://www.mongodb.com/atlas).
    2.  Create a free cluster.
    3.  Click "Connect" > "Drivers" to get your connection string.
*   *Video Guide:* [Setup MongoDB Atlas](https://www.youtube.com/results?search_query=setup+mongodb+atlas+free)

---

## 5. Configuration File Reference

### Backend: `backend-nodejs/.env`
```env
PORT=8889
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/realestate
JWT_SECRET=your_secure_random_string
GEMINI_API_KEY=your_gemini_key_here
# Optional: Cloudinary keys if used
```

### Frontend: `frontend/.env.local`
```env
VITE_API_BASE_URL=http://localhost:8889/api
VITE_GOOGLE_MAPS_KEY=your_google_maps_key
```

---

## 6. Troubleshooting
*   **Port In Use (EADDRINUSE):**
    *   Run `netstat -ano | findstr :8889`
    *   Run `taskkill /F /PID <PID>` to stop the conflicting process.
*   **Connection Refused:** Ensure the backend `npm run dev` is running before you try to log in or chat on the frontend.
