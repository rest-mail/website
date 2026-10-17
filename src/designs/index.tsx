import type { ComponentType, ReactNode } from "react";
import { useSite, type Design } from "../site";
import Bold, { BoldChrome, BoldDoc, BoldDocSection } from "./Bold";
import type { DocProps, DocSectionProps } from "./common";
import Experimental, { ExperimentalChrome, ExperimentalDoc, ExperimentalDocSection } from "./Experimental";
import Safe, { SafeChrome, SafeDoc, SafeDocSection } from "./Safe";

type Parts = {
  /** Header and footer, around every page. */
  Chrome: ComponentType<{ children: ReactNode }>;
  /** The home page. */
  Home: ComponentType;
  /** A page of text, and its sections. */
  Doc: ComponentType<DocProps>;
  Section: ComponentType<DocSectionProps>;
};

// Each design draws every page. The server sends the HTML and the stylesheet
// of one of them (src/routes/__root.tsx); the script that brings it to life
// carries all three, which are small next to their stylesheets.
const parts: Record<Design, Parts> = {
  safe: { Chrome: SafeChrome, Home: Safe, Doc: SafeDoc, Section: SafeDocSection },
  bold: { Chrome: BoldChrome, Home: Bold, Doc: BoldDoc, Section: BoldDocSection },
  experimental: {
    Chrome: ExperimentalChrome,
    Home: Experimental,
    Doc: ExperimentalDoc,
    Section: ExperimentalDocSection,
  },
};

const useParts = () => parts[useSite().design];

export const Chrome = ({ children }: { children: ReactNode }) => {
  const { Chrome } = useParts();
  return <Chrome>{children}</Chrome>;
};

export const Home = () => {
  const { Home } = useParts();
  return <Home />;
};

export const Doc = (props: DocProps) => {
  const { Doc } = useParts();
  return <Doc {...props} />;
};

export const Section = (props: DocSectionProps) => {
  const { Section } = useParts();
  return <Section {...props} />;
};
