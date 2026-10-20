import { createFileRoute } from "@tanstack/react-router";
import association from "../../../.well-known/apple-app-site-association?raw";

// Apple fetches this to decide whether https://rest-mail.com/setup opens the
// app rather than the browser. It is .well-known/apple-app-site-association,
// sent exactly as written, as JSON: Apple requires that, and a file with no
// extension would not get it by itself. A short cache, so a change to it is
// not stuck for long.
const serve = () =>
  new Response(association, {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=300" },
  });

export const Route = createFileRoute("/.well-known/apple-app-site-association")({
  server: { handlers: { GET: serve, HEAD: serve } },
});
