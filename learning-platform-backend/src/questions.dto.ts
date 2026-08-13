import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { QuestionPublicationStatus, QuestionSource } from './question.entity';
import {
  QuestionReportReason,
  QuestionReportStatus,
} from './question-report.entity';
import { LearningQuestionSource } from './adaptive/adaptive.types';

// Accept both the four canonical proficiency levels and the legacy Bloom
// vocabulary so historical clients and seeded data continue to validate.
export const BLOOM_LEVELS = [
  'Recall',
  'Comprehension',
  'Application',
  'Higher-Order',
  // legacy aliases (normalized server-side)
  'Remember',
  'Understand',
  'Apply',
  'Analyze',
  'Evaluate',
  'Create',
];

export const QUESTION_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export class GenerateQuestionQueryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  topic: string;

  @IsOptional()
  @IsString()
  @IsIn(BLOOM_LEVELS)
  bloomLevel?: string;
}

export class TutorChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  topic: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message: string;
}

export class QuestionBankQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  chapter?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  topic?: string;

  @IsOptional()
  @IsIn(QUESTION_DIFFICULTIES)
  difficulty?: string;

  @IsOptional()
  @IsIn(BLOOM_LEVELS)
  bloom_level?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit = 200;
}

export class SearchQuestionCatalogDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  query?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 24;
}

/** Admin-only filters for the reviewed and draft question inventory. */
export class AdminQuestionReviewQueryDto extends QuestionBankQueryDto {
  @IsOptional()
  @IsIn(Object.values(QuestionPublicationStatus))
  status?: QuestionPublicationStatus;

  @IsOptional()
  @IsIn(Object.values(QuestionSource))
  source?: QuestionSource;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 25;
}

export class GenerateQuestionDraftDto {
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

  @IsIn(BLOOM_LEVELS)
  bloomLevel: string;

  @IsIn(QUESTION_DIFFICULTIES)
  difficulty: string;
}

export class UpdateQuestionPublicationDto {
  @IsIn(['PUBLISH', 'ARCHIVE'])
  action: 'PUBLISH' | 'ARCHIVE';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNotes?: string;
}

/**
 * The curated question shape an admin types in by hand or imports in bulk.
 * `correct_answer` must be one of `options` — checked in QuestionsService
 * rather than here, since class-validator field decorators can't cross-check
 * two sibling fields against each other.
 */
export class CreateQuestionDto {
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

  @IsOptional()
  @IsString()
  @MaxLength(160)
  subtopic?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  question_text: string;

  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @ArrayUnique()
  @IsString({ each: true })
  options: string[];

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  correct_answer: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  solution: string;

  @IsIn(BLOOM_LEVELS)
  bloom_level: string;

  @IsIn(QUESTION_DIFFICULTIES)
  difficulty: string;

  @IsInt()
  @Min(1)
  @Max(10)
  marks: number;

  @IsInt()
  @Min(10)
  @Max(1800)
  estimated_time_sec: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  concept_tags?: string[];

  /** AI-suggested (or reviewer-authored) common wrong-answer patterns; never auto-published. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  common_errors?: string[];
}

/** Same shape as CreateQuestionDto, but every field is optional for a partial edit. */
export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  subject?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  chapter?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  topic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  subtopic?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  question_text?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @ArrayUnique()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  correct_answer?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  solution?: string;

  @IsOptional()
  @IsIn(BLOOM_LEVELS)
  bloom_level?: string;

  @IsOptional()
  @IsIn(QUESTION_DIFFICULTIES)
  difficulty?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  marks?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(1800)
  estimated_time_sec?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  concept_tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  common_errors?: string[];
}

/**
 * Deliberately loose at the request-body level: each row is validated
 * individually inside QuestionsService (via validateQuestionRow) so a batch
 * with some bad rows can report per-row errors instead of the whole request
 * being rejected outright by the global ValidationPipe.
 */
export class BulkImportQuestionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  rows: Record<string, unknown>[];
}

/** Either questionId (CURATED) or generatedQuestionId (AI_POOL) must be set, matching source. */
export class ReportQuestionDto {
  @IsIn(Object.values(LearningQuestionSource))
  questionSource: LearningQuestionSource;

  @IsOptional()
  @IsUUID()
  questionId?: string;

  @IsOptional()
  @IsUUID()
  generatedQuestionId?: string;

  @IsIn(Object.values(QuestionReportReason))
  reason: QuestionReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  details?: string;
}

export class QuestionReportQueryDto {
  @IsOptional()
  @IsIn(Object.values(QuestionReportStatus))
  status?: QuestionReportStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 25;
}

export class ResolveQuestionReportDto {
  @IsIn(['DISMISS', 'RESOLVE'])
  action: 'DISMISS' | 'RESOLVE';
}
