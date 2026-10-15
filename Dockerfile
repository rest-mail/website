# The site is React, built once here into static files; nginx serves them.
FROM node:22-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY public/ public/
COPY src/ src/
RUN npm run build

FROM nginx:alpine

# Which design is live: safe, bold or experimental. The chart sets it from its
# `design` value; nginx writes it into /design.js at startup
# (nginx/templates/default.conf.template).
ENV REST_MAIL_DESIGN=experimental

COPY nginx/templates/ /etc/nginx/templates/
COPY --from=build /src/dist/ /usr/share/nginx/html/
# Claiming a freshly installed server: the page a setup link lands on when the
# app is not there to take it, and the file Apple reads to decide that the app
# should take it. Plain files, whatever design is live.
COPY setup/ /usr/share/nginx/html/setup/
COPY .well-known/ /usr/share/nginx/html/.well-known/
# The dev server's stand-in; nginx answers /design.js itself.
RUN rm -f /usr/share/nginx/html/design.js

# nginx's workers do not run as root, and COPY keeps whatever modes the build
# host's checkout had: on a machine whose files are group-only readable, every
# request would answer 403. Say the modes the image needs instead of inheriting
# them.
RUN chmod -R a+rX /usr/share/nginx/html /etc/nginx/templates

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
