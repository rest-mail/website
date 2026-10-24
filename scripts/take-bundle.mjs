// Takes a newer Email, explained bundle when rest-mail-server has published
// one, as ghcr.io/rest-mail/email-explained:<version> (its email-explained.yml).
// It finds the newest version of the bundle format this site reads and, if
// that is newer than the copy here, replaces the copy: content/email-explained/
// bundle.json, and public/email-explained/diagrams/.
//
//   node scripts/take-bundle.mjs            take a newer one, if there is one
//   node scripts/take-bundle.mjs --check    only say whether there is
//
// The package is public, so it fetches with no credentials, and it needs only
// Node and tar, so the release workflow runs it before installing anything. In
// GitHub Actions it writes taken, version and commit to $GITHUB_OUTPUT.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, unlinkSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { parseArgs } from "node:util";

/** The bundle format this site reads (src/guide/bundle.ts refuses any other). */
export const FORMAT = 1;
const REPOSITORY = "rest-mail/email-explained";
const REGISTRY = "https://ghcr.io";
const root = new URL("../", import.meta.url).pathname;
export const COPY = { bundle: "content/email-explained/bundle.json", diagrams: "public/email-explained/diagrams" };

const parse = (v) => v.split(".").map(Number);
/** Which of two versions (x.y.z) is later: above zero if a is. */
export const compare = (a, b) => parse(a).map((n, i) => n - parse(b)[i]).find((d) => d !== 0) ?? 0;

/** The newest published version of the format this site reads. */
export function newest(tags, format = FORMAT) {
  return tags.filter((t) => /^\d+\.\d+\.\d+$/.test(t) && parse(t)[0] === format).sort(compare).at(-1) ?? null;
}

/** What replacing the copy does: the files to delete, and the files to write. */
export function plan(have, want) {
  const keep = new Set(want);
  return { remove: have.filter((f) => !keep.has(f)).sort(), write: [...want].sort() };
}

const files = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { recursive: true, withFileTypes: true })
        .filter((e) => e.isFile())
        .map((e) => relative(dir, join(e.parentPath, e.name)))
        .sort()
    : [];

async function registry(repository, path, token, accept) {
  const response = await fetch(`${REGISTRY}/v2/${repository}/${path}`, {
    headers: { authorization: `Bearer ${token}`, ...(accept ? { accept } : {}) },
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw Object.assign(new Error(`${repository}/${path}: HTTP ${response.status}`), { status: response.status });
  return response;
}

/** An anonymous pull token for a public package, and its published tags. */
export async function published(repository = REPOSITORY) {
  const { token } = await (await fetch(`${REGISTRY}/token?scope=repository:${repository}:pull`, { signal: AbortSignal.timeout(30_000) })).json();
  try {
    const { tags = [] } = await (await registry(repository, "tags/list?n=10000", token)).json();
    return { token, tags };
  } catch (error) {
    // ghcr answers 403 for a package that does not exist yet, as for a
    // private one; either way there is nothing this site can take.
    if ([401, 403, 404].includes(error.status)) return { token, tags: [], refused: error.status };
    throw error;
  }
}

const MANIFESTS = [
  "application/vnd.oci.image.manifest.v1+json",
  "application/vnd.docker.distribution.manifest.v2+json",
  "application/vnd.oci.image.index.v1+json",
  "application/vnd.docker.distribution.manifest.list.v2+json",
].join(", ");

/** A package's one layer at a version, unpacked into a new directory. */
export async function fetchBundle(version, token, repository = REPOSITORY) {
  let manifest = await (await registry(repository, `manifests/${version}`, token, MANIFESTS)).json();
  if (manifest.manifests) {
    const image = manifest.manifests.find((m) => m.platform?.os !== "unknown") ?? manifest.manifests[0];
    manifest = await (await registry(repository, `manifests/${image.digest}`, token, MANIFESTS)).json();
  }
  if (manifest.layers?.length !== 1) throw new Error(`${repository}:${version} has ${manifest.layers?.length ?? 0} layers, not the one a bundle has`);
  const [layer] = manifest.layers;
  const bytes = Buffer.from(await (await registry(repository, `blobs/${layer.digest}`, token)).arrayBuffer());
  if (`sha256:${createHash("sha256").update(bytes).digest("hex")}` !== layer.digest) throw new Error(`${repository}:${version}: its layer does not match its digest`);
  const dir = mkdtempSync(join(tmpdir(), "email-explained-"));
  writeFileSync(join(dir, "layer.tar.gz"), bytes);
  mkdirSync(join(dir, "bundle"));
  execFileSync("tar", ["-xzf", join(dir, "layer.tar.gz"), "-C", join(dir, "bundle"), "--no-same-owner"]);
  return { dir, bundle: join(dir, "bundle") };
}

async function main() {
  const { values } = parseArgs({ options: { check: { type: "boolean", default: false } } });
  const output = (pairs) => process.env.GITHUB_OUTPUT && appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(pairs).map(([k, v]) => `${k}=${v}\n`).join(""));

  const current = JSON.parse(readFileSync(join(root, COPY.bundle), "utf8"));
  const { token, tags, refused } = await published();
  const latest = newest(tags);
  const have = current.version ?? null;
  if (!latest || (have && compare(latest, have) <= 0)) {
    const none = refused ? `ghcr.io/${REPOSITORY} has nothing public (HTTP ${refused})` : `newest of format ${FORMAT}: ${latest ?? "none"}`;
    console.log(`The guide's bundle here is ${have ?? "unversioned"}; nothing newer is published (${none}).`);
    output({ taken: false, version: have ?? "" });
    return;
  }
  if (values.check) {
    console.log(`${latest} is published; the copy here is ${have ?? "unversioned"}.`);
    output({ taken: false, version: latest });
    return;
  }

  const { dir, bundle } = await fetchBundle(latest, token);
  try {
    const taken = JSON.parse(readFileSync(join(bundle, "bundle.json"), "utf8"));
    if (taken.format !== FORMAT) throw new Error(`${latest} is bundle format ${taken.format}, not ${FORMAT}`);
    if (taken.version !== latest) throw new Error(`${latest} says it is version ${taken.version}`);
    const target = join(root, COPY.diagrams);
    const { remove, write } = plan(files(target), files(join(bundle, "diagrams")));
    // Exactly the files the new bundle no longer has, each by its own path.
    for (const file of remove) unlinkSync(join(target, file));
    for (const file of write) {
      mkdirSync(dirname(join(target, file)), { recursive: true });
      copyFileSync(join(bundle, "diagrams", file), join(target, file));
    }
    copyFileSync(join(bundle, "bundle.json"), join(root, COPY.bundle));
    console.log(`Took the guide's bundle ${latest} (was ${have ?? "unversioned"}), from ${taken.source.repository}@${taken.source.commit.slice(0, 12)}: ${taken.chapters.length} chapters, ${write.length} diagram files, ${remove.length} removed.`);
    output({ taken: true, version: latest, commit: taken.source.commit });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
