"use client";

import { useEffect, useId, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import {
  rememberSetupSkipped,
  savePersonalization,
  shouldShowSetup,
  valuesFromProfile,
  wasSetupSkipped,
  type PersonalizationValues,
} from "@/lib/personalization";
import PersonalizationForm from "./PersonalizationForm";

/**
 * After sign-in, asks a student for class, stream, target month and daily study
 * time (the inputs of the personalised study plan). Shown only to students whose
 * profile is incomplete; "Skip for now" hides it for the rest of the browser
 * session and it asks again at the next sign-in.
 */
export default function ProfileSetupDialog() {
  const { user, refreshAuth } = useAuth();
  const formId = useId();
  // Read from sessionStorage after mount so server and client render the same.
  const [skipped, setSkipped] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id ?? null;
  useEffect(() => {
    // Deferred a tick so the setState lands outside the effect body.
    const timeout = window.setTimeout(
      () => setSkipped(userId ? wasSetupSkipped(userId) : null),
      0,
    );
    return () => window.clearTimeout(timeout);
  }, [userId]);

  if (!user || skipped === null) return null;
  const open = shouldShowSetup(user, skipped);

  const skip = () => {
    rememberSetupSkipped(user.id);
    setSkipped(true);
  };

  const save = async (values: PersonalizationValues) => {
    setBusy(true);
    setError(null);
    try {
      await savePersonalization(values);
      // The saved profile arrives with the refreshed user; that closes the dialog.
      await refreshAuth();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Your details could not be saved. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={skip}
      title="Set up your study plan"
      description="Tell us a little about you and when you are aiming to be ready. We use it to build your personalised plan."
      maxWidth="sm:max-w-xl"
      footer={
        <>
          <button
            type="button"
            onClick={skip}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-ink-soft transition hover:bg-canvas hover:text-ink disabled:opacity-60"
          >
            Skip for now
          </button>
          <button
            type="submit"
            form={formId}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(63,111,87,0.25)] transition hover:bg-primary-strong disabled:opacity-60"
          >
            {busy ? "Saving..." : "Save and continue"}
          </button>
        </>
      }
    >
      <PersonalizationForm
        formId={formId}
        initial={valuesFromProfile(user.personalization)}
        onSubmit={save}
        busy={busy}
        error={error}
      />
    </Modal>
  );
}
