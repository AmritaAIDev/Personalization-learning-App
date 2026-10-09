"use client";

import { useId, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import {
  planSettingsChange,
  savePersonalization,
  valuesFromProfile,
  type PersonalizationValues,
} from "@/lib/personalization";
import { generatePlanRequest } from "@/lib/study-plan";
import PersonalizationForm from "./PersonalizationForm";

type Notice = { text: string; offerRebuild: boolean };

/**
 * Class, stream, target month and daily study time, editable from the profile.
 * Changing the target month asks first, because it rebuilds the study plan.
 */
export default function StudyPlanSettings() {
  const { user, refreshAuth } = useAuth();
  const formId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirming, setConfirming] = useState<PersonalizationValues | null>(null);

  if (!user || user.role !== "student") return null;
  const current = valuesFromProfile(user.personalization);

  const persist = async (values: PersonalizationValues, rebuild: boolean) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const change = planSettingsChange(current, values);
      await savePersonalization(values);
      let rebuilt = false;
      if (rebuild) {
        await generatePlanRequest();
        rebuilt = true;
      }
      await refreshAuth();
      setConfirming(null);
      setNotice(
        rebuilt
          ? { text: "Saved. Your study plan has been rebuilt.", offerRebuild: false }
          : {
              text: "Saved.",
              offerRebuild: change === "replan" && Boolean(values.targetMonth),
            },
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Your details could not be saved. Please try again.",
      );
      setConfirming(null);
    } finally {
      setBusy(false);
    }
  };

  const submit = (values: PersonalizationValues) => {
    const change = planSettingsChange(current, values);
    if (change === "none") {
      setNotice({ text: "There is nothing to save yet.", offerRebuild: false });
      return;
    }
    if (change === "target") {
      setConfirming(values);
      return;
    }
    // A first target month builds the first plan; other edits only save.
    void persist(values, !current.targetMonth && Boolean(values.targetMonth));
  };

  const rebuildNow = async () => {
    setBusy(true);
    setError(null);
    try {
      await generatePlanRequest();
      setNotice({ text: "Your study plan has been rebuilt.", offerRebuild: false });
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Your plan could not be rebuilt.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-labelledby="plan-settings-heading"
      className="mt-5 rounded-[1.5rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6"
    >
      <h2 id="plan-settings-heading" className="font-heading text-lg font-bold text-ink">
        Study plan settings
      </h2>
      <p className="mt-0.5 text-xs text-ink-mute">
        Your plan is built from these. Change them any time.
      </p>

      <div className="mt-5">
        <PersonalizationForm
          key={`${current.className}-${current.targetMonth}-${current.dailyMinutes}`}
          formId={formId}
          initial={current}
          onSubmit={submit}
          busy={busy}
          error={error}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          form={formId}
          disabled={busy}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(63,111,87,0.25)] transition hover:bg-primary-strong disabled:opacity-60"
        >
          {busy && !confirming ? "Saving..." : "Save changes"}
        </button>
        {notice ? (
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-success" role="status">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {notice.text}
            {notice.offerRebuild ? (
              <button
                type="button"
                onClick={() => void rebuildNow()}
                disabled={busy}
                className="font-bold text-primary underline disabled:opacity-60"
              >
                Rebuild my plan
              </button>
            ) : null}
          </p>
        ) : null}
      </div>

      <Modal
        open={confirming !== null}
        onClose={() => (busy ? undefined : setConfirming(null))}
        title="Change your target month?"
        description="Changing your target month will update your personalized study plan."
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirming(null)}
              disabled={busy}
              className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-ink-soft transition hover:bg-canvas hover:text-ink disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => confirming && void persist(confirming, true)}
              disabled={busy}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(63,111,87,0.25)] transition hover:bg-primary-strong disabled:opacity-60"
            >
              {busy ? "Rebuilding..." : "Rebuild My Plan"}
            </button>
          </>
        }
      >
        <p className="text-sm leading-6 text-ink-soft">
          Topics you have already completed stay completed. The rest are
          rescheduled up to your new target month.
        </p>
      </Modal>
    </section>
  );
}
