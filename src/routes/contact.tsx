import { createFileRoute, Link } from "@tanstack/react-router";
import { Doc, Section } from "../designs";
import { ContactAddress, Repo } from "../pages/common";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — REST Mail" },
      { name: "description", content: "How to reach the REST Mail project: email, and GitHub issues for bugs." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <Doc
      eyebrow="Contact"
      kicker="Write to us."
      title="Contact"
      lede="REST Mail is a small open source project. Here is how to reach the people who make it."
    >
      <Section title="Email" id="email">
        <p>
          Write to <ContactAddress />. It reaches the people who make REST Mail. We read everything, and answer as
          soon as we can.
        </p>
      </Section>

      <Section title="Bugs and ideas" id="issues">
        <p>Open an issue on GitHub, in the repository it is about:</p>
        <ul>
          <li>
            <Repo name="rest-mail-server" />: the mail server, its API and its gateways.
          </li>
          <li>
            <Repo name="rest-mail-mobile" />: the app for iPhone and Android.
          </li>
          <li>
            <Repo name="website" />: this website.
          </li>
        </ul>
        <p>Issues are public. Leave out passwords, addresses and anything from your mail.</p>
      </Section>

      <Section title="Security problems" id="security">
        <p>
          Please don't open a public issue for a vulnerability. Email <ContactAddress /> instead. The{" "}
          <Link to="/security">security page</Link> says what to include.
        </p>
      </Section>

      <Section title="Privacy" id="privacy">
        <p>
          Questions about privacy go to <ContactAddress /> too. The <Link to="/privacy">privacy policy</Link> says what
          we keep, which is almost nothing.
        </p>
      </Section>

      <Section title="Your mail server" id="your-server">
        <p>
          If your mail is on a REST Mail server someone else runs, such as your company's, they run it, not us. Ask
          them first: we can't see your server, your mailbox or your mail.
        </p>
      </Section>
    </Doc>
  );
}
