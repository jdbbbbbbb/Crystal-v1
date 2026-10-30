# Crystal v1

Crystal is a browser-style web app with internal Chat, Settings, Apps, and Games pages.

## Run

Requires Node.js 24 or newer.

```sh
npm install
npm start
```

Open http://localhost:4173. Set `PORT` to use another port. Chat accounts, sessions, channel messages, DMs, and read receipts are stored in SQLite at `~/.crystal-v1.sqlite`; set `CRYSTAL_DB` to choose another database path. Passwords are stored as scrypt hashes.

Chat has a `#general` channel, member profiles, private messages, typing indicators, and read receipts. Settings includes dark color themes, a start-page image upload, and reduced-motion control.

## Apps and games

Apps is a curated list of popular sites. Site providers may prevent their pages from loading in an embedded frame; use the browser's external-page link when needed.

Games embeds Lumin and combines its searchable catalogue with 200 Interstellar entries and all 492 Seraph game folders that contain an `index.html`. Seraph names and image metadata are read from the repository tree; selected game files are opened in the main browser frame, through Scramjet when their host is allowlisted.

Scramjet v2 is installed and routes HTTPS sites in the server-side allowlist through a Wisp transport. The Wisp server permits only port 443, blocks private/loopback/direct-IP destinations, and caps active streams. Other entered URLs continue to open directly and are not proxied; this is intentionally not an unrestricted public proxy.
