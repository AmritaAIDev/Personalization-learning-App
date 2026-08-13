/**
 * Bulk question import expects this exact header row (order doesn't matter,
 * extra columns are ignored). Options are four separate columns rather than
 * one delimited field so a reviewer can prep the sheet without inventing a
 * sub-delimiter for option text that may itself contain commas.
 */
export const QUESTION_CSV_COLUMNS = [
  "subject",
  "chapter",
  "topic",
  "subtopic",
  "question_text",
  "option_1",
  "option_2",
  "option_3",
  "option_4",
  "correct_answer",
  "solution",
  "bloom_level",
  "difficulty",
  "marks",
  "estimated_time_sec",
  "concept_tags",
] as const;

const REQUIRED_COLUMNS = QUESTION_CSV_COLUMNS.filter(
  (column) => column !== "subtopic" && column !== "concept_tags",
);

export type QuestionCsvRow = Record<string, unknown>;

export interface ParsedQuestionCsv {
  rows: QuestionCsvRow[];
  /** File-level problems (bad header, no data rows) — parsing stops here. */
  fileErrors: string[];
}

/** Splits one CSV line into fields, honoring double-quoted fields with embedded commas/quotes (RFC 4180). */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(field);
      field = "";
    } else {
      field += char;
    }
  }
  fields.push(field);
  return fields;
}

/** Splits raw CSV text into logical lines, keeping quoted newlines intact. */
function splitCsvLines(text: string): string[] {
  const lines: string[] = [];
  let line = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') inQuotes = !inQuotes;
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      lines.push(line);
      line = "";
    } else {
      line += char;
    }
  }
  if (line.trim().length > 0) lines.push(line);
  return lines;
}

/**
 * Parses a bulk-upload CSV into row objects shaped like `CreateQuestionDto`
 * (the backend's per-row shape) — `option_1..option_4` collapse into an
 * `options` array, `marks`/`estimated_time_sec` become numbers,
 * `concept_tags` splits on `;`. Row-level content validation (required
 * fields, bloom level, etc.) happens server-side via the validate endpoint;
 * this function only does structural CSV→object parsing.
 */
export function parseQuestionsCsv(text: string): ParsedQuestionCsv {
  const lines = splitCsvLines(text).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { rows: [], fileErrors: ["The file is empty."] };
  }

  const header = splitCsvLine(lines[0]).map((column) => column.trim());
  const missing = REQUIRED_COLUMNS.filter(
    (column) => !header.includes(column),
  );
  if (missing.length > 0) {
    return {
      rows: [],
      fileErrors: [`Missing required column(s): ${missing.join(", ")}.`],
    };
  }
  if (lines.length === 1) {
    return { rows: [], fileErrors: ["The file has a header but no data rows."] };
  }

  const rows: QuestionCsvRow[] = [];
  for (const line of lines.slice(1)) {
    const values = splitCsvLine(line);
    const byColumn: Record<string, string> = {};
    header.forEach((column, index) => {
      byColumn[column] = (values[index] ?? "").trim();
    });

    const options = [
      byColumn.option_1,
      byColumn.option_2,
      byColumn.option_3,
      byColumn.option_4,
    ].filter((option) => option.length > 0);

    const row: QuestionCsvRow = {
      subject: byColumn.subject,
      chapter: byColumn.chapter,
      topic: byColumn.topic,
      question_text: byColumn.question_text,
      options,
      correct_answer: byColumn.correct_answer,
      solution: byColumn.solution,
      bloom_level: byColumn.bloom_level,
      difficulty: byColumn.difficulty,
      marks: Number(byColumn.marks),
      estimated_time_sec: Number(byColumn.estimated_time_sec),
    };
    if (byColumn.subtopic) row.subtopic = byColumn.subtopic;
    if (byColumn.concept_tags) {
      row.concept_tags = byColumn.concept_tags
        .split(";")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
    rows.push(row);
  }

  return { rows, fileErrors: [] };
}
