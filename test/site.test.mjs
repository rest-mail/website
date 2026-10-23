// What rest-mail.com must do, checked against the production server: build
// first (npm run build), then `npm test`. Every page is fetched the way curl
// would, with no JavaScript, so this is what a browser gets before any script
// runs, and what a search engine reads.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { after, before, describe, test } from "node:test";

const root = new URL("../", import.meta.url);
const port = 3000 + Math.floor(Math.random() * 2000) + 1000;
const base = `http://127.0.0.1:${port}`;
const contact = "privacy-test@example.org";

let server;
let output = "";

before(async () => {
  server = spawn(process.execPath, ["server.mjs"], {
    cwd: root,
    env: { ...process.env, PORT: String(port), REST_MAIL_DESIGN: "bold", REST_MAIL_CONTACT: contact },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => (output += chunk));
  server.stderr.on("data", (chunk) => (output += chunk));
  for (let i = 0; i < 100 && !output.includes("listening"); i++) await new Promise((r) => setTimeout(r, 100));
  assert.match(output, /listening on port/, `the server did not start:\n${output}`);
});

after(() => server?.kill("SIGTERM"));

const get = (path, init) => fetch(base + path, { redirect: "manual", ...init });

async function page(path) {
  const response = await get(path);
  return { response, html: await response.text() };
}

const pages = {
  "/": "/v1/deliver",
  "/about": "About REST Mail",
  "/docs": "Documentation",
  "/privacy": "Privacy policy",
  "/contact": "Contact",
  "/security": "Reporting a vulnerability",
};
const pageClass = { safe: "rm-safe", bold: "rm-bold", experimental: "rm-exp" };

describe("every page", () => {
  for (const [path, heading] of Object.entries(pages)) {
    test(`${path} is rendered on the server, in the deployment's design`, async () => {
      const { response, html } = await page(path);
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type"), /^text\/html/);
      assert.ok(html.includes(heading), `${path} should say "${heading}"`);
      assert.ok(html.includes('class="rm-page rm-bold'), `${path} should be drawn in bold, the deployment's design`);
      assert.match(html, /<link rel="stylesheet" href="\/assets\/design-bold-[^"]+\.css"/);
      assert.doesNotMatch(html, /design-safe-|design-experimental-/, "only the live design's stylesheet");
      // The header and footer link every page.
      for (const other of ["/about", "/docs", "/privacy", "/security", "/contact"]) assert.ok(html.includes(`href="${other}"`));
    });

    for (const design of ["safe", "experimental"]) {
      test(`${path}?design=${design} previews another design, and its links keep it`, async () => {
        const { response, html } = await page(`${path}?design=${design}`);
        assert.equal(response.status, 200);
        assert.ok(html.includes(`class="rm-page ${pageClass[design]}`));
        assert.match(html, new RegExp(`/assets/design-${design}-[^"]+\\.css`));
        assert.ok(html.includes(`href="/about?design=${design}"`), "links keep ?design=");
      });
    }

    test(`${path}?design=nonsense goes to ${path}, in the deployment's design`, async () => {
      const response = await get(`${path}?design=nonsense`);
      assert.equal(response.status, 307);
      assert.equal(response.headers.get("location"), path);
      const { html } = await page(path);
      assert.ok(html.includes('class="rm-page rm-bold'));
    });
  }

  test("the contact address comes from the deployment", async () => {
    for (const path of ["/contact", "/privacy", "/security"]) {
      const { html } = await page(path);
      assert.ok(html.includes(`href="mailto:${contact}"`), `${path} should show ${contact}`);
      assert.ok(!html.includes("hello@rest-mail.com"), `${path} should not show the default`);
    }
  });

  test("the privacy policy has its effective date and Google's Limited Use disclosure", async () => {
    const { html } = await page("/privacy");
    assert.match(html, /Effective <time dateTime="\d{4}-\d{2}-\d{2}">/);
    assert.ok(html.includes("including the Limited Use requirements"));
    assert.ok(html.includes('href="https://developers.google.com/terms/api-services-user-data-policy"'));
  });

  test("an unknown address is a 404 page, in the design", async () => {
    const { response, html } = await page("/no/such/page?design=safe");
    assert.equal(response.status, 404);
    assert.ok(html.includes("Nothing here."));
    assert.ok(html.includes("<title>Not found — REST Mail</title>"));
    assert.ok(html.includes('class="rm-page rm-safe'));
  });
});

describe("setup links", () => {
  const csp =
    "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

  for (const path of ["/setup", "/setup/", "/setup/index.html"]) {
    test(`${path} is setup/index.html, exactly, with nothing else allowed in`, async () => {
      const expected = await readFile(new URL("setup/index.html", root), "utf8");
      const { response, html } = await page(path);
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type"), /^text\/html/);
      assert.equal(html, expected);
      assert.equal(response.headers.get("content-security-policy"), csp);
      assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    });
  }

  test("the app-site association is the file, unchanged, as JSON", async () => {
    const expected = await readFile(new URL(".well-known/apple-app-site-association", root), "utf8");
    const response = await get("/.well-known/apple-app-site-association");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/json");
    assert.equal(await response.text(), expected);
  });
});

describe("publisher domain", () => {
  test("Microsoft's identity association is the file, unchanged, as JSON", async () => {
    const expected = await readFile(new URL(".well-known/microsoft-identity-association.json", root), "utf8");
    const response = await get("/.well-known/microsoft-identity-association.json");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/json");
    assert.equal(await response.text(), expected);
  });
});

describe("security.txt", () => {
  test("names the deployment's contact, and expires within a year", async () => {
    const response = await get("/.well-known/security.txt", { headers: { "x-forwarded-proto": "https" } });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /^text\/plain/);
    const text = await response.text();
    assert.match(text, new RegExp(`^Contact: mailto:${contact}$`, "m"));
    assert.match(text, /^Contact: https:\/\/github\.com\/rest-mail\/rest-mail-server\/security\/advisories\/new$/m);
    assert.match(text, new RegExp(`^Policy: https://127\\.0\\.0\\.1:${port}/security$`, "m"));
    const expires = new Date(text.match(/^Expires: (.+)$/m)[1]);
    const days = (expires - Date.now()) / 86_400_000;
    assert.ok(days > 30 && days < 365, `Expires is ${days} days away`);
  });

  test("the old address redirects to it", async () => {
    const response = await get("/security.txt");
    assert.equal(response.status, 301);
    assert.equal(response.headers.get("location"), "/.well-known/security.txt");
  });
});

const bundle = JSON.parse(await readFile(new URL("content/email-explained/bundle.json", root), "utf8"));

describe("Email, explained", () => {
  const chapter = "/email-explained/how-it-goes-wrong/open-relay-and-spam-machine";

  test("a chapter is rendered on the server from the bundle, a section to each heading", async () => {
    const { response, html } = await page(chapter);
    assert.equal(response.status, 200);
    assert.ok(html.includes("The open relay and the spam machine"));
    for (const id of ["how-common-is-it", "how-rest-mail-handles-it", "sources"]) assert.ok(html.includes(`id="${id}"`), `section ${id}`);
    // It is one of the docs, so the header's Docs link is the current one.
    assert.match(html, /<a [^>]*href="\/docs"[^>]*data-status="active"|<a [^>]*data-status="active"[^>]*href="\/docs"/);
    // With no script, the diagram is its static image.
    assert.match(html, /<img src="\/email-explained\/diagrams\/open-relay\.png\?v=[0-9a-f]{12}"/);
    // Code links name the commit the bundle was built from.
    assert.ok(html.includes(`https://github.com/rest-mail/rest-mail-server/blob/${bundle.source.commit}/`));
  });

  test("the docs page and the guide's front page link its chapters, and an unknown chapter is a 404", async () => {
    for (const path of ["/docs", "/email-explained"]) {
      const { html } = await page(path);
      assert.ok(html.includes(`href="${chapter}"`), `${path} links the chapter`);
    }
    const { response } = await page("/email-explained/no-such-chapter");
    assert.equal(response.status, 404);
  });

  test("each chapter links the ones before and after it, in the order the front page lists them", async () => {
    const order = bundle.chapters.map((c) => (c.slug ? `/email-explained/${c.slug}` : "/email-explained"));
    for (const [i, path] of order.entries()) {
      const { html } = await page(path);
      const prev = html.match(/<a href="([^"]*)" rel="prev"/)?.[1] ?? null;
      const next = html.match(/<a href="([^"]*)" rel="next"/)?.[1] ?? null;
      assert.equal(prev, order[i - 1] ?? null, `${path}: previous`);
      assert.equal(next, order[i + 1] ?? null, `${path}: next`);
    }
  });

  test("the docs page lists the chapters under their parts, in reading order", async () => {
    const { html } = await page("/docs");
    const parts = [...new Set(bundle.chapters.filter((c) => c.slug).map((c) => c.part))];
    let from = 0;
    for (const part of parts) {
      const at = html.indexOf(`<h3>${part}</h3>`, from);
      assert.ok(at >= from, `part ${part} in order`);
      from = at;
    }
    let last = -1;
    for (const c of bundle.chapters.filter((c) => c.slug)) {
      const at = html.indexOf(`href="/email-explained/${c.slug}"`);
      assert.ok(at > last, `${c.slug} in order`);
      last = at;
    }
  });

  test("a diagram is no wider than the text it sits in", async () => {
    const dir = new URL("dist/client/assets/", root);
    for (const file of (await readdir(dir)).filter((f) => f.endsWith(".css"))) {
      const css = await readFile(new URL(file, dir), "utf8");
      for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (!/\.guide-diagram(?![-\w])/.test(selectors)) continue;
        assert.doesNotMatch(body, /(^|;)\s*width:(?!\s*100%)/, `${selectors.trim()} sets another width`);
        assert.doesNotMatch(body, /margin(-left)?:[^;]*-/, `${selectors.trim()} pulls it out of the column`);
      }
    }
  });

  test("a diagram is its own page, framed only by this site, with its typefaces beside it", async () => {
    const response = await get("/email-explained/diagrams/open-relay.html");
    assert.equal(response.status, 200);
    const csp = response.headers.get("content-security-policy");
    assert.match(csp, /frame-ancestors 'self'/);
    assert.match(csp, /font-src 'self'/);
    const html = await response.text();
    assert.doesNotMatch(html, /data:font/, "typefaces are files, which the site's policy allows");
    const font = html.match(/url\((fonts\/[0-9a-f]{16}\.woff2)\)/)[1];
    const file = await get(`/email-explained/diagrams/${font}`);
    assert.equal(file.status, 200);
    assert.equal(file.headers.get("content-type"), "font/woff2");
  });
});

describe("the site is left-aligned", () => {
  // Nothing on a page is centred: every block starts on the left margin or on
  // a column of the page grid. Only text inside a round shape is centred in it.
  const round = new Set([".hs-peer-label", ".exp-stamp", ".exp-stamp-inner"]);

  test("no stylesheet centres anything but text in a round shape", async () => {
    const dir = new URL("dist/client/assets/", root);
    const centred = [];
    for (const file of (await readdir(dir)).filter((f) => f.endsWith(".css"))) {
      const css = await readFile(new URL(file, dir), "utf8");
      for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (!/text-align:\s*center|justify-content:\s*center|margin(-inline)?:[^;]*\bauto\b/.test(body)) continue;
        for (const selector of selectors.split(",").map((s) => s.trim())) if (!round.has(selector)) centred.push(selector);
      }
    }
    assert.deepEqual(centred, []);
  });
});

describe("nothing from outside rest-mail.com", () => {
  // Links people can follow are fine; anything a page loads by itself is not.
  test("pages load only their own files, and set no cookies", async () => {
    for (const path of [...Object.keys(pages), "/nope"]) {
      const { response, html } = await page(path);
      assert.equal(response.headers.get("set-cookie"), null, `${path} sets a cookie`);
      assert.match(response.headers.get("content-security-policy"), /^default-src 'self'/);
      for (const [, tag, url] of html.matchAll(/<(\w+)[^>]*?\s(?:src|href)="([^"]*)"/g)) {
        if (/^(https?:)?\/\//.test(url)) assert.equal(tag, "a", `${path}: <${tag}> loads ${url}`);
      }
    }
  });

  test("stylesheets and scripts fetch nothing from elsewhere", async () => {
    const { html } = await page("/");
    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:css|js))"/g)].map((m) => m[1]);
    assert.ok(assets.length > 0);
    for (const asset of assets) {
      const body = await (await get(asset)).text();
      assert.doesNotMatch(body, /url\(\s*["']?(https?:)?\/\//, `${asset} loads something from elsewhere`);
      assert.doesNotMatch(body, /@import\s+(url\()?["']?(https?:)?\/\//, `${asset} imports something from elsewhere`);
      // The Content-Security-Policy allows fonts from rest-mail.com only.
      assert.doesNotMatch(body, /url\(\s*["']?data:font/, `${asset} carries a font the policy refuses`);
    }
  });
});

describe("the server", () => {
  test("answers its liveness probe", async () => {
    const response = await get("/healthz");
    assert.equal(response.status, 200);
  });

  test("logs nothing about requests", async () => {
    await page("/privacy?from=a-visitor");
    await new Promise((r) => setTimeout(r, 100));
    const lines = output.trim().split("\n");
    assert.deepEqual(lines.length, 1, `expected only the startup line, got:\n${output}`);
    assert.doesNotMatch(output, /127\.0\.0\.1|a-visitor|privacy/);
  });
});
