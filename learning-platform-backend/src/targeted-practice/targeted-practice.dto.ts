import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BLOOM_LEVELS, DIFFICULTY_LEVELS } from '../adaptive/adaptive.types';

export class GenerateTargetedQuestionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  subject: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  chapter: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  topic: string;

  @IsIn(['MISCONCEPTION', 'SIMILAR'])
  reason: 'MISCONCEPTION' | 'SIMILAR';

  /** The misconception text (MISCONCEPTION) or the source question's text (SIMILAR). */
  @IsString()
  @MinLength(4)
  @MaxLength(2000)
  focusText: string;

  @IsOptional()
  @IsUUID()
  sourceQuestionId?: string;

  @IsOptional()
  @IsIn(BLOOM_LEVELS)
  bloomLevel?: (typeof BLOOM_LEVELS)[number];

  @IsOptional()
  @IsIn(DIFFICULTY_LEVELS)
  difficulty?: (typeof DIFFICULTY_LEVELS)[number];
}

export class SubmitTargetedAnswerDto {
  @IsString()
  @MaxLength(1000)
  selectedOption: string;
}
