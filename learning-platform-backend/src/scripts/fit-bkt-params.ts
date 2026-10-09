/**
 * Fit BKT parameters to the platform's real graded-answer history — the
 * knowledge-tracing counterpart of the FSRS weight optimisation.
 *
 * Reads every student's answer events (the same cross-table contract the
 * live tracer uses), groups them into per-skill chronological sequences
 * (capped at 50, matching the runtime window), and runs deterministic
 * coordinate ascent on the exact forward-algorithm likelihood.
 *
 * Usage:
 *   npm run fit:bkt-params            -- report only
 *   npm run fit:bkt-params -- --write -- also save docs/bkt-fitted-params.json
 *
 * The report is advisory: adopting the fitted values into
 * DEFAULT_BKT_PARAMS is a deliberate, reviewed change, not a side effect.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import dataSource from '../database/data-source';
import { loadAnswerEvents } from '../catalog/answer-events.query';
import { DEFAULT_BKT_PARAMS } from '../knowledge-tracing/bkt';
import { fitBktParams } from '../knowledge-tracing/bkt-fit';

const MAX_OBSERVATIONS_PER_SKILL = 50;
const WRITE = process.argv.includes('--write');

async function main(): Promise<void> {
  await dataSource.initialize();
  try {
    const students: Array<{ id: string }> = await dataSource.query(
      "SELECT id FROM users WHERE role = 'student'",
    );
    const sequences: boolean[][] = [];
    let observations = 0;

    for (const student of students) {
      const events = await loadAnswerEvents(dataSource, student.id, null, null);
      const eventsByKey = new Map<
        string,
        Array<{ at: Date; correct: boolean }>
      >();
      for (const event of events) {
        const key = `${event.subject}|${event.chapter}|${event.topic}`;
        const list = eventsByKey.get(key) ?? [];
        list.push({ at: event.answeredAt, correct: event.isCorrect });
        eventsByKey.set(key, list);
      }
      for (const list of eventsByKey.values()) {
        const ordered = list
          .sort((a, b) => a.at.getTime() - b.at.getTime())
          .slice(-MAX_OBSERVATIONS_PER_SKILL)
          .map((entry) => entry.correct);
        if (ordered.length > 0) {
          sequences.push(ordered);
          observations += ordered.length;
        }
      }
    }

    const fit = fitBktParams(sequences);
    const fmt = (value: number): string => value.toFixed(3);

    console.log('\n===== BKT parameter fit =====');
    console.log(
      `students: ${students.length}  sequences: ${fit.sequences}  observations: ${observations}`,
    );
    console.log(
      `log-likelihood: default ${fmt(fit.baselineLogLikelihood)} -> fitted ${fmt(fit.logLikelihood)} (${fit.passes} passes)`,
    );
    console.log('param    default  fitted');
    for (const key of Object.keys(DEFAULT_BKT_PARAMS) as Array<
      keyof typeof DEFAULT_BKT_PARAMS
    >) {
      console.log(
        `${key.padEnd(4)}   ${fmt(DEFAULT_BKT_PARAMS[key])}    ${fmt(fit.params[key])}`,
      );
    }

    const gridBounds: Record<string, [number, number]> = {
      pL0: [0.05, 0.95],
      pT: [0.01, 0.6],
      pG: [0.01, 0.5],
      pS: [0.01, 0.5],
    };
    const pinned = Object.keys(fit.params)
      .filter((key) => {
        const bounds = gridBounds[key];
        return (
          bounds &&
          (fit.params[key as keyof typeof fit.params] <= bounds[0] ||
            fit.params[key as keyof typeof fit.params] >= bounds[1])
        );
      })
      .join(', ');
    if (fit.sequences < 200 || observations < 1000) {
      console.log(
        `\n[caution] ${fit.sequences} sequences / ${observations} observations is below ` +
          'the adoption bar (>=200 sequences and >=1000 observations). This fit is ' +
          'INDICATIVE ONLY — DEFAULT_BKT_PARAMS stay as they are.',
      );
    }
    if (pinned) {
      console.log(
        `[caution] parameters pinned at a grid boundary (${pinned}) — the data ` +
          'cannot identify them; treat the fit as unreliable.',
      );
    }

    if (WRITE) {
      const target = join(
        process.cwd(),
        '..',
        'docs',
        'bkt-fitted-params.json',
      );
      writeFileSync(
        target,
        `${JSON.stringify(
          {
            fittedAt: new Date().toISOString(),
            sequences: fit.sequences,
            observations,
            baselineLogLikelihood: fit.baselineLogLikelihood,
            logLikelihood: fit.logLikelihood,
            params: fit.params,
          },
          null,
          2,
        )}\n`,
      );
      console.log(`\nSaved: ${target}`);
    }
  } finally {
    await dataSource.destroy();
  }
}

void main().catch((error) => {
  console.error('fit-bkt-params failed:', error);
  process.exitCode = 1;
});
