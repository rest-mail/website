# rest-mail.com

The public-facing website for the **REST Mail** project — served at https://rest-mail.com via GitHub Pages from this repository's `master` branch.

REST Mail replaces legacy mail server protocols (SMTP, IMAP, POP3) with a modern REST API. The product source lives at [`rest-mail/rest-mail-server`](https://github.com/rest-mail/rest-mail-server); this repository is **only the marketing site**.

## Layout

```
.
├── index.html                    # the landing page
├── css/style.css                 # all styles
├── js/main.js                    # animation, nav toggle, etc.
├── favicon.svg
├── CNAME                         # rest-mail.com — DO NOT remove (breaks GitHub Pages custom domain)
├── docker-compose.yml            # local dev: nginx serving the static files
├── docker-compose.override.yml   # local dev: read-write volume mount
└── README.md
```

The site is **fully static** — no build step, no framework, no bundler. Edit HTML/CSS/JS directly and push.

## Hosting

- **Production:** GitHub Pages, served from the `master` branch of this repo. Pushing to `master` deploys within ~1 minute.
- **Custom domain:** `rest-mail.com`, configured via the `CNAME` file. Apex DNS A records point at GitHub Pages IPs.
- **Analytics:** Google Analytics tag `UA-950385-34` at the bottom of `index.html`. (Note: this is a Universal Analytics property, sunset by Google in July 2023 — collection has stopped. The tag is preserved for historical continuity; switch to a GA4 property when ready.)

## Published image

Every push to `master` builds and publishes a container image to GHCR:

```
ghcr.io/rest-mail/website:latest          # always newest
ghcr.io/rest-mail/website:YYYY.MM.DD      # immutable calver tag
```

The image is `nginx:alpine` with the static site baked in. Use it standalone or in the [rest-mail-server](https://github.com/rest-mail/rest-mail-server) local-dev environment.

## Local development

Three ways to preview locally:

### Option A — any static server

```bash
python3 -m http.server 8090
# then open http://localhost:8090
```

### Option B — published image

```bash
docker run --rm -p 8090:80 ghcr.io/rest-mail/website:latest
# then open http://localhost:8090
```

### Option C — docker compose (mirrors the testbed setup)

```bash
docker compose up -d
```

The compose file expects an external Docker network named `${COMPOSE_PROJECT_NAME:-rest-mail}_mailnet`, used by the [rest-mail-server](https://github.com/rest-mail/rest-mail-server) testbed. The website becomes reachable at `restmail.localhost` via the testbed's reverse proxy. For isolated preview, use Option A or B.

## Updating

- Edit files directly on `master` (or via PR — your choice).
- Commit and push.
- GitHub Pages rebuilds automatically.

## License

MIT.
