import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

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
}
