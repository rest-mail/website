// rest-mail.com in production. `npm run build` (TanStack Start, with Vite)
// makes dist/: dist/client holds the files browsers fetch, and
// dist/server/server.js renders every page and answers every route. This
// serves the first and hands everything else to the second.
//
// It logs no requests: no addresses, no pages, no browsers. It writes a line
// when it starts and a line when something fails, and neither is about a
// visitor. The privacy policy says so (src/routes/privacy.tsx): keep it true.
import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "srvx";
import app from "./dist/server/server.js";

const port = Number(process.env.PORT) || 3000;
const client = fileURLToPath(new URL("./dist/client", import.meta.url));

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

// The files the build made, by the path they are fetched at. Nothing else on
// disk can be asked for, so no path can reach above dist/client.
const files = new Map();
for (const entry of await readdir(client, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const file = join(entry.parentPath, entry.name);
  const type = types[extname(file)];
  if (type) files.set(`/${relative(client, file).split(sep).join("/")}`, { file, type });
}

async function asset(pathname) {
  const found = files.get(pathname);
  if (!found) return null;
  return new Response(await readFile(found.file), {
    headers: {
      "content-type": found.type,
      // The build names these after their contents, so each can be kept for
      // good; anything else (the favicon) for an hour.
      "cache-control": pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "public, max-age=3600",
    },
  });
}

// On every response: nothing from outside rest-mail.com may load on any page,
// whatever ends up in one later. The setup page sets its own, stricter policy
// (src/routes/setup.ts), which this leaves alone. Inline scripts are allowed:
// the page carries the state the router picks up from in the browser.
const always = {
  "content-security-policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
};

// Email, explained's diagrams are Archify's standalone pages: inline script
// and styles, typefaces beside them, and framed by the chapter that shows them
// (src/guide/Diagram.tsx). Nothing else, and nothing from anywhere.
const diagram = {
  "content-security-policy":
    "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src 'self'; media-src blob:; frame-ancestors 'self'; base-uri 'none'; form-action 'none'",
};
const isDiagram = (pathname) => /^\/email-explained\/diagrams\/[a-z0-9-]+\.html$/.test(pathname);

const failed = () =>
  new Response("Something went wrong.\n", { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } });

async function respond(request) {
  const { pathname } = new URL(request.url);
  // For the cluster's liveness probe: the process is up and answering.
  if (pathname === "/healthz") return new Response("ok\n", { headers: { "content-type": "text/plain" } });
  if (request.method === "GET" || request.method === "HEAD") {
    const response = await asset(pathname);
    if (response) return response;
  }
  try {
    return await app.fetch(request);
  } catch (error) {
    console.error("A request failed:", error);
    return failed();
  }
}

const server = serve({
  port,
  silent: true,
  // Shut down as below instead: srvx's own way is off under CI, and prints.
  gracefulShutdown: false,
  async fetch(request) {
    const response = await respond(request);
    const headers = new Headers(response.headers);
    if (isDiagram(new URL(request.url).pathname)) for (const [name, value] of Object.entries(diagram)) headers.set(name, value);
    for (const [name, value] of Object.entries(always)) if (!headers.has(name)) headers.set(name, value);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
});

await server.ready();
console.log(`rest-mail.com: listening on port ${port}, design ${process.env.REST_MAIL_DESIGN || "safe"}`);

// The cluster stops a pod with SIGTERM: finish what is in flight, then go,
// within ten seconds whatever happens.
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.once(signal, () => {
    setTimeout(() => process.exit(0), 10_000).unref();
    server.close().then(() => process.exit(0));
  });
}
