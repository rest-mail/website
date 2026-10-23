import { Doc, Section } from "../designs";
import { bundle, type Chapter } from "./bundle";
import { Diagram, type Embed } from "./Diagram";

// A chapter's HTML, with its diagrams drawn by the site: the bundle marks each
// one with a placeholder figure, which holds the static image GitHub shows.
const placeholder = /<figure class="guide-diagram" data-diagram="([a-z0-9-]+)"><img [^>]*alt="([^"]*)"[^>]*><\/figure>/g;

function Html({ html, embed }: { html: string; embed: Embed }) {
  const parts = html.split(placeholder);
  const out = [];
  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i].trim()) out.push(<div key={i} className="guide-html" dangerouslySetInnerHTML={{ __html: parts[i] }} />);
    if (i + 1 < parts.length) out.push(<Diagram key={`d${i}`} name={parts[i + 1]} alt={unescape(parts[i + 2])} embed={embed} />);
  }
  return <>{out}</>;
}

const unescape = (text: string) => text.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&amp;/g, "&");

export function GuideChapter({ chapter, embed }: { chapter: Chapter; embed: Embed }) {
  const commit = bundle.source.commit;
  return (
    <Doc
      eyebrow={chapter.part ? `Email, explained · ${chapter.part}` : "Email, explained"}
      kicker={chapter.slug ? <a href="/email-explained">All chapters</a> : <a href="/docs">All docs</a>}
      title={chapter.title}
      lede={chapter.summary ?? undefined}
    >
      <section className="guide-intro">
        <div className="doc-body">
          <Html html={chapter.intro} embed={embed} />
        </div>
      </section>
      {chapter.sections.map((section) => (
        <Section key={section.id} id={section.id} title={<span dangerouslySetInnerHTML={{ __html: section.titleHtml }} />}>
          <Html html={section.html} embed={embed} />
        </Section>
      ))}
      <footer className="guide-source">
        <p className="doc-body">
        Built from{" "}
        <a href={`https://github.com/${bundle.source.repository}/blob/${commit}/${chapter.file}`}>{chapter.file}</a> at{" "}
        <a href={`https://github.com/${bundle.source.repository}/commit/${commit}`}>
          <code>{commit.slice(0, 12)}</code>
        </a>
        .
        </p>
      </footer>
    </Doc>
  );
}
