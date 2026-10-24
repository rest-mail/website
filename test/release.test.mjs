// The release workflow's decisions (scripts/release.mjs, scripts/take-bundle.mjs),
// checked without a network or a git history.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { bump, levelBetween, levelFor, pointChart } from "../scripts/release.mjs";
import { compare, FORMAT, newest, plan } from "../scripts/take-bundle.mjs";

test("a feat commit makes a minor release, a breaking one too while the site is 0.x, anything else a patch", () => {
  assert.equal(levelFor(["fix: a page title is never cut off", "chore(email-explained): the guide's bundle at 1.0.2950"], "0.10.0"), "patch");
  assert.equal(levelFor(["fix: x", "feat: a docs page"], "0.10.0"), "minor");
  assert.equal(levelFor(["feat!: a new design"], "0.10.0"), "minor");
  assert.equal(levelFor(["refactor: x\n\nBREAKING CHANGE: the chart's values moved"], "1.2.3"), "major");
  assert.equal(bump("0.10.0", "patch"), "0.10.1");
  assert.equal(bump("0.10.4", "minor"), "0.11.0");
  assert.equal(bump("1.2.3", "major"), "2.0.0");
});

test("the chart deploys the new site, and its own version moves as far", async () => {
  const chart = 'name: website\nversion: 0.10.0\n# the site\nappVersion: "0.10.0"\n';
  const renderTest = 'has "appVersion by default" "$tmp/plain.yaml" "ghcr.io/rest-mail/website:0.10.0"\nhas "an explicit tag" "$tmp/pinned.yaml" "ghcr.io/rest-mail/website:9.9.9"\n';
  const patch = pointChart({ chart, renderTest }, "0.10.1");
  assert.equal(patch.version, "0.10.1");
  assert.match(patch.chart, /^version: 0\.10\.1$/m);
  assert.match(patch.chart, /^appVersion: "0\.10\.1"$/m);
  assert.match(patch.renderTest, /website:0\.10\.1"/);
  assert.match(patch.renderTest, /website:9\.9\.9"/, "the explicit tag stays");
  assert.equal(pointChart({ chart, renderTest }, "0.11.0").version, "0.11.0");
  assert.throws(() => pointChart({ chart, renderTest }, "0.10.0"), /not newer/);
  assert.equal(levelBetween("0.7.1", "0.9.0"), "minor");
  // The real chart is in the shape this edits.
  const real = { chart: await readFile(new URL("../charts/website/Chart.yaml", import.meta.url), "utf8"), renderTest: await readFile(new URL("../charts/website/tests/render-test.sh", import.meta.url), "utf8") };
  const app = real.chart.match(/^appVersion:\s*"([^"]+)"/m)[1];
  assert.match(pointChart(real, bump(app, "patch")).renderTest, new RegExp(`website:${bump(app, "patch").replaceAll(".", "\\.")}"`));
});

test("the newest bundle of this site's format is taken, never another format's", () => {
  assert.equal(newest(["1.0.2950", "1.0.10000", "1.0.999", "2.0.1", "latest", "sha-abc"]), "1.0.10000");
  assert.equal(newest(["2.0.1"]), null);
  assert.ok(compare("1.0.10000", "1.0.999") > 0);
  assert.equal(compare("1.0.5", "1.0.5"), 0);
});

test("taking a bundle removes exactly the files it no longer has", () => {
  assert.deepEqual(plan(["arc.html", "arc.png", "fonts/a.woff2"], ["arc.html", "arc.svg", "fonts/a.woff2"]), {
    remove: ["arc.png"],
    write: ["arc.html", "arc.svg", "fonts/a.woff2"],
  });
});

test("the pickup takes the format the site reads", async () => {
  const source = await readFile(new URL("../src/guide/bundle.ts", import.meta.url), "utf8");
  assert.equal(Number(source.match(/bundle\.format !== (\d+)/)[1]), FORMAT);
});
