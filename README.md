# Uma 🪔

A Durga Puja chat agent: pandal hopping, pujor adda spots, bhog and street food, rituals, and outfit suggestions from a photo. Powered by [Groq](https://groq.com) (free tier). Users sign in with their Google account, and their chats are saved so they can switch between them.

## Setup

Needs Node.js 22.13 or newer.

1. Create free API keys at https://console.groq.com/keys and https://aistudio.google.com/apikey
2. Copy `.env.example` to `.env` and paste them into `GROQ_API_KEY` and `GEMINI_API_KEY`
3. Set up Google sign-in (below) and put the client ID in `GOOGLE_CLIENT_ID`.
4. Install and run (two terminals):

```sh
npm install
npm run server   # API on http://localhost:3001
npm run dev      # UI on http://localhost:5173
```

## How it works

- `src/App.jsx` is the UI: the sign-in card (`src/components/AuthCard.jsx`), the chat, and the hamburger menu that opens the chat drawer (`src/components/Sidebar.jsx`). Photos are resized to 1024px in the browser, then sent as base64.
- `server/index.js` is the API. It checks the login, loads the chat history from the database, asks the AI, and saves both the question and the reply.
- `server/llm.js` calls Groq, with Gemini as a backup (both through their OpenAI-compatible `/chat/completions` endpoints), and applies the Pujo-only check.
- `server/db.js` stores users, sessions, chats and message text in SQLite: a local file (`server/data/pujo.db`, created automatically, not committed) during development, or [Turso](https://turso.tech) (hosted SQLite) when `TURSO_DATABASE_URL` is set.
- `server/google.js` verifies Google sign-in tokens; `server/auth.js` handles sessions.
- `server/systemPrompt.js` holds the agent's personality, what counts as a Pujo topic, and example answers.
- `server/knowledge.md` is the agent's Pujo knowledge base, loaded into the prompt at startup. Add this year's dates, pandal themes and Metro timings to its "This year's Pujo" section. Restart the server after editing.

### Models

Free AI plans have tight per-minute limits, so Uma uses a chain of models and moves to the next one whenever a model is busy or failing. A model that hits its limit is skipped for the wait time the provider suggests.

| Order | Provider | Setting | Default models | Used for |
| --- | --- | --- | --- | --- |
| 1 | Groq | `GROQ_TEXT_MODELS` | `openai/gpt-oss-120b`, `openai/gpt-oss-20b` | Text questions |
| 1 | Groq | `GROQ_VISION_MODELS` | `qwen/qwen3.8-27b` | Questions with a photo |
| 2 | Gemini | `GEMINI_MODELS` | `gemini-3.8-flash`, `gemini-3.5-flash-lite` | Backup for both text and photos |

Each provider is used only if its key is set (`GROQ_API_KEY`, `GEMINI_API_KEY`); either one alone also works. Get a free Gemini key at https://aistudio.google.com/apikey.

Providers retire models from time to time. If the server log shows `404` or `model_not_found`, list the models your keys can use and update the settings:

```sh
curl -s https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY"
curl -s https://generativelanguage.googleapis.com/v1beta/openai/models -H "Authorization: Bearer $GEMINI_API_KEY"
```

### Photos

Photos are never stored. A photo is sent to the AI only with the message it was attached to, stays visible in the browser for that session, and after a reload shows as "📷 Photo not saved". The database only records that a photo was shared.

## Setting up Google sign-in

1. Go to https://console.cloud.google.com and create a project (e.g. "Uma").
2. Open **APIs & Services → OAuth consent screen** (called **Google Auth Platform** in newer consoles). Choose **External**, enter the app name "Uma", your support email and developer email, and save. While the app is in **Testing**, add the Google accounts that may sign in under **Test users**; choose **Publish app** when you're ready for everyone.
3. Open **Credentials → Create credentials → OAuth client ID**. Application type: **Web application**.
4. Under **Authorized JavaScript origins**, add `http://localhost:5173` and `http://localhost` (and later your live site, e.g. `https://uma.example.com`). No redirect URI is needed.
5. Copy the **Client ID** (it ends in `.apps.googleusercontent.com`) into `GOOGLE_CLIENT_ID` in `.env`, and restart `npm run server`.

## API

All responses are JSON. Everything except `/api/config` and sign-in needs the session cookie.

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/api/config` | Settings the page needs (the Google client ID) |
| POST | `/api/auth/google` | `{ credential, remember }` signs in with a Google ID token, creating the account the first time |
| POST | `/api/auth/logout` | Ends the session |
| GET | `/api/auth/me` | The logged-in user |
| GET | `/api/chats` | The user's chats, newest first |
| GET | `/api/chats/:id` | One chat with its messages |
| PATCH | `/api/chats/:id` | `{ title }` renames a chat |
| DELETE | `/api/chats/:id` | Deletes a chat and its messages |
| POST | `/api/messages` | `{ chatId?, text, image? }` sends a message; leave out `chatId` to start a new chat |

## Security

- There are no passwords: people sign in with Google. The server checks each Google ID token's signature against Google's published keys, and that it was issued for this app's client ID, hasn't expired, and has a verified email.
- Accounts are keyed on Google's permanent account ID. Accounts created before Google sign-in are linked by email the first time that person signs in with Google.
- Sign-in attempts are limited to 30 per network address every 15 minutes. Behind a hosting proxy, set `TRUST_PROXY=1` so each visitor's real address is used.
- Logins use a random session token in an `HttpOnly`, `SameSite=Lax` cookie, and only a SHA-256 hash of the token is stored. With "Stay signed in" the session lasts 30 days; without it, it ends when the browser closes (and after 12 hours at most).
- The user's name from Google is added to the AI's instructions so it can address them by name. Their Google profile photo is shown in the chat drawer.
- Users can only read or change their own chats.
- Write requests must be JSON, which blocks cross-site form posts.
- When you deploy over HTTPS, set `COOKIE_SECURE=1` so the cookie is only sent over HTTPS.

## Keeping it to Durga Puja

The agent only chats about Durga Puja and its season. This is done with prompting and a server check, not model training:

1. The system prompt defines the Pujo scope and tells the model to answer anything else with the marker `[OFF_TOPIC]` only.
2. `server/llm.js` spots that marker and replaces it with a fixed, friendly redirect, so the model's own text for an off-topic request is never shown. Off-topic exchanges are also left out of the history sent to the model later.
3. The history sent to the model comes from the database, not the browser, so it can't be tampered with. Only the last 16 messages are sent, with photos from the 6 most recent.

To adjust the scope, edit the "Scope" and "Examples" sections in `server/systemPrompt.js`. To change the redirect lines, edit `REDIRECTS` in `server/llm.js`.

## Database backups

- `npm run backup` downloads the whole database (local file or Turso) into `server/backups/` as a single file named by local time, e.g. `pujo-2026-09-27-23-02-27.db`. The newest 14 are kept (`BACKUP_KEEP`).
- With a local database, the server also does this automatically once a day.
- With Turso, run `npm run backup` on your computer now and then (with the Turso settings in `.env`), and copy backups somewhere safe.
- To restore a local database: stop the server, copy the backup over `server/data/pujo.db`, delete `pujo.db-wal` and `pujo.db-shm` next to it if present, and start the server.

## Viewing the database

- In VS Code, install the **SQLite Viewer** extension (by Florian Klampfer), then click `server/data/pujo.db` or any backup to browse its tables.
- Or use the free desktop app [DB Browser for SQLite](https://sqlitebrowser.org).
- Look, don't edit: change data only through the app, or with the server stopped.

## Deploying (free: Render + Turso)

Both have free plans that need no card. Render's free server has no permanent disk, so the data lives in Turso.

### 1. Turso database
1. At https://app.turso.tech, create a database named `uma` (pick the region closest to your users, e.g. Mumbai).
2. Copy its URL (`libsql://uma-….turso.io`) and create a token (**Create token**, no expiry).
3. To move your existing users and chats: put both into `.env` as `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`, run `npm run copy-to-turso`, then comment those two lines out again so local development keeps using the local file.

### 2. Render web service
1. At https://dashboard.render.com: **New → Web Service**, connect this GitHub repository.
2. Settings: Runtime **Node**, Build command `npm install && npm run build`, Start command `npm start`, Instance type **Free**, Health check path `/api/health`.
3. Environment variables: `GROQ_API_KEY`, `GEMINI_API_KEY` (optional), `GOOGLE_CLIENT_ID`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `COOKIE_SECURE=1`, `TRUST_PROXY=1`. Render sets `PORT` itself.
4. Deploy. The site will be at `https://<name>.onrender.com`.

### 3. Google sign-in
Add the Render address (e.g. `https://uma-xxxx.onrender.com`, no trailing slash) to **Authorized JavaScript origins** in your Google OAuth client, keeping the `localhost` entries. Under **Audience**, choose **Publish app** so anyone can sign in.

### Notes
- The free Render server sleeps after 15 minutes without visitors; the next visit takes about a minute. A free uptime monitor (e.g. UptimeRobot) pinging `/api/health` every 10 minutes keeps it awake.
- Every push to GitHub redeploys automatically.
