import type { CSSProperties, ReactNode } from "react";
import Handshake from "../Handshake";
import { Brand, GitHubLink, PageLinks, type DocProps, type DocSectionProps, type Tweaks } from "./common";


/**
 * Option A — SAFE
 * "The Editorial". Big serif headline, mono micro-labels, two-column dense
 * grid, electric cobalt accent. Confident but not loud.
 */
const OptionSafe = ({ tweaks = {} }: { tweaks?: Tweaks }) => {
  const speed = tweaks.speed || 700;
  const cheeky = tweaks.cheeky !== false;

  return (
    <>
      {/* Masthead */}
      <section className="safe-masthead">
        <div className="safe-mast-grid">
          <div className="safe-mast-meta">
            <div className="rm-eyebrow">Issue 001 · April 2026</div>
            <div className="rm-eyebrow safe-mast-section">Infrastructure / Obituary</div>
          </div>
          <div className="safe-mast-eyebrow">
            {cheeky ? "An obituary, and an upgrade." : "A modern email server."}
          </div>
        </div>
        <div className="rm-rule-thin" />
      </section>

      {/* Hero */}
      <section className="safe-hero">
        <div className="safe-hero-grid">
          <div className="safe-hero-headline">
            <h1>
              SMTP is dead.<br/>
              <span className="safe-accent-word">Long live</span><br/>
              the REST.
            </h1>
            <div className="safe-hero-deck">
              <p>
                {cheeky ? (
                  <>A modern, REST-native email server that speaks SMTP to the world out of <em>politeness</em>—and HTTPS to its peers because it's <em>2026</em>.</>
                ) : (
                  <>A modern, REST-native email server. Speaks SMTP/IMAP/POP3 at the edge, REST in the core. Two REST Mail servers auto-upgrade to HTTPS.</>
                )}
              </p>
            </div>
            <div className="safe-hero-actions">
              <a className="rm-btn rm-btn-accent" href="#">▶ Try Webmail</a>
              <a className="rm-btn rm-btn-ghost" href="#">$ docker run · 1 line</a>
            </div>
          </div>
          <div className="safe-hero-media">
            <div className="safe-hero-caption rm-eyebrow">
              Fig. 01 · Live capture
            </div>
            <Handshake variant="safe" speed={speed} />
            <div className="safe-hero-caption rm-eyebrow safe-hero-caption-bottom">
              Two servers shake hands. After EHLO, the connection upgrades to a single HTTPS POST.
            </div>
          </div>
        </div>
      </section>

      <div className="rm-rule" />

      {/* Obituary card */}
      <section className="safe-obit">
        <div className="safe-obit-grid">
          <div className="safe-obit-cell">
            <div className="rm-eyebrow">In Memoriam</div>
            <div className="safe-obit-name">SMTP</div>
            <div className="safe-obit-dates">RFC 821 · 1982 — 2026</div>
            <div className="safe-obit-quote">
              {cheeky ? "Survived by 5,000 unread Postfix log lines." : "Forty-four years of faithful service."}
            </div>
          </div>
          <div className="safe-obit-cell">
            <div className="rm-eyebrow">In Memoriam</div>
            <div className="safe-obit-name">IMAP</div>
            <div className="safe-obit-dates">RFC 3501 · 1986 — 2026</div>
            <div className="safe-obit-quote">
              {cheeky ? "May your IDLE finally rest." : "A complex protocol gracefully retired."}
            </div>
          </div>
          <div className="safe-obit-cell">
            <div className="rm-eyebrow">In Memoriam</div>
            <div className="safe-obit-name">POP3</div>
            <div className="safe-obit-dates">RFC 1939 · 1988 — 2026</div>
            <div className="safe-obit-quote">
              {cheeky ? "USER. PASS. RETR. QUIT. We hardly knew ye." : "Simple to the end."}
            </div>
          </div>
        </div>
      </section>

      <div className="rm-rule" />

      {/* Why / How */}
      <section className="safe-section" id="why">
        <div className="safe-section-grid">
          <div className="safe-section-label">
            <div className="rm-eyebrow">§ I</div>
            <h2>The pitch, in one breath.</h2>
          </div>
          <div className="safe-section-body">
            <p className="safe-lede">
              Every mailbox operation—send, receive, search, label, filter—is an HTTP endpoint.
              When two REST Mail servers find each other, they skip SMTP entirely and POST.
            </p>
            <div className="safe-pull-row">
              <div className="safe-pull">
                <div className="safe-pull-num">~12<span>ms</span></div>
                <div className="safe-pull-cap">peer delivery</div>
              </div>
              <div className="safe-pull">
                <div className="safe-pull-num">3<span>protocols</span></div>
                <div className="safe-pull-cap">spoken at the edge</div>
              </div>
              <div className="safe-pull">
                <div className="safe-pull-num">0<span>config</span></div>
                <div className="safe-pull-cap">to upgrade peers</div>
              </div>
              <div className="safe-pull">
                <div className="safe-pull-num">1<span>binary</span></div>
                <div className="safe-pull-cap">go static build</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="rm-rule" />

      {/* How — three columns */}
      <section className="safe-section" id="how">
        <div className="safe-section-grid">
          <div className="safe-section-label">
            <div className="rm-eyebrow">§ II</div>
            <h2>How the upgrade works.</h2>
            <p className="safe-section-sub">
              Three steps. No configuration. No magic.
            </p>
          </div>
          <div className="safe-section-body">
            <ol className="safe-steps">
              <li>
                <div className="safe-step-num">01</div>
                <div className="safe-step-body">
                  <h3>DNS Discovery</h3>
                  <p>A TXT record at <code>_restmail.&lt;domain&gt;</code> announces the endpoint.</p>
                  <pre><code>$ dig TXT _restmail.example.com{"\n"}"v=restmail1 endpoint=https://mail.example.com/v1"</code></pre>
                </div>
              </li>
              <li>
                <div className="safe-step-num">02</div>
                <div className="safe-step-body">
                  <h3>EHLO Capability</h3>
                  <p>Both servers advertise <code>X-RESTMAIL</code> during EHLO. If both speak it, the upgrade fires.</p>
                </div>
              </li>
              <li>
                <div className="safe-step-num">03</div>
                <div className="safe-step-body">
                  <h3>HTTPS Delivery</h3>
                  <p>Skip SMTP. The sender POSTs to the recipient's REST endpoint with a signed JWT.</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <div className="rm-rule" />

      {/* API spread */}
      <section className="safe-section safe-section-dark" id="api">
        <div className="safe-section-grid">
          <div className="safe-section-label">
            <div className="rm-eyebrow safe-eyebrow-dark">§ III</div>
            <h2 className="safe-h2-dark">Every operation is a POST.</h2>
            <p className="safe-section-sub safe-section-sub-dark">
              Not a webhook bolted onto IMAP. Not a wrapper. The store itself.
            </p>
          </div>
          <div className="safe-section-body">
            <div className="safe-api-grid">
              {[
                ["POST", "/v1/messages", "send a message"],
                ["GET", "/v1/messages", "list inbox"],
                ["GET", "/v1/messages/:id", "fetch one"],
                ["POST", "/v1/messages/:id/labels", "label / move"],
                ["GET", "/v1/search?q=", "full-text search"],
                ["GET", "/v1/stream (SSE)", "real-time updates"],
                ["POST", "/v1/deliver", "peer delivery"],
                ["POST", "/v1/sieve", "filter scripts"],
              ].map(([m, p, d]) => (
                <div key={`${m} ${p}`} className="safe-api-row">
                  <span className={`safe-api-method m-${m}`}>{m}</span>
                  <span className="safe-api-path">{p}</span>
                  <span className="safe-api-desc">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="rm-rule" />

      {/* Stack */}
      <section className="safe-section" id="stack">
        <div className="safe-section-grid">
          <div className="safe-section-label">
            <div className="rm-eyebrow">§ IV</div>
            <h2>Built on what works.</h2>
          </div>
          <div className="safe-section-body">
            <div className="safe-stack-grid">
              {[
                ["Go 1.24+", "single static binary"],
                ["chi router", "idiomatic HTTP"],
                ["PostgreSQL", "via GORM"],
                ["React + Vite", "webmail UI"],
                ["Bubble Tea", "terminal admin"],
                ["Server-Sent Events", "no polling"],
                ["Sieve scripts", "user filters"],
                ["Docker Compose", "one command"],
              ].map(([n, d]) => (
                <div key={n} className="safe-stack-cell">
                  <div className="safe-stack-name">{n}</div>
                  <div className="safe-stack-desc">{d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="rm-rule" />

      {/* CTA */}
      <section className="safe-cta">
        <div className="safe-cta-grid">
          <h2>
            {cheeky ? "Send mail. Skip the séance." : "Run modern email infrastructure."}
          </h2>
          <div className="safe-cta-actions">
            <a className="rm-btn rm-btn-accent" href="#">$ docker run rest-mail</a>
            <a className="rm-btn rm-btn-ghost" href="#">Read the docs →</a>
          </div>
        </div>
      </section>
    </>
  );
};

/**
 * Everything around a page in this design: the top bar and the footer, the
 * same on every page.
 */
export const SafeChrome = ({ tweaks = {}, children }: { tweaks?: Tweaks; children: ReactNode }) => {
  const accent = tweaks.accentSafe || "#1840ff";
  const density = tweaks.density || "comfortable";

  return (
    <div
      className={`rm-page rm-safe density-${density}`}
      style={{ "--accent": accent, "--accent-ink": "#fff" } as CSSProperties}
    >
      {/* Top bar */}
      <header className="safe-nav">
        <div className="safe-nav-row">
          <Brand className="safe-nav-brand">
            <span className="safe-mark">▮</span>
            <span>REST Mail</span>
          </Brand>
          <nav className="safe-nav-links">
            <PageLinks />
          </nav>
          <div className="safe-nav-meta">
            <span className="rm-eyebrow">v1.0 · MIT</span>
            <GitHubLink className="rm-btn rm-btn-accent">★ GitHub</GitHubLink>
          </div>
        </div>
        <div className="rm-rule" />
      </header>

      <main>{children}</main>

      <div className="rm-rule" />

      {/* Footer */}
      <footer className="safe-foot">
        <div className="safe-foot-grid">
          <div className="safe-foot-brand">REST Mail</div>
          <div className="safe-foot-tag">Because the protocol is old, and needs to take a REST.</div>
          <div className="safe-foot-meta rm-eyebrow">MIT · github.com/rest-mail · rest-mail.com</div>
        </div>
        <nav className="site-foot-links rm-eyebrow">
          <PageLinks home />
        </nav>
      </footer>
    </div>
  );
};

/** A page of text in this design: the masthead line, then numbered sections. */
export const SafeDoc = ({ eyebrow, kicker, title, lede, children }: DocProps) => (
  <article className="doc doc-safe">
    <section className="safe-masthead">
      <div className="safe-mast-grid">
        <div className="safe-mast-meta">
          <div className="rm-eyebrow">{eyebrow}</div>
        </div>
        {kicker && <div className="safe-mast-eyebrow">{kicker}</div>}
      </div>
      <div className="rm-rule-thin" />
    </section>
    <header className="safe-hero doc-hero">
      <h1 className="doc-title">{title}</h1>
      {lede && (
        <div className="safe-hero-deck doc-lede">
          <p>{lede}</p>
        </div>
      )}
    </header>
    {children}
  </article>
);

export const SafeDocSection = ({ title, id, children }: DocSectionProps) => (
  <>
    <div className="rm-rule" />
    <section className="safe-section doc-section" id={id}>
      <div className="safe-section-grid">
        <div className="safe-section-label">
          <div className="rm-eyebrow doc-num" />
          <h2>{title}</h2>
        </div>
        <div className="safe-section-body doc-body">{children}</div>
      </div>
    </section>
  </>
);

export default OptionSafe;
