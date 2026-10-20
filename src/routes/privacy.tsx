import { createFileRoute, Link } from "@tanstack/react-router";
import { Doc, Section } from "../designs";
import { ContactAddress } from "../pages/common";

// When this text last changed in substance. Move it with every such change:
// the page says it at the top, and Google reads it.
const effective = { iso: "2026-10-17", text: "17 October 2026" };

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — REST Mail" },
      {
        name: "description",
        content:
          "What rest-mail.com and the REST Mail app collect, which is almost nothing, and what happens to your mail. Includes Google's Limited Use disclosure.",
      },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <Doc
      eyebrow="Privacy"
      kicker={
        <>
          Effective <time dateTime={effective.iso}>{effective.text}</time>
        </>
      }
      title="Privacy policy"
      lede="What this website and the REST Mail app collect, which is almost nothing, and where your mail goes, which is only where you send it."
    >
      <Section title="In short" id="summary">
        <ul>
          <li>This website has no analytics, no cookies and no tracking, and it loads nothing from anywhere else.</li>
          <li>
            The app keeps your passwords and sign-ins on your phone. It talks to the mail servers you add, and sends
            nothing to us.
          </li>
          <li>Your mail stays between you and your mail server. The REST Mail project never receives it.</li>
        </ul>
        <p>
          Effective date: <time dateTime={effective.iso}>{effective.text}</time>. Questions about privacy go to{" "}
          <ContactAddress />.
        </p>
      </Section>

      <Section title="Who we are" id="who">
        <p>
          REST Mail is an open source project made by Antimatter Studios. In this policy, "we" means the people who
          make REST Mail and run rest-mail.com.
        </p>
        <p>
          REST Mail is software you run, not a service we provide. We make the website, the mail server and the app;
          we don't run your mail.
        </p>
      </Section>

      <Section title="This website" id="website">
        <ul>
          <li>No analytics, no advertising, no cookies, and nothing that follows you from site to site.</li>
          <li>
            Everything on these pages comes from rest-mail.com, typefaces included. Nothing loads from Google, from a
            CDN or from anywhere else. Links to GitHub take you there only if you follow them.
          </li>
          <li>
            Your browser sends your IP address with every request, as it does to every website. The server uses it to
            send the page back, and doesn't keep it.
          </li>
          <li>
            The server that runs this site keeps no log of requests: no IP addresses, no pages, no browsers. It writes
            a line when it starts and a line when something breaks, and neither says anything about who was visiting.
            Those lines are kept only with the running server, and go when it is replaced. The proxy in front of it,
            which handles HTTPS, keeps no log of requests either.
          </li>
          <li>The site runs on a server the project rents from Contabo.</li>
        </ul>
        <h3>Setup links</h3>
        <p>
          A setup link from a REST Mail server (<code>rest-mail.com/setup#…</code>) carries its details after the{" "}
          <code>#</code>. Browsers never send that part to a web server, so this site can't see it, and nor can its
          logs. The page reads it in your browser, only to show it to you.
        </p>
      </Section>

      <Section title="The mobile app" id="app">
        <ul>
          <li>
            There is no REST Mail account to make. You add the mail accounts you already have: on a REST Mail server,
            or at Gmail, iCloud and other providers.
          </li>
          <li>
            The app talks to the servers you add, and to the few services below that help it find them. It has no
            analytics, no advertising and no crash-reporting service, and it sends nothing to us.
          </li>
          <li>
            Passwords and sign-ins stay on your phone, in the iPhone's Keychain, or encrypted with a key in Android's
            Keystore. On an iPhone they are kept for that device only, and never sync to another. For a REST Mail account, the app sends your
            password once, to sign in, and then keeps only the session. For Gmail and other IMAP accounts it keeps the
            password or app password, because IMAP and SMTP ask for it every time they connect.
          </li>
          <li>
            Settings, such as your signature and the app's appearance, are stored on the phone. Recent searches are
            forgotten when the app closes.
          </li>
          <li>
            Every connection is encrypted. The app refuses servers that don't offer TLS, and its certificate checks
            can't be turned off.
          </li>
          <li>
            Pictures in HTML mail that come from elsewhere stay blocked until you tap Load. Loading them fetches them
            from the sender's servers, which can then tell that you opened the message.
          </li>
          <li>
            Scanning a setup QR code uses the camera, on the phone. On an iPhone, Apple's Vision framework reads the
            code. On Android, Google's ML Kit does; Google says ML Kit may contact Google for updates and send it
            measurements of how well it works. The camera picture isn't sent anywhere.
          </li>
          <li>
            If you have told your phone to share crash reports with app developers, Apple or Google may pass us a
            report when the app crashes. That is your phone's setting, not the app's, and a report holds no mail.
          </li>
        </ul>
      </Section>

      <Section title="Finding your servers" id="discovery">
        <p>When you add an account, the app looks up where its servers are.</p>
        <ul>
          <li>
            For a REST Mail account, it asks your address's domain, and <code>mail.</code> in front of it, whether a
            REST Mail server answers there.
          </li>
          <li>For Gmail, iCloud, Yahoo, Fastmail and Outlook.com it knows the servers already, and asks no one.</li>
          <li>
            For any other address it tries, in this order: Thunderbird's autoconfig database (
            <code>autoconfig.thunderbird.net</code>), with your domain only, never your full address; your mail
            provider's own settings file, at your domain, with your full address, as that standard asks; then your
            domain's DNS records, looked up through Cloudflare's DNS over HTTPS (<code>cloudflare-dns.com</code>), with
            your domain only.
          </li>
        </ul>
        <p>
          Each of these sees the domain it is asked about and your phone's IP address, as any server you connect to
          does. Their own privacy policies apply to them.
        </p>
      </Section>

      <Section title="Gmail and Outlook" id="gmail-outlook">
        <h3>With an app password</h3>
        <p>
          Gmail is added with an app password you make in your Google account. The app keeps it in the Keychain or
          Keystore and sends it only to Google's mail servers, to sign in. You can revoke it in your Google account at
          any time.
        </p>
        <h3>With Google or Microsoft sign-in</h3>
        <p>
          Where the app offers <strong>Sign in with Google</strong> or <strong>Sign in with Microsoft</strong>, you
          sign in on Google's or Microsoft's own page, in your phone's browser. The app never sees your Google or
          Microsoft password. It receives a token that lets it read and send your mail over IMAP and SMTP, keeps the
          token in the Keychain or Keystore, and uses it only to connect to Google's or Microsoft's mail servers. You
          can withdraw its access at any time in your Google or Microsoft account. Signing out of a Google account in
          the app hands its token back to Google.
        </p>
        <p>
          Either way, your mail goes directly between your phone and Google or Microsoft. It doesn't pass through any
          server of ours.
        </p>
      </Section>

      <Section title="Google user data" id="google">
        <p>
          This is about the data the app receives from Google's APIs when you sign in with a Google account.
        </p>
        <ul>
          <li>
            <strong>What the app accesses:</strong> your Gmail messages, labels and folders, through Gmail's IMAP and
            SMTP; and your Google account's email address and name, to label the account in the app.
          </li>
          <li>
            <strong>How it uses it:</strong> only to show you your mail, and to send, label, move and delete mail when
            you ask it to. For nothing else.
          </li>
          <li>
            <strong>Where it's kept:</strong> on your phone. The sign-in token is in the Keychain or Keystore. Your mail
            stays in Gmail, and the app fetches it from there to show it to you.
          </li>
          <li>
            <strong>Who it's shared with:</strong> no one. The app sends no Google user data to us or to anyone else.
            Nobody at REST Mail reads it. It is not used for advertising, not sold, and not used to train AI models.
          </li>
          <li>
            <strong>Deleting it:</strong> sign out of the account in the app, which deletes the token from your phone
            and hands it back to Google, or remove REST Mail's access in your Google account's security settings.
          </li>
        </ul>
        <p className="doc-note">
          REST Mail's use and transfer to any other app of information received from Google APIs will adhere to the{" "}
          <a href="https://developers.google.com/terms/api-services-user-data-policy">
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
      </Section>

      <Section title="Push notifications" id="push">
        <p>
          The app doesn't get notifications while it is closed yet. When it does, your mail server will send Apple or
          Google only a signal to check for mail: the number your server gave your phone, which of your accounts it is
          for, and how many messages are unread. Never the sender, the subject or any of the message. The app then fetches the new mail from your server
          itself, so none of it passes through Apple or Google.
        </p>
      </Section>

      <Section title="Mail servers people run" id="servers">
        <p>
          Every REST Mail server is run by someone: you, your company, or whoever set it up for you. That operator
          holds the server's mail, accounts and logs, decides what it keeps and for how long, and is responsible for
          it. Ask them how they look after your data.
        </p>
        <p>
          The REST Mail project doesn't run your server, and receives nothing from it: the server sends us no data of
          any kind.
        </p>
      </Section>

      <Section title="When you write to us" id="writing">
        <p>
          If you email <ContactAddress />, we receive your address and what you wrote, and use them only to answer
          you. We keep the conversation while it is useful, and delete it if you ask.
        </p>
        <p>Issues and discussions on GitHub are public, and GitHub's privacy statement covers them.</p>
      </Section>

      <Section title="Your rights" id="rights">
        <p>
          You can ask us what we hold about you, and have it corrected or deleted. As this site and the app collect
          nothing about you, that usually means emails you have sent us. If you are in the EU or the UK, you can also
          complain to a data protection authority.
        </p>
      </Section>

      <Section title="Changes" id="changes">
        <p>
          When what we do changes, this policy changes with it, and the effective date at the top moves. Every version
          is public, in the{" "}
          <a href="https://github.com/rest-mail/website/commits/master/src/routes/privacy.tsx">
            history of this page
          </a>{" "}
          on GitHub.
        </p>
      </Section>

      <Section title="Contact" id="contact">
        <p>
          Questions about privacy, or about this policy: <ContactAddress />. Other ways to reach the project are on the{" "}
          <Link to="/contact">contact page</Link>.
        </p>
      </Section>
    </Doc>
  );
}
