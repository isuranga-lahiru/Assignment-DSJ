# AGENTS.md

## Project overview
This repository is StudyMate, a full-stack notes application with a marketing landing page, a React frontend, an Express API, and an MCP server for Claude Desktop integration. For setup, environment variables, screenshots, and feature descriptions, see [README.md](README.md).

## Key architecture
- landing/: static marketing site
- client/: React + Vite frontend application
- server/: Express + MongoDB + Mongoose backend API
- mcp-server/: Model Context Protocol server that exposes note tools to Claude Desktop
- docs/screenshots/: UI reference images

## Critical conventions
- Keep the backend in CommonJS style in server/ and mcp-server/ unless a file explicitly already uses a different pattern.
- Put database models in server/models/ and shared database setup in server/config/db.js.
- Follow the existing Express route and validation patterns already used in server/server.js.
- Treat API errors as structured responses with clear message text and status codes.
- Keep secrets out of source control; use environment variables such as MONGO_URI, PORT, and Anthropic API keys.
- Preserve compatibility with the Vite React app in client/ when making frontend changes.

## Commands
- Start the backend: cd server && npm run dev
- Start the frontend: cd client && npm run dev
- Build the frontend: cd client && npm run build
- Start the MCP server: cd mcp-server && node index.js

## Editing guidance
- Prefer minimal, targeted changes that match the existing project structure.
- If new environment variables are introduced, update the relevant sections in [README.md](README.md).
- For AI-related features, keep graceful fallback behavior when API keys are missing.
- Maintain separation of concerns: frontend logic in client/, server logic in server/, and MCP tooling in mcp-server/.

## Useful references
- [README.md](README.md)
- [server/server.js](server/server.js)
- [server/config/db.js](server/config/db.js)
- [server/models/Note.js](server/models/Note.js)
