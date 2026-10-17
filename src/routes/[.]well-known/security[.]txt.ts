import { createFileRoute } from "@tanstack/react-router";
import { readSite } from "../../site";

/**
 * How to report a vulnerability, for machines (RFC 9116). It names the
 * deployment's contact address, so it is written for each request rather than
 * kept as a file. Expires is always six months ahead: the file is as current as
 * the deployment serving it, and the RFC asks for less than a year.
 */
export function securityTxt(request: Request, contact: string, now = new Date()) {
  const expires = new Date(now);
  expires.setUTCHours(0, 0, 0, 0);
  expires.setUTCDate(expires.getUTCDate() + 182);
  // Behind the cluster's proxy the request arrives over plain HTTP; the page
  // people read is at the address they used, which is HTTPS.
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || url.protocol.slice(0, -1);
  const origin = `${proto}://${url.host}`;
  return [
    `Contact: mailto:${contact}`,
    "Contact: https://github.com/rest-mail/rest-mail-server/security/advisories/new",
    `Expires: ${expires.toISOString()}`,
    "Preferred-Languages: en",
    `Policy: ${origin}/security`,
    "",
  ].join("\n");
}

const serve = ({ request }: { request: Request }) =>
  new Response(securityTxt(request, readSite(process.env).contact), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });

export const Route = createFileRoute("/.well-known/security.txt")({
  server: { handlers: { GET: serve, HEAD: serve } },
});
