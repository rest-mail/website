import data from "../../content/email-explained/bundle.json";

// Email, explained: the guide rest-mail-server writes in docs/email-explained,
// as its content bundle (rest-mail-server scripts/email-explained/bundle.mjs).
// The words are that repository's; this site only draws them.

export type GuideSection = { id: string; title: string; titleHtml: string; html: string };

export type Chapter = {
  /** Its address under /email-explained; "" for the front page. */
  slug: string;
  /** Its file in rest-mail-server. */
  file: string;
  title: string;
  part: string | null;
  summary: string | null;
  diagram: string | null;
  /** What comes before its first section, as HTML. */
  intro: string;
  sections: GuideSection[];
};

export type Bundle = {
  format: number;
  /** Its published version (ghcr.io/rest-mail/email-explained), taken by scripts/take-bundle.mjs. */
  version: string | null;
  source: { repository: string; commit: string; path: string };
  chapters: Chapter[];
  diagrams: { name: string; type: string; source: string; html: string; image: string }[];
};

export const bundle = data as Bundle;

// scripts/take-bundle.mjs takes only this format (its FORMAT), and a test holds the two together.
if (bundle.format !== 1) throw new Error(`Email, explained: bundle format ${bundle.format} is not one this site reads`);

export const chapter = (slug: string) => bundle.chapters.find((c) => c.slug === slug.replace(/\/$/, ""));

/** Where a diagram's files are on this site, named for the commit they were built from. */
export const diagramFile = (name: string, ext: "html") =>
  `/email-explained/diagrams/${name}.${ext}?v=${bundle.source.commit.slice(0, 12)}`;

/**
 * The chapters either side of one, in the guide's reading order (the order its
 * front page lists them). The front page comes before the first chapter.
 */
export function neighbours(slug: string): { previous: Chapter | null; next: Chapter | null } {
  const order = bundle.chapters;
  const at = order.findIndex((c) => c.slug === slug);
  if (at < 0) return { previous: null, next: null };
  return { previous: order[at - 1] ?? null, next: order[at + 1] ?? null };
}

/** The guide's parts, in reading order, each with its chapters. */
export function parts(): { part: string; chapters: Chapter[] }[] {
  const out: { part: string; chapters: Chapter[] }[] = [];
  for (const c of bundle.chapters) {
    if (!c.slug || !c.part) continue;
    const last = out.at(-1);
    if (last?.part === c.part) last.chapters.push(c);
    else out.push({ part: c.part, chapters: [c] });
  }
  return out;
}
