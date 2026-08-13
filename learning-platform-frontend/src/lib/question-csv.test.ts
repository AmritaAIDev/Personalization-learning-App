import { describe, expect, it } from "vitest";
import { parseQuestionsCsv } from "./question-csv";

const HEADER =
  "subject,chapter,topic,subtopic,question_text,option_1,option_2,option_3,option_4,correct_answer,solution,bloom_level,difficulty,marks,estimated_time_sec,concept_tags";

describe("parseQuestionsCsv", () => {
  it("parses a well-formed row into a CreateQuestionDto-shaped object", () => {
    const csv = [
      HEADER,
      'Physics,Electric Charges and Fields,"Coulomb\'s Law",,"What is the SI unit of charge?",Coulomb,Ampere,Volt,Ohm,Coulomb,"It is the base unit of charge.",Recall,Easy,2,60,"charge;units"',
    ].join("\n");

    const { rows, fileErrors } = parseQuestionsCsv(csv);

    expect(fileErrors).toEqual([]);
    expect(rows).toEqual([
      {
        subject: "Physics",
        chapter: "Electric Charges and Fields",
        topic: "Coulomb's Law",
        question_text: "What is the SI unit of charge?",
        options: ["Coulomb", "Ampere", "Volt", "Ohm"],
        correct_answer: "Coulomb",
        solution: "It is the base unit of charge.",
        bloom_level: "Recall",
        difficulty: "Easy",
        marks: 2,
        estimated_time_sec: 60,
        concept_tags: ["charge", "units"],
      },
    ]);
  });

  it("keeps a comma embedded inside a quoted field intact", () => {
    const csv = [
      HEADER,
      'Physics,Kinematics,Motion,,"A car moves 10m, then 20m.",A,B,C,D,A,"Add the distances.",Apply,Medium,4,90,',
    ].join("\n");

    const { rows } = parseQuestionsCsv(csv);

    expect(rows[0].question_text).toBe("A car moves 10m, then 20m.");
  });

  it("reports a file-level error when a required column is missing", () => {
    const csv = "subject,chapter,topic\nPhysics,Kinematics,Motion";

    const { rows, fileErrors } = parseQuestionsCsv(csv);

    expect(rows).toEqual([]);
    expect(fileErrors[0]).toContain("Missing required column");
  });

  it("reports a file-level error for a header-only file", () => {
    const { rows, fileErrors } = parseQuestionsCsv(HEADER);

    expect(rows).toEqual([]);
    expect(fileErrors).toEqual(["The file has a header but no data rows."]);
  });

  it("reports a file-level error for an empty file", () => {
    const { rows, fileErrors } = parseQuestionsCsv("");

    expect(rows).toEqual([]);
    expect(fileErrors).toEqual(["The file is empty."]);
  });

  it("omits subtopic and concept_tags when left blank", () => {
    const csv = [
      HEADER,
      "Physics,Kinematics,Motion,,Question text,A,B,C,D,A,Solution text,Recall,Easy,2,60,",
    ].join("\n");

    const { rows } = parseQuestionsCsv(csv);

    expect(rows[0]).not.toHaveProperty("subtopic");
    expect(rows[0]).not.toHaveProperty("concept_tags");
  });
});
