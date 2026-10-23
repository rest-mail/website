// PROTOTYPE. Archify's standalone page, moved into one element of this page
// with everything it names prefixed, so neither side reaches the other:
//
// - its <html>, :root and <body> become the element (#archify-<name>), in its
//   styles and for its script, so its state lands there and not on our <html>;
// - every other rule of its stylesheet only matches inside that element, and
//   outranks ours there (an id beats our classes);
// - the element and everything in it start from the browser's defaults, so
//   our inherited fonts and colours, and our rules for p, li or a, stop at it;
// - its typeface is renamed, so it cannot merge with our JetBrains Mono;
// - its script sees a document whose lookups stay inside the element;
// - its address is a parameter of ours: what it keeps after # on its own page
//   (#focus=relay) lives in ?<name>= here, so it never touches our anchors.

const FAMILY = /(['"])JetBrains Mono\1/g;

/** Mount Archify's page `html`, fetched from `url`, into `host`. */
export function mountNamespaced(host: HTMLElement, html: string, url: string, name: string) {
  const id = `archify-${name}`;
  host.id = id;
  const scope = `#${CSS.escape(id)}`;
  const page = new DOMParser().parseFromString(html, "text/html");

  for (const el of [page.documentElement, page.body]) {
    for (const { name, value } of el.attributes) if (name !== "lang") host.setAttribute(name, value);
    host.classList.add(...el.classList);
  }

  // It is the page to Archify, so what it places absolutely is placed in it.
  const reset = `${scope} { all: initial; display: block; position: relative; }\n${scope} :where(*:not(svg, svg *)) { all: revert; }`;
  host.append(Object.assign(document.createElement("style"), { textContent: reset }));
  for (const style of page.querySelectorAll("style")) {
    const css = rename(absolute(style.textContent ?? "", url));
    host.append(Object.assign(document.createElement("style"), { textContent: scopeCss(css, scope) }));
  }

  const scripts = [...page.querySelectorAll("script")];
  scripts.forEach((s) => s.remove());
  host.append(...page.body.childNodes);

  const scoped = ((window as unknown as { __archify?: Record<string, Globals> }).__archify ??= {});
  scoped[id] = scopedGlobals(host, scope, name);
  const g = `window.__archify[${JSON.stringify(id)}]`;
  for (const old of scripts) {
    const script = document.createElement("script");
    for (const attr of old.attributes) script.setAttribute(attr.name, attr.value);
    const code = rename(old.textContent ?? "");
    script.textContent =
      old.type && !/javascript/.test(old.type)
        ? code
        : `(function (window, self, globalThis, document, location, history) {\n${code}\n}).call(${g}.window, ${g}.window, ${g}.window, ${g}.window, ${g}.document, ${g}.location, ${g}.history);`;
    host.append(script);
  }
}

type Globals = { window: Window; document: Document; location: Location; history: History };

/** The globals Archify's script is given: ours, with its document and its address its own. */
function scopedGlobals(host: HTMLElement, scope: string, param: string): Globals {
  const document = scopedDocument(host, scope);
  const real = () => new URL(window.location.href);
  // Archify's view of the address: this page, with no query of its own, and
  // after # whatever it keeps in our ?<param>=.
  const own = () => {
    const url = real();
    const state = url.searchParams.get(param);
    url.search = "";
    url.hash = state ? `#${state}` : "";
    return url;
  };
  // Its "copy link" gives this page's address with its state in our parameter
  // (Archify's data-reading-link-template, made for hosts that embed it).
  const base = real();
  base.searchParams.delete(param);
  base.hash = "";
  host.setAttribute("data-reading-link-template", `${base.href}${base.search ? "&" : "?"}${param}={state}`);

  const location = forward(window.location, (prop) => {
    const url = own();
    if (prop === "href") return { value: url.href };
    if (prop === "search") return { value: url.search };
    if (prop === "hash") return { value: url.hash };
    if (prop === "toString") return { value: () => url.href };
  });
  const write = (url?: string | URL | null) => {
    if (url == null) return;
    const state = new URL(String(url), own()).hash.replace(/^#/, "");
    const next = real();
    if (state) next.searchParams.set(param, state);
    else next.searchParams.delete(param);
    window.history.replaceState(window.history.state, "", next);
  };
  const history = forward(window.history, (prop) =>
    prop === "replaceState" || prop === "pushState" ? { value: (_: unknown, __: string, url?: string | URL | null) => write(url) } : undefined,
  );
  const scopedWindow = forward(window, (prop) => {
    if (prop === "document") return { value: document };
    if (prop === "location") return { value: location };
    if (prop === "history") return { value: history };
  });
  return { window: scopedWindow, document, location, history };
}

/** An object that answers as `target` does, except where `own` says otherwise. */
function forward<T extends object>(target: T, own: (prop: string | symbol) => { value: unknown } | undefined): T {
  return new Proxy(target, {
    get(t, prop) {
      const mine = own(prop);
      if (mine) return mine.value;
      const value = Reflect.get(t, prop, t);
      // Methods need their own object as `this`; constructors (Image, URL) do not.
      return typeof value === "function" && !/^[A-Z]/.test(String(prop)) ? value.bind(t) : value;
    },
    set: (t, prop, value) => Reflect.set(t, prop, value, t),
  });
}

const rename = (text: string) => text.replace(FAMILY, "$1archify JetBrains Mono$1");

/** Its stylesheet's relative addresses (its typefaces), made absolute. */
export const absolute = (css: string, base: string) =>
  css.replace(/url\((['"]?)(?!data:|[a-z]+:|\/|#)([^'")]+)\1\)/g, (_, q, path) => `url(${q}${new URL(path, new URL(base, location.href)).pathname}${q})`);

/** The document Archify's script is given: ours, with its lookups kept inside the element. */
function scopedDocument(host: HTMLElement, scope: string): Document {
  const find = (selector: string) => scopeSelectorList(selector, scope);
  return forward(document, (prop) => {
    switch (prop) {
      case "documentElement":
      case "body":
      case "head":
        return { value: host };
      case "getElementById":
        return { value: (id: string) => host.querySelector(`#${CSS.escape(id)}`) };
      case "querySelector":
        return { value: (s: string) => document.querySelector(find(s)) };
      case "querySelectorAll":
        return { value: (s: string) => document.querySelectorAll(find(s)) };
    }
  });
}

export function scopeCss(css: string, scope: string): string {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  return [...sheet.cssRules].map((rule) => scopeRule(rule, scope)).join("\n");
}

function scopeRule(rule: CSSRule, scope: string): string {
  if (rule instanceof CSSStyleRule) {
    rule.selectorText = scopeSelectorList(rule.selectorText, scope);
    return rule.cssText;
  }
  if (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule || rule instanceof CSSContainerRule) {
    const inner = [...rule.cssRules].map((r) => scopeRule(r, scope)).join("\n");
    const at = rule instanceof CSSMediaRule ? "@media" : rule instanceof CSSSupportsRule ? "@supports" : "@container";
    return `${at} ${rule.conditionText} {\n${inner}\n}`;
  }
  return rule.cssText;
}

const scopeSelectorList = (list: string, scope: string) =>
  splitList(list)
    .map((s) => scopeSelector(s, scope))
    .join(", ");

// A compound's qualifiers: [attr], :pseudo and :pseudo(...), .class.
const QUALIFIERS = String.raw`((?:\[[^\]]*\]|\.[\w-]+|:[\w-]+(?:\((?:[^()]|\([^()]*\))*\))?)*)`;
const ROOT = new RegExp(String.raw`^(?:html|:root)${QUALIFIERS}(?:\s+body${QUALIFIERS})?(?=$|[\s>+~])\s*(.*)$`);
const BODY = new RegExp(String.raw`^body${QUALIFIERS}(?=$|[\s>+~])\s*(.*)$`);

/** html, :root and body are the element itself; anything else is inside it. */
export function scopeSelector(selector: string, scope: string): string {
  const s = selector.trim();
  const root = s.match(ROOT);
  if (root) {
    const [, html = "", body = "", rest] = root;
    return `${scope}${html}${body}${rest ? ` ${rest}` : ""}`;
  }
  const body = s.match(BODY);
  if (body) {
    const [, quals = "", rest] = body;
    return `${scope}${quals}${rest ? ` ${rest}` : ""}`;
  }
  // No element named first ([data-theme="light"], .x, :not(...)): on its own
  // page this could match <html>, so here it may match the element itself.
  if (/^[[.:]/.test(s) && !s.startsWith("::")) return `${scope}${s}, ${scope} ${s}`;
  return `${scope} ${s}`;
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
