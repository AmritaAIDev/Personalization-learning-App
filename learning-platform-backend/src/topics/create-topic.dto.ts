import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TopicLevel } from './topic.entity';

export class CreateTopicDto {
  @IsString()
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsEnum(TopicLevel)
  level: TopicLevel;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
