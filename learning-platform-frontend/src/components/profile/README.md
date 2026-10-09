# Profile and onboarding components

Part of the Study Plan & Progress UI (`docs/STUDY-PLAN-UI-PLAN.md`, Phase B). They collect
the inputs of the personalised study plan: class, stream, target month and daily study time.
All values are stored by the backend (`PATCH /api/users/me/personalization`, see
`learning-platform-backend/src/users/README.md`); nothing is kept only in the browser except
the "skipped this session" flag.

| Piece | Role |
|---|---|
| `lib/personalization.ts` | Options, client-side validation (`validatePersonalization`), the save call, and `shouldShowSetup` (the gating rule). Pure and unit-tested. |
| `lib/month.ts` | `YYYY-MM` helpers on the **IST** calendar, mirroring the backend range rule (this month up to 24 months ahead). |
| `PersonalizationForm` | The shared form: class, stream, month grid, daily-time presets. Owns draft values and validation; the parent supplies `onSubmit` and a `<button type="submit" form={formId}>`. Reused by the Profile page in a later phase. |
| `ProfileSetupDialog` | Mounted once in the dashboard layout. Shows to **students only**, while class, stream and month are not all set. "Skip for now" hides it for the browser session (`sessionStorage`, asks again at the next sign-in). Saving refreshes the signed-in user, which closes it. |

Shared UI kit in `components/ui/`:

| Piece | Role |
|---|---|
| `Modal` | Accessible dialog: portal, labelled by its title, focus moves in and returns, Tab is trapped, Escape/backdrop/X close it unless `dismissible={false}`, page scroll is locked. A bottom sheet on phones, a centred card from `sm`. |
| `MonthPicker` | A 12-month grid with year arrows (the native month input is not supported on iOS Safari). Out-of-range months are shown but disabled. |
| `TaskCheckbox` | A whole-row `role="checkbox"` button (44px+ target) that ignores taps while a save is pending. Used by the study plan screens. |

Behaviour worth knowing:

- The client validates for instant feedback, but the server is the authority; a server
  rejection (for example a month that became past) is shown above the fields and the dialog
  stays open for another try.
- An unchanged saved month stays valid even after it has passed, exactly like the server.
- Admins never see the dialog (they have no study plan).
- Generating the first plan after saving arrives with the study-plan engine (Phase C).
