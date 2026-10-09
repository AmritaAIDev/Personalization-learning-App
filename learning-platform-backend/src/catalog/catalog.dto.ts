import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ChapterDifficulty, ChapterMetaStatus } from './chapter-meta.entity';

/** Admin edit of a chapter's study guide. Every field is optional (PATCH). */
export class UpdateChapterMetaDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  unit?: string;

  /** Class the chapter is taught in; drives which chapters a Class 11 / 12 student is planned. */
  @IsOptional()
  @IsInt()
  @IsIn([11, 12])
  classLevel?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  overview?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  objectives?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  keyFormulas?: string[];

  @IsOptional()
  @IsEnum(ChapterDifficulty)
  difficulty?: ChapterDifficulty;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(600)
  studyMinutes?: number;

  /** Empty string clears the note. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jeeWeightageNote?: string;

  @IsOptional()
  @IsEnum(ChapterMetaStatus)
  status?: ChapterMetaStatus;
}
