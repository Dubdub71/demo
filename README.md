# demo

A small static task list. No dependencies, no build step — three files and a browser.

Add tasks, check them off, filter by All / Active / Done, clear completed. State is kept in
`localStorage`, so it survives a reload. Styling follows the system light/dark preference.

## Run it

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Markup |
| `styles.css` | Styling, light/dark via `prefers-color-scheme` |
| `app.js` | State, rendering, persistence |
| `.claude/launch.json` | Dev-server config for Claude Code's preview |
