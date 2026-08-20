import { IsIn } from 'class-validator';
import { FlashcardRating } from '../../adaptive/adaptive.types';

export class ReviewMistakeDto {
  @IsIn(Object.values(FlashcardRating))
  rating: FlashcardRating;
}
