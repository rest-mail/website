// The two decisions a release makes, so the release workflow (release.yml)
// and a person releasing by hand make them the same way:
//
//   node scripts/release.mjs next           the next site version, from the commits since the last v tag
//   node scripts/release.mjs chart <x.y.z>  point the chart at site x.y.z; prints the chart's new version
//
// `next` prints nothing when there is nothing to release. A feat commit makes
// a minor release, and so does a breaking one while the site is 0.x; anything
// else, a patch. The chart's own version moves as far as the site's did, which
// is how its releases have gone (site 0.7.1 was chart 0.8.1, 0.10.0 was 0.10.0).
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url).pathname;
const CHART = "charts/website/Chart.yaml";
const RENDER_TEST = "charts/website/tests/render-test.sh";

const parse = (v) => v.split(".").map(Number);

/** How far a release must move, from its commits' messages: major, minor or patch. */
export function levelFor(messages, current) {
  const breaking = messages.some((m) => /^[a-z]+(\([^)]*\))?!:/.test(m) || /^BREAKING[ -]CHANGE:/m.test(m));
  if (breaking) return parse(current)[0] === 0 ? "minor" : "major";
  return messages.some((m) => /^feat(\([^)]*\))?:/.test(m)) ? "minor" : "patch";
}

export function bump(version, level) {
  const [major, minor, patch] = parse(version);
  if (level === "major") return `${major + 1}.0.0`;
  if (level === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/** How far one version moved from another. */
export function levelBetween(from, to) {
  const [a, b] = [parse(from), parse(to)];
  return a[0] !== b[0] ? "major" : a[1] !== b[1] ? "minor" : "patch";
}

/** The chart and its render test, pointed at a new site version. */
export function pointChart({ chart, renderTest }, site) {
  const version = chart.match(/^version:\s*(\S+)/m)?.[1];
  const app = chart.match(/^appVersion:\s*"?([^"\s]+)"?/m)?.[1];
  if (!version || !app) throw new Error(`${CHART} has no version or appVersion`);
  if (levelBetween(app, site) === "patch" && parse(site)[2] <= parse(app)[2]) throw new Error(`site ${site} is not newer than ${app}`);
  const next = bump(version, levelBetween(app, site));
  const pin = `ghcr.io/rest-mail/website:${app}"`;
  if (!renderTest.includes(pin)) throw new Error(`${RENDER_TEST} does not pin ${pin}`);
  return {
    version: next,
    chart: chart.replace(/^version:\s*\S+/m, `version: ${next}`).replace(/^appVersion:\s*\S+/m, `appVersion: "${site}"`),
    renderTest: renderTest.replace(pin, `ghcr.io/rest-mail/website:${site}"`),
  };
}

function main() {
  const [command, site] = process.argv.slice(2);
  const git = (...args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
  if (command === "next") {
    const tag = git("describe", "--tags", "--abbrev=0", "--match", "v[0-9]*.[0-9]*.[0-9]*");
    const messages = git("log", "--format=%B%x00", `${tag}..HEAD`).split("\0").map((m) => m.trim()).filter(Boolean);
    if (messages.length) console.log(bump(tag.slice(1), levelFor(messages, tag.slice(1))));
  } else if (command === "chart" && /^\d+\.\d+\.\d+$/.test(site ?? "")) {
    const files = { chart: readFileSync(root + CHART, "utf8"), renderTest: readFileSync(root + RENDER_TEST, "utf8") };
    const pointed = pointChart(files, site);
    writeFileSync(root + CHART, pointed.chart);
    writeFileSync(root + RENDER_TEST, pointed.renderTest);
    console.log(pointed.version);
  } else {
    throw new Error("usage: node scripts/release.mjs next | chart <x.y.z>");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
