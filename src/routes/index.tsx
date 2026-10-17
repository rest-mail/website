import { createFileRoute } from "@tanstack/react-router";
import { Home } from "../designs";

export const Route = createFileRoute("/")({
  component: Home,
});
