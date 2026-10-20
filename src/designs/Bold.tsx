import type { CSSProperties, ReactNode } from "react";
import Handshake from "../Handshake";
import { Brand, GitHubLink, PageLinks, type DocProps, type DocSectionProps, type Tweaks } from "./common";


/**
 * Option B — BOLD
 * Maximum impact. Oversized type that bleeds the column, acid lime accent,
 * thick rules, "tabloid front page" energy. Cheeky copy front and center.
 */
const OptionBold = ({ tweaks = {} }: { tweaks?: Tweaks }) => {
  const speed = tweaks.speed || 700;
  const cheeky = tweaks.cheeky !== false;

  return (
    <>
      {/* Hero — gigantic */}
      <section className="bold-hero">
        <div className="bold-hero-meta">
          <div className="bold-hero-stamp">
            <div className="bold-stamp-line">REST MAIL</div>
            <div className="bold-stamp-line">vol. 1 · no. 1</div>
            <div className="bold-stamp-line">apr · 2026</div>
          </div>
          <div className="bold-hero-tag">
            {cheeky ? "Free with the price of a docker pull." : "Open source. MIT. Self-hosted."}
          </div>
        </div>

        <h1 className="bold-hero-title">
          <span className="bold-line bold-line-1">Mail</span>
          <span className="bold-line bold-line-2"><em>is</em></span>
          <span className="bold-line bold-line-3">finally</span>
          <span className="bold-line bold-line-4 bold-accent-block">at REST.</span>
        </h1>

        <div className="bold-hero-deck">
          <p>
            {cheeky ? (
              <>SMTP, IMAP and POP3 walked into the bar in 1986 and never left. We turned out the lights. <em>You're welcome.</em></>
            ) : (
              <>A REST-native email server that speaks SMTP/IMAP/POP3 at the edge and HTTPS at the core. Two REST Mail servers find each other and skip the legacy dance entirely.</>
            )}
          </p>
        </div>

        <div className="bold-hero-actions">
          <a className="bold-btn bold-btn-accent" href="#">▶ TRY THE WEBMAIL</a>
          <a className="bold-btn bold-btn-ink" href="#">$ docker run rest-mail</a>
        </div>
      </section>

      {/* Hero animation strip */}
      <section className="bold-strip">
        <div className="bold-strip-meta">
          <div className="bold-strip-label rm-eyebrow">Live Capture · Fig. 1</div>
          <div className="bold-strip-cap">
            Watch two servers ditch a 44-year-old protocol mid-handshake.
          </div>
        </div>
        <Handshake variant="bold" speed={speed} />
      </section>

      {/* Tabloid stat row */}
      <section className="bold-stats">
        <div className="bold-stat">
          <div className="bold-stat-num">12<span>ms</span></div>
          <div className="bold-stat-cap">peer-to-peer<br/>delivery latency</div>
        </div>
        <div className="bold-stat">
          <div className="bold-stat-num">0<span>cfg</span></div>
          <div className="bold-stat-cap">to upgrade<br/>existing peers</div>
        </div>
        <div className="bold-stat">
          <div className="bold-stat-num">3<span>RFCs</span></div>
          <div className="bold-stat-cap">retired<br/>with honors</div>
        </div>
        <div className="bold-stat bold-stat-accent">
          <div className="bold-stat-num">∞</div>
          <div className="bold-stat-cap">peace of mind<br/>per mailbox</div>
        </div>
      </section>

      {/* Editorial pull quote */}
      <section className="bold-pull">
        <blockquote>
          <span className="bold-quote-mark">“</span>
          The protocols served us well. They served us in <em>1982</em>.
          They served us in <em>1996</em>. They are still serving us in <em>2026</em>.
          That, friends, is the problem.
          <span className="bold-quote-mark bold-quote-close">”</span>
        </blockquote>
        <div className="bold-pull-attr">— the README, paraphrased</div>
      </section>

      {/* How — three big tiles */}
      <section className="bold-how" id="how">
        <div className="bold-section-head">
          <div className="bold-section-num">§ 01</div>
          <h2>The handshake, declassified.</h2>
        </div>
        <div className="bold-how-grid">
          <article className="bold-how-tile">
            <div className="bold-tile-num">01</div>
            <h3>DNS shows up first.</h3>
            <p>A TXT record at <code>_restmail.&lt;domain&gt;</code> says: yes, I speak REST. No record? Fall back to SMTP, sigh dramatically, continue.</p>
            <pre><code>$ dig TXT _restmail.example.com{"\n"}; v=restmail1{"\n"}; endpoint=https://mail.example.com/v1</code></pre>
          </article>
          <article className="bold-how-tile">
            <div className="bold-tile-num">02</div>
            <h3>EHLO does its thing.</h3>
            <p>The SMTP handshake advertises <code>X-RESTMAIL v1</code>. Both sides agree. The protocol upgrade fires before any mail body is sent.</p>
            <pre><code>S: 250-mail Hello{"\n"}S: 250-STARTTLS{"\n"}S: 250 X-RESTMAIL v1</code></pre>
          </article>
          <article className="bold-how-tile bold-how-tile-accent">
            <div className="bold-tile-num">03</div>
            <h3>HTTPS carries the bag.</h3>
            <p>Skip the SMTP transaction entirely. Sender POSTs a JSON envelope to the recipient's REST endpoint with a signed JWT. Done in 12ms.</p>
            <pre><code>POST /v1/deliver HTTP/2{"\n"}Authorization: Bearer ‹jwt›{"\n"}{"{ delivered: true, ms: 12 }"}</code></pre>
          </article>
        </div>
      </section>

      {/* API ticker */}
      <section className="bold-api" id="api">
        <div className="bold-section-head bold-section-head-dark">
          <div className="bold-section-num">§ 02</div>
          <h2>Every mailbox op is a POST.</h2>
        </div>
        <div className="bold-api-rows">
          {[
            ["POST", "/v1/messages", "send a message"],
            ["GET", "/v1/messages", "list inbox"],
            ["GET", "/v1/messages/:id", "fetch one"],
            ["PATCH", "/v1/messages/:id", "label, archive, trash"],
            ["GET", "/v1/search?q=", "full-text search"],
            ["GET", "/v1/stream", "Server-Sent Events"],
            ["POST", "/v1/deliver", "peer-to-peer delivery"],
            ["POST", "/v1/sieve", "user filter scripts"],
          ].map(([m, p, d]) => (
            <div key={`${m} ${p}`} className="bold-api-row">
              <span className={`bold-api-method m-${m}`}>{m}</span>
              <span className="bold-api-path">{p}</span>
              <span className="bold-api-desc">{d}</span>
              <span className="bold-api-arrow">→</span>
            </div>
          ))}
        </div>
      </section>

      {/* Stack */}
      <section className="bold-stack" id="stack">
        <div className="bold-section-head">
          <div className="bold-section-num">§ 03</div>
          <h2>Built on what works.</h2>
        </div>
        <div className="bold-stack-row">
          {[
            "Go 1.24+", "PostgreSQL", "chi router", "React + Vite",
            "Bubble Tea", "Sieve", "SSE", "Docker Compose",
          ].map((s) => (
            <span key={s} className="bold-stack-chip">{s}</span>
          ))}
        </div>
      </section>

      {/* Final shout */}
      <section className="bold-cta">
        <h2>
          Send mail.<br/>
          <span className="bold-cta-strike">Cry over Postfix.</span><br/>
          <em>Sleep tonight.</em>
        </h2>
        <a className="bold-btn bold-btn-accent bold-btn-xl" href="#">$ docker run rest-mail →</a>
      </section>
    </>
  );
};

/**
 * Everything around a page in this design: the sticker nav with its marquee,
 * and the footer, the same on every page.
 */
export const BoldChrome = ({ tweaks = {}, children }: { tweaks?: Tweaks; children: ReactNode }) => {
  const accent = tweaks.accentBold || "#caff33";

  return (
    <div
      className="rm-page rm-bold"
      style={{ "--accent": accent, "--accent-ink": "#15110d", "--paper": "#f4f1ea" } as CSSProperties}
    >
      {/* Sticker nav */}
      <header className="bold-nav">
        <div className="bold-nav-row">
          <Brand className="bold-brand">
            <span className="bold-brand-mark">●</span>
            REST/MAIL
          </Brand>
          <nav className="bold-nav-links">
            <PageLinks />
          </nav>
          <GitHubLink className="bold-nav-cta">github →</GitHubLink>
        </div>
        <div className="bold-marquee">
          <div className="bold-marquee-track">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i}>
                R.I.P. SMTP 1982–2026 ✦ R.I.P. IMAP 1986–2026 ✦ R.I.P. POP3 1988–2026 ✦ NOW DELIVERING OVER HTTPS ✦ 
              </span>
            ))}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="bold-foot">
        <div>© 2026 REST MAIL · MIT · github.com/rest-mail</div>
        <nav className="site-foot-links">
          <PageLinks home />
        </nav>
        <div>The protocol is old. It needs to take a REST.</div>
      </footer>
    </div>
  );
};

/** A page of text in this design: a stamped front page, then numbered sections. */
export const BoldDoc = ({ eyebrow, kicker, title, lede, children }: DocProps) => (
  <article className="doc doc-bold">
    <header className="bold-hero doc-hero">
      <div className="bold-hero-meta">
        <div className="bold-hero-stamp">
          <div className="bold-stamp-line">REST MAIL</div>
          <div className="bold-stamp-line">{eyebrow}</div>
        </div>
        {kicker && <div className="bold-hero-tag">{kicker}</div>}
      </div>
      <h1 className="doc-title">{title}</h1>
      {lede && (
        <div className="bold-hero-deck doc-lede">
          <p>{lede}</p>
        </div>
      )}
    </header>
    {children}
  </article>
);

export const BoldDocSection = ({ title, id, children }: DocSectionProps) => (
  <section className="bold-how doc-section" id={id}>
    <div className="bold-section-head">
      <div className="bold-section-num doc-num" />
      <h2>{title}</h2>
    </div>
    <div className="doc-body">{children}</div>
  </section>
);

export default OptionBold;
