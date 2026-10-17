import React from "react";

// Its styles, handshake.css, come with each design's stylesheet
// (src/styles/design-*.css).

type Props = { variant?: "safe" | "bold" | "experimental"; speed?: number };

/**
 * Handshake — animated SMTP -> REST upgrade.
 * Renders a back-and-forth dialog between two servers. After a few legacy
 * lines, EHLO advertises X-RESTMAIL and the connection "upgrades" to a
 * single HTTPS POST.
 *
 * Props:
 *   variant: "safe" | "bold" | "experimental" — visual treatment
 *   speed:   number (ms per line, default 700)
 */
const Handshake = ({ variant = "safe", speed = 700 }: Props) => {
  const [step, setStep] = React.useState(0);
  const [phase, setPhase] = React.useState("smtp"); // smtp | upgrade | rest

  const script = [
    { from: "A", proto: "smtp", text: "220 mail.example.com ESMTP ready" },
    { from: "B", proto: "smtp", text: "EHLO sender.com" },
    { from: "A", proto: "smtp", text: "250-mail.example.com Hello" },
    { from: "A", proto: "smtp", text: "250-STARTTLS" },
    { from: "A", proto: "smtp", text: "250-SIZE 52428800" },
    { from: "A", proto: "rest", text: "250 X-RESTMAIL v1 https://mail.example.com/v1" },
    { from: "B", proto: "upgrade", text: "// upgrading to REST" },
    { from: "B", proto: "rest", text: "POST /v1/deliver HTTP/2" },
    { from: "B", proto: "rest", text: "Authorization: Bearer ‹jwt›" },
    { from: "B", proto: "rest", text: '{ "to":["bob@example.com"], "subject":"Hi" }' },
    { from: "A", proto: "rest", text: "200 OK { delivered: true, ms: 12 }" },
  ];

  React.useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => {
        if (s >= script.length) return 0;
        return s + 1;
      });
    }, speed);
    return () => clearInterval(id);
  }, [speed]);

  React.useEffect(() => {
    if (step >= script.length) { setPhase("smtp"); return; }
    setPhase(script[step]?.proto || "smtp");
  }, [step]);

  const visible = script.slice(0, step);

  return (
    <div className={`hs hs-${variant}`}>
      <div className="hs-frame">
        <div className="hs-header">
          <div className="hs-dots">
            <span /><span /><span />
          </div>
          <div className="hs-title">
            <span className="hs-mono">$ tcpdump host mail.example.com</span>
          </div>
          <div className={`hs-badge hs-badge-${phase}`}>
            {phase === "smtp" && "SMTP · :25"}
            {phase === "upgrade" && "negotiating…"}
            {phase === "rest" && "REST · :443"}
          </div>
        </div>

        <div className="hs-body">
          {visible.map((line, i) => (
            <div key={i} className={`hs-line hs-line-${line.from} hs-line-${line.proto}`}>
              <span className="hs-arrow">{line.from === "A" ? "←" : "→"}</span>
              <span className="hs-text">{line.text}</span>
            </div>
          ))}
          {step < script.length && (
            <div className="hs-cursor">
              <span className="hs-arrow hs-arrow-pending">{script[step].from === "A" ? "←" : "→"}</span>
              <span className="hs-blink">▍</span>
            </div>
          )}
        </div>

        <div className="hs-footer">
          <div className="hs-peers">
            <div className={`hs-peer ${phase !== "smtp" ? "is-rest" : ""}`}>
              <div className="hs-peer-label">A</div>
              <div className="hs-peer-name">mail.example.com</div>
            </div>
            <div className={`hs-link hs-link-${phase}`}>
              <span className="hs-link-bar" />
              <span className="hs-link-pulse" />
            </div>
            <div className={`hs-peer ${phase !== "smtp" ? "is-rest" : ""}`}>
              <div className="hs-peer-label">B</div>
              <div className="hs-peer-name">sender.com</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Handshake;
