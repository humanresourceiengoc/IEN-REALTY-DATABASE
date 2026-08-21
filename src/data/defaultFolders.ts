import { FolderDefinition } from '../types';

export const DEFAULT_FOLDERS: FolderDefinition[] = [
  {
    id: 'folder_01_engagement',
    code: '01',
    name: 'ENGAGEMENT FILES',
    color: 'emerald',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Contract agreements, proposals, client engagement letters, scope of work, and KYC records.',
    suggestedDocs: [
      'Engagement Agreement / Letter',
      'Client Onboarding KYC Sheet',
      'Special Power of Attorney (SPA)',
      'Terms of Reference / Scope Matrix',
      'Board Resolution / Secretary Certificate'
    ],
    isDefault: true,
  },
  {
    id: 'folder_02_dti',
    code: '02',
    name: 'SEC FILES',
    color: 'blue',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Securities and Exchange Commission (SEC) Registration Certificates, Articles of Incorporation, By-Laws, GIS, & DTI Business Name records.',
    suggestedDocs: [
      'SEC Certificate of Incorporation / Registration',
      'SEC Articles of Incorporation & By-Laws',
      'SEC General Information Sheet (GIS)',
      'SEC Form 17-A / Audited Financial Statements (AFS)',
      'Board Resolution / Secretary’s Certificate',
      'DTI Business Name Registration Certificate'
    ],
    isDefault: true,
  },
  {
    id: 'folder_03_bir',
    code: '03',
    name: 'BIR FILES',
    color: 'sky',
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    description: 'Bureau of Internal Revenue Tax Filings, Certificate of Registration (2303), ATP OCN, & Annual submissions.',
    suggestedDocs: [
      'BIR Certificate of Registration (Form 2303)',
      'Authority to Print (ATP) / OCN Official Receipt',
      'Annual Registration Fee (BIR Form 0605)',
      'Sample Official Receipt / Sales Invoice Template',
      'Books of Accounts Registration Stamp / QR',
      'Quarterly / Annual Income Tax Returns'
    ],
    isDefault: true,
  },
  {
    id: 'folder_04_lgu',
    code: '04',
    name: 'LGU FILES',
    color: 'indigo',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'Local Government Unit Mayor’s Business Permits, Barangay Clearances, Sanitary, and Fire Safety.',
    suggestedDocs: [
      'Mayor’s / Business Permit (Annual Renewal)',
      'Barangay Business Clearance',
      'Fire Safety Inspection Certificate (FSIC)',
      'Sanitary Permit & Environmental Clearance',
      'Zoning & Building Clearance',
      'LGU Official Tax Receipt & Plate'
    ],
    isDefault: true,
  },
  {
    id: 'folder_05_govt_mande',
    code: '05',
    name: 'GOVT MANDE FILES',
    color: 'purple',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Government Mandatory agencies compliance (SSS, PhilHealth, Pag-IBIG HDMF, and DOLE).',
    suggestedDocs: [
      'Social Security System (SSS) Employer Registration (R-1A)',
      'PhilHealth Employer Data Record (ER2)',
      'Pag-IBIG Fund Employer Registration',
      'DOLE Establishment Registration (Rule 1020)',
      'Mandatory Contributions Remittance Proofs'
    ],
    isDefault: true,
  },
  {
    id: 'folder_07_bmbe',
    code: '07',
    name: 'BMBE FILES',
    color: 'teal',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
    description: 'Barangay Micro Business Enterprise Certificate of Authority, income tax exemption, and incentives.',
    suggestedDocs: [
      'BMBE Certificate of Authority (DTI Issued)',
      'BMBE Income Tax Exemption Availment Letter',
      'Annual Financial Statement for BMBE Verification',
      'Sworn Statement of Asset Value (< P3M)'
    ],
    isDefault: true,
  },
  {
    id: 'folder_08_other',
    code: '08',
    name: 'OTHER FILES',
    color: 'slate',
    badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
    description: 'Miscellaneous corporate documents, lease contracts, utility receipts, property titles, and notes.',
    suggestedDocs: [
      'Contract of Lease / Real Estate Agreement',
      'Transfer Certificate of Title (TCT) / CCT Copy',
      'SEC Articles of Incorporation / By-Laws (if Corp)',
      'Tax Declarations & Real Property Tax (Amilyar) Receipts',
      'Bank Certificate / Statement of Accounts',
      'Audited Financial Statements (AFS)'
    ],
    isDefault: true,
  },
];
