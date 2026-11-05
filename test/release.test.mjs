// The release workflow's decisions (scripts/release.mjs, scripts/take-bundle.mjs),
// checked without a network: the last tests run them in a throwaway git repository,
// because what they read is where a release's tag sits in its history.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { bump, lastRelease, levelBetween, levelFor, pointChart } from "../scripts/release.mjs";
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

test("the last release is the highest v tag, wherever it sits", () => {
  assert.equal(lastRelease(["v0.9.0", "v0.12.10", "v0.12.9", "latest", "v0.13.0-rc1", ""]), "v0.12.10");
  assert.throws(() => lastRelease(["latest"]), /no v tag/);
});

test("the chart deploys the new site, and its own version moves as far", async () => {
  const chart = 'name: website\nversion: 0.10.0\n# the site\nappVersion: "0.10.0"\n';
  const last = { site: "0.10.0", chart };
  const patch = pointChart(chart, "0.10.1", last);
  assert.equal(patch.version, "0.10.1");
  assert.match(patch.chart, /^version: 0\.10\.1$/m);
  assert.match(patch.chart, /^appVersion: "0\.10\.1"$/m);
  assert.equal(pointChart(chart, "0.11.0", last).version, "0.11.0");
  assert.throws(() => pointChart(chart, "0.10.0", last), /not newer/);
  assert.equal(levelBetween("0.7.1", "0.9.0"), "minor");
  // The last release's chart counts, and so does a later one written on main.
  assert.equal(pointChart("version: 0.10.0\nappVersion: x\n", "0.12.1", { site: "0.12.0", chart: "version: 0.12.3\n" }).version, "0.12.4");
  assert.equal(pointChart("version: 1.0.0\nappVersion: x\n", "0.12.1", { site: "0.12.0", chart: "version: 0.12.3\n" }).version, "1.0.1");
  // The real chart is in the shape this edits.
  const real = await readFile(new URL("../charts/website/Chart.yaml", import.meta.url), "utf8");
  assert.match(pointChart(real, "999.0.0", { site: "0.0.1", chart: real }).chart, /^appVersion: "999\.0\.0"$/m);
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

test("a release pushes its tag and no branch", async () => {
  const workflow = await readFile(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
  const pushes = workflow.match(/git push.*/g);
  assert.deepEqual(pushes, ['git push origin "refs/tags/v$NEXT"']);
});

/** A repository holding what the release scripts read, with those scripts in it. */
function repository() {
  const dir = mkdtempSync(join(tmpdir(), "release-test-"));
  const env = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null", GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@example.org", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@example.org" };
  for (const name of ["GIT_DIR", "GIT_INDEX_FILE", "GIT_WORK_TREE"]) delete env[name];
  const git = (...args) => execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", env, stdio: ["ignore", "pipe", "pipe"] }).trim();
  const write = (file, text) => {
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), text);
  };
  const commit = (message) => {
    git("add", "-A");
    git("commit", "--allow-empty", "-q", "-m", message);
  };
  execFileSync("git", ["init", "-q", "--template=", "-b", "main", dir], { env, stdio: "ignore" });
  for (const script of ["release.mjs", "take-bundle.mjs"]) {
    mkdirSync(join(dir, "scripts"), { recursive: true });
    copyFileSync(new URL(`../scripts/${script}`, import.meta.url), join(dir, "scripts", script));
  }
  const release = (...args) => execFileSync("node", [join(dir, "scripts/release.mjs"), ...args], { encoding: "utf8", env, stdio: ["ignore", "pipe", "pipe"] }).trim();
  const bundle = (version) => write("content/email-explained/bundle.json", JSON.stringify({ format: 1, version }));
  const chart = () => readFileSync(join(dir, "charts/website/Chart.yaml"), "utf8");
  /** A release as release.yml makes one: a commit and tag that main does not get. */
  const tagOffMain = (site) => {
    const main = git("rev-parse", "HEAD");
    git("switch", "-q", "--detach");
    release("chart", site);
    commit(`chore(release): rest-mail.com ${site}`);
    git("tag", "-a", `v${site}`, "-m", `rest-mail.com ${site}`);
    git("switch", "-q", "main");
    assert.equal(git("rev-parse", "HEAD"), main, "main did not move");
  };
  // As main was on the day releases stopped committing to it: the tag on the
  // bundle's commit, the chart's commit after it, ahead of the chart in the tag.
  bundle("1.0.1");
  write("public/email-explained/diagrams/a.html", "a");
  write("public/email-explained/diagrams/b.html", "b");
  write("charts/website/Chart.yaml", 'version: 0.12.6\nappVersion: "0.12.7"\n');
  commit("chore(email-explained): the guide's bundle at 1.0.1");
  git("tag", "-a", "v0.12.8", "-m", "rest-mail.com 0.12.8");
  write("charts/website/Chart.yaml", 'version: 0.12.7\nappVersion: "0.12.8"\n');
  commit("chore(release): the chart deploys the site at 0.12.8");
  return { dir, git, write, commit, release, bundle, chart, tagOffMain, done: () => rmSync(dir, { recursive: true, force: true }) };
}

test("next sees what is new since a tag off main, and a new bundle that is on no branch", () => {
  const r = repository();
  try {
    assert.equal(r.release("next"), "0.12.9", "commits since a tag from before this way of releasing");
    r.tagOffMain("0.12.9");
    assert.throws(() => r.git("merge-base", "--is-ancestor", "v0.12.9", "main"), "the tag is not on main");
    assert.equal(r.release("next"), "", "nothing merged and no new bundle: nothing to release");
    assert.equal(r.release("next", "--new-bundle"), "0.12.10", "a new bundle alone is a patch release");
    r.commit("fix: a page title is never cut off");
    assert.equal(r.release("next"), "0.12.10");
    r.commit("feat: a docs page");
    assert.equal(r.release("next"), "0.13.0");
    assert.equal(r.release("next", "--new-bundle"), "0.13.0", "and does not lower what the commits ask for");
    r.tagOffMain("0.13.0");
    assert.equal(r.release("next"), "", "the highest tag, not the nearest one in main's history");
  } finally {
    r.done();
  }
});

test("the chart's version continues from what was published, release after release", () => {
  const r = repository();
  try {
    // The tag holds chart 0.12.6, one behind the 0.12.7 published and written on main.
    assert.equal(r.release("chart", "0.12.9"), "0.12.8");
    assert.match(r.chart(), /^version: 0\.12\.8$/m);
    assert.match(r.chart(), /^appVersion: "0\.12\.9"$/m);
    r.git("checkout", "--", "charts/website/Chart.yaml");
    r.tagOffMain("0.12.9");
    assert.match(r.chart(), /^version: 0\.12\.7$/m, "main keeps what it had");
    assert.equal(r.release("chart", "0.12.10"), "0.12.9", "from the tag, not main's older one");
    r.git("checkout", "--", "charts/website/Chart.yaml");
    assert.equal(r.release("chart", "0.13.0"), "0.13.0", "as far as the site moved");
    r.git("checkout", "--", "charts/website/Chart.yaml");
    assert.throws(() => r.release("chart", "0.12.9"), /not newer/);
  } finally {
    r.done();
  }
});

test("a release starts from the bundle the last one shipped, unless main's copy is later", () => {
  const r = repository();
  const version = () => JSON.parse(readFileSync(join(r.dir, "content/email-explained/bundle.json"), "utf8")).version;
  const diagram = (name) => existsSync(join(r.dir, "public/email-explained/diagrams", name));
  try {
    // v0.12.9 ships bundle 1.0.2: it dropped a.html, added c.html. Main never sees it.
    r.git("switch", "-q", "--detach");
    r.bundle("1.0.2");
    unlinkSync(join(r.dir, "public/email-explained/diagrams/a.html"));
    r.write("public/email-explained/diagrams/c.html", "c");
    r.release("chart", "0.12.9");
    r.commit("chore(release): rest-mail.com 0.12.9");
    r.git("tag", "-a", "v0.12.9", "-m", "rest-mail.com 0.12.9");
    r.git("switch", "-q", "main");
    assert.equal(version(), "1.0.1");
    assert.ok(diagram("a.html") && !diagram("c.html"));

    r.release("shipped");
    assert.equal(version(), "1.0.2");
    assert.ok(!diagram("a.html"), "a diagram the shipped bundle dropped goes");
    assert.ok(diagram("b.html") && diagram("c.html"));
    // What release.yml adds then holds that bundle exactly.
    r.git("add", "content/email-explained", "public/email-explained");
    assert.equal(r.git("diff", "--cached", "--name-only", "v0.12.9", "--", "content", "public"), "");

    r.git("reset", "-q", "--hard", "main");
    r.bundle("1.0.3");
    r.commit("chore(email-explained): refreshed by hand");
    r.release("shipped");
    assert.equal(version(), "1.0.3", "a later copy on main is kept");
  } finally {
    r.done();
  }
});
