// What rest-mail.com must do, checked against the production server: build
// first (npm run build), then `npm test`. Every page is fetched the way curl
// would, with no JavaScript, so this is what a browser gets before any script
// runs, and what a search engine reads.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
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
      for (const other of ["/about", "/privacy", "/security", "/contact"]) assert.ok(html.includes(`href="${other}"`));
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

describe("security.txt", () => {
  test("names the deployment's contact, and expires within a year", async () => {
    const response = await get("/.well-known/security.txt", { headers: { "x-forwarded-proto": "https" } });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /^text\/plain/);
    const text = await response.text();
    assert.match(text, new RegExp(`^Contact: mailto:${contact}$`, "m"));
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
