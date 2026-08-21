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

export function determineContractStatus(maturityDate?: string, currentStatus?: string): 'Active' | 'Active Renewal' | 'Expired' | 'Terminated' {
  if (currentStatus === 'Terminated') return 'Terminated';
  if (!maturityDate) return 'Active';

  const days = calculateDaysRemaining(maturityDate);
  if (days === null) return 'Active';

  if (days < 0) {
    return 'Expired'; // Contract has lapsed
  }
  
  if (currentStatus === 'Active Renewal') {
    return 'Active Renewal';
  }

  if (days <= 60) {
    return 'Active Renewal'; // Auto-suggest renewal window
  }

  return 'Active';
}

export interface ContractStatusDisplay {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  description: string;
}

export function getContractStatusDisplay(status: string, maturityDate?: string): ContractStatusDisplay {
  const days = calculateDaysRemaining(maturityDate);

  if (status === 'Terminated') {
    return {
      label: 'Contract Terminated',
      badgeBg: 'bg-rose-950/80',
      badgeText: 'text-rose-300',
      badgeBorder: 'border-rose-700/60',
      dotColor: 'bg-rose-500',
      description: 'Account engagement formally ended',
    };
  }

  if (status === 'Expired' || (days !== null && days < 0)) {
    const absDays = days !== null ? Math.abs(days) : 0;
    return {
      label: 'Contract Expired',
      badgeBg: 'bg-red-950/90',
      badgeText: 'text-red-300',
      badgeBorder: 'border-red-600/70',
      dotColor: 'bg-red-500 animate-ping',
      description: days !== null && days < 0 ? `Lapsed ${absDays} day${absDays === 1 ? '' : 's'} ago` : 'Contract has reached maturity',
    };
  }

  if (status === 'Active Renewal' || (days !== null && days <= 60)) {
    return {
      label: 'Contract Renewal',
      badgeBg: 'bg-amber-950/80',
      badgeText: 'text-amber-300',
      badgeBorder: 'border-amber-600/60',
      dotColor: 'bg-amber-400 animate-pulse',
      description: days !== null ? `Matures in ${days} days (Renewal Window)` : 'Renewal in progress',
    };
  }

  return {
    label: 'Contract Active',
    badgeBg: 'bg-emerald-950/80',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-600/60',
    dotColor: 'bg-emerald-400',
    description: days !== null ? `${days} days remaining on contract` : 'Contract is in good standing',
  };
}
