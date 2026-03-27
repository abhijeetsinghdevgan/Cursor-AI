# GammaChat - Hulk Theme

A simple frontend chatbot app built with **HTML, CSS, and JavaScript** that lets users chat with **Google Gemini**.

The UI follows a Hulk/Bruce Banner inspired color style:
- Hulk gamma green accents
- Banner purple gradients
- Dark comic-style interface

## Project Structure

- `index.html` - app layout and UI structure
- `style.css` - Hulk/Banner themed styling
- `script.js` - Gemini API integration and chat logic

## Features

- Chat with Google Gemini from the browser
- Clean, responsive UI
- API key saved in browser `localStorage`
- API key panel auto-hides after saving (can be reopened with **Change API Key**)
- Auto-detects supported Gemini models before sending requests
- Simple message bubbles for user and bot

## Prerequisites

- A modern web browser (Chrome, Edge, Firefox)
- A Gemini API key from Google AI Studio

## How to Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Open **Get API key** (or **API keys**) from the dashboard.
4. Click **Create API key** and choose a project (or create one if prompted).
5. Copy the generated API key.
6. Open this app, paste the key into the **Gemini API Key** field, and click **Save Key**.

## How to Download This Project

### Option 1: Clone from GitHub

```bash
git clone git@github.com:abhijeetsinghdevgan/Cursor-AI.git
cd "Cursor-AI/chatbot app with Hulk theme"
```

### Option 2: Download ZIP

1. Open the repository on GitHub.
2. Click **Code** -> **Download ZIP**.
3. Extract the ZIP file.
4. Open the folder `chatbot app with Hulk theme`.

## How to Run and Test

1. Open `index.html` in your browser.
2. Paste your Gemini API key into the input field.
3. Click **Save Key** (the key panel will hide automatically).
4. Type a message and click **Send**.
5. If needed, click **Change API Key** in the header to edit/update your key.
6. Verify that Gemini replies appear in the chat window.

## Suggested Self-Testing Checklist

- Confirm the app loads with Hulk/Banner theme colors.
- Confirm API key save message appears.
- Send at least 3 prompts and verify bot responses.
- Refresh the page and confirm API key persists.
- Test on mobile-size window to verify responsive layout.

## Important Note (Security)

This app calls Gemini directly from the browser, so your API key is used client-side.
Keep `EMBEDDED_API_KEY` in `script.js` blank before committing/pushing to GitHub.
For production use, move API calls to a backend proxy to keep keys private.
