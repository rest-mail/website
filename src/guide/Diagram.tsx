import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { diagramFile, diagramImage } from "./bundle";
import { absolute, mountNamespaced } from "./namespaced";

// PROTOTYPE. Eight ways to put an Archify diagram in a page, so they can be
// compared on the real site, with its stylesheets and its
// Content-Security-Policy (server.mjs). ?embed= picks one on any chapter.
//
// - image:  the static image GitHub shows. Nothing to break, nothing to explore.
// - iframe: Archify's standalone page, by address, sized to fit.
// - iframe-embed: the same, in Archify's embed mode: the diagram alone,
//   without its title, toolbar, cards or index.
// - srcdoc: the same page in an opaque, sandboxed frame (Archify's own advice).
// - shadow: its markup and styles in a shadow root, its script in the page.
// - inline: its markup in the page, its styles scoped to the diagram.
// - inline-ns: the same, with everything it names prefixed (namespaced.ts).
// - inline-ns-x2: two of those on one page, to see whether they collide.
export const embeds = ["image", "iframe", "iframe-embed", "srcdoc", "shadow", "inline", "inline-ns", "inline-ns-x2"] as const;
export type Embed = (typeof embeds)[number];
export const isEmbed = (value: unknown): value is Embed => embeds.includes(value as Embed);

export function Diagram({ name, alt, embed }: { name: string; alt: string; embed: Embed }) {
  return (
    <figure className="guide-diagram" data-embed={embed}>
      <nav className="guide-embeds" aria-label="How the diagram is embedded (prototype)">
        <span>Embed:</span>
        {embeds.map((e) => (
          <Link key={e} to="." search={(s) => ({ ...s, embed: e })} hash={`diagram-${name}`} aria-current={e === embed}>
            {e}
          </Link>
        ))}
      </nav>
      <div id={`diagram-${name}`} className="guide-diagram-body">
        {embed === "image" && <img src={diagramImage(name)} alt={alt} />}
        {embed === "iframe" && <Framed name={name} alt={alt} />}
        {embed === "iframe-embed" && <Framed name={name} alt={alt} bare />}
        {embed === "srcdoc" && <Srcdoc name={name} alt={alt} />}
        {(embed === "shadow" || embed === "inline" || embed === "inline-ns") && <Mounted name={name} alt={alt} how={embed} />}
        {embed === "inline-ns-x2" && (
          <>
            <Mounted name={name} alt={alt} how="inline-ns" />
            <Mounted name={name} alt={alt} how="inline-ns" instance={`${name}-2`} />
          </>
        )}
      </div>
    </figure>
  );
}

// Same origin, so the page can read how tall the diagram is and size the
// frame to it, with no scrollbar of its own.
function Framed({ name, alt, bare = false }: { name: string; alt: string; bare?: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>();
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    let observer: ResizeObserver | undefined;
    const fit = () => {
      const doc = el.contentDocument;
      if (!doc?.body) return;
      const measure = () => setHeight(doc.documentElement.scrollHeight);
      measure();
      observer?.disconnect();
      observer = new ResizeObserver(measure);
      observer.observe(doc.body);
    };
    // The server's HTML may have loaded the frame before this script ran.
    if (el.contentDocument?.readyState === "complete" && el.contentDocument.URL !== "about:blank") fit();
    el.addEventListener("load", fit);
    return () => {
      el.removeEventListener("load", fit);
      observer?.disconnect();
    };
  }, []);
  const src = `${diagramFile(name, "html")}${bare ? "&embed=1" : ""}`;
  return <iframe ref={frame} src={src} title={alt} style={height ? { height } : undefined} />;
}

const useHtml = (name: string) => {
  const [html, setHtml] = useState<string>();
  useEffect(() => {
    fetch(diagramFile(name, "html"))
      .then((r) => r.text())
      .then(setHtml);
  }, [name]);
  return html;
};

function Srcdoc({ name, alt }: { name: string; alt: string }) {
  const html = useHtml(name);
  if (!html) return <img src={diagramImage(name)} alt={alt} />;
  return <iframe srcDoc={html} sandbox="allow-scripts" title={alt} />;
}

// Shadow and inline: the static image until the script has the page, then
// Archify's own markup, styles and script.
function Mounted({ name, alt, how, instance = name }: { name: string; alt: string; how: "shadow" | "inline" | "inline-ns"; instance?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const html = useHtml(name);
  useEffect(() => {
    if (!html || !host.current || host.current.dataset.mounted) return;
    host.current.dataset.mounted = "true";
    if (how === "inline-ns") {
      host.current.querySelector("img")?.remove();
      mountNamespaced(host.current, html, diagramFile(name, "html"), instance);
      return;
    }
    const page = new DOMParser().parseFromString(html, "text/html");
    const styles = [...page.querySelectorAll("style")].map((s) => absolute(s.textContent ?? "", diagramFile(name, "html")));
    const scripts = [...page.querySelectorAll("script")];
    scripts.forEach((s) => s.remove());

    let root: ShadowRoot | HTMLElement;
    if (how === "shadow") {
      root = host.current.attachShadow({ mode: "open" });
      for (const css of styles) root.append(Object.assign(document.createElement("style"), { textContent: css }));
    } else {
      root = host.current;
      host.current.setAttribute("data-archify-host", "");
      for (const css of styles) {
        root.append(Object.assign(document.createElement("style"), { textContent: scopeCss(css, "[data-archify-host]") }));
      }
      // Archify's script and styles read these from <html>.
      for (const { name, value } of page.documentElement.attributes) {
        if (name !== "lang") document.documentElement.setAttribute(name, value);
      }
    }
    host.current.querySelector("img")?.remove();
    root.append(...page.body.childNodes);
    // Scripts parsed by DOMParser never run; fresh ones do, in this page.
    for (const old of scripts) {
      const script = document.createElement("script");
      for (const { name, value } of old.attributes) script.setAttribute(name, value);
      script.textContent = old.textContent;
      root.append(script);
    }
  }, [html, how]);
  return (
    <div ref={host} className="guide-diagram-host">
      <img src={diagramImage(name)} alt={alt} />
    </div>
  );
}

// Scope a stylesheet to one element: its rules for html, :root and body apply
// to the element instead, and every other rule only inside it. Parsed by the
// browser (CSSOM), not by pattern.
export function scopeCss(css: string, host: string): string {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  return [...sheet.cssRules].map((rule) => scopeRule(rule, host)).join("\n");
}

function scopeRule(rule: CSSRule, host: string): string {
  if (rule instanceof CSSStyleRule) {
    rule.selectorText = splitList(rule.selectorText)
      .map((s) => scopeSelector(s, host))
      .join(", ");
    return rule.cssText;
  }
  if (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule || rule instanceof CSSContainerRule) {
    const inner = [...rule.cssRules].map((r) => scopeRule(r, host)).join("\n");
    const at = rule instanceof CSSMediaRule ? "@media" : rule instanceof CSSSupportsRule ? "@supports" : "@container";
    return `${at} ${rule.conditionText} {\n${inner}\n}`;
  }
  return rule.cssText;
}

function scopeSelector(selector: string, host: string): string {
  const s = selector.trim();
  // html or :root, with whatever it is qualified by: the document stays the
  // document (Archify's script sets its state there), and what follows is
  // looked for inside the diagram.
  const doc = s.match(/^(?:html|:root)((?:\[[^\]]*\]|:[\w-]+(?:\((?:[^()]|\([^()]*\))*\))?)*)\s*(.*)$/);
  if (doc) {
    const [, qualifiers, rest] = doc;
    const inside = rest.replace(/^body\b/, "").trim();
    return `html${qualifiers} ${host}${inside ? ` ${inside}` : ""}`;
  }
  if (/^body\b/.test(s)) return `${host}${s.slice(4)}`;
  return `${host} ${s}`;
}

/** A selector list, split at its top-level commas only. */
function splitList(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  let quote = "";
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (quote) {
      if (c === quote) quote = "";
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (c === "," && depth === 0) {
      parts.push(list.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(list.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}
