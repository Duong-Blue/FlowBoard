import type { DeadlineState } from '@/store/types';

export const DEADLINE_WARNING_HOURS = 48;

export function getDeadlineState(
  status?: string,
  dueDate?: string | null,
  _completedAt?: string | null
): DeadlineState {
  if (!dueDate) return 'NO_DUE_DATE';
  if (status === 'DONE') return 'COMPLETED';

  const now = new Date();
  const due = new Date(dueDate);

  if (now >= due) return 'OVERDUE';

  const diffMs = due.getTime() - now.getTime();
  if (diffMs <= DEADLINE_WARNING_HOURS * 3600 * 1000) return 'DUE_SOON';

  return 'UPCOMING';
}

export function formatDate(
  isoString?: string | null,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
): string {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString(undefined, options);
}
