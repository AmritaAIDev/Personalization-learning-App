import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsIn, IsInt, Max, Min } from 'class-validator';
import { FlashcardRating } from './adaptive.types';

export class CreateLearningSessionDto {
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

export class SubmitLearningAnswerDto {
  @IsString()
  @MaxLength(1000)
  selectedOption: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60 * 60)
  elapsedSeconds?: number;
}

export class AskTutorDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1200)
  message: string;
}

export class FlashcardQueryDto {
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
  @IsInt()
  @Min(1)
  @Max(30)
  limit?: number;
}

export class GenerateFlashcardsDto extends CreateLearningSessionDto {
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(12)
  count?: number;

  /** Ephemeral client session context used only to avoid repeat prompts. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(48)
  @IsString({ each: true })
  @MaxLength(240, { each: true })
  excludedPrompts?: string[];
}

export class ReviewFlashcardDto {
  @IsIn(Object.values(FlashcardRating))
  rating: FlashcardRating;
}
