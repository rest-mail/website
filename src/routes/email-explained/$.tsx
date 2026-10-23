import { createFileRoute, notFound } from "@tanstack/react-router";
import { chapter } from "../../guide/bundle";
import { GuideChapter } from "../../guide/Chapter";
import { isEmbed, type Embed } from "../../guide/Diagram";

// Every chapter of Email, explained, at its path in the guide.
export const Route = createFileRoute("/email-explained/$")({
  validateSearch: (search: Record<string, unknown>): { embed?: Embed } => ({
    embed: isEmbed(search.embed) ? search.embed : undefined,
  }),
  loader: ({ params }) => {
    const found = chapter(params._splat ?? "");
    if (!found) throw notFound();
    return found;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — Email, explained — REST Mail` },
          ...(loaderData.summary ? [{ name: "description", content: loaderData.summary }] : []),
        ]
      : [],
  }),
  component: Page,
});

function Page() {
  const found = Route.useLoaderData();
  const { embed } = Route.useSearch();
  return <GuideChapter chapter={found} embed={embed ?? "image"} />;
}
