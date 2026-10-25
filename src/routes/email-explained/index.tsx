import { createFileRoute } from "@tanstack/react-router";
import { chapter } from "../../guide/bundle";
import { GuideChapter } from "../../guide/Chapter";

const front = chapter("")!;

export const Route = createFileRoute("/email-explained/")({
  head: () => ({
    meta: [{ title: "Email, explained — REST Mail" }, { name: "description", content: "How email actually works, and why mail servers are so easy to get wrong." }],
  }),
  component: () => <GuideChapter chapter={front} />,
});
