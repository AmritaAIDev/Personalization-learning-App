"use client";

import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

/**
 * One renderer for every piece of study prose: flashcards, tutor replies, and
 * question explanations. Keeping a single pipeline means maths, lists, and
 * emphasis look identical wherever the learner meets them.
 *
 * Only safe Markdown is rendered. Raw HTML is never enabled, and KaTeX is
 * configured to degrade to the literal source instead of throwing when a model
 * emits an expression it cannot parse.
 */

/**
 * Models are told to use `$inline$` and `$$display$$` notation, but they
 * frequently fall back to raw LaTeX delimiters instead: `\(...\)` for inline
 * math and `\[...\]` for display math. `remark-math` only understands the
 * dollar forms, so anything else survives as literal text in the UI.
 *
 * This normaliser rewrites those delimiters to the dollar form before the
 * markdown pipeline runs. Code spans and fenced code blocks are protected so
 * the rewrite never touches source listings. It also repairs the common
 * `\text(enc)` mistake (KaTeX needs braces: `\text{enc}`).
 */
function normalizeMathDelimiters(input: string): string {
  const stash: string[] = [];
  const protect = (match: string) => {
    stash.push(match);
    return `\u0000${stash.length - 1}\u0000`;
  };

  let out = input;
  // Protect fenced code blocks first (they may span many lines)...
  out = out.replace(/```[\s\S]*?```/g, protect);
  // ...then inline code, so no math rewrite leaks into source listings.
  out = out.replace(/`[^`\n]*`/g, protect);

  // Display math: \[ ... \]  ->  $$ ... $$
  out = out.replace(/\\\[([\s\S]+?)\\\]/g, (_, body: string) => `$$${body}$$`);
  // Inline math: \( ... \)  ->  $ ... $
  out = out.replace(/\\\((.+?)\\\)/g, (_, body: string) => `$${body}$`);
  // Repair the frequent \text(...) mistake -> \text{...} (braces required).
  out = out.replace(
    /\\text\(([^(){}]+?)\)/g,
    (_, body: string) => `\\text{${body}}`,
  );

  // Restore protected code segments.
  out = out.replace(
    /\u0000(\d+)\u0000/g,
    (_, index: string) => stash[Number(index)],
  );
  return out;
}

export default function StudyMarkdown({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={`study-markdown ${className}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
      >
        {normalizeMathDelimiters(children)}
      </ReactMarkdown>
    </div>
  );
}
