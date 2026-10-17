import { createServerFn } from "@tanstack/react-start";
import { getRouteApi } from "@tanstack/react-router";

/**
 * The three designs every release carries. Which one is live is the
 * deployment's choice, not the build's: the chart's `design` value, which
 * reaches the server as REST_MAIL_DESIGN. `?design=bold` previews another.
 */
export const designs = ["safe", "bold", "experimental"] as const;
export type Design = (typeof designs)[number];

export const isDesign = (value: unknown): value is Design =>
  typeof value === "string" && (designs as readonly string[]).includes(value);

/** Where people write to the project, unless the deployment says otherwise. */
export const defaultContact = "hello@rest-mail.com";

export type Site = {
  /** The design the deployment chose. */
  design: Design;
  /** The address on /contact, /privacy, /security and security.txt. */
  contact: string;
};

// An address and nothing else: it goes into mailto: links and into
// security.txt, a line-based file, so no spaces, line breaks or brackets.
const isAddress = (value: string) => /^[^\s@<>()"',;:]+@[^\s@<>()"',;:.]+(\.[^\s@<>()"',;:.]+)+$/.test(value);

/**
 * The deployment's settings, read from the environment the chart gives the
 * container. A value that is not usable falls back to the default rather than
 * break the site; the chart refuses both before they get here.
 */
export function readSite(env: Record<string, string | undefined>): Site {
  const design = env.REST_MAIL_DESIGN?.trim();
  const contact = env.REST_MAIL_CONTACT?.trim();
  return {
    design: isDesign(design) ? design : "safe",
    contact: contact && isAddress(contact) ? contact : defaultContact,
  };
}

/**
 * The settings, read on the server for every page it renders. The root route
 * loads them once; the browser gets them with the page and keeps them.
 */
export const getSite = createServerFn({ method: "GET" }).handler(() => readSite(process.env));

const root = getRouteApi("__root__");

/** The design this page is drawn in and the contact address, for any component. */
export function useSite(): Site {
  const site = root.useLoaderData();
  const { design } = root.useSearch();
  return { ...site, design: isDesign(design) ? design : site.design };
}
