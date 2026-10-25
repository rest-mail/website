import { createFileRoute, notFound } from "@tanstack/react-router";
import { chapter } from "../../guide/bundle";
import { GuideChapter } from "../../guide/Chapter";

// Every chapter of Email, explained, at its path in the guide.
export const Route = createFileRoute("/email-explained/$")({
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
  return <GuideChapter chapter={found} />;
}
