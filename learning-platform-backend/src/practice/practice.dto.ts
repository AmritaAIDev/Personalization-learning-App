import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  EXPLANATION_DEPTHS,
  type ExplanationDepth,
} from '../agent/agent.service';

export class CreatePracticeSessionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  subject: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  chapter: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  topic: string;
}

export class SavePracticeAnswerDto {
  @IsString()
  @MaxLength(1000)
  selectedOption: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60 * 60)
  elapsedSeconds?: number;

  /** Pre-answer self-rated confidence: 1 (unsure) to 3 (certain). */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  confidence?: number;
}

export class ExplainQuestionDto {
  /** Optional depth for the on-demand explanation; defaults to step-by-step. */
  @IsOptional()
  @IsIn(EXPLANATION_DEPTHS)
  depth?: ExplanationDepth;
}
