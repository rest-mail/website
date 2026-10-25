import { type CSSProperties, useEffect, useRef, useState } from "react";
import { diagramFile } from "./bundle";

// A diagram is Archify's own page, in its embed mode (the diagram alone,
// without the title, toolbar, cards and index that repeat the chapter), in a
// frame. The site and the diagram can't affect each other, and a new Archify
// release drops in unchanged (rest-mail-server#822). The diagram files are
// served with a policy of their own that lets only this site frame them
// (server.mjs).
//
// A diagram is as wide as the text it sits in. On a phone that would shrink a
// wide one's labels to a few pixels, so there the frame keeps them readable
// and the diagram scrolls sideways, with a hint that it does
// (rest-mail-server#824, pages.css).
export function Diagram({ name, alt }: { name: string; alt: string }) {
  const body = useRef<HTMLDivElement>(null);
  const [sideways, setSideways] = useState(false);
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const check = () => setSideways(el.scrollWidth > el.clientWidth + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    for (const child of el.children) observer.observe(child);
    return () => observer.disconnect();
  }, []);
  return (
    <figure className="guide-diagram">
      {sideways && <p className="guide-diagram-hint">Scroll sideways to see the whole diagram →</p>}
      <div ref={body} id={`diagram-${name}`} className="guide-diagram-body">
        <Framed name={name} alt={alt} />
      </div>
    </figure>
  );
}

// Archify draws a node's title at 11px on the diagram's own canvas; a frame
// this much of the canvas's width keeps titles at 9.5px.
const READABLE = 9.5 / 11;

// Same origin, so the page can read how tall the diagram is and size the
// frame to it, with no scrollbar of its own, and how wide its canvas is.
function Framed({ name, alt }: { name: string; alt: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>();
  const [canvas, setCanvas] = useState<number>();
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    let observer: ResizeObserver | undefined;
    const fit = () => {
      const doc = el.contentDocument;
      if (!doc?.body) return;
      const measure = () => {
        // The body, not the document: a document is never shorter than its
        // frame, so the frame could grow but never shrink to the diagram.
        setHeight(Math.ceil(doc.body.getBoundingClientRect().height));
        const width = doc.querySelector<SVGSVGElement>(".diagram-container svg")?.viewBox.baseVal.width;
        if (width) setCanvas(width);
      };
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
  const style = {
    ...(height ? { height } : {}),
    ...(canvas ? { "--diagram-readable": `${Math.ceil(canvas * READABLE)}px` } : {}),
  } as CSSProperties;
  return <iframe ref={frame} src={`${diagramFile(name, "html")}&embed=1`} title={alt} style={style} />;
}
