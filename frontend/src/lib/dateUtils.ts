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
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, options);
}

export function formatDateTime(
  isoString?: string | null,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, options);
}

export function calculateDurationInDays(startDateStr?: string | null, dueDateStr?: string | null): number | null {
  if (!startDateStr || !dueDateStr) return null;
  const start = new Date(startDateStr);
  const due = new Date(dueDateStr);
  if (isNaN(start.getTime()) || isNaN(due.getTime())) return null;
  const diffTime = due.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
}
