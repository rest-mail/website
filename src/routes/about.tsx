import { createFileRoute, Link } from "@tanstack/react-router";
import { Doc, Section } from "../designs";
import { GITHUB } from "../designs/common";
import { Repo } from "../pages/common";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — REST Mail" },
      {
        name: "description",
        content: "What REST Mail is, why it exists, what it is made of, and who makes it. Open source, MIT.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <Doc
      eyebrow="About"
      kicker="An email server, explained."
      title="About REST Mail"
      lede="REST Mail is an email server with a REST API at its core. It speaks the old mail protocols to the rest of the world, and HTTPS to everything else."
    >
      <Section title="What it is">
        <p>
          Every mailbox operation is an HTTP request: sending, reading, searching, filing and filtering. Webmail, the
          mobile app, your scripts and your automations all use the same API.
        </p>
        <p>
          At the edge, REST Mail speaks SMTP, IMAP and POP3. Mail from anywhere still arrives, and any mail app still
          works. When two REST Mail servers meet, they recognise each other in the SMTP greeting and deliver the
          message over HTTPS instead.
        </p>
      </Section>

      <Section title="Why">
        <p>
          Email still runs on protocols from the 1980s. Running your own mail server means wiring Postfix, Dovecot and a
          pile of configuration together, then keeping them that way.
        </p>
        <p>
          REST Mail is one server you can script. The webmail, the app, the protocol gateways and your own scripts
          all go through the same API, and every sign-in and change is in its audit log.
        </p>
      </Section>

      <Section title="What it's made of">
        <h3>The server</h3>
        <p>
          Written in Go, on PostgreSQL. The REST API, DKIM, SPF, DMARC, ARC and MTA-STS, a filter pipeline with Sieve
          and JavaScript, webmail and admin tools. It runs in containers, and its Helm chart installs it on Kubernetes.{" "}
          <Repo name="rest-mail-server" />
        </p>
        <h3>The protocol gateways</h3>
        <p>
          SMTP, IMAP and POP3, part of the same server. Thunderbird, Apple Mail, Outlook and the rest connect to REST
          Mail as they would to any mail server.
        </p>
        <h3>The mobile app</h3>
        <p>
          For iPhone and Android. It reads REST Mail accounts over the API, and Gmail, iCloud, Yahoo, Fastmail or any
          IMAP account beside them. An administrator can run a REST Mail server from it. <Repo name="rest-mail-mobile" />
        </p>
        <h3>The libraries</h3>
        <p>
          The server is built on seven Go libraries of the project's own: POP3, IMAP, DKIM, ARC, DMARC, MTA-STS and
          Sieve. Each one works on its own.
        </p>
      </Section>

      <Section title="Open source">
        <p>
          All of it is open source under the MIT licence, at <a href={GITHUB}>github.com/rest-mail</a>. Use it, change
          it and run it however you like.
        </p>
        <p>
          You run your own server. The REST Mail project doesn't host your mail, and never sees it.
        </p>
      </Section>

      <Section title="Who makes it">
        <p>
          REST Mail is made by Antimatter Studios. It is young: version 0.x, and changing fast. If something is wrong
          or missing, <Link to="/contact">say so</Link>.
        </p>
      </Section>
    </Doc>
  );
}
