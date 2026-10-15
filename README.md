# rest-mail.com

The public-facing website for the **REST Mail** project — served at https://rest-mail.com from the project's own cluster, built from this repository's `master` branch.

REST Mail replaces legacy mail server protocols (SMTP, IMAP, POP3) with a modern REST API. The product source lives at [`rest-mail/rest-mail-server`](https://github.com/rest-mail/rest-mail-server); this repository is **only the marketing site**.

## Three designs, one live

The site exists in three designs, all from the "REST Mail · three directions"
design, and every release carries all three:

| `design` | Direction |
|---|---|
| `safe` | A · Cobalt Editorial: serif headlines, two-column grid, cobalt accent |
| `bold` | B · Acid Tabloid: oversized type, thick rules, acid-lime accent |
| `experimental` | C · Magenta Zine: stickers, ASCII diagrams, magenta accent (the default) |

Which one rest-mail.com shows is the deployment's choice, not the build's: the
chart's `design` value. Switching is a change to that one setting, with no new
release. Any of them can be looked at on the live site with `?design=safe`,
`?design=bold` or `?design=experimental`.

## Layout

```
.
├── index.html                    # the page shell; loads /design.js, then the app
├── src/
│   ├── main.jsx                  # picks the design; bundles the typefaces
│   ├── Handshake.jsx             # the SMTP → REST animation all three share
│   ├── designs/                  # Safe.jsx, Bold.jsx, Experimental.jsx
│   └── styles/                   # one stylesheet per design, plus the shared ones
├── public/                       # copied as is: favicon, and design.js for `npm run dev`
├── setup/index.html              # where a server's setup link lands
├── .well-known/                  # apple-app-site-association: setup links open the app
├── nginx/templates/              # what nginx serves it with; writes /design.js
├── charts/website/               # how the site is deployed
├── Dockerfile                    # builds the site, then serves it with nginx
└── docker-compose.yml            # local dev: the image, built from the checkout
```

It's React, built with Vite. Each design is its own chunk, so a visitor
downloads only the live one. Nothing outside rest-mail.com loads on the site:
the typefaces (Fraunces, Instrument Serif, JetBrains Mono) are bundled.

## Hosting

- **Production:** the project's own cluster, from the image this repository publishes, installed by `charts/website` (see below). Pushing to `master` builds a new image; the deployment says which one is live.
- **Analytics:** none. The old page carried a Google Analytics tag for a Universal Analytics property, which stopped collecting in July 2023; it went with that page.

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
and nothing else on the site does either.

## The chart

`charts/website` installs the site: a deployment of the image below, a service,
and an ingress for the names it answers to. It is published to
`oci://ghcr.io/rest-mail/charts/website` on every push to `master` that touches
it, and pinned by version where it is installed: rest-mail.com's is
`restMailWebsite.chartVersion` in antimatter-vps's `Pulumi.prod.yaml`, next to
its `design`. `charts/website/tests/render-test.sh` renders it.

## Published image

Tagging `vX.Y.Z` publishes that release to GHCR; every push to `master` refreshes `latest`:

```
ghcr.io/rest-mail/website:latest          # newest master build; pin a release instead
ghcr.io/rest-mail/website:X.Y.Z          # a release: git tag vX.Y.Z publishes it
```

The image is `nginx:alpine` with the built site baked in. `REST_MAIL_DESIGN` (`safe`, `bold` or `experimental`) says which design it shows; the chart sets it from `design`.

## Local development

### Option A — the dev server, with live reload

```bash
npm install
npm run dev
# then open http://localhost:5173/?design=safe (or bold, or experimental)
```

### Option B — published image

```bash
docker run --rm -p 8090:80 -e REST_MAIL_DESIGN=bold ghcr.io/rest-mail/website:0.2.0
# then open http://localhost:8090
```

### Option C — docker compose (mirrors the testbed setup)

```bash
docker compose up -d
```

The compose file expects an external Docker network named `${COMPOSE_PROJECT_NAME:-rest-mail}_mailnet`, used by the [rest-mail-server](https://github.com/rest-mail/rest-mail-server) testbed. The website becomes reachable at `restmail.localhost` via the testbed's reverse proxy. For isolated preview, use Option A or B. `REST_MAIL_DESIGN=bold docker compose up -d --build` shows another design.

## Updating

- Change it in a pull request; CI renders the chart.
- To release: set the chart's `appVersion` to the new version in a pull
  request, then tag the merge commit `vX.Y.Z`. That publishes
  `ghcr.io/rest-mail/website:X.Y.Z`. It goes live when antimatter-vps moves to
  the chart that names it.
- To switch design: change `design` in antimatter-vps, nothing else.

## License

MIT.
