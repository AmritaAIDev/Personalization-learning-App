import {
  Equals,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { DIAGNOSTIC_SUBJECT } from './diagnostic.types';
import { DiagnosticAttemptMode } from './diagnostic.types';

export class CreateDiagnosticDto {
  @IsOptional()
  @IsString()
  @IsIn([DIAGNOSTIC_SUBJECT])
  subject?: string;

  @IsOptional()
  @IsIn(Object.values(DiagnosticAttemptMode))
  mode?: DiagnosticAttemptMode;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  chapter?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  topic?: string;
}

export class SaveDiagnosticAnswerDto {
  @IsString()
  @MaxLength(1000)
  selectedOption: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30 * 60)
  elapsedSeconds?: number;
}

export class ClearDiagnosticHistoryDto {
  @IsString()
  @Equals('DELETE')
  confirmation: 'DELETE';
}
