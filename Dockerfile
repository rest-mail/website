# rest-mail.com: a TanStack Start app, rendered on the server by Node.
#
# The build runs on the builder's own platform, whatever the image is for: what
# it makes is JavaScript, CSS and fonts, the same for every platform.
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY vite.config.ts tsconfig.json ./
COPY public/ public/
COPY src/ src/
# Claiming a freshly installed server: the page a setup link lands on when the
# app is not there to take it, and the file Apple reads to decide that the app
# should take it. Both are built into the server, exactly as written.
COPY setup/ setup/
COPY .well-known/ .well-known/
RUN npm run build
# The server bundle carries React and the router (vite.config.ts); what is
# left to install is srvx, which serves it.
RUN npm prune --omit=dev

FROM node:24-alpine

# npm, npx and corepack are for building, which happened above.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
      /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /opt/yarn-* \
      /usr/local/bin/yarn /usr/local/bin/yarnpkg

WORKDIR /app
ENV NODE_ENV=production PORT=3000
# Keeps the heap well inside the chart's memory limit (256Mi): the server
# idles at about 75Mi and stays near 120Mi under load; without a cap V8 grows
# its heap lazily towards whatever the machine has.
ENV NODE_OPTIONS=--max-old-space-size=128
# Which design is live: safe, bold or experimental. The chart sets it from its
# `design` value; the server reads it for every page.
ENV REST_MAIL_DESIGN=safe
# Where people write to the project: /contact, /privacy, /security and
# security.txt. The chart sets it from its `contact` value.
ENV REST_MAIL_CONTACT=hello@rest-mail.com

COPY --from=build /src/package.json ./
COPY --from=build /src/node_modules/ node_modules/
COPY --from=build /src/dist/ dist/
COPY server.mjs ./
# COPY keeps whatever modes the build host's checkout had: on a machine whose
# files are group-only readable, the server could not read its own files. Say
# the modes the image needs instead of inheriting them. Nothing is writable.
RUN chmod -R a+rX,go-w /app

# The image's own unprivileged user, uid 1000.
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz >/dev/null || exit 1

CMD ["node", "server.mjs"]
