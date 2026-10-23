import { createFileRoute } from "@tanstack/react-router";
import { chapter } from "../../guide/bundle";
import { GuideChapter } from "../../guide/Chapter";
import { isEmbed, type Embed } from "../../guide/Diagram";

const front = chapter("")!;

export const Route = createFileRoute("/email-explained/")({
  validateSearch: (search: Record<string, unknown>): { embed?: Embed } => ({
    embed: isEmbed(search.embed) ? search.embed : undefined,
  }),
  head: () => ({
    meta: [{ title: "Email, explained — REST Mail" }, { name: "description", content: "How email actually works, and why mail servers are so easy to get wrong." }],
  }),
  component: () => <GuideChapter chapter={front} embed={Route.useSearch().embed ?? "image"} />,
});
