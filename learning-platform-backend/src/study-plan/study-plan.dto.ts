import { IsIn, IsOptional, Matches } from 'class-validator';

export const TASK_ACTIONS = ['complete', 'undo', 'skip'] as const;
export type TaskAction = (typeof TASK_ACTIONS)[number];

export class UpdateTaskDto {
  @IsIn(TASK_ACTIONS)
  action: TaskAction;
}

/** Optional `d=YYYY-MM-DD` (any day of the wanted week). Real-date check is in the service. */
export class WeekQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'd must be a date in YYYY-MM-DD format',
  })
  d?: string;
}

/** Optional `m=YYYY-MM`. */
export class MonthQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'm must be a month in YYYY-MM format',
  })
  m?: string;
}
