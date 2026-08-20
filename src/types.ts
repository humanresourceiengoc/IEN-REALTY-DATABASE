export type ClientStatus = 'Active' | 'Under Review' | 'Pending Renewal' | 'Matured/Expired' | 'Dormant';

export interface ClientProfile {
  id: string;
  clientName: string;
  tradeName: string;
  logoUrl?: string;
  dateOfEngagement: string; // YYYY-MM-DD
  cifNo: string; // Customer Information File Number
  officeAddress: string;
  contactPerson: string;
  contactNumber: string;
  contactEmail: string;
  tin: string; // Tax Identification Number
  ocnNumber: string; // Official Confirmation Number
  atpOcn: string; // Authority to Print OCN
  annualSubDate: string; // Annual Submission Date (e.g. BIR 0605 / SEC GIS)
  annualSubNotes?: string;
  contractDate: string; // YYYY-MM-DD
  maturityDate: string; // YYYY-MM-DD
  status: ClientStatus;
  notes?: string;
  customFolders?: string[]; // IDs of custom folders added for this client
  createdAt: string;
  updatedAt: string;
}

export interface FolderDefinition {
  id: string;
  code: string; // '01', '02', '03', '04', '05', '07', '08', or 'CUSTOM'
  name: string;
  color: string;
  badgeBg: string;
  description: string;
  suggestedDocs: string[];
  isDefault: boolean;
}

export type TransmittalStatus = 'in_custody' | 'transmitted' | 'returned' | 'acknowledged';

export interface TransmittalMovement {
  id: string;
  date: string; // YYYY-MM-DD
  action: 'TRANSMITTED' | 'RETURNED' | 'ACKNOWLEDGED' | 'CUSTODY_REVERTED';
  recipientOrSource: string; // e.g. "BIR RDO 044", "Taguig City Hall BPLO", "SEC", "Notary Public"
  courierOrPersonnel?: string; // e.g. "Liaison Officer Mark", "LBC Tracking # 9812", "Atty. Gomez"
  receivedBy?: string; // e.g. "Officer Santos", "Receiving Clerk"
  transmittalNo?: string; // e.g. "TR-2026-0089"
  purpose?: string; // e.g. "For annual business permit assessment & official stamping"
  remarks?: string; // e.g. "Returned with official receiving stamp & assessment receipt"
}

export interface TransmittalInfo {
  status: TransmittalStatus; // 'in_custody' | 'transmitted' | 'returned' | 'acknowledged'
  currentTransmittalNo?: string;
  transmittedTo?: string; // Agency / Company / Person (e.g. "BIR RDO 044", "Taguig BPLO", "SEC")
  transmittedDate?: string; // YYYY-MM-DD
  carrierOrMessenger?: string; // e.g. "Messenger Juan", "Atty. Rafael Gomez"
  receivedBy?: string; // Name of receiving party
  returnedDate?: string; // Date received back in office (if returned)
  purpose?: string; // e.g. "For Dry Seal Notarization", "For Annual 2026 Renewal"
  remarks?: string;
  history: TransmittalMovement[];
}

export interface DocumentItem {
  id: string;
  clientId: string;
  folderId: string;
  folderCode: string;
  fileName: string; // Editable display title
  originalFileName: string;
  fileType: string; // 'application/pdf', 'image/png', etc.
  fileSize: number;
  fileData: string; // base64 or blob URL
  uploadedAt: string;
  expirationDate?: string; // YYYY-MM-DD
  referenceNumber?: string; // e.g. Form 2303, Cert No. 2026-9812
  notes?: string;
  tags?: string[];
  transmittal?: TransmittalInfo;
}

export type UrgencySeverity = 'expired' | 'urgent' | 'warning' | 'notice' | 'good';

export interface DeadlineAlert {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  category: 'CONTRACT_MATURITY' | 'ANNUAL_SUBMISSION' | 'DOCUMENT_EXPIRATION' | 'CUSTOM';
  dueDate: string;
  daysRemaining: number;
  severity: UrgencySeverity;
  documentId?: string;
  folderCode?: string;
  folderName?: string;
}

export interface NotificationSetting {
  enablePush: boolean;
  enableSound: boolean;
  alertDaysBefore: number[]; // e.g. [60, 30, 15, 7, 1, 0]
}

export type UserRole = 'master_admin' | 'approved_staff' | 'auditor' | 'pending_verification' | 'guest';

export interface UserSession {
  email: string;
  name: string;
  picture?: string;
  role: UserRole;
  isMaster: boolean;
  status: 'active' | 'pending_approval' | 'rejected';
  loginTime: string;
  requestNote?: string;
}

export interface AccessRequest {
  id: string;
  email: string;
  name: string;
  picture?: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  grantedRole?: UserRole;
}

export interface SecurityGateSettings {
  masterEmail: string;
  requireMasterApproval: boolean;
  autoApproveCompanyDomain: boolean;
  approvedEmails: string[];
}

