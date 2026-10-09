import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import {
  CLASS_NAMES,
  MAX_DAILY_MINUTES,
  MIN_DAILY_MINUTES,
  STREAMS,
  TARGET_MONTH_PATTERN,
} from './personalization';

/**
 * A student's own profile choices. Every field is optional (PATCH); unknown
 * fields are rejected by the global ValidationPipe, so a student cannot set
 * anything else (role, xp ...) through this endpoint.
 */
export class UpdatePersonalizationDto {
  @IsOptional()
  @IsString()
  @IsIn(CLASS_NAMES)
  className?: string;

  @IsOptional()
  @IsString()
  @IsIn(STREAMS)
  stream?: string;

  /** YYYY-MM. Range (not in the past, at most 24 months ahead) is checked in the service. */
  @IsOptional()
  @IsString()
  @Matches(TARGET_MONTH_PATTERN, {
    message: 'targetMonth must be in YYYY-MM format',
  })
  targetMonth?: string;

  @IsOptional()
  @IsInt()
  @Min(MIN_DAILY_MINUTES)
  @Max(MAX_DAILY_MINUTES)
  dailyMinutes?: number;
}
