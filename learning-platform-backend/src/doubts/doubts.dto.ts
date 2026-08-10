import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateDoubtDto {
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

  @IsString()
  @MinLength(5)
  @MaxLength(1600)
  message: string;

  @IsOptional()
  @IsUUID()
  threadId?: string;

  @IsOptional()
  @IsUUID()
  questionId?: string;

  @IsOptional()
  @IsUUID()
  learningSessionId?: string;

  @IsOptional()
  @IsUUID()
  learningSessionItemId?: string;

  @IsOptional()
  @IsUUID()
  practiceAttemptId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  notebookCardId?: string;
}

export class CreateDoubtThreadDto {
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
  @MaxLength(120)
  title?: string;
}
