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
  source: { repository: string; commit: string; path: string };
  chapters: Chapter[];
  diagrams: { name: string; type: string; source: string; html: string; image: string }[];
};

export const bundle = data as Bundle;

if (bundle.format !== 1) throw new Error(`Email, explained: bundle format ${bundle.format} is not one this site reads`);

export const chapter = (slug: string) => bundle.chapters.find((c) => c.slug === slug.replace(/\/$/, ""));

/** Where a diagram's files are on this site, named for the commit they were built from. */
export const diagramFile = (name: string, ext: "html" | "png") =>
  `/email-explained/diagrams/${name}.${ext}?v=${bundle.source.commit.slice(0, 12)}`;
