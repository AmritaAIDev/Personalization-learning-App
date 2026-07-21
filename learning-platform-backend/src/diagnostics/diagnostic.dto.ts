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

export class CreateDiagnosticDto {
  @IsOptional()
  @IsString()
  @IsIn([DIAGNOSTIC_SUBJECT])
  subject?: string;
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
