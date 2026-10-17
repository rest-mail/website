import { Link } from "@tanstack/react-router";
import { Doc, Section } from "../designs";

/** Any address the site has no page for. The server answers it with 404. */
export function NotFound() {
  return (
    <Doc
      eyebrow="404 · Not found"
      kicker="Return to sender."
      title="Nothing here."
      lede="There's no page at this address. It may have moved, or it was never here."
    >
      <Section title="Try one of these">
        <ul>
          <li>
            <Link to="/">The home page</Link>: REST Mail on one page.
          </li>
          <li>
            <Link to="/about">About</Link>: what it is, and who makes it.
          </li>
          <li>
            <Link to="/privacy">Privacy</Link>: what the site and the app keep, which is very little.
          </li>
          <li>
            <Link to="/contact">Contact</Link>: how to reach the project.
          </li>
        </ul>
      </Section>
    </Doc>
  );
}
