# StudyMate

StudyMate is a full-stack study notes app where students can create notes, search and delete them, generate AI summaries, and manage notes from Claude through an MCP server.

## Tech stack

- **Landing page:** HTML, CSS, vanilla JavaScript
- **Client:** React + Vite
- **Server:** Node.js, Express, MongoDB, Mongoose
- **AI summaries:** Anthropic Claude API with a graceful fallback when the API key is missing
- **MCP server:** Node.js stdio server using the Model Context Protocol SDK

## Repository structure

- `landing/` — static marketing page
- `client/` — React app for creating and managing notes
- `server/` — Express API, MongoDB connection, AI summarization route
- `mcp-server/` — MCP tools for listing and creating notes from Claude

## Features

- Create notes with a title, subject, and content
- Fetch, search, and delete notes
- Generate and persist AI summaries with 3 bullet points + 1 quiz question
- Use Claude Desktop or MCP Inspector to list/create notes with your own server
- Responsive landing page with a dark-mode toggle and FAQ accordion

## Setup

### 1) Server

1. Go to `server/`
2. Install dependencies
3. Copy `.env.example` to `.env` if needed and update the values
4. Start the API

Environment variables:

- `PORT` — API port, default `5000`
- `MONGO_URI` — MongoDB connection string
- `ANTHROPIC_API_KEY` — optional, used for AI summaries
- `ANTHROPIC_MODEL` — Claude model name used by the summary route

### 2) Client

1. Go to `client/`
2. Install dependencies
3. Copy `.env.example` to `.env` or `.env.local` if your API runs somewhere else
4. Start the React app

Environment variable:

- `VITE_API_URL` — base URL for the StudyMate API

### 3) MCP server

1. Go to `mcp-server/`
2. Install dependencies
3. Copy `.env.example` to `.env` if needed
4. Start the stdio server

Environment variable:

- `STUDYMATE_API_URL` — base URL for the Express API

## Running the app

- Launch the server on port `5000`
- Launch the React client on port `5173`
- Open the landing page from the `landing/` folder or serve it with your preferred static server

## MCP setup in Claude Desktop

Add the MCP server entry that points to the `mcp-server` folder and runs `node index.js`. Once connected, you can ask Claude things like:

- "What notes do I have?"
- "Add a note about React hooks"

## Screenshots

Replace the placeholders below with your own captures after running the app:

- `docs/screenshots/landing-page.png` — landing page
- `docs/screenshots/app-ui.png` — React app with notes list and AI summary
- `docs/screenshots/mcp-tool-call.png` — MCP tool call working in Claude Desktop or MCP Inspector

## Notes on commits

For a polished submission, make several meaningful commits as you complete each part instead of one giant checkpoint commit.
