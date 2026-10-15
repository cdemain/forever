# Legacy Optimization Plan (static)

The planner in this folder has no build step and no Battle.net login. GitHub Pages should publish this directory, not the repository root.

The approach is Ceedsy’s comfort-first alt army: [the video](https://youtu.be/rAcXmhon5Oo).

## Files

| File | Role |
| --- | --- |
| `index.html` | Page |
| `styles.css` | Layout |
| `app.js` | Planner |
| `favicon.svg` | Tab icon |
| `LICENSE` | MIT |

`index.html` loads `styles.css` and `app.js` from this same directory. Do not move those files unless you change those two links.

## GitHub Pages

1. Settings, Pages, Deploy from a branch.
2. Folder: `/docs`.
3. The site is `https://<user>.github.io/<repo>/`.

The repository root is the Cloudflare app. It is not this page.
