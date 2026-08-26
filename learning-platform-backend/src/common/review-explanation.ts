import { TutorMessageType } from '../adaptive/adaptive.types';
import {
  AgentService,
  type ExplanationDepth,
  RetrievedSource,
} from '../agent/agent.service';
import { ExplanationResult, toCitations } from '../citation.util';
import { Question } from '../question.entity';

/**
 * Shared "Explain this" pipeline for submitted-attempt review screens
 * (practice and diagnostics). The attempt is already submitted, so the answer
 * key is the learner's to see — the tutor teaches it fully at the requested
 * depth, degrading to a deterministic fallback if the model is unavailable.
 */
export async function generateReviewExplanation(
  agentService: AgentService,
  question: Question,
  selectedOption: string | null,
  depth?: ExplanationDepth,
): Promise<ExplanationResult> {
  // Citations are best-effort and never block: retrieval degrades to [].
  const sources = await agentService
    .retrieveSupplementalSources(question.topic)
    .catch(() => [] as RetrievedSource[]);

  try {
    const explanation = await agentService.generateTutorResponse({
      subject: question.subject,
      chapter: question.chapter,
      topic: question.topic,
      learnerMessage:
        'Explain this question: why the correct answer is right and where the tempting choices go wrong.',
      mode: TutorMessageType.ANSWER_EXPLANATION,
      questionText: question.question_text,
      options: question.options,
      selectedOption: selectedOption ?? undefined,
      correctAnswer: question.correct_answer,
      solution: question.solution,
      commonErrors: question.common_errors ?? [],
      answerRevealed: true,
      explanatory: true,
      depth,
    });
    return { explanation, grounded: true, sources: toCitations(sources) };
  } catch {
    return {
      explanation: buildFallbackExplanation(question, selectedOption, depth),
      grounded: false,
      sources: toCitations(sources),
    };
  }
}

/**
 * Deterministic explanation used when the model is unavailable. Shaped by
 * `depth` so Regenerate/Concise/Step by step/From scratch don't all render
 * the identical offline text.
 */
export function buildFallbackExplanation(
  question: Question,
  selectedOption: string | null,
  depth?: ExplanationDepth,
): string {
  const misconception = (question.common_errors ?? [])[0];
  if (depth === 'concise') {
    const firstSentence = question.solution.split(/(?<=[.!?])\s+/)[0];
    return [
      '### Correct answer',
      `**${question.correct_answer}**`,
      firstSentence,
    ].join('\n\n');
  }
  const lines = ['### Correct answer', `**${question.correct_answer}**`];
  if (selectedOption && selectedOption !== question.correct_answer) {
    lines.push(
      '### Where your choice went wrong',
      misconception
        ? `A common cause of “${selectedOption}” is: ${misconception}`
        : `Compare “${selectedOption}” against the governing relationship for this topic.`,
    );
  }
  if (depth === 'step-by-step') {
    lines.push(
      '### Step by step',
      `1. Identify what the question is actually asking for.`,
      `2. Apply the governing relationship: ${question.solution}`,
      `3. Check that ${question.correct_answer} is the only option consistent with step 2.`,
    );
  } else if (depth === 'from-scratch') {
    lines.push(
      '### From first principles',
      `Before using any shortcut, re-derive it: ${question.solution}`,
      `That derivation is what rules every option out except ${question.correct_answer}.`,
    );
  } else {
    lines.push('### Worked reasoning', question.solution);
  }
  return lines.join('\n\n');
}
