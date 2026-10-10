FROM nginx:alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY index.html favicon.svg /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
# Claiming a freshly installed server: the page a setup link lands on when the
# app is not there to take it, and the file Apple reads to decide that the app
# should take it.
COPY setup/ /usr/share/nginx/html/setup/
COPY .well-known/ /usr/share/nginx/html/.well-known/

# nginx's workers do not run as root, and COPY keeps whatever modes the build
# host's checkout had: on a machine whose files are group-only readable, every
# request would answer 403. Say the modes the image needs instead of inheriting
# them.
RUN chmod -R a+rX /usr/share/nginx/html /etc/nginx/conf.d

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
