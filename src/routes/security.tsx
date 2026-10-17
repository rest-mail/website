import { createFileRoute } from "@tanstack/react-router";
import { Doc, Section } from "../designs";
import { ContactAddress, Repo } from "../pages/common";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security — REST Mail" },
      { name: "description", content: "How to report a vulnerability in REST Mail, privately." },
    ],
  }),
  component: Security,
});

function Security() {
  return (
    <Doc
      eyebrow="Security"
      kicker="Tell us first."
      title="Reporting a vulnerability"
      lede="Found a security problem in REST Mail? Tell us privately, so it can be fixed before anyone else hears of it."
    >
      <Section title="How to report it" id="report">
        <p>
          Report it privately on GitHub, in the repository it affects: open its <strong>Security</strong> tab and choose{" "}
          <strong>Report a vulnerability</strong>. Only the maintainers see it. For the mail server, that is{" "}
          <a href="https://github.com/rest-mail/rest-mail-server/security/advisories/new">
            rest-mail-server's private report form
          </a>
          .
        </p>
        <p>
          Or email <ContactAddress />, with "Security" in the subject. Either way, please don't open a public GitHub issue
          for it.
        </p>
        <p>Tell us:</p>
        <ul>
          <li>what is affected: the server, the app or this website, and which version;</li>
          <li>how to make it happen, step by step;</li>
          <li>what someone could do with it.</li>
        </ul>
      </Section>

      <Section title="What happens next" id="next">
        <p>
          We confirm that we have your report, work on a fix, and tell you when it is out. We would like to thank you
          by name in the release notes; say if you would rather not be named.
        </p>
      </Section>

      <Section title="What it covers" id="scope">
        <ul>
          <li>
            The mail server and its gateways: <Repo name="rest-mail-server" />.
          </li>
          <li>
            The app for iPhone and Android: <Repo name="rest-mail-mobile" />.
          </li>
          <li>The project's Go libraries, at github.com/rest-mail.</li>
          <li>
            This website: <Repo name="website" />.
          </li>
        </ul>
        <p>
          A REST Mail server someone else runs is theirs. A problem with how it is set up goes to its operator; a bug in
          REST Mail itself comes to us.
        </p>
      </Section>

      <Section title="Please don't" id="rules">
        <ul>
          <li>read other people's mail, or get into their accounts;</li>
          <li>disrupt servers that aren't yours;</li>
          <li>trick people into helping you.</li>
        </ul>
        <p>Test against a server you installed yourself.</p>
      </Section>

      <Section title="For machines" id="security-txt">
        <p>
          The same, in the standard form (RFC 9116), is at{" "}
          <a href="/.well-known/security.txt">/.well-known/security.txt</a>.
        </p>
      </Section>
    </Doc>
  );
}
