import { Link, useRouterState } from "@tanstack/react-router";
import type { CSSProperties, ReactNode } from "react";
import { titleChars, type TitleWidths } from "./titleWidths";

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

/**
 * How wide a title's widest word is, in ems of the design's title type, from
 * the widths measured for it (titleWidths.ts). A line can break at a space or
 * after a hyphen, so those end a word. The design shrinks the title only as
 * far as that word needs to fit its column (min(..., 100cqi / ...)), so a long
 * word on a phone is never cut off.
 */
export function titleFit(title: ReactNode, widths: TitleWidths): CSSProperties | undefined {
  if (typeof title !== "string") return undefined;
  const widest = Math.max(...widths);
  const width = (word: string) =>
    [...word].reduce((sum, c) => sum + (widths[titleChars.indexOf(c)] ?? widest), 0) / 1000;
  const longest = Math.max(0, ...(title.match(/[^\s\-–]+[-–]?/g) ?? []).map(width));
  // 2% to spare, for rounding.
  return { "--doc-title-ems": +(longest * 1.02).toFixed(3) } as CSSProperties;
}

/** One numbered section of a page of text. */
export type DocSectionProps = {
  title: ReactNode;
  id?: string;
  children: ReactNode;
};
