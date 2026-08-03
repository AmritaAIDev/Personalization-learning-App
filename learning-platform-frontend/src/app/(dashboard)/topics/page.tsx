import { redirect } from 'next/navigation';

/** Curriculum is intentionally presented inside the learner's Journey workspace. */
export default function TopicsPage() {
  redirect('/journey');
}
