import { useEffect, useRef, useState } from "react";
import { diagramFile } from "./bundle";

// A diagram is Archify's own page, in its embed mode (the diagram alone,
// without the title, toolbar, cards and index that repeat the chapter), in a
// frame. The site and the diagram can't affect each other, and a new Archify
// release drops in unchanged (rest-mail-server#822). The diagram files are
// served with a policy of their own that lets only this site frame them
// (server.mjs).
export function Diagram({ name, alt }: { name: string; alt: string }) {
  return (
    <figure className="guide-diagram">
      <div id={`diagram-${name}`} className="guide-diagram-body">
        <Framed name={name} alt={alt} />
      </div>
    </figure>
  );
}

// Same origin, so the page can read how tall the diagram is and size the
// frame to it, with no scrollbar of its own.
function Framed({ name, alt }: { name: string; alt: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>();
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    let observer: ResizeObserver | undefined;
    const fit = () => {
      const doc = el.contentDocument;
      if (!doc?.body) return;
      const measure = () => setHeight(doc.documentElement.scrollHeight);
      measure();
      observer?.disconnect();
      observer = new ResizeObserver(measure);
      observer.observe(doc.body);
    };
    // The server's HTML may have loaded the frame before this script ran.
    if (el.contentDocument?.readyState === "complete" && el.contentDocument.URL !== "about:blank") fit();
    el.addEventListener("load", fit);
    return () => {
      el.removeEventListener("load", fit);
      observer?.disconnect();
    };
  }, []);
  return <iframe ref={frame} src={`${diagramFile(name, "html")}&embed=1`} title={alt} style={height ? { height } : undefined} />;
}
