// The decisions a release makes, so the release workflow (release.yml) and a
// person releasing by hand make them the same way:
//
//   node scripts/release.mjs shipped                 bring here the guide's bundle the last release shipped, if it is later than this copy
//   node scripts/release.mjs next [--new-bundle]     the next site version, from what is new since the last v tag
//   node scripts/release.mjs chart <x.y.z>           stamp the chart for site x.y.z; prints the chart's new version
//
// A release is one commit that only its v tag holds: main's history plus what
// was generated for that release, the guide's bundle and the chart's versions.
// main never gets that commit, so the last release is the highest v tag, not the
// nearest one in main's history, and what it shipped is read from that tag.
//
// `next` prints nothing when there is nothing to release. A new guide bundle is
// never on main, so it has to be said (--new-bundle), and makes a patch release
// at least. A feat commit makes a minor release, and so does a breaking one while
// the site is 0.x; anything else, a patch. The chart's own version moves as far
// as the site's did, which is how its releases have gone (site 0.7.1 was chart
// 0.8.1, 0.10.0 was 0.10.0).
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { compare, COPY } from "./take-bundle.mjs";

const root = new URL("../", import.meta.url).pathname;
const CHART = "charts/website/Chart.yaml";

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

/** The highest release among a repository's tags, wherever each one sits. */
export function lastRelease(tags) {
  const releases = tags.filter((t) => /^v\d+\.\d+\.\d+$/.test(t)).sort((a, b) => compare(a.slice(1), b.slice(1)));
  if (!releases.length) throw new Error("no v tag to release from");
  return releases.at(-1);
}

const chartVersion = (chart) => {
  const version = chart.match(/^version:\s*(\S+)/m)?.[1];
  if (!version) throw new Error(`${CHART} has no version`);
  return version;
};

/**
 * The chart, stamped to deploy a new site. Its version moves on from the last
 * release's, or from the one written here if that is later: a person can raise
 * it on main, and the tags older than this way of releasing hold a chart one
 * version behind what was published.
 */
export function pointChart(chart, site, last) {
  if (!/^appVersion:/m.test(chart)) throw new Error(`${CHART} has no appVersion`);
  if (compare(site, last.site) <= 0) throw new Error(`site ${site} is not newer than ${last.site}`);
  const here = chartVersion(chart);
  const from = compare(here, chartVersion(last.chart)) > 0 ? here : chartVersion(last.chart);
  const version = bump(from, levelBetween(last.site, site));
  return {
    version,
    chart: chart.replace(/^version:\s*\S+/m, `version: ${version}`).replace(/^appVersion:\s*\S+/m, `appVersion: "${site}"`),
  };
}

function main() {
  const [command, argument] = process.argv.slice(2);
  // A bundle's JSON comes through here, and is well past the default buffer's reach as it grows.
  const git = (...args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim();
  const tag = () => lastRelease(git("tag", "--list", "v*").split("\n"));
  if (command === "shipped" && !argument) {
    const released = tag();
    const version = (bundle) => JSON.parse(bundle).version ?? "0.0.0";
    const here = version(readFileSync(root + COPY.bundle, "utf8"));
    const shipped = version(git("show", `${released}:${COPY.bundle}`));
    if (compare(shipped, here) > 0) {
      // Exactly that bundle: a diagram it does not have goes too.
      git("restore", `--source=${released}`, "--", COPY.bundle, COPY.diagrams);
      console.log(`Took the guide's bundle ${shipped} from ${released} (the copy here was ${here}).`);
    } else {
      console.log(`The guide's bundle here is ${here}; ${released} shipped ${shipped}.`);
    }
  } else if (command === "next" && [undefined, "--new-bundle"].includes(argument)) {
    const released = tag();
    const messages = git("log", "--format=%B%x00", `${released}..HEAD`).split("\0").map((m) => m.trim()).filter(Boolean);
    if (argument) messages.push("chore(email-explained): a new guide bundle");
    if (messages.length) console.log(bump(released.slice(1), levelFor(messages, released.slice(1))));
  } else if (command === "chart" && /^\d+\.\d+\.\d+$/.test(argument ?? "")) {
    const released = tag();
    const last = { site: released.slice(1), chart: git("show", `${released}:${CHART}`) };
    const pointed = pointChart(readFileSync(root + CHART, "utf8"), argument, last);
    writeFileSync(root + CHART, pointed.chart);
    console.log(pointed.version);
  } else {
    throw new Error("usage: node scripts/release.mjs shipped | next [--new-bundle] | chart <x.y.z>");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
