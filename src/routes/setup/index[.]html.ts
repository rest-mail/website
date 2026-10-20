import { createFileRoute } from "@tanstack/react-router";
import { servePage } from "../setup";

// The setup page by its file name, as the site has always answered it.
export const Route = createFileRoute("/setup/index.html")({
  server: { handlers: { GET: servePage, HEAD: servePage } },
});
