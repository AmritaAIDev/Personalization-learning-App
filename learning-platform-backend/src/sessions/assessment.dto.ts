import { IsString, IsUUID, MaxLength } from 'class-validator';

/** Legacy adaptive-session payload. Correctness is calculated from the DB. */
export class SubmitAssessmentAnswerDto {
  @IsUUID()
  questionId: string;

  @IsString()
  @MaxLength(1000)
  selectedOption: string;
}
