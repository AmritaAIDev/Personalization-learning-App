'use client';

import { useParams } from 'next/navigation';
import PracticeReview from '@/components/practice/PracticeReview';

export default function PracticeReviewPage() {
  const params = useParams<{ attemptId: string }>();
  return <PracticeReview attemptId={params.attemptId} />;
}
