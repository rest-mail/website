import { createFileRoute } from "@tanstack/react-router";

// The old place for security.txt. RFC 9116 lets it redirect to the new one.
const serve = () => new Response(null, { status: 301, headers: { location: "/.well-known/security.txt" } });

export const Route = createFileRoute("/security.txt")({
  server: { handlers: { GET: serve, HEAD: serve } },
});
