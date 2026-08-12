import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class SaveMockTestAnswerDto {
  @IsString()
  @MinLength(1)
  selectedOption: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  elapsedSeconds?: number;
}
