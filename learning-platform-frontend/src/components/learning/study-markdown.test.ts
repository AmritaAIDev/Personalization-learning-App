/**
 * Unit tests for the math normaliser that keeps tutor prose renderable.
 * Pure string transforms — no DOM needed.
 */
import { describe, expect, it } from "vitest";
import { normalizeMathDelimiters } from "./StudyMarkdown";

describe("normalizeMathDelimiters", () => {
  it("converts raw \\( \\) and \\[ \\] delimiters to dollar forms", () => {
    expect(normalizeMathDelimiters("inline \\(a+b\\) math")).toContain("$a+b$");
    const display = normalizeMathDelimiters("see \\[\\frac{a}{b}\\] here");
    expect(display).toContain("$$");
    expect(display).toContain("\\frac{a}{b}");
  });

  it("moves an inline $$ display expression onto its own block", () => {
    const out = normalizeMathDelimiters(
      "charge:$$\\oint E = \\frac{Q}{\\varepsilon_0}$$ next line",
    );
    const lines = out.split("\n");
    const mathLineIndex = lines.findIndex((l) => l.trim() === "$$");
    expect(mathLineIndex).toBeGreaterThan(-1);
    // The $$ opener is alone on its line, with a blank line before it, so
    // remark-math parses display math instead of an inline display span.
    expect(lines[mathLineIndex - 1].trim()).toBe("");
    expect(out).toMatch(/:\n\n\$\$\n/);
  });

  it("keeps already-blocked display math intact", () => {
    const input = "text\n\n$$\nE=mc^2\n$$\n\nmore";
    const out = normalizeMathDelimiters(input);
    expect(out).toContain("$$\nE=mc^2\n$$");
    expect(out).toContain("more");
  });

  it("downgrades \\dfrac and \\tfrac so inline stacks fit the line", () => {
    expect(normalizeMathDelimiters("$\\dfrac{1}{2}$")).toContain("\\frac{1}{2}");
    expect(normalizeMathDelimiters("$\\tfrac{1}{2}$")).toContain("\\frac{1}{2}");
  });

  it("repairs \\text(...) into \\text{...}", () => {
    expect(normalizeMathDelimiters("\\(\\text{enc}\\)")).toContain(
      "\\text{enc}",
    );
  });

  it("never rewrites math inside code spans or fences", () => {
    const inline = normalizeMathDelimiters("use `\\(x\\)` literally");
    expect(inline).toContain("`\\(x\\)`");
    const fenced = normalizeMathDelimiters("```\n$$x$$\n```");
    expect(fenced).toContain("```\n$$x$$\n```");
  });

  it("collapses the blank lines the block moves leave behind", () => {
    const out = normalizeMathDelimiters("a$$x$$b$$y$$c");
    expect(out).not.toMatch(/\n{3,}/);
  });
});
