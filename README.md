# Alix Drummond — Portfolio

Static site with no build step. It has three files: `index.html`, `style.css` and `app.js`.

## Put it on GitHub Pages
1. Create a repo (for example `alixdrummond.github.io`, or any name).
2. Upload `index.html`, `style.css` and `app.js` to the root, using **Add file → Upload files**.
3. Go to **Settings → Pages → Build and deployment**, set Source to *Deploy from a branch*, then pick `main` and `/ (root)`.
4. Your site goes live at `https://<username>.github.io/<repo>/` within a minute or two.

## Make it yours
- **Projects:** edit the `PROJECTS` array at the top of `app.js`. You can change the title, tagline, colours, role and summary. Each project gets a cartridge and its own case-study page.
- **Cover art:** set `cover: "images/bloom-cover.jpg"` to swap the drawn cover for your own image. Use about 1.12:1 landscape.
- **Case-study images:** use `hero: "images/bloom-hero.jpg"` and `images: { research: "...", process: "...", solution: "..." }`.
- **Case-study sections:** pass `sections: [{ id, h, body, fig }]` for a single project to override the default structure.
- **Contact:** search `index.html` for `EDIT` to find the email, LinkedIn and résumé links.
- **Intro line and About page:** replace anything in `[square brackets]`.

## What's built in
- A 3D console (three.js, loaded from a CDN). If WebGL isn't available, it falls back to a flat illustration.
- Clicking a cartridge flies it into the side slot. The console then boots, turns to face you and zooms into the top screen, and the screen becomes the case-study page.
- The animation can be skipped with **Esc** or the on-screen button. With *Reduce motion* turned on, it's replaced by a simple fade.
- The carousel loops infinitely. It has arrow buttons, ←/→ keys (Home/End too), and an auto-advance that you can pause. Auto-advance also pauses on hover, focus and touch.
- Hash routing (`#/work/bloom`) means links, refresh and the back button all work on GitHub Pages.
- Accessibility: skip link, visible focus, 44px targets, focus moves to the page title on navigation, and screen-reader announcements.
