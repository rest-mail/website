import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";

// The typefaces, bundled rather than fetched from Google: nothing outside
// rest-mail.com loads on this site.
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/fraunces/opsz-italic.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/jetbrains-mono/700.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./styles/shared.css";

// Three designs of the same site. Each is its own chunk, styles included, so
// a visitor downloads only the one that is live.
const designs = {
  safe: lazy(() => import("./designs/Safe.jsx")),
  bold: lazy(() => import("./designs/Bold.jsx")),
  experimental: lazy(() => import("./designs/Experimental.jsx")),
};

// Which one is live is the deployment's choice, not the build's: the chart's
// `design` value reaches the page as window.REST_MAIL_DESIGN, through
// /design.js (nginx/templates/default.conf.template). `?design=bold` previews
// another without deploying anything.
export function chooseDesign(search, deployed) {
  const asked = new URLSearchParams(search).get("design");
  if (asked in designs) return asked;
  if (deployed in designs) return deployed;
  return "safe";
}

const Design = designs[chooseDesign(window.location.search, window.REST_MAIL_DESIGN)];

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Suspense fallback={null}>
      <Design />
    </Suspense>
  </React.StrictMode>,
);
