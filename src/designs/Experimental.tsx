import React, { type CSSProperties, type ReactNode } from "react";
import Handshake from "../Handshake";
import { Brand, GitHubLink, PageLinks, titleFit, type DocProps, type DocSectionProps, type Tweaks } from "./common";
import { experimentalTitleWidths } from "./titleWidths";


/**
 * Option C — EXPERIMENTAL
 * Zine / dataviz / sticker energy. Magenta + ink. Asymmetric grid, rotated
 * stickers, ASCII diagrams, copy that doesn't take itself seriously.
 */
const OptionExperimental = ({ tweaks = {} }: { tweaks?: Tweaks }) => {
  const speed = tweaks.speed || 700;

  const [tomb, setTomb] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTomb((t) => (t + 1) % 3), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* Hero collage */}
      <section className="exp-hero">
        <div className="exp-hero-canvas">
          {/* Big diagonal title */}
          <div className="exp-title-stack">
            <div className="exp-title-row exp-row-1">
              <span className="exp-word">REST</span>
              <span className="exp-mailtag">·mail·</span>
            </div>
            <div className="exp-title-row exp-row-2">
              <span className="exp-word exp-word-outline">in.</span>
              <span className="exp-word exp-word-fill">peace.</span>
            </div>
          </div>

          {/* Floating tombstone */}
          <div className="exp-sticker exp-tomb">
            <div className="exp-tomb-cross">✝</div>
            <div className="exp-tomb-name">
              {["SMTP", "IMAP", "POP3"][tomb]}
            </div>
            <div className="exp-tomb-dates">
              {[["1982", "2026"], ["1986", "2026"], ["1988", "2026"]][tomb].join(" — ")}
            </div>
            <div className="exp-tomb-cap">forever offline</div>
          </div>

          {/* Sticker: stamp */}
          <div className="exp-sticker exp-stamp">
            <div className="exp-stamp-inner">
              <div>★ vol 1 ★</div>
              <div>apr 2026</div>
              <div>★ MIT ★</div>
            </div>
          </div>

          {/* Lede card */}
          <div className="exp-lede-card">
            <div className="exp-lede-tag">// the pitch</div>
            <p>
              Email's plumbing was last rethought when the <em>USSR</em> still existed.
              REST Mail is a modern email server that speaks SMTP at the front desk
              and HTTPS in the back office.
            </p>
            <p className="exp-lede-mini">
              Two REST Mail servers find each other → <strong>they skip SMTP entirely.</strong>
            </p>
            <div className="exp-lede-cta">
              <a className="exp-btn" href="#"><span>▶</span> launch webmail</a>
              <a className="exp-btn exp-btn-ghost" href="#"><span>$</span> docker run</a>
            </div>
          </div>
        </div>
      </section>

      {/* Live capture / handshake */}
      <section className="exp-capture">
        <div className="exp-cap-meta">
          <div className="exp-cap-label">EXHIBIT A</div>
          <h2>The handshake, on tape.</h2>
          <p>
            Server A picks up the line, reads its capabilities. Halfway through it
            says "actually, we both speak HTTP, let's just do that." And we do.
          </p>
          <div className="exp-cap-arrows">
            <div className="exp-cap-step"><span className="exp-cap-step-n">1.</span> EHLO and small talk</div>
            <div className="exp-cap-step"><span className="exp-cap-step-n">2.</span> oh, you speak REST?</div>
            <div className="exp-cap-step exp-cap-step-hot"><span className="exp-cap-step-n">3.</span> POST /v1/deliver</div>
          </div>
        </div>
        <div className="exp-cap-frame">
          <div className="exp-cap-tape">▸ ▸ ▸ recording ▸ ▸ ▸</div>
          <Handshake variant="experimental" speed={speed} />
        </div>
      </section>

      {/* Handshake declassified — three tiles */}
      <section className="exp-declass">
        <div className="exp-declass-head">
          <div className="exp-declass-tag">
            <span className="exp-stamp-mini">CLASSIFIED</span>
            <span className="exp-stamp-mini exp-stamp-mini-redact">DECLASSIFIED</span>
          </div>
          <h2>The handshake, declassified.</h2>
          <p className="exp-declass-sub">Three steps. No configuration. No séance.</p>
        </div>
        <div className="exp-declass-grid">
          <article className="exp-declass-tile">
            <div className="exp-declass-num">01</div>
            <h3>DNS shows up first.</h3>
            <p>A TXT record at <code>_restmail.&lt;domain&gt;</code> announces the endpoint. No record? Fall back to SMTP, sigh dramatically, continue.</p>
            <pre><code>$ dig TXT _restmail.example.com{"\n"}; v=restmail1{"\n"}; endpoint=https://mail.example.com/v1</code></pre>
          </article>
          <article className="exp-declass-tile">
            <div className="exp-declass-num">02</div>
            <h3>EHLO does its thing.</h3>
            <p>The SMTP handshake advertises <code>X-RESTMAIL v1</code>. Both sides nod. The protocol upgrade fires before any mail body crosses the wire.</p>
            <pre><code>S: 250-mail Hello{"\n"}S: 250-STARTTLS{"\n"}S: 250 X-RESTMAIL v1</code></pre>
          </article>
          <article className="exp-declass-tile exp-declass-tile-hot">
            <div className="exp-declass-num">03</div>
            <h3>HTTPS carries the bag.</h3>
            <p>Skip the SMTP transaction entirely. Sender POSTs a JSON envelope to the recipient's REST endpoint with a signed JWT. Done in 12ms.</p>
            <pre><code>POST /v1/deliver HTTP/2{"\n"}Authorization: Bearer ‹jwt›{"\n"}{"{ delivered: true, ms: 12 }"}</code></pre>
          </article>
        </div>
      </section>

      {/* ASCII architecture */}
      <section className="exp-ascii">
        <div className="exp-ascii-head">
          <div className="exp-ascii-tag">// figure 02 · the topology</div>
          <h2>Three domains, two protocols, one upgrade.</h2>
        </div>
        <pre className="exp-ascii-art">
{`   ┌─────────────┐       SMTP        ┌─────────────┐       SMTP↗REST       ┌─────────────────┐
   │  mail1.test │  ◀── :25 ────▶   │  mail2.test │  ◀── upgrades ──▶    │  mail3.test  ★  │
   │  postfix    │                   │  postfix    │                       │  REST Mail      │
   │  + dovecot  │                   │  + dovecot  │                       │  (REST native)  │
   └─────────────┘                   └─────────────┘                       └─────────────────┘
          │                                  │                                       │
          └─────── legacy world ─────────────┘                                       ▼
                                                                              POST /v1/deliver
                                                                              { delivered: 12ms }`}
        </pre>
        <div className="exp-ascii-cap">
          mail1 ↔ mail2 stay vintage. anyone talking to mail3 quietly upgrades.
          the old guard never finds out.
        </div>
      </section>

      {/* Pull quote */}
      <section className="exp-pull">
        <div className="exp-pull-tag">// from the README, paraphrased</div>
        <blockquote>
          <span className="exp-quote-mark">“</span>
          The protocols served us well. They served us in <em>1982</em>.
          They served us in <em>1996</em>. They are still serving us in <em>2026</em>.
          That, friends, is the problem.
          <span className="exp-quote-mark exp-quote-close">”</span>
        </blockquote>
        <div className="exp-pull-attr">— rest-mail/README.md</div>
      </section>

      {/* Big numbers in random card stack */}
      <section className="exp-numbers">
        <div className="exp-num-card exp-num-1">
          <div className="exp-num-label">peer delivery</div>
          <div className="exp-num-value">12<sub>ms</sub></div>
        </div>
        <div className="exp-num-card exp-num-2">
          <div className="exp-num-label">years SMTP served us</div>
          <div className="exp-num-value">44</div>
          <div className="exp-num-foot">we're grateful, truly</div>
        </div>
        <div className="exp-num-card exp-num-3">
          <div className="exp-num-label">config to upgrade peers</div>
          <div className="exp-num-value">0<sub>lines</sub></div>
        </div>
        <div className="exp-num-card exp-num-4">
          <div className="exp-num-label">deployable as</div>
          <div className="exp-num-value">1<sub>binary</sub></div>
          <div className="exp-num-foot">go static · linux/arm64</div>
        </div>
        <div className="exp-num-card exp-num-5">
          <div className="exp-num-label">RFCs honored</div>
          <div className="exp-num-value">∞</div>
          <div className="exp-num-foot">we read them. all of them.</div>
        </div>
      </section>

      {/* API as receipt */}
      <section className="exp-api">
        <div className="exp-receipt">
          <div className="exp-receipt-head">
            <div>★★★ REST MAIL ★★★</div>
            <div className="exp-mono-mini">v1 // your.box@example.com</div>
            <div className="exp-receipt-rule">─────────────────────────────</div>
          </div>
          {[
            ["POST", "/v1/messages", "send"],
            ["GET", "/v1/messages", "inbox"],
            ["GET", "/v1/messages/:id", "fetch"],
            ["PATCH", "/v1/messages/:id", "label"],
            ["GET", "/v1/search", "find"],
            ["GET", "/v1/stream", "SSE"],
            ["POST", "/v1/deliver", "p2p"],
            ["POST", "/v1/sieve", "filter"],
          ].map(([m, p, d]) => (
            <div key={`${m} ${p}`} className="exp-receipt-row">
              <span className={`exp-receipt-m m-${m}`}>{m}</span>
              <span className="exp-receipt-p">{p}</span>
              <span className="exp-receipt-d">{d}</span>
            </div>
          ))}
          <div className="exp-receipt-foot">
            <div className="exp-receipt-rule">─────────────────────────────</div>
            <div>thank you for not running postfix</div>
            <div>★ keep this slip for your records ★</div>
          </div>
        </div>
        <div className="exp-api-side">
          <div className="exp-side-tag">// figure 03</div>
          <h2>Every box. Every op. <em>One</em> protocol.</h2>
          <p>
            No webhook adapter. No IMAP wrapper. No "REST API on top of Dovecot." This
            is the storage layer. It just happens to be HTTP.
          </p>
          <div className="exp-side-stack">
            <div className="exp-side-row"><strong>store →</strong> postgres + content-addressable blobs</div>
            <div className="exp-side-row"><strong>auth →</strong> jwt + per-mailbox scopes</div>
            <div className="exp-side-row"><strong>realtime →</strong> SSE, no polling</div>
            <div className="exp-side-row"><strong>filters →</strong> sieve + javascript hooks</div>
          </div>
        </div>
      </section>

      {/* Final scream */}
      <section className="exp-cta">
        <div className="exp-cta-grid">
          <div className="exp-cta-headline">
            <h2>
              <span>It's 2026.</span>
              <em>Stop fighting Postfix.</em>
              <span className="exp-cta-final">RUN THIS:</span>
            </h2>
          </div>
          <div className="exp-cta-cmd">
            <span className="exp-cta-prompt">$</span>
            <span className="exp-cta-typed">docker run -p 25:25 -p 443:443 ghcr.io/rest-mail/server</span>
            <span className="exp-cta-cursor">▍</span>
          </div>
          <div className="exp-cta-row">
            <a className="exp-btn exp-btn-big" href="#">github →</a>
            <a className="exp-btn exp-btn-big exp-btn-ghost" href="#">docs →</a>
            <span className="exp-cta-note">$0 · MIT · self-hosted</span>
          </div>
        </div>
      </section>
    </>
  );
};

/**
 * Everything around a page in this design: the status bar, a row of page
 * stickers, and the footer, the same on every page.
 */
export const ExperimentalChrome = ({ tweaks = {}, children }: { tweaks?: Tweaks; children: ReactNode }) => {
  const accent = tweaks.accentExp || "#ff2d6f";

  return (
    <div
      className="rm-page rm-exp"
      style={{ "--accent": accent, "--accent-ink": "#fff", "--paper": "#f0ece2" } as CSSProperties}
    >
      {/* Top status bar */}
      <header className="exp-top">
        <div className="exp-top-row">
          <Brand className="exp-pill">SYS://rest-mail.exe</Brand>
          <span className="exp-top-mid">— a zine about turning email off and on again —</span>
          <span className="exp-pill exp-pill-blink">● LIVE</span>
        </div>
      </header>
      <nav className="exp-nav">
        <PageLinks />
        <GitHubLink className="exp-nav-gh">github →</GitHubLink>
      </nav>

      <main>{children}</main>

      <footer className="exp-foot">
        <div className="exp-foot-mark">REST/MAIL</div>
        <div>made in protest of `tail -f /var/log/maillog`</div>
        <nav className="site-foot-links">
          <PageLinks home />
        </nav>
        <div className="exp-foot-meta">2026 · MIT · github.com/rest-mail</div>
      </footer>
    </div>
  );
};

/** A page of text in this design: stamps and a big title, then sections filed as figures. */
export const ExperimentalDoc = ({ eyebrow, kicker, title, lede, children }: DocProps) => (
  <article className="doc doc-exp">
    <header className="exp-declass doc-hero">
      <div className="exp-declass-head">
        <div className="exp-declass-tag">
          <span className="exp-stamp-mini">{eyebrow}</span>
          {kicker && <span className="exp-stamp-mini doc-stamp-hot">{kicker}</span>}
        </div>
        <h1 className="doc-title" style={titleFit(title, experimentalTitleWidths)}>
          {title}
        </h1>
        {lede && <p className="exp-declass-sub doc-lede">{lede}</p>}
      </div>
    </header>
    {children}
  </article>
);

export const ExperimentalDocSection = ({ title, id, children }: DocSectionProps) => (
  <section className="exp-declass doc-section" id={id}>
    <div className="doc-num" />
    <h2>{title}</h2>
    <div className="doc-body">{children}</div>
  </section>
);

export default OptionExperimental;
