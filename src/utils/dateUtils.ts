import { UrgencySeverity } from '../types';

export function calculateDaysRemaining(targetDateStr?: string): number | null {
  if (!targetDateStr) return null;
  const target = new Date(targetDateStr);
  if (isNaN(target.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getUrgencySeverity(days: number | null): UrgencySeverity {
  if (days === null) return 'good';
  if (days < 0) return 'expired';
  if (days <= 14) return 'urgent';
  if (days <= 30) return 'warning';
  if (days <= 60) return 'notice';
  return 'good';
}

export function formatRemainingDaysText(days: number | null): string {
  if (days === null) return 'No date set';
  if (days < 0) {
    const abs = Math.abs(days);
    return `Expired ${abs} day${abs === 1 ? '' : 's'} ago`;
  }
  if (days === 0) return 'Due today!';
  if (days === 1) return '1 day remaining';
  return `${days} days remaining`;
}

export function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToDate(days: number, fromDateStr?: string): string {
  const base = fromDateStr ? new Date(fromDateStr) : new Date();
  base.setDate(base.getDate() + days);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addMonthsToDate(months: number, fromDateStr?: string): string {
  const base = fromDateStr ? new Date(fromDateStr) : new Date();
  base.setMonth(base.getMonth() + months);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addYearsToDate(years: number, fromDateStr?: string): string {
  const base = fromDateStr ? new Date(fromDateStr) : new Date();
  base.setFullYear(base.getFullYear() + years);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
