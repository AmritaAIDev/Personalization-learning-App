export type TutorInlineSegment =
  | { type: 'text'; text: string }
  | { type: 'strong'; text: string }
  | { type: 'code'; text: string };

export type TutorMarkdownBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; segments: TutorInlineSegment[] }
  | { type: 'unorderedList'; items: TutorInlineSegment[][] }
  | { type: 'orderedList'; items: TutorInlineSegment[][] }
  | { type: 'codeBlock'; code: string };

const unorderedListPattern = /^[-*]\s+(.+)$/;
const orderedListPattern = /^\d+[.)]\s+(.+)$/;

export function parseTutorInline(value: string): TutorInlineSegment[] {
  const segments: TutorInlineSegment[] = [];
  const pattern = /(`[^`\n]+`|\*\*[^*\n]+\*\*)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    if (match.index > cursor) {
      segments.push({ type: 'text', text: value.slice(cursor, match.index) });
    }
    const token = match[0];
    if (token.startsWith('`')) {
      segments.push({ type: 'code', text: token.slice(1, -1) });
    } else {
      segments.push({ type: 'strong', text: token.slice(2, -2) });
    }
    cursor = match.index + token.length;
  }

  if (cursor < value.length) {
    segments.push({ type: 'text', text: value.slice(cursor) });
  }

  return segments.length ? segments : [{ type: 'text', text: value }];
}

export function parseTutorMarkdown(content: string): TutorMarkdownBlock[] {
  const normalized = content.replace(/\r\n?/g, '\n').trim();
  if (!normalized) return [];

  const blocks: TutorMarkdownBlock[] = [];
  const paragraphLines: string[] = [];
  let activeList:
    | { type: 'unorderedList' | 'orderedList'; items: TutorInlineSegment[][] }
    | null = null;
  let activeCode: string[] | null = null;

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    blocks.push({
      type: 'paragraph',
      segments: parseTutorInline(paragraphLines.join('\n')),
    });
    paragraphLines.length = 0;
  };

  const flushList = () => {
    if (!activeList) return;
    blocks.push(activeList);
    activeList = null;
  };

  const flushCode = () => {
    if (!activeCode) return;
    blocks.push({ type: 'codeBlock', code: activeCode.join('\n') });
    activeCode = null;
  };

  for (const rawLine of normalized.split('\n')) {
    const line = rawLine.trimEnd();

    if (line.trim().startsWith('```')) {
      flushParagraph();
      flushList();
      if (activeCode) {
        flushCode();
      } else {
        activeCode = [];
      }
      continue;
    }

    if (activeCode) {
      activeCode.push(rawLine);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', text: line.slice(4).trim() });
      continue;
    }

    const unordered = line.match(unorderedListPattern);
    if (unordered) {
      flushParagraph();
      if (activeList?.type !== 'unorderedList') flushList();
      activeList ??= { type: 'unorderedList', items: [] };
      activeList.items.push(parseTutorInline(unordered[1].trim()));
      continue;
    }

    const ordered = line.match(orderedListPattern);
    if (ordered) {
      flushParagraph();
      if (activeList?.type !== 'orderedList') flushList();
      activeList ??= { type: 'orderedList', items: [] };
      activeList.items.push(parseTutorInline(ordered[1].trim()));
      continue;
    }

    flushList();
    paragraphLines.push(line.trim());
  }

  flushCode();
  flushParagraph();
  flushList();
  return blocks;
}
