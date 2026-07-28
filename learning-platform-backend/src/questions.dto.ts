import { Type } from 'class-transformer';
import {
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { QuestionPublicationStatus, QuestionSource } from './question.entity';

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
  @Max(12)
  limit = 8;
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
