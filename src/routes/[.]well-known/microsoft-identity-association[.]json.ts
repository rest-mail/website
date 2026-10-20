import { createFileRoute } from "@tanstack/react-router";
import association from "../../../.well-known/microsoft-identity-association.json?raw";

// Microsoft Entra fetches this to check that rest-mail.com belongs to whoever
// owns the REST Mail app registration (the mobile app's Sign in with
// Microsoft). Once it has, the consent screen names rest-mail.com as the app's
// publisher. Each id listed is a registration's Application (client) id. Sent
// exactly as written, as JSON, and never as a redirect: Entra follows neither.
const serve = () =>
  new Response(association, {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=300" },
  });

export const Route = createFileRoute("/.well-known/microsoft-identity-association.json")({
  server: { handlers: { GET: serve, HEAD: serve } },
});
