import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * What the design tool could vary in each design. Nothing sets these on the
 * live site; each design's defaults are what it shows.
 */
export type Tweaks = {
  accentSafe?: string;
  accentBold?: string;
  accentExp?: string;
  density?: "tight" | "comfortable" | "airy";
  speed?: number;
  cheeky?: boolean;
};

export const GITHUB = "https://github.com/rest-mail";

/** The pages every header and footer links to, in every design. */
export const pages = [
  { to: "/about", label: "About" },
  // The guide's pages are under Docs too, so the link shows as current there.
  { to: "/docs", label: "Docs", under: ["/email-explained"] },
  { to: "/privacy", label: "Privacy" },
  { to: "/security", label: "Security" },
  { to: "/contact", label: "Contact" },
] as const;

// Internal links are the router's: plain links in the server's HTML, so they
// work with no JavaScript, and they keep ?design= so a preview stays one
// (src/routes/__root.tsx).

export const Brand = ({ className, children }: { className: string; children: ReactNode }) => (
  <Link to="/" className={className} aria-label="REST Mail, home">
    {children}
  </Link>
);

const current = { "data-status": "active", "aria-current": "page" } as const;

export const PageLinks = ({ home = false }: { home?: boolean }) => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return <PageLinkList home={home} pathname={pathname} />;
};

const PageLinkList = ({ home, pathname }: { home: boolean; pathname: string }) => (
  <>
    {home && (
      <Link to="/" activeOptions={{ exact: true, includeSearch: false }}>
        Home
      </Link>
    )}
    {pages.map((page) => (
      <Link
        key={page.to}
        to={page.to}
        activeOptions={{ includeSearch: false }}
        {...("under" in page && page.under.some((p) => pathname.startsWith(p)) ? current : {})}
      >
        {page.label}
      </Link>
    ))}
  </>
);

/** A link out: to GitHub, the one place the site links to that is not itself. */
export const GitHubLink = ({ className, children }: { className: string; children: ReactNode }) => (
  <a className={className} href={GITHUB}>
    {children}
  </a>
);

/** A page of text (About, Privacy and the rest), drawn by each design its own way. */
export type DocProps = {
  /** The mono label above the title: the page's name. */
  eyebrow: string;
  /** A short aside next to it, in the design's italic. */
  kicker?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  children: ReactNode;
};

/** One numbered section of a page of text. */
export type DocSectionProps = {
  title: ReactNode;
  id?: string;
  children: ReactNode;
};
