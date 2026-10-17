import { createFileRoute } from "@tanstack/react-router";
import page from "../../setup/index.html?raw";

// Where a server's setup link lands when the app is not there to take it:
// https://rest-mail.com/setup#…. The page is setup/index.html, sent exactly as
// written, at /setup, /setup/ and /setup/index.html alike. It is not a page of
// the app: no design, no scripts but its own. What the link carries is after
// the `#`, which browsers never send, so it never reaches this server; the
// page reads it in the browser, and nothing from anywhere else may load there.
export const setupHeaders = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-cache",
  "content-security-policy":
    "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
};

export const servePage = () => new Response(page, { headers: setupHeaders });

export const Route = createFileRoute("/setup")({
  server: { handlers: { GET: servePage, HEAD: servePage } },
});
