import { createFileRoute } from "@tanstack/react-router";
import { Doc, Section } from "../designs";
import { GITHUB } from "../designs/common";
import { parts } from "../guide/bundle";

// Where every link to documentation goes: the guide drawn on this site, and
// what lives with the code on GitHub.

const docs = `${GITHUB}/rest-mail-server/blob/main/docs`;

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Docs — REST Mail" },
      {
        name: "description",
        content: "Email, explained: how email works and why mail servers go wrong. And the guides to installing and running REST Mail.",
      },
    ],
  }),
  component: Docs,
});

function Docs() {
  return (
    <Doc
      eyebrow="Docs"
      kicker="Read the manual."
      title="Documentation"
      lede="How email works, why mail servers are so easy to get wrong, and how to install and run REST Mail."
    >
      <Section title="Email, explained" id="email-explained">
        <p>
          A guide to how email actually works: the protocols, the security layers on top of them, and the mistakes that
          turn a mail server into someone else's spam machine. It is useful whatever server you run. Every claim in it
          has a source.
        </p>
        <p>
          <a href="/email-explained">Start at the front page</a>, or go straight to a chapter:
        </p>
        {parts().map(({ part, chapters }) => (
          <div key={part} className="docs-part">
            <h3>{part}</h3>
            <ul>
              {chapters.map((c) => (
                <li key={c.slug}>
                  <a href={`/email-explained/${c.slug}`}>{c.title}</a>
                  {c.summary && <>: {c.summary}</>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>

      <Section title="Running REST Mail" id="running">
        <p>These live with the code, on GitHub, and change with it.</p>
        <ul>
          <li>
            <a href={`${docs}/installing.md`}>Installing</a>: the ways to install REST Mail, and what each one needs.
          </li>
          <li>
            <a href={`${docs}/MANUAL.md`}>The manual</a>: for operators and developers. Settings, endpoints and
            day-to-day tasks.
          </li>
          <li>
            <a href={`${docs}/README.md`}>Everything else</a>: filters, DNS providers, PROXY protocol, bans, and what
            each document is for.
          </li>
        </ul>
      </Section>
    </Doc>
  );
}
