# rest-mail.com

The public-facing website for the **REST Mail** project — served at https://rest-mail.com from the project's own cluster, built from this repository's `master` branch.

REST Mail replaces legacy mail server protocols (SMTP, IMAP, POP3) with a modern REST API. The product source lives at [`rest-mail/rest-mail-server`](https://github.com/rest-mail/rest-mail-server); this repository is **only the marketing site**.

## Three designs, one live

The site exists in three designs, all from the "REST Mail · three directions"
design, and every release carries all three:

| `design` | Direction |
|---|---|
| `safe` | A · Cobalt Editorial: serif headlines, two-column grid, cobalt accent (the default) |
| `bold` | B · Acid Tabloid: oversized type, thick rules, acid-lime accent |
| `experimental` | C · Magenta Zine: stickers, ASCII diagrams, magenta accent |

Which one rest-mail.com shows is the deployment's choice, not the build's: the
chart's `design` value. Switching is a change to that one setting, with no new
release. Any of them can be looked at on the live site with `?design=safe`,
`?design=bold` or `?design=experimental`, on any page; the links on a page keep
it, so a preview lasts from page to page.

## Pages

| Path | What |
|---|---|
| `/` | The home page: the pitch, the handshake animation, the API |
| `/about` | What REST Mail is and why, what it is made of, who makes it |
| `/privacy` | The privacy policy, with Google's Limited Use disclosure for Gmail |
| `/contact` | How to reach the project |
| `/security` | How to report a vulnerability; `/.well-known/security.txt` says the same for machines (RFC 9116) |
| `/setup` | Where a server's setup link lands (see below) |
| anything else | A 404 page |

Every page is drawn in all three designs and rendered on the server, so it
works with no JavaScript and is what search engines read. One header and one
footer, drawn by each design its own way, link them all.

## Layout

```
.
├── src/
│   ├── routes/                   # one file per page, and per file the server answers
│   │   ├── __root.tsx            # the page shell; picks the design and its stylesheet
│   │   ├── index.tsx             # /
│   │   ├── about.tsx, privacy.tsx, contact.tsx, security.tsx
│   │   ├── setup.ts, setup/      # /setup, /setup/index.html: setup/index.html, as written
│   │   ├── [.]well-known/        # apple-app-site-association, security.txt,
│   │   │                         # microsoft-identity-association.json
│   │   └── security[.]txt.ts     # the old place for security.txt: a redirect
│   ├── designs/                  # Safe.tsx, Bold.tsx, Experimental.tsx: each one's
│   │                             # header and footer, home page and pages of text
│   ├── pages/                    # the 404 page, and what the pages share
│   ├── site.ts                   # the deployment's settings: design, contact address
│   ├── router.tsx                # the router; routeTree.gen.ts is generated from routes/
│   ├── Handshake.tsx             # the SMTP → REST animation all three share
│   └── styles/                   # base.css for every page, design-<name>.css for each design
├── public/                       # copied as is: the favicon
├── setup/index.html              # where a server's setup link lands
├── .well-known/                  # apple-app-site-association: setup links open the app;
│                                 # microsoft-identity-association.json: the publisher domain
├── server.mjs                    # the production server: serves the build, logs no requests
├── test/                         # what the built server must do, checked with no JavaScript
├── charts/website/               # how the site is deployed
├── Dockerfile                    # builds the site, then runs it with Node
└── docker-compose.yml            # local dev: the image, built from the checkout
```

It's a [TanStack Start](https://tanstack.com/start) app: React 19, TanStack
Router with a file per route, rendered on the server by Node. `npm run build`
makes `dist/`; `server.mjs` serves it with [srvx](https://srvx.h3.dev). The
server bundle carries React and the router, so srvx is the only package the
image installs, and the only one under `dependencies`.

Each design has its own stylesheet, and a page links only the live one. The
script that brings a page to life carries all three designs, which are small
next to their stylesheets. Nothing outside rest-mail.com loads on the site: the
typefaces (Fraunces, Instrument Serif, JetBrains Mono) are bundled, and every
response says so in its `Content-Security-Policy`.

## Hosting

- **Production:** the project's own cluster, from the image this repository publishes, installed by `charts/website` (see below). Pushing to `master` builds a new image; the deployment says which one is live.
- **Analytics:** none, and no cookies. The old page carried a Google Analytics tag for a Universal Analytics property, which stopped collecting in July 2023; it went with that page.
- **Logs:** the server logs no requests (`server.mjs`): it writes a line when it starts and when something fails. `/privacy` says so, so keep it true.

## Claiming a mail server

A freshly installed rest-mail server prints a setup code, with a QR code, every
time it starts until somebody claims it. Those links are ordinary web links so
that they are tappable anywhere — `https://rest-mail.com/setup#token=CODE` —
and this site serves both halves of what that needs:

- `.well-known/apple-app-site-association` tells iOS that the link belongs to
  the rest-mail app, so tapping it opens the app rather than this site. It is
  served as `application/json`
  (`src/routes/[.]well-known/apple-app-site-association.ts`), which Apple
  requires and which a file with no extension does not get by default.
- `setup/index.html` is where the link lands when the app is not installed. It
  shows the code so it can be typed in by hand. It is sent exactly as written,
  at `/setup`, `/setup/` and `/setup/index.html` (`src/routes/setup.ts`): it is
  not a page of the app, and carries no script but its own.

A setup code claims a mail server, so a link carries it after the `#`, which
browsers never send to a web server: this site cannot see one, and neither can
its logs. For the same reason the setup page loads nothing from anywhere else,
and nothing else on the site does either.

## Publisher domain

The app's Sign in with Microsoft goes through a Microsoft Entra app
registration. Its consent screen names the publisher, and it can only say
rest-mail.com once Entra has checked that the domain belongs to whoever owns
the registration. Entra checks that by fetching
`/.well-known/microsoft-identity-association.json`, which lists the
registration's Application (client) id. The route that serves it is
`src/routes/[.]well-known/microsoft-identity-association[.]json.ts`, and the
file is sent exactly as written, as JSON. Another registration means another
entry in `associatedApplications`.

## The chart

`charts/website` installs the site: a deployment of the image below, a service,
and an ingress for the names it answers to. It is published to
`oci://ghcr.io/rest-mail/charts/website` on every push to `master` that touches
it, and pinned by version where it is installed: rest-mail.com's is
`restMailWebsite.chartVersion` in antimatter-vps's `Pulumi.prod.yaml`, next to
its `design`. `charts/website/tests/render-test.sh` renders it.

| Value | What |
|---|---|
| `design` | `safe`, `bold` or `experimental`: the design the site shows. Anything else is refused when the chart renders. |
| `contact` | The address on `/contact`, `/privacy`, `/security` and in `security.txt`. Default `hello@rest-mail.com`; anything that is not an address is refused. |

The container runs as the image's unprivileged user, on a read-only
filesystem, listening on port 3000. It is ready once it renders `/`, and alive
while it answers `/healthz`.

## Published image

Tagging `vX.Y.Z` publishes that release to GHCR; every push to `master` refreshes `latest`:

```
ghcr.io/rest-mail/website:latest          # newest master build; pin a release instead
ghcr.io/rest-mail/website:X.Y.Z          # a release: git tag vX.Y.Z publishes it
```

The image is `node:24-alpine` running `server.mjs` on port 3000, as the
unprivileged `node` user. Its environment:

| Variable | What | Default |
|---|---|---|
| `REST_MAIL_DESIGN` | `safe`, `bold` or `experimental`: the design it shows. The chart sets it from `design`. | `safe` |
| `REST_MAIL_CONTACT` | Where people write to the project. The chart sets it from `contact`. | `hello@rest-mail.com` |
| `PORT` | Where it listens. | `3000` |

## Local development

### Option A — the dev server, with live reload

Node 22.12 or newer.

```bash
npm install
npm run dev
# then open http://localhost:5173/ (or ?design=bold, ?design=experimental)
# REST_MAIL_DESIGN=bold npm run dev shows another design by default
```

The dev server answers files that are in the checkout itself before the app
sees the request, so `/.well-known/apple-app-site-association` comes back as
JavaScript there. The built server (`npm run build && npm start`) serves it as
JSON, and `npm test` checks that.

### Option B — published image

```bash
docker run --rm -p 8090:3000 -e REST_MAIL_DESIGN=bold ghcr.io/rest-mail/website:latest
# then open http://localhost:8090
```

Releases up to 0.2.0 are the nginx site, which listens on port 80.

### Option C — docker compose (mirrors the testbed setup)

```bash
docker compose up -d
```

The compose file expects an external Docker network named `${COMPOSE_PROJECT_NAME:-rest-mail}_mailnet`, used by the [rest-mail-server](https://github.com/rest-mail/rest-mail-server) testbed. The website becomes reachable at `restmail.localhost` via the testbed's reverse proxy. For isolated preview, use Option A or B. `REST_MAIL_DESIGN=bold docker compose up -d --build` shows another design.

### Checking a change

```bash
npm run typecheck
npm run build
npm test                               # starts the built server and checks every route
charts/website/tests/render-test.sh    # the chart
```

`npm test` fetches every page with no JavaScript, in every design, and checks
the setup page and the app-site association are served exactly as written,
that no page loads anything from elsewhere, and that the server logs nothing
about requests. CI runs these on every pull request (the chart's test when the
chart changes), and builds the image.

## Updating

- Change it in a pull request; CI checks the site, builds the image and renders the chart.
- To release: set the chart's `appVersion` to the new version in a pull
  request, then tag the merge commit `vX.Y.Z`. That publishes
  `ghcr.io/rest-mail/website:X.Y.Z`. It goes live when antimatter-vps moves to
  the chart that names it.
- A change to the chart's templates needs a new chart `version` in
  `charts/website/Chart.yaml` before it can be published: CI refuses to publish
  over a version that exists.
- To switch design: change `design` in antimatter-vps, nothing else.

## License

MIT.
