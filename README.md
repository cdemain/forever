# Duo Legacy Plan

A comfort-first duo leveling and Legacy Points plan for World of Warcraft: Forever.

Static site. No build step. Open `index.html` in a browser, or publish the folder with GitHub Pages.

## What's in here

| File | Role |
| --- | --- |
| `index.html` | Page shell |
| `css/styles.css` | Layout and theme |
| `js/app.js` | Roster, coverage math, checklist, copy |
| `favicon.svg` | Tab icon |
| `LICENSE` | MIT, plus a trademark note |

Roster choices and checklist ticks are stored in this browser only (`localStorage`).

## Use it locally

Open `index.html`. That is enough. A local file URL works because the script and stylesheet are relative.

## GitHub Pages

1. Create an empty repository.
2. Copy these files into it. Do not put them inside an extra folder unless you also set that folder as the Pages root.
3. Commit and push.
4. In the repo: Settings, Pages, Build and deployment, Deploy from a branch.
5. Branch `main`, folder `/ (root)`, Save.

The site will be at `https://<user>.github.io/<repo>/`.

Replace the copyright line in `LICENSE` with your own name before you publish, if you want the grant in your name.

## License

MIT. See [LICENSE](LICENSE).

MIT instead of GPL: this is a personal plan page, not a library. Copyleft would force every fork and every site that reused a snippet to be GPL too, which does not protect the plan and makes ordinary sharing harder. MIT lets you and anyone else copy, change, and host it, including on GitHub Pages, as long as the license notice stays with the code.

World of Warcraft is Blizzard's game. This page is a fan planning aid and is not affiliated with Blizzard Entertainment.
