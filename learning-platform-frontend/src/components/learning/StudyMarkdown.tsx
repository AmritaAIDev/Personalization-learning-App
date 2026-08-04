'use client';

import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

/**
 * One renderer for every piece of study prose: flashcards, tutor replies, and
 * question explanations. Keeping a single pipeline means maths, lists, and
 * emphasis look identical wherever the learner meets them.
 *
 * Only safe Markdown is rendered. Raw HTML is never enabled, and KaTeX is
 * configured to degrade to the literal source instead of throwing when a model
 * emits an expression it cannot parse.
 */
export default function StudyMarkdown({
  children,
  className = '',
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
        {children}
      </ReactMarkdown>
    </div>
  );
}
