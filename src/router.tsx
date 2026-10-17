import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// The router TanStack Start renders every page with, on the server and then
// in the browser. The route tree is generated from src/routes/ by the build.
export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
