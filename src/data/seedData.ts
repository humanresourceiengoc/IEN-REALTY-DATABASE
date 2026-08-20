import { ClientProfile, DocumentItem, FolderDefinition } from '../types';

// Helper to generate a minimal valid PDF data URI that displays text cleanly
export function generateSamplePdfDataUri(title: string, subtitle: string): string {
  // Sanitize strings for PDF Helvetica / standard ASCII stream
  const sanitizeForPdf = (str: string) => {
    return str
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[—–]/g, '-')
      .replace(/[ñ]/g, 'n')
      .replace(/[Ñ]/g, 'N')
      .replace(/[\\]/g, '\\\\')
      .replace(/[(]/g, '\\(')
      .replace(/[)]/g, '\\)')
      .replace(/[^\x20-\x7E]/g, ' ');
  };

  const cleanTitle = sanitizeForPdf(title);
  const cleanSubtitle = sanitizeForPdf(subtitle);

  // A minimal valid PDF structure base64 encoded
  const pdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 300 >> stream
BT
/F1 18 Tf
50 720 Td
(${cleanTitle}) Tj
/F1 11 Tf
0 -30 Td
(${cleanSubtitle}) Tj
0 -25 Td
(Document managed under IEN REALTY INC. Corporate Compliance Portal.) Tj
0 -20 Td
(Verified and securely archived on local database.) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000224 00000 n 
0000000475 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
548
%%EOF`;

  try {
    return `data:application/pdf;base64,${btoa(pdfContent)}`;
  } catch {
    // UTF-8 fallback
    const encoded = encodeURIComponent(pdfContent).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    );
    return `data:application/pdf;base64,${btoa(encoded)}`;
  }
}

export const INITIAL_CLIENTS: ClientProfile[] = [
  {
    id: 'client_ien_001',
    clientName: 'SOLARIS PRIME COMMERCIAL TOWER HOLDINGS',
    tradeName: 'Solaris Commercial Plaza - BGC',
    logoUrl: '',
    dateOfEngagement: '2024-03-15',
    cifNo: 'IEN-CIF-2024-8891',
    registrationType: 'Corporation',
    serviceCategory: 'Retainer',
    officeAddress: 'Unit 2804, 28th Floor, Solaris Prime Tower, 5th Avenue cor. 26th St., Bonifacio Global City, Taguig City, Metro Manila',
    contactPerson: 'Atty. Rafael Vicente Gomez',
    contactNumber: '+63 (02) 8876-4321 / +63 917 890 1234',
    contactEmail: 'corp.compliance@solarisprimeholdings.ph',
    tin: '009-876-543-000',
    ocnNumber: 'OCN-BIR-RR8-2024-004521',
    atpOcn: 'ATP-2024-098871-BIR',
    annualSubDate: '2026-04-15',
    annualSubNotes: 'BIR Form 1702-RT & SEC General Information Sheet (GIS) due April 15',
    contractDate: '2024-03-15',
    maturityDate: '2027-03-14',
    status: 'Active',
    notes: 'Premium commercial lessor client. Managed under IEN Realty corporate asset division. Requires quarterly tax reconciliation and annual LGU plate renewal.',
    customFolders: [],
    createdAt: '2024-03-15T08:00:00.000Z',
    updatedAt: '2026-08-15T10:30:00.000Z',
  },
  {
    id: 'client_ien_002',
    clientName: 'AVENUE HEIGHTS REALTY & DEVELOPMENT CORP.',
    tradeName: 'Avenue Heights Residences & Commercial Arcade',
    logoUrl: '',
    dateOfEngagement: '2025-01-10',
    cifNo: 'IEN-CIF-2025-4412',
    registrationType: 'Corporation',
    serviceCategory: 'Virtual Retainer',
    officeAddress: 'GF Avenue Arcade, Ortigas Avenue Ext., Pasig City, 1600 Philippines',
    contactPerson: 'Engr. Ma. Cristina Santos-Del Rosario',
    contactNumber: '+63 (02) 8631-9000 / +63 920 955 4321',
    contactEmail: 'inquiry@avenueheightsrealty.com',
    tin: '412-339-810-000',
    ocnNumber: 'OCN-BIR-RR7-2025-001290',
    atpOcn: 'ATP-2025-011294-BIR',
    annualSubDate: '2026-09-30',
    annualSubNotes: 'LGU Pasig 3rd Quarter Local Business Tax and Environmental Safety Assessment',
    contractDate: '2025-01-10',
    maturityDate: '2026-09-15',
    status: 'Active',
    notes: 'Commercial lease management and property brokerage agreement with IEN Realty Inc.',
    customFolders: [],
    createdAt: '2025-01-10T09:00:00.000Z',
    updatedAt: '2026-08-10T14:20:00.000Z',
  },
  {
    id: 'client_ien_003',
    clientName: 'ZENITH LOGISTICS & WAREHOUSING HUB INC.',
    tradeName: 'Zenith Logistics Freeport Park',
    logoUrl: '',
    dateOfEngagement: '2023-08-01',
    cifNo: 'IEN-CIF-2023-1109',
    registrationType: 'OPC',
    serviceCategory: 'Retainer',
    officeAddress: 'Warehouse Compound 4B, Southwoods Industrial Park, Biñan, Laguna',
    contactPerson: 'Mr. Ferdinand L. Tan',
    contactNumber: '+63 918 555 8901',
    contactEmail: 'operations@zenithlogisticsph.com',
    tin: '280-991-623-000',
    ocnNumber: 'OCN-BIR-RR9-2023-776100',
    atpOcn: 'ATP-2023-998811-BIR',
    annualSubDate: '2026-08-25',
    annualSubNotes: 'Annual Fire Safety Inspection Certificate & PEZA compliance renewal',
    contractDate: '2023-08-01',
    maturityDate: '2026-08-31',
    status: 'Active Renewal',
    notes: 'Industrial warehouse lease contract undergoing active renewal process. Coordinate lease renewal agreement with IEN Realty Inc.',
    customFolders: [],
    createdAt: '2023-08-01T10:00:00.000Z',
    updatedAt: '2026-08-18T16:45:00.000Z',
  },
  {
    id: 'client_ien_004',
    clientName: 'APEX INNOVATIONS BPO SOLUTIONS PHILS.',
    tradeName: 'Apex Tower Tech Hub Makati',
    logoUrl: '',
    dateOfEngagement: '2025-05-20',
    cifNo: 'IEN-CIF-2025-7721',
    registrationType: 'Corporation',
    serviceCategory: 'Virtual Client',
    officeAddress: '15th Floor, Ayala Triangle Tower 2, Paseo de Roxas, Makati City, Metro Manila',
    contactPerson: 'Ms. Katherine Joy Mendoza',
    contactNumber: '+63 (02) 8812-3000 / +63 917 500 8822',
    contactEmail: 'facilities@apexinnovations.ph',
    tin: '008-542-190-000',
    ocnNumber: 'OCN-BIR-RR8-2025-449102',
    atpOcn: 'ATP-2025-882310-BIR',
    annualSubDate: '2026-11-15',
    annualSubNotes: 'PEZA annual information report and Makati City Hall sanitation compliance',
    contractDate: '2025-05-20',
    maturityDate: '2028-05-19',
    status: 'Active',
    notes: '24/7 BPO operations facility. 3-year commercial lease contract under IEN Realty asset portfolio.',
    customFolders: [],
    createdAt: '2025-05-20T08:30:00.000Z',
    updatedAt: '2026-08-01T09:15:00.000Z',
  },
  {
    id: 'client_ien_005',
    clientName: 'METRO PACIFIC GOLDEN PROPERTIES INC.',
    tradeName: 'Golden Heights Lifestyle Mall & Offices',
    logoUrl: '',
    dateOfEngagement: '2024-11-01',
    cifNo: 'IEN-CIF-2024-3320',
    registrationType: 'Sole Proprietorship',
    serviceCategory: 'Virtual Retainer',
    officeAddress: 'Level 4 Administration Office, Golden Mall, EDSA cor. North Ave, Quezon City',
    contactPerson: 'Arch. Vincent Paolo Mercado',
    contactNumber: '+63 (02) 8920-5500 / +63 928 440 9988',
    contactEmail: 'leasing.compliance@metropacificgolden.com',
    tin: '219-480-112-000',
    ocnNumber: 'OCN-BIR-RR7-2024-110034',
    atpOcn: 'ATP-2024-554109-BIR',
    annualSubDate: '2026-10-30',
    annualSubNotes: 'Quezon City Business Permit Tax Assessment & Building Structural Audit',
    contractDate: '2024-11-01',
    maturityDate: '2027-10-31',
    status: 'Active Renewal',
    notes: 'Multi-tenant commercial retail space managed by IEN Realty corporate team.',
    customFolders: [],
    createdAt: '2024-11-01T10:00:00.000Z',
    updatedAt: '2026-07-28T11:20:00.000Z',
  },
  {
    id: 'client_ien_006',
    clientName: 'HARBOR VIEW MARITIME & COMMERCIAL CORP.',
    tradeName: 'Harbor Point Cargo Terminal Offices',
    logoUrl: '',
    dateOfEngagement: '2023-01-15',
    cifNo: 'IEN-CIF-2023-0048',
    registrationType: 'Corporation',
    serviceCategory: 'Retainer',
    officeAddress: 'Port Area South Harbor, Manila City, Metro Manila',
    contactPerson: 'Capt. Manuel D. Alvarez',
    contactNumber: '+63 (02) 8527-4000',
    contactEmail: 'admin@harborviewmaritime.com.ph',
    tin: '104-338-901-000',
    ocnNumber: 'OCN-BIR-RR6-2023-000188',
    atpOcn: 'ATP-2023-112200-BIR',
    annualSubDate: '2026-01-20',
    annualSubNotes: 'Overdue Annual Sub - PPA clearance and Manila LGU renewal required',
    contractDate: '2023-01-15',
    maturityDate: '2026-01-14',
    status: 'Expired',
    notes: 'Contract matured on January 14, 2026. Needs renewal or turnover clearance.',
    customFolders: [],
    createdAt: '2023-01-15T09:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  }
];

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  // Solaris Prime Documents (client_ien_001)
  {
    id: 'doc_001',
    clientId: 'client_ien_001',
    folderId: 'folder_01_engagement',
    folderCode: '01',
    fileName: 'IEN Realty - Solaris Prime Engagement Agreement & Master Brokerage.pdf',
    originalFileName: 'Engagement_Contract_Solaris_2024.pdf',
    fileType: 'application/pdf',
    fileSize: 428000,
    fileData: generateSamplePdfDataUri('IEN REALTY INC. - ENGAGEMENT AGREEMENT', 'Client: Solaris Prime Commercial Tower Holdings | CIF: IEN-CIF-2024-8891'),
    uploadedAt: '2024-03-15T09:30:00.000Z',
    expirationDate: '2027-03-14',
    referenceNumber: 'AGR-IEN-2024-019',
    notes: 'Tripartite engagement contract between IEN Realty Inc., Landowner, and Solaris Prime Holdings.',
    tags: ['Contract', 'Master Agreement', 'Notarized']
  },
  {
    id: 'doc_002',
    clientId: 'client_ien_001',
    folderId: 'folder_02_dti',
    folderCode: '02',
    fileName: 'DTI Business Name Registration Certificate - Solaris Prime.pdf',
    originalFileName: 'DTI_Cert_Solaris_BN2024.pdf',
    fileType: 'application/pdf',
    fileSize: 312000,
    fileData: generateSamplePdfDataUri('DTI BUSINESS NAME CERTIFICATE', 'Business Name: Solaris Commercial Plaza | BN No: 5892014-2024'),
    uploadedAt: '2024-03-16T11:00:00.000Z',
    expirationDate: '2029-03-15',
    referenceNumber: 'DTI-BN-5892014',
    notes: '5-year national validity under DTI e-Services portal.',
    tags: ['DTI', 'Certificate', '5-Year']
  },
  {
    id: 'doc_003',
    clientId: 'client_ien_001',
    folderId: 'folder_03_bir',
    folderCode: '03',
    fileName: 'BIR Form 2303 Certificate of Registration & Tax Types.pdf',
    originalFileName: 'BIR_2303_COR_Solaris.pdf',
    fileType: 'application/pdf',
    fileSize: 520000,
    fileData: generateSamplePdfDataUri('BIR FORM 2303 - CERTIFICATE OF REGISTRATION', 'TIN: 009-876-543-000 | RDO 044 - Taguig / Pateros'),
    uploadedAt: '2024-03-18T14:15:00.000Z',
    expirationDate: '2027-01-31',
    referenceNumber: 'BIR-2303-RDO044-889',
    notes: 'Includes VAT, Expanded Withholding Tax, and Corporate Income Tax classifications.',
    tags: ['BIR', 'Form 2303', 'Tax COR']
  },
  {
    id: 'doc_004',
    clientId: 'client_ien_001',
    folderId: 'folder_03_bir',
    folderCode: '03',
    fileName: 'BIR Authority to Print (ATP) Official Receipts & Sales Invoices.pdf',
    originalFileName: 'BIR_ATP_OCN_2024.pdf',
    fileType: 'application/pdf',
    fileSize: 289000,
    fileData: generateSamplePdfDataUri('BIR AUTHORITY TO PRINT (ATP) & OCN', 'OCN: OCN-BIR-RR8-2024-004521 | ATP: ATP-2024-098871-BIR'),
    uploadedAt: '2024-03-20T10:00:00.000Z',
    expirationDate: '2029-03-19',
    referenceNumber: 'ATP-2024-098871-BIR',
    notes: 'Series 000001 to 050000 printed by BIR-accredited printer.',
    tags: ['ATP', 'OCN', 'Receipts']
  },
  {
    id: 'doc_005',
    clientId: 'client_ien_001',
    folderId: 'folder_04_lgu',
    folderCode: '04',
    fileName: 'Taguig City Mayor’s Business Permit 2026.pdf',
    originalFileName: 'Taguig_Mayors_Permit_2026.pdf',
    fileType: 'application/pdf',
    fileSize: 450000,
    fileData: generateSamplePdfDataUri('CITY OF TAGUIG - MAYORS BUSINESS PERMIT', 'Permit No: BGC-2026-009182 | Valid for Calendar Year 2026'),
    uploadedAt: '2026-01-15T09:00:00.000Z',
    expirationDate: '2026-12-31',
    referenceNumber: 'BGC-MP-2026-009182',
    notes: 'Annual LGU license renewal. Due for renewal every January 20.',
    tags: ['LGU', 'Mayor Permit', 'Annual']
  },
  {
    id: 'doc_006',
    clientId: 'client_ien_001',
    folderId: 'folder_05_govt_mande',
    folderCode: '05',
    fileName: 'SSS Employer Registration & SSS Form R-1A.pdf',
    originalFileName: 'SSS_Employer_R1A_Solaris.pdf',
    fileType: 'application/pdf',
    fileSize: 340000,
    fileData: generateSamplePdfDataUri('SSS EMPLOYER REGISTRATION (FORM R-1A)', 'Employer SSS No: 03-9988112-4 | Solaris Prime Holdings'),
    uploadedAt: '2024-03-22T13:40:00.000Z',
    expirationDate: '',
    referenceNumber: 'SSS-ER-03-9988112-4',
    notes: 'Permanent SSS employer registry for on-site property staff.',
    tags: ['Govt Mande', 'SSS', 'Mandatory']
  },
  {
    id: 'doc_007',
    clientId: 'client_ien_001',
    folderId: 'folder_07_bmbe',
    folderCode: '07',
    fileName: 'BMBE Certificate of Authority (Tax Exemption).pdf',
    originalFileName: 'BMBE_Cert_Authority_2025.pdf',
    fileType: 'application/pdf',
    fileSize: 390000,
    fileData: generateSamplePdfDataUri('BMBE CERTIFICATE OF AUTHORITY', 'Republic Act No. 9178 | Certificate No: BMBE-NCR-2025-0819'),
    uploadedAt: '2025-02-10T15:20:00.000Z',
    expirationDate: '2027-02-09',
    referenceNumber: 'BMBE-NCR-2025-0819',
    notes: '2-Year renewable certificate. Exempt from income tax arising from operations.',
    tags: ['BMBE', 'Tax Exemption', 'DTI']
  },
  {
    id: 'doc_008',
    clientId: 'client_ien_001',
    folderId: 'folder_08_other',
    folderCode: '08',
    fileName: 'Condominium Certificate of Title (CCT) & Master Deed.pdf',
    originalFileName: 'CCT_Solaris_Tower_2804.pdf',
    fileType: 'application/pdf',
    fileSize: 620000,
    fileData: generateSamplePdfDataUri('REGISTRY OF DEEDS - CCT TITLE DEED', 'CCT No. 014-202400981 | Taguig Registry of Deeds'),
    uploadedAt: '2024-03-15T09:00:00.000Z',
    expirationDate: '',
    referenceNumber: 'CCT-014-202400981',
    notes: 'Property ownership and real estate deed registered under Solaris Prime Tower.',
    tags: ['Title Deed', 'CCT', 'Property']
  },

  // Avenue Heights Documents (client_ien_002)
  {
    id: 'doc_009',
    clientId: 'client_ien_002',
    folderId: 'folder_01_engagement',
    folderCode: '01',
    fileName: 'IEN Realty - Avenue Heights Commercial Leasing Agreement.pdf',
    originalFileName: 'Avenue_Heights_Lease_2025.pdf',
    fileType: 'application/pdf',
    fileSize: 410000,
    fileData: generateSamplePdfDataUri('IEN REALTY INC. - COMMERCIAL LEASE AGREEMENT', 'Client: Avenue Heights Realty & Development Corp | CIF: IEN-CIF-2025-4412'),
    uploadedAt: '2025-01-10T10:00:00.000Z',
    expirationDate: '2026-09-15',
    referenceNumber: 'AGR-IEN-2025-008',
    notes: 'Commercial lease management and tenant representation.',
    tags: ['Contract', 'Commercial Lease']
  },
  {
    id: 'doc_010',
    clientId: 'client_ien_002',
    folderId: 'folder_03_bir',
    folderCode: '03',
    fileName: 'BIR Form 2303 Certificate of Registration - Avenue Heights.pdf',
    originalFileName: 'BIR_2303_AvenueHeights.pdf',
    fileType: 'application/pdf',
    fileSize: 490000,
    fileData: generateSamplePdfDataUri('BIR FORM 2303 - TAX REGISTRATION', 'TIN: 412-339-810-000 | RDO 043 - Pasig'),
    uploadedAt: '2025-01-12T14:00:00.000Z',
    expirationDate: '',
    referenceNumber: 'BIR-2303-PASIG-4412',
    notes: 'Tax registration certificate for Pasig City operations.',
    tags: ['BIR', 'Form 2303']
  },
  {
    id: 'doc_011',
    clientId: 'client_ien_002',
    folderId: 'folder_04_lgu',
    folderCode: '04',
    fileName: 'Pasig City Mayor’s Business License Permit 2026.pdf',
    originalFileName: 'Pasig_Business_Permit_2026.pdf',
    fileType: 'application/pdf',
    fileSize: 375000,
    fileData: generateSamplePdfDataUri('CITY OF PASIG - MAYORS PERMIT', 'Permit No: PSG-2026-118920 | Avenue Heights Realty'),
    uploadedAt: '2026-01-18T11:30:00.000Z',
    expirationDate: '2026-12-31',
    referenceNumber: 'PSG-MP-2026-118920',
    notes: 'Valid until December 31, 2026.',
    tags: ['LGU', 'Mayor Permit']
  },
  
  // Zenith Logistics Documents (client_ien_003)
  {
    id: 'doc_012',
    clientId: 'client_ien_003',
    folderId: 'folder_01_engagement',
    folderCode: '01',
    fileName: 'IEN Realty - Zenith Industrial Warehouse Master Lease Contract.pdf',
    originalFileName: 'Lease_Contract_Zenith_2023.pdf',
    fileType: 'application/pdf',
    fileSize: 490000,
    fileData: generateSamplePdfDataUri('IEN REALTY INC. - INDUSTRIAL LEASE CONTRACT', 'Client: Zenith Logistics & Warehousing Hub | Maturity: Aug 31, 2026'),
    uploadedAt: '2023-08-01T11:00:00.000Z',
    expirationDate: '2026-08-31',
    referenceNumber: 'LEASE-IEN-2023-88',
    notes: 'Expiring in August 2026! High priority for contract renewal.',
    tags: ['Contract', 'Lease', 'Urgent Renewal']
  },
  {
    id: 'doc_013',
    clientId: 'client_ien_003',
    folderId: 'folder_04_lgu',
    folderCode: '04',
    fileName: 'Biñan Laguna Mayor’s Industrial Warehouse Permit 2026.pdf',
    originalFileName: 'Binan_Laguna_Permit_2026.pdf',
    fileType: 'application/pdf',
    fileSize: 380000,
    fileData: generateSamplePdfDataUri('CITY OF BINAN - MAYORS BUSINESS PERMIT', 'Permit No: LAG-BIN-2026-4412 | Zenith Logistics'),
    uploadedAt: '2026-01-20T10:00:00.000Z',
    expirationDate: '2026-12-31',
    referenceNumber: 'LAG-BIN-2026-4412',
    notes: 'Includes zoning and industrial fire safety approval.',
    tags: ['LGU', 'Mayor Permit']
  },

  // Apex Innovations Documents (client_ien_004)
  {
    id: 'doc_014',
    clientId: 'client_ien_004',
    folderId: 'folder_01_engagement',
    folderCode: '01',
    fileName: 'IEN Realty - Apex BPO Hub Commercial Facility Management Agreement.pdf',
    originalFileName: 'Apex_BPO_Agreement_2025.pdf',
    fileType: 'application/pdf',
    fileSize: 460000,
    fileData: generateSamplePdfDataUri('IEN REALTY INC. - FACILITY MANAGEMENT AGREEMENT', 'Client: Apex Innovations BPO Solutions Phils. | CIF: IEN-CIF-2025-7721'),
    uploadedAt: '2025-05-20T09:00:00.000Z',
    expirationDate: '2028-05-19',
    referenceNumber: 'AGR-IEN-2025-044',
    notes: 'Triennial master brokerage and facility management contract.',
    tags: ['Contract', 'BPO Hub', '3-Year']
  },
  {
    id: 'doc_015',
    clientId: 'client_ien_004',
    folderId: 'folder_03_bir',
    folderCode: '03',
    fileName: 'BIR Form 2303 Certificate of Registration - Makati RDO 048.pdf',
    originalFileName: 'BIR_2303_Apex.pdf',
    fileType: 'application/pdf',
    fileSize: 510000,
    fileData: generateSamplePdfDataUri('BIR FORM 2303 - TAX REGISTRATION', 'TIN: 008-542-190-000 | RDO 048 - West Makati'),
    uploadedAt: '2025-05-22T11:00:00.000Z',
    expirationDate: '',
    referenceNumber: 'BIR-2303-MAKATI-7721',
    notes: 'Registered tax certificate with PEZA incentives attachment.',
    tags: ['BIR', 'Form 2303', 'PEZA']
  },
  {
    id: 'doc_016',
    clientId: 'client_ien_004',
    folderId: 'folder_04_lgu',
    folderCode: '04',
    fileName: 'Makati City Mayor’s Business License Permit 2026.pdf',
    originalFileName: 'Makati_Mayors_Permit_2026.pdf',
    fileType: 'application/pdf',
    fileSize: 420000,
    fileData: generateSamplePdfDataUri('CITY OF MAKATI - MAYORS BUSINESS PERMIT', 'Permit No: MKT-2026-990142 | Apex Innovations BPO'),
    uploadedAt: '2026-01-14T10:15:00.000Z',
    expirationDate: '2026-12-31',
    referenceNumber: 'MKT-MP-2026-990142',
    notes: 'Annual Makati City business license.',
    tags: ['LGU', 'Mayor Permit']
  }
];

export const INITIAL_CUSTOM_FOLDERS: FolderDefinition[] = [];

