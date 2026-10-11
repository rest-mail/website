# rest-mail.com

The public-facing website for the **REST Mail** project — served at https://rest-mail.com from the project's own cluster, built from this repository's `master` branch.

REST Mail replaces legacy mail server protocols (SMTP, IMAP, POP3) with a modern REST API. The product source lives at [`rest-mail/rest-mail-server`](https://github.com/rest-mail/rest-mail-server); this repository is **only the marketing site**.

## Layout

```
.
├── index.html                    # the landing page
├── css/style.css                 # all styles
├── js/main.js                    # animation, nav toggle, etc.
├── favicon.svg
├── setup/index.html              # where a server's setup link lands
├── .well-known/                  # apple-app-site-association: setup links open the app
├── nginx/default.conf            # content types and headers the files above need
├── charts/website/               # how the site is deployed
├── docker-compose.yml            # local dev: nginx serving the static files
├── docker-compose.override.yml   # local dev: read-write volume mount
└── README.md
```

The site is **fully static** — no build step, no framework, no bundler. Edit HTML/CSS/JS directly and push.

## Hosting

- **Production:** the project's own cluster, from the image this repository publishes, installed by `charts/website` (see below). Pushing to `master` builds a new image; the deployment says which one is live.
- **Analytics:** Google Analytics tag `UA-950385-34` at the bottom of `index.html`. (Note: this is a Universal Analytics property, sunset by Google in July 2023 — collection has stopped. The tag is preserved for historical continuity; switch to a GA4 property when ready.)

## Claiming a mail server

A freshly installed rest-mail server prints a setup code, with a QR code, every
time it starts until somebody claims it. Those links are ordinary web links so
that they are tappable anywhere — `https://rest-mail.com/setup#token=CODE` —
and this site serves both halves of what that needs:

- `.well-known/apple-app-site-association` tells iOS that the link belongs to
  the rest-mail app, so tapping it opens the app rather than this site. It is
  served as `application/json` (`nginx/default.conf`), which Apple requires and
  which a file with no extension does not get by default.
- `setup/index.html` is where the link lands when the app is not installed. It
  shows the code so it can be typed in by hand.

A setup code claims a mail server, so a link carries it after the `#`, which
browsers never send to a web server: this site cannot see one, and neither can
its logs. For the same reason the setup page loads nothing from anywhere else,
and is the one page here with no analytics on it.

## The chart

`charts/website` installs the site: a deployment of the image below, a service,
and an ingress for the names it answers to. It is published to
`oci://ghcr.io/rest-mail/charts/website` on every push to `master` that touches
it, and pinned by version where it is installed — in
[`rest-mail/deploy`](https://github.com/rest-mail/deploy), which composes the
whole product. `charts/website/tests/render-test.sh` renders it.

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
- That builds a new image (`ghcr.io/rest-mail/website:YYYY.MM.DD[.N]`). It goes live when the deployment pins it: `websiteImageTag` in antimatter-vps's `Pulumi.prod.yaml`.

## License

MIT.
