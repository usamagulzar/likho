import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";

/**
 * GFM Markdown for the note body. Code languages load lazily through language-data: a fence only pulls in its
 * language's chunk when it is first seen, and unknown languages stay plain text.
 * SetextHeading is removed, so a line of dashes under a paragraph stays a horizontal rule, not an h2.
 */
export const markdownSupport = markdown({
  base: markdownLanguage,
  codeLanguages: languages,
  addKeymap: false,
  completeHTMLTags: false,
  extensions: { remove: ["SetextHeading"] },
});
