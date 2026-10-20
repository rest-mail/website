import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const html = await readFile(new URL("../setup/index.html", import.meta.url), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function openLink(hash, pathname = "/setup") {
  const elements = Object.fromEntries(
    [...html.matchAll(/<\w+\b[^>]*\bid="([^"]+)"[^>]*>/g)].map(([tag, id]) => [
      id, { hidden: /\bhidden\b/.test(tag), textContent: "", href: "#" },
    ]),
  );
  const history = [];
  runInNewContext(script, {
    URLSearchParams,
    location: { hash, pathname },
    history: { replaceState: (...args) => history.push(args) },
    document: { getElementById: (id) => elements[id] },
  });
  return { elements, history };
}

test("sign-in details survive decoding and app handoff, and leave browser history", () => {
  const details = {
    server: "https://mail.example.com",
    username: "owner+test@example.com",
    password: " <script>+&=#% /\u00e9 ",
  };
  for (const pathname of ["/setup", "/setup/", "/setup/index.html"]) {
    const { elements, history } = openLink(`#${new URLSearchParams(details)}`, pathname);
    for (const [key, value] of Object.entries(details)) assert.equal(elements[key].textContent, value);
    const app = new URL(elements.open.href);
    assert.equal(app.protocol, "rest-mail:");
    assert.equal(app.hostname, "setup");
    assert.deepEqual(Object.fromEntries(app.searchParams), details);
    assert.equal(history.length, 1);
    assert.equal(history[0][2], pathname);
    assert.equal(elements["with-sign-in"].hidden, false);
    assert.equal(elements["without-sign-in"].hidden, true);
    assert.equal(elements["old-code"].hidden, true);
  }
});

test("a missing username defaults to admin", () => {
  const { elements } = openLink("#password=test");
  assert.equal(elements.username.textContent, "admin");
  assert.equal(new URL(elements.open.href).searchParams.get("username"), "admin");
});

test("an old setup code shows migration instructions", () => {
  const { elements } = openLink("#token=old-code");
  assert.equal(elements["old-code"].hidden, false);
  assert.equal(elements["without-sign-in"].hidden, true);
  assert.equal(elements["with-sign-in"].hidden, true);
  assert.equal(elements.open.href, "#");
});

test("an empty or incomplete link keeps the no-sign-in instructions", () => {
  for (const hash of ["", "#server=https%3A%2F%2Fmail.example.com", "#password="]) {
    const { elements, history } = openLink(hash);
    assert.equal(elements["without-sign-in"].hidden, false);
    assert.equal(elements["with-sign-in"].hidden, true);
    assert.equal(elements["old-code"].hidden, true);
    assert.equal(history.length, 0);
  }
});
