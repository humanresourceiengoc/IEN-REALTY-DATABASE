import { TransmittalInfo, TransmittalMovement, TransmittalStatus } from '../types';

export interface TransmittalStatusConfig {
  label: string;
  shortLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  description: string;
}

export const TRANSMITTAL_STATUS_CONFIG: Record<TransmittalStatus, TransmittalStatusConfig> = {
  in_custody: {
    label: 'In Custody / On Hand',
    shortLabel: 'In Custody',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-300',
    dotColor: 'bg-slate-500',
    description: 'Document is safely filed in IEN Realty corporate physical archive / custody.',
  },
  transmitted: {
    label: 'Transmitted / Out for Processing',
    shortLabel: 'Transmitted (Out)',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300',
    dotColor: 'bg-amber-500',
    description: 'Dispatched / sent to government agency, bank, client, or external party.',
  },
  returned: {
    label: 'Returned & Received Back',
    shortLabel: 'Returned / Back',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-900',
    badgeBorder: 'border-emerald-300',
    dotColor: 'bg-emerald-500',
    description: 'Document has returned to IEN Realty after external processing/stamping.',
  },
  acknowledged: {
    label: 'Acknowledged / Signed by Recipient',
    shortLabel: 'Acknowledged',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-900',
    badgeBorder: 'border-sky-300',
    dotColor: 'bg-sky-500',
    description: 'Received & acknowledged permanently by recipient with signed transmittal receipt.',
  },
};

export const generateTransmittalNumber = (): string => {
  const currentYear = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `TR-${currentYear}-${randomNum}`;
};

export const createDefaultTransmittal = (status: TransmittalStatus = 'in_custody'): TransmittalInfo => {
  return {
    status,
    currentTransmittalNo: generateTransmittalNumber(),
    transmittedTo: '',
    transmittedDate: '',
    carrierOrMessenger: '',
    receivedBy: '',
    returnedDate: '',
    purpose: '',
    remarks: '',
    history: [],
  };
};
