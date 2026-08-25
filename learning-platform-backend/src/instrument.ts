/**
 * Sentry must be initialised before any instrumented module is imported, so
 * this file is the first import in every entrypoint (`main.ts`, `api/index.ts`).
 *
 * Error tracking is opt-in: with no SENTRY_DSN set the SDK is never started and
 * the app behaves exactly as it did before. That keeps local development and
 * CI free of network calls while production gets a durable error sink, which
 * platform logs alone do not provide once they age out.
 */
import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    // Traces are sampled well below 1.0 because the adaptive endpoints are
    // chatty; errors are always captured regardless of this rate.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    // Learner answers and tutor prompts are personal data; never ship request
    // bodies, headers, or cookies to a third party.
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        delete event.request.headers;
      }
      return event;
    },
  });
}

export const isErrorTrackingEnabled = Boolean(dsn);
