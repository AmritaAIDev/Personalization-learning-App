"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import { CircleAlert } from "lucide-react";
import MonthPicker from "@/components/ui/MonthPicker";
import { formatMonth, targetMonthBounds } from "@/lib/month";
import {
  CLASS_OPTIONS,
  DAILY_MINUTE_PRESETS,
  STREAM_OPTIONS,
  formatDailyMinutes,
  validatePersonalization,
  type PersonalizationErrors,
  type PersonalizationValues,
} from "@/lib/personalization";

function Segmented<T extends string | number>({
  legend,
  options,
  value,
  onChange,
  error,
  disabled,
}: {
  legend: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T | null;
  onChange: (value: T) => void;
  error?: string;
  disabled?: boolean;
}) {
  const errorId = useId();
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="text-sm font-semibold text-ink">{legend}</legend>
      <div
        className="mt-2 flex flex-wrap gap-2"
        role="radiogroup"
        aria-label={legend}
        aria-describedby={error ? errorId : undefined}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={String(option.value)}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={`min-h-11 rounded-xl border px-4 text-sm font-semibold transition motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? "border-transparent bg-primary text-white shadow-[0_8px_20px_rgba(63,111,87,0.22)]"
                  : "border-hairline bg-surface text-ink-soft hover:border-primary/30 hover:text-primary"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/**
 * Class, stream, target month and daily study time. Shared by the onboarding
 * dialog and the Profile page. It owns the draft values and validation; the
 * parent supplies `onSubmit` and renders the submit button (outside the form
 * if it likes) by pointing a `<button type="submit" form={formId}>` at it.
 */
export default function PersonalizationForm({
  formId,
  initial,
  onSubmit,
  busy = false,
  error,
  unchangedMonth = null,
}: {
  formId: string;
  initial: PersonalizationValues;
  onSubmit: (values: PersonalizationValues) => void | Promise<void>;
  busy?: boolean;
  /** A server-side error to show above the fields. */
  error?: string | null;
  /** The month already saved, which stays valid even after it has passed. */
  unchangedMonth?: string | null;
}) {
  const [values, setValues] = useState<PersonalizationValues>(initial);
  const [errors, setErrors] = useState<PersonalizationErrors>({});
  const bounds = useMemo(() => targetMonthBounds(), []);

  const set = <K extends keyof PersonalizationValues>(
    key: K,
    value: PersonalizationValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validatePersonalization(values, { unchangedMonth });
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;
    void onSubmit(values);
  };

  const minutesOptions = (
    DAILY_MINUTE_PRESETS.includes(values.dailyMinutes as never)
      ? [...DAILY_MINUTE_PRESETS]
      : [...DAILY_MINUTE_PRESETS, values.dailyMinutes].sort((a, b) => a - b)
  ).map((minutes) => ({ value: minutes, label: formatDailyMinutes(minutes) }));

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error ? (
        <div
          className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-tint px-3 py-3 text-sm text-danger"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <Segmented
        legend="Class"
        options={CLASS_OPTIONS}
        value={values.className}
        onChange={(value) => set("className", value)}
        error={errors.className}
        disabled={busy}
      />

      <Segmented
        legend="Stream"
        options={STREAM_OPTIONS}
        value={values.stream}
        onChange={(value) => set("stream", value)}
        error={errors.stream}
        disabled={busy}
      />

      <fieldset disabled={busy} className="min-w-0">
        <legend className="text-sm font-semibold text-ink">
          Target month
          {values.targetMonth ? (
            <span className="ml-2 font-medium text-primary">
              {formatMonth(values.targetMonth)}
            </span>
          ) : null}
        </legend>
        <div className="mt-2">
          <MonthPicker
            value={values.targetMonth}
            onChange={(month) => set("targetMonth", month)}
            min={bounds.min}
            max={bounds.max}
          />
        </div>
        {errors.targetMonth ? (
          <p className="mt-1.5 text-xs font-medium text-danger" role="alert">
            {errors.targetMonth}
          </p>
        ) : null}
      </fieldset>

      <Segmented
        legend="Study time per day"
        options={minutesOptions}
        value={values.dailyMinutes}
        onChange={(value) => set("dailyMinutes", value)}
        error={errors.dailyMinutes}
        disabled={busy}
      />
    </form>
  );
}
