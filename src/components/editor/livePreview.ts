import { syntaxTree } from "@codemirror/language";
import { type Line, RangeSet, RangeSetBuilder, type Range } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import type { SyntaxNode } from "@lezer/common";
import { CheckboxWidget, CodeHeadWidget, MarkerWidget } from "./widgets";
import { closingFence, fenceInfo, QUOTE_PREFIX } from "./syntax";

/** Bullet glyph per nesting level. */
const BULLETS = ["•", "◦", "▪"];

const HEADING_LINE: Record<string, string> = {
  ATXHeading1: "md-h1",
  ATXHeading2: "md-h2",
  ATXHeading3: "md-h3",
  ATXHeading4: "md-h3",
  ATXHeading5: "md-h3",
  ATXHeading6: "md-h3",
};

// Shared decoration instances. CodeMirror compares by spec, so reusing them keeps rebuilds cheap.
const markCache = new Map<string, Decoration>();
function markDeco(cls: string): Decoration {
  let deco = markCache.get(cls);
  if (!deco) {
    deco = Decoration.mark({ class: cls });
    markCache.set(cls, deco);
  }
  return deco;
}
const dimDeco = markDeco("md-mark");
const hideDeco = Decoration.replace({});

const lineCache = new Map<string, Decoration>();
function lineDeco(classes: string, style: string): Decoration {
  const key = `${classes}|${style}`;
  let deco = lineCache.get(key);
  if (!deco) {
    deco = Decoration.line({ attributes: style ? { class: classes, style } : { class: classes } });
    lineCache.set(key, deco);
  }
  return deco;
}

interface Built {
  decorations: DecorationSet;
  atomic: DecorationSet;
}

function listDepth(node: SyntaxNode): number {
  let depth = 0;
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.name === "ListItem") depth++;
  }
  return depth;
}

/**
 * Builds the live-preview decorations for the lines in view only. Markers are hidden when the cursor is away
 * from their span and dimmed when it is inside. Markdown syntax is read from the lezer tree, so a fence or a list
 * is only what the parser says it is, and nothing inside a code block gets styled as Markdown.
 */
function build(view: EditorView): Built {
  const { state } = view;
  const doc = state.doc;
  const tree = syntaxTree(state);
  const cursors = state.selection.ranges;
  const touches = (from: number, to: number) => cursors.some((range) => range.from <= to && range.to >= from);

  const items: Range<Decoration>[] = [];
  const atomic: Range<Decoration>[] = [];
  const lines = new Map<number, { classes: string[]; style: string }>();
  const seen = new Set<string>();

  // Each tag names a kind of decoration, so a range visited from two visible ranges is only added once.
  const put = (tag: string, from: number, to: number, deco: Decoration, replaces: boolean) => {
    const key = `${tag}|${from}|${to}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(deco.range(from, to));
    if (replaces) atomic.push(deco.range(from, to));
  };

  const hide = (from: number, to: number, active: boolean) => {
    if (to <= from) return;
    if (active) put("dim", from, to, dimDeco, false);
    else put("hide", from, to, hideDeco, true);
  };

  const addLine = (at: number, classes: string, style = "") => {
    let entry = lines.get(at);
    if (!entry) {
      entry = { classes: [], style: "" };
      lines.set(at, entry);
    }
    for (const cls of classes.split(" ")) {
      if (cls && !entry.classes.includes(cls)) entry.classes.push(cls);
    }
    if (style) entry.style = style;
  };

  const skipSpaces = (pos: number) => {
    const line = doc.lineAt(pos);
    let i = pos - line.from;
    while (i < line.text.length && (line.text[i] === " " || line.text[i] === "\t")) i++;
    return line.from + i;
  };

  for (const range of view.visibleRanges) {
    // Lines of a block that start before or end after this visible range are clipped to it.
    const eachLine = (from: number, to: number, fn: (line: Line) => void) => {
      const start = Math.max(from, range.from);
      const end = Math.min(to, range.to);
      if (start > end) return;
      for (let line = doc.lineAt(start); ; line = doc.line(line.number + 1)) {
        fn(line);
        if (line.to >= end || line.number >= doc.lines) break;
      }
    };

    tree.iterate({
      from: range.from,
      to: range.to,
      enter: (ref) => {
        const node = ref.node;
        const name = ref.name;

        if (name in HEADING_LINE) {
          const cls = HEADING_LINE[name];
          eachLine(ref.from, ref.to, (line) => addLine(line.from, cls));
          return;
        }

        switch (name) {
          // Tables have their own StateField replacement. Skip their descendants so inline preview marks do not
          // overlap the block widget or partially style the raw Markdown while a table is being edited.
          case "Table":
            return false;

          case "HeaderMark": {
            const line = doc.lineAt(ref.from);
            // The "#" marker and the space after it.
            hide(ref.from, skipSpaces(ref.to), touches(line.from, line.to));
            return;
          }

          case "Blockquote":
            eachLine(ref.from, ref.to, (line) => {
              if (QUOTE_PREFIX.test(line.text)) addLine(line.from, "md-quote");
            });
            return;

          case "QuoteMark": {
            const line = doc.lineAt(ref.from);
            hide(ref.from, skipSpaces(ref.to), touches(line.from, line.to));
            return;
          }

          case "ListItem": {
            const mark = node.getChild("ListMark");
            if (!mark) return;
            // A marker counts only with a space after it. "-" alone is still plain text.
            const after = doc.sliceString(mark.to, mark.to + 1);
            if (after !== " " && after !== "\t") return;

            const depth = listDepth(node);
            eachLine(ref.from, ref.to, (line) => addLine(line.from, "md-list", `--lvl:${depth}`));

            const markLine = doc.lineAt(mark.from);
            // Leading indent is replaced together with the marker, so the hanging gutter alone sets the column.
            const leadingIsIndent = /^[ \t]*$/.test(doc.sliceString(markLine.from, mark.from));
            const start = leadingIsIndent ? markLine.from : mark.from;

            const task = node.getChild("Task");
            const box = task?.getChild("TaskMarker");
            if (task && box) {
              const end = skipSpaces(box.to);
              const checked = doc.sliceString(box.from + 1, box.from + 2).toLowerCase() === "x";
              const label = doc.sliceString(end, task.to).trim().slice(0, 120);
              put("box", start, end, Decoration.replace({ widget: new CheckboxWidget(checked, label) }), true);
              if (checked && task.to > end) put("done", end, task.to, markDeco("md-task-done"), false);
            } else {
              const end = skipSpaces(mark.to);
              const label = doc.sliceString(mark.from, mark.to);
              const ordered = /\d/.test(label);
              const glyph = ordered ? label : BULLETS[depth % BULLETS.length];
              put("bullet", start, end, Decoration.replace({ widget: new MarkerWidget(glyph, ordered) }), true);
            }
            return;
          }

          case "FencedCode": {
            const open = doc.lineAt(ref.from);
            const last = doc.lineAt(ref.to);
            const close = closingFence(node);
            // The fence lines show while the cursor is inside the block, and are hidden otherwise.
            const active = touches(ref.from, ref.to);
            eachLine(ref.from, ref.to, (line) => addLine(line.from, "md-code"));
            addLine(open.from, "md-code-first");
            addLine(last.from, "md-code-last");
            if (active) addLine(open.from, "md-code-focus");
            hide(open.from, open.to, active);
            if (close) hide(last.from, last.to, active);
            // The language label and Copy button sit at the end of the opening line, which has no other content.
            put(
              "head",
              open.to,
              open.to,
              // While the cursor is in the block the raw fence shows, so the label would repeat it.
              Decoration.widget({ widget: new CodeHeadWidget(active ? "" : fenceInfo(state, node)), side: 1 }),
              false,
            );
            return false;
          }

          case "HorizontalRule": {
            const line = doc.lineAt(ref.from);
            addLine(line.from, "md-hr");
            hide(ref.from, ref.to, touches(line.from, line.to));
            return false;
          }

          case "Emphasis":
          case "StrongEmphasis":
          case "Strikethrough":
          case "InlineCode": {
            const cls =
              name === "Emphasis"
                ? "md-em"
                : name === "StrongEmphasis"
                  ? "md-strong"
                  : name === "Strikethrough"
                    ? "md-strike"
                    : "md-code-inline";
            const active = touches(ref.from, ref.to);
            put(cls, ref.from, ref.to, markDeco(cls), false);
            for (let child = node.firstChild; child; child = child.nextSibling) {
              if (child.name === "EmphasisMark" || child.name === "StrikethroughMark" || child.name === "CodeMark") {
                hide(child.from, child.to, active);
              }
            }
            return;
          }

          case "Link": {
            const marks: SyntaxNode[] = [];
            for (let child = node.firstChild; child; child = child.nextSibling) {
              if (child.name === "LinkMark") marks.push(child);
            }
            const open = marks[0];
            const close = marks[1];
            if (!open || !close) return;
            const active = touches(ref.from, ref.to);
            if (open.to < close.from) put("md-link", open.to, close.from, markDeco("md-link"), false);
            // "[" on its own, then "](url)" as one range, so the link reads as its text alone.
            hide(open.from, open.to, active);
            hide(close.from, ref.to, active);
            return;
          }

          case "URL": {
            // Bare links. A URL inside a [text](url) link is styled by the Link branch.
            if (node.parent?.name !== "Link") put("md-url", ref.from, ref.to, markDeco("md-url"), false);
            return;
          }

          default:
            return;
        }
      },
    });
  }

  const lineItems: Range<Decoration>[] = [];
  for (const [at, entry] of lines) {
    lineItems.push(lineDeco(entry.classes.join(" "), entry.style).range(at));
  }
  const all = [...lineItems, ...items].sort(byStart);
  const builder = new RangeSetBuilder<Decoration>();
  for (const range of all) builder.add(range.from, range.to, range.value);

  const atomicSorted = atomic.sort(byStart);
  const atomicBuilder = new RangeSetBuilder<Decoration>();
  for (const range of atomicSorted) atomicBuilder.add(range.from, range.to, range.value);

  return { decorations: builder.finish(), atomic: atomicBuilder.finish() };
}

function byStart(a: Range<Decoration>, b: Range<Decoration>): number {
  return a.from - b.from || a.value.startSide - b.value.startSide;
}

/** The live Markdown decorations. Hidden markers are atomic, so the caret steps over them as one unit. */
export const livePreview = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    atomic: DecorationSet;

    constructor(view: EditorView) {
      const built = build(view);
      this.decorations = built.decorations;
      this.atomic = built.atomic;
    }

    update(update: ViewUpdate) {
      // Rebuild only when something a decoration depends on changed: the text, the view, the cursor, or a parse.
      if (
        update.docChanged ||
        update.viewportChanged ||
        update.selectionSet ||
        syntaxTree(update.state) !== syntaxTree(update.startState)
      ) {
        const built = build(update.view);
        this.decorations = built.decorations;
        this.atomic = built.atomic;
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations,
    provide: (plugin) =>
      EditorView.atomicRanges.of((view) => view.plugin(plugin)?.atomic ?? RangeSet.empty),
  },
);
