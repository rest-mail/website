/// <reference types="vite/client" />
import { createRootRoute, HeadContent, Outlet, retainSearchParams, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Chrome } from "../designs";
import { NotFound } from "../pages/NotFound";
import { getSite, isDesign, type Design } from "../site";
import baseCss from "../styles/base.css?url";
import boldCss from "../styles/design-bold.css?url";
import experimentalCss from "../styles/design-experimental.css?url";
import safeCss from "../styles/design-safe.css?url";

// One stylesheet per design: a page links only the one it is drawn in.
const stylesheets: Record<Design, string> = { safe: safeCss, bold: boldCss, experimental: experimentalCss };

export const Route = createRootRoute({
  // ?design=bold previews another design on any page. Anything else in it is
  // ignored, and the deployment's design is shown. (Said as undefined, not
  // left out: the router keeps a parameter validation does not mention.)
  validateSearch: (search: Record<string, unknown>): { design?: Design } => ({
    design: isDesign(search.design) ? search.design : undefined,
  }),
  // Every link keeps the preview, so it lasts from page to page.
  search: { middlewares: [retainSearchParams(["design"])] },
  // The deployment's settings, read on the server. The browser gets them with
  // the page, and never asks again.
  loader: () => getSite(),
  staleTime: Infinity,
  head: ({ loaderData, match, matches }) => {
    const asked = match.search.design;
    const design = isDesign(asked) ? asked : (loaderData?.design ?? "safe");
    // Only this route matched: there is no page at this address (NotFound).
    const missing = matches.length === 1;
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: missing ? "Not found — REST Mail" : "REST Mail — because the protocol needs to take a REST." },
        {
          name: "description",
          content:
            "REST Mail is a modern email server: SMTP, IMAP and POP3 at the edge, a REST API at the core. Open source, MIT, self-hosted.",
        },
      ],
      links: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        { rel: "stylesheet", href: baseCss },
        { rel: "stylesheet", href: stylesheets[design] },
      ],
    };
  },
  shellComponent: Document,
  component: Root,
  notFoundComponent: NotFound,
});

function Document({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Root() {
  return (
    <Chrome>
      <Outlet />
    </Chrome>
  );
}
