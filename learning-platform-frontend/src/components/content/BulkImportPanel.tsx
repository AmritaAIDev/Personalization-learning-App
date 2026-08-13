"use client";

import { useRef, useState } from "react";
import { CheckCircle2, CircleAlert, LoaderCircle, Upload } from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  parseQuestionsCsv,
  QUESTION_CSV_COLUMNS,
  type QuestionCsvRow,
} from "@/lib/question-csv";

interface RowValidationResult {
  row: number;
  valid: boolean;
  errors: string[];
}

interface BulkImportCommitResult {
  inserted: number;
  failed: { row: number; errors: string[] }[];
}

type Stage = "idle" | "validating" | "previewing" | "importing" | "done";

export default function BulkImportPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<QuestionCsvRow[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [validation, setValidation] = useState<RowValidationResult[]>([]);
  const [result, setResult] = useState<BulkImportCommitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStage("idle");
    setFileName(null);
    setRows([]);
    setFileErrors([]);
    setValidation([]);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onFileSelected = async (file: File) => {
    setFileName(file.name);
    setResult(null);
    setError(null);
    const text = await file.text();
    const parsed = parseQuestionsCsv(text);
    if (parsed.fileErrors.length > 0) {
      setFileErrors(parsed.fileErrors);
      setRows([]);
      setValidation([]);
      setStage("idle");
      return;
    }
    setFileErrors([]);
    setRows(parsed.rows);
    setStage("validating");
    try {
      const response = await apiFetch<RowValidationResult[]>(
        "/api/questions/bulk-import/validate",
        { method: "POST", body: JSON.stringify({ rows: parsed.rows }) },
      );
      setValidation(response);
      setStage("previewing");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The file could not be validated.",
      );
      setStage("idle");
    }
  };

  const commit = async () => {
    setStage("importing");
    setError(null);
    try {
      const response = await apiFetch<BulkImportCommitResult>(
        "/api/questions/bulk-import/commit",
        { method: "POST", body: JSON.stringify({ rows }) },
      );
      setResult(response);
      setStage("done");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "The import failed.",
      );
      setStage("previewing");
    }
  };

  const validCount = validation.filter((row) => row.valid).length;

  return (
    <section className="rounded-[1.75rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-tint text-primary">
          <Upload className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-heading text-xl font-bold text-ink">
            Bulk import
          </h2>
          <p className="mt-0.5 text-sm text-ink-soft">
            Upload a CSV with columns: {QUESTION_CSV_COLUMNS.join(", ")}.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onFileSelected(file);
          }}
          className="block w-full text-sm text-ink-soft file:mr-4 file:rounded-xl file:border-0 file:bg-primary-tint file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-primary-strong hover:file:bg-primary/20"
        />
        {fileName ? (
          <p className="mt-2 text-xs font-medium text-ink-mute">{fileName}</p>
        ) : null}
      </div>

      {fileErrors.length > 0 ? (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-rose-100 bg-rose-50 px-3 py-3 text-sm font-semibold text-rose-700"
        >
          {fileErrors.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-3 text-sm font-semibold text-rose-700"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      {stage === "validating" ? (
        <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-ink-soft">
          <LoaderCircle className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
          Validating rows…
        </p>
      ) : null}

      {stage === "previewing" || stage === "importing" ? (
        <div className="mt-6">
          <p className="text-sm font-semibold text-ink">
            {validCount} of {validation.length} row
            {validation.length === 1 ? "" : "s"} valid.
          </p>
          <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-hairline">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-canvas text-xs font-bold uppercase tracking-wide text-ink-mute">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Question</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {validation.map((result) => (
                  <tr key={result.row} className="border-t border-hairline">
                    <td className="px-3 py-2 text-ink-soft">{result.row}</td>
                    <td className="max-w-xs truncate px-3 py-2 text-ink">
                      {typeof rows[result.row - 1]?.question_text === "string"
                        ? (rows[result.row - 1].question_text as string)
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {result.valid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Valid
                        </span>
                      ) : (
                        <span className="text-rose-700">
                          {result.errors.join("; ")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              disabled={validCount === 0 || stage === "importing"}
              onClick={() => void commit()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(20,20,30,0.22)] transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {stage === "importing" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              Import {validCount} valid row{validCount === 1 ? "" : "s"} as drafts
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-hairline px-4 py-2.5 text-sm font-bold text-ink-soft hover:bg-canvas"
            >
              Start over
            </button>
          </div>
        </div>
      ) : null}

      {stage === "done" && result ? (
        <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Imported {result.inserted} question{result.inserted === 1 ? "" : "s"} as drafts.
          </p>
          {result.failed.length > 0 ? (
            <p className="mt-2 text-sm text-emerald-900">
              {result.failed.length} row{result.failed.length === 1 ? "" : "s"} could not be imported.
            </p>
          ) : null}
          <p className="mt-2 text-sm text-emerald-900">
            Review and publish them from the Review queue tab.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-3 text-sm font-bold text-primary underline underline-offset-4"
          >
            Import another file
          </button>
        </div>
      ) : null}
    </section>
  );
}
