import { ClientProfile, DocumentItem, FolderDefinition } from '../types';

// Helper to generate a multi-page valid PDF data URI that displays text cleanly
export function generateSamplePdfDataUri(title: string, subtitle: string, pageCount: number = 3): string {
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

  // Generate SVG-based multi-page data URI if preferred or standard PDF
  // A clean standard 3-page PDF stream:
  const pdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R 6 0 R 8 0 R] /Count 3 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 380 >> stream
BT
/F1 16 Tf
50 720 Td
(${cleanTitle}) Tj
/F1 11 Tf
0 -30 Td
(${cleanSubtitle}) Tj
0 -25 Td
(Document managed under IEN REALTY INC. Corporate Compliance Portal.) Tj
0 -20 Td
(STATUS: Official File Archived & Verified - PAGE 1 OF 3) Tj
0 -30 Td
(Section 1: General Information & Corporate Profile Identification) Tj
0 -20 Td
(Authorized Liaison: IEN Realty Asset Management Operations) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
6 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 7 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
7 0 obj << /Length 380 >> stream
BT
/F1 14 Tf
50 720 Td
(${cleanTitle} - [PAGE 2: COMPLIANCE CLAUSES]) Tj
/F1 11 Tf
0 -30 Td
(Section 2: Philippine Regulatory Filings & Statutory Approvals) Tj
0 -25 Td
(Verified against BIR, SEC, LGU, and SSS / PhilHealth Mandates.) Tj
0 -20 Td
(Certified that this attachment forms part of the master engagement file.) Tj
0 -30 Td
(Official Seal & Authentication Record: IEN-COMP-2026-VAL) Tj
ET
endstream
endobj
8 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 9 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
9 0 obj << /Length 380 >> stream
BT
/F1 14 Tf
50 720 Td
(${cleanTitle} - [PAGE 3: SIGNATURES & TRANSMITTAL LOG]) Tj
/F1 11 Tf
0 -30 Td
(Section 3: Custody, Notarization & Transmittal Schedule) Tj
0 -25 Td
(Signed and delivered in Metro Manila, Philippines.) Tj
0 -20 Td
(End of Document Records - Page 3 of 3) Tj
0 -30 Td
(IEN REALTY INC. - LEASING & PROPERTY COMPLIANCE DIVISION) Tj
ET
endstream
endobj
xref
0 10
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000125 00000 n 
0000000232 00000 n 
0000000560 00000 n 
0000000632 00000 n 
0000000739 00000 n 
0000001067 00000 n 
0000001174 00000 n 
trailer << /Size 10 /Root 1 0 R >>
startxref
1502
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

// Generate high quality sample page SVG images for multi-page preview testing
export function generateSamplePageImage(title: string, clientSubtitle: string, pageNum: number, totalPages: number = 3): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100" width="800" height="1100">
    <rect width="800" height="1100" fill="#ffffff"/>
    <rect x="20" y="20" width="760" height="1060" fill="#fafafa" stroke="#e2e8f0" stroke-width="2" rx="8"/>
    <rect x="40" y="40" width="720" height="80" fill="#0284c7" rx="6"/>
    <text x="60" y="88" fill="#ffffff" font-family="Arial, sans-serif" font-size="20" font-weight="bold">IEN REALTY INC. &bull; COMPLIANCE ARCHIVE</text>
    <text x="60" y="150" fill="#0f172a" font-family="Arial, sans-serif" font-size="22" font-weight="bold">${title}</text>
    <text x="60" y="180" fill="#475569" font-family="Arial, sans-serif" font-size="14">${clientSubtitle}</text>
    <line x1="60" y1="200" x2="740" y2="200" stroke="#cbd5e1" stroke-width="1.5"/>
    
    <rect x="60" y="220" width="680" height="40" fill="#f1f5f9" rx="4"/>
    <text x="80" y="246" fill="#0369a1" font-family="Arial, sans-serif" font-size="14" font-weight="bold">DOCUMENT SECTION ${pageNum}: OFFICIAL PAGE RECORD</text>
    
    <text x="60" y="300" fill="#334155" font-family="Arial, sans-serif" font-size="15" font-weight="bold">1. Statutory Filing and Compliance Summary</text>
    <text x="60" y="330" fill="#475569" font-family="Arial, sans-serif" font-size="13">This page constitutes official Philippine corporate compliance file documentation.</text>
    <text x="60" y="355" fill="#475569" font-family="Arial, sans-serif" font-size="13">Record verified with Mandaluyong City Hall, BIR Revenue District Office, and SEC.</text>
    
    <rect x="60" y="400" width="680" height="180" fill="#ffffff" stroke="#e2e8f0" rx="6"/>
    <text x="80" y="435" fill="#0f172a" font-family="Arial, sans-serif" font-size="14" font-weight="bold">Particulars &amp; Verification Breakdown</text>
    <text x="80" y="470" fill="#64748b" font-family="Arial, sans-serif" font-size="12">Document Status: ACTIVE COMPLIANT &bull; Verified by Legal and Assets Team</text>
    <text x="80" y="500" fill="#64748b" font-family="Arial, sans-serif" font-size="12">Filing Registry Reference: PH-IEN-2026-COMP-${pageNum}</text>
    <text x="80" y="530" fill="#64748b" font-family="Arial, sans-serif" font-size="12">Original Blue-Ink Stamp Validated on Custody Records</text>
    
    <rect x="60" y="620" width="320" height="150" fill="#f8fafc" stroke="#e2e8f0" rx="6"/>
    <text x="80" y="655" fill="#0f172a" font-family="Arial, sans-serif" font-size="13" font-weight="bold">IEN Realty Compliance Officer</text>
    <line x1="80" y1="720" x2="350" y2="720" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4"/>
    <text x="80" y="745" fill="#64748b" font-family="Arial, sans-serif" font-size="11">Authorized Signature &amp; Stamp</text>
    
    <rect x="420" y="620" width="320" height="150" fill="#f8fafc" stroke="#e2e8f0" rx="6"/>
    <text x="440" y="655" fill="#0f172a" font-family="Arial, sans-serif" font-size="13" font-weight="bold">Client Authorized Signatory</text>
    <line x1="440" y1="720" x2="710" y2="720" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4"/>
    <text x="440" y="745" fill="#64748b" font-family="Arial, sans-serif" font-size="11">Received &amp; Acknowledged</text>
    
    <text x="400" y="1030" fill="#64748b" font-family="Arial, sans-serif" font-size="13" font-weight="bold" text-anchor="middle">Page ${pageNum} of ${totalPages}</text>
    <text x="400" y="1055" fill="#94a3b8" font-family="Arial, sans-serif" font-size="11" text-anchor="middle">IEN REALTY INC. &bull; CONFIDENTIAL &amp; PROPRIETARY CORPORATE RECORD</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const INITIAL_CLIENTS: ClientProfile[] = [
  {
    id: 'client_ab_soterio_001',
    clientName: 'A.B Soterio Construction Corporation',
    codeName: 'ABS-CONST',
    tradeName: 'A.B Soterio Construction Corporation',
    logoUrl: '',
    dateOfEngagement: '2021-05-01',
    cifNo: '2021-0027',
    registrationType: 'Corporation',
    serviceCategory: 'Virtual Client',
    officeAddress: '4th Flr. Julio Antonio II Bldg., 315 Maysilo Circle, Brgy. Plainview, Mandaluyong City',
    contactPerson: 'Arvin Soterio',
    contactNumber: '+63 9994753068',
    contactEmail: 'arvinsoterio.construction@gmail.com',
    tin: '602-486-232-00000',
    ocnNumber: 'OCN-BIR-RR7-2021-008921',
    atpOcn: 'ATP-2021-094412-BIR',
    contractDate: '2021-05-01',
    maturityDate: '2025-05-03',
    status: 'Terminated',
    notes: 'Construction corporation compliance account under IEN Realty Inc. Contract ended. Expired 473 days ago.',
    customFolders: [],
    createdAt: '2021-05-01T08:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z',
  },
  {
    id: 'client_ien_001',
    clientName: 'SOLARIS PRIME COMMERCIAL TOWER HOLDINGS',
    codeName: 'SOLARIS',
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
    codeName: 'AVENUE-PASIG',
    ocnNumber: 'OCN-BIR-RR7-2025-001290',
    atpOcn: 'ATP-2025-011294-BIR',
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
    codeName: 'ZENITH-LAGUNA',
    ocnNumber: 'OCN-BIR-RR9-2023-776100',
    atpOcn: 'ATP-2023-998811-BIR',
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
    codeName: 'APEX-MAKATI',
    ocnNumber: 'OCN-BIR-RR8-2025-449102',
    atpOcn: 'ATP-2025-882310-BIR',
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
    codeName: 'GOLDEN-QC',
    ocnNumber: 'OCN-BIR-RR7-2024-110034',
    atpOcn: 'ATP-2024-554109-BIR',
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
    codeName: 'HARBOR-MANILA',
    ocnNumber: 'OCN-BIR-RR6-2023-000188',
    atpOcn: 'ATP-2023-112200-BIR',
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
  // A.B Soterio Construction Corporation Documents (client_ab_soterio_001) - 10 Compliance Files
  {
    id: 'doc_soterio_001',
    clientId: 'client_ab_soterio_001',
    folderId: 'folder_01_engagement',
    folderCode: '01',
    fileName: 'IEN Realty - A.B Soterio Master Brokerage & Service Agreement.pdf',
    originalFileName: 'Service_Agreement_Soterio_2021.pdf',
    fileType: 'application/pdf',
    fileSize: 410000,
    fileData: generateSamplePdfDataUri('IEN REALTY INC. - CLIENT ENGAGEMENT CONTRACT', 'Client: A.B Soterio Construction Corporation | CIF: 2021-0027'),
    pages: [
      generateSamplePageImage('IEN REALTY INC. - CLIENT ENGAGEMENT CONTRACT', 'A.B Soterio Construction Corporation - Mandated Lease Terms', 1, 3),
      generateSamplePageImage('SERVICE LEVEL AGREEMENT & BROKERAGE TERMS', 'Brokerage Commission & Escrow Provisions', 2, 3),
      generateSamplePageImage('NOTARIZATION & MUTUAL EXECUTION SIGNATURES', 'Atty. Rafael Gomez - Notary Public Manila', 3, 3),
    ],
    pageCount: 3,
    copyType: 'Original',
    uploadedAt: '2021-05-01T09:00:00.000Z',
    expirationDate: '2025-05-03',
    referenceNumber: 'AGR-SOTERIO-2021-027',
    notes: 'Corporate service & property facilitation contract under IEN Realty Inc. (Terminated/Expired).',
    tags: ['Engagement', 'Master Agreement', 'Notarized']
  },
  {
    id: 'doc_soterio_002',
    clientId: 'client_ab_soterio_001',
    folderId: 'folder_01_engagement',
    folderCode: '01',
    fileName: 'Board Resolution & Secretary Certificate - Authorized Signatory.pdf',
    originalFileName: 'Board_Res_Soterio_Auth.pdf',
    fileType: 'application/pdf',
    fileSize: 320000,
    fileData: generateSamplePdfDataUri('BOARD RESOLUTION & SECRETARY CERTIFICATE', 'Designating Arvin Soterio as Authorized Representative'),
    pages: [
      generateSamplePageImage('BOARD RESOLUTION - SPECIAL MEETING', 'Designation of Authorized Representative - Arvin Soterio', 1, 2),
      generateSamplePageImage('CORPORATE SECRETARY’S CERTIFICATE', 'Verified under oath by Corporate Secretary', 2, 2),
    ],
    pageCount: 2,
    copyType: 'Certified True Copy',
    uploadedAt: '2021-05-02T10:30:00.000Z',
    expirationDate: '2025-05-03',
    referenceNumber: 'BR-2021-05-SOT',
    notes: 'Corporate board authorization for IEN Realty property transactions.',
    tags: ['Board Resolution', 'Secretary Cert']
  },
  {
    id: 'doc_soterio_003',
    clientId: 'client_ab_soterio_001',
    folderId: 'folder_02_dti',
    folderCode: '02',
    fileName: 'SEC Certificate of Incorporation - A.B Soterio Construction Corp.pdf',
    originalFileName: 'SEC_Cert_Incorporation_Soterio.pdf',
    fileType: 'application/pdf',
    fileSize: 580000,
    fileData: generateSamplePdfDataUri('SECURITIES AND EXCHANGE COMMISSION (SEC)', 'Certificate of Incorporation: CS2021-09812 | A.B Soterio Construction Corp.'),
    pages: [
      generateSamplePageImage('SEC CERTIFICATE OF INCORPORATION', 'Company Reg. No. CS2021-09812 - Mandaluyong City', 1, 2),
      generateSamplePageImage('SEC ENDORSEMENT & REGISTRATION SEAL', 'Securities & Exchange Commission Manila', 2, 2),
    ],
    pageCount: 2,
    copyType: 'Certified True Copy',
    uploadedAt: '2021-05-03T11:15:00.000Z',
    expirationDate: '2071-05-01',
    referenceNumber: 'SEC-CS2021-09812',
    notes: 'Perpetual corporate term under Revised Corporation Code.',
    tags: ['SEC', 'Registration', 'Certificate']
  },
  {
    id: 'doc_soterio_004',
    clientId: 'client_ab_soterio_001',
    folderId: 'folder_02_dti',
    folderCode: '02',
    fileName: 'Articles of Incorporation and Corporate By-Laws.pdf',
    originalFileName: 'AOI_ByLaws_Soterio_Signed.pdf',
    fileType: 'application/pdf',
    fileSize: 640000,
    fileData: generateSamplePdfDataUri('ARTICLES OF INCORPORATION & BY-LAWS', 'A.B Soterio Construction Corporation - Mandaluyong City'),
    pages: [
      generateSamplePageImage('ARTICLES OF INCORPORATION - TITLE & PURPOSE', 'Primary & Secondary Purpose Clauses - Construction', 1, 3),
      generateSamplePageImage('CAPITAL STOCK & SUBSCRIBERS TABLE', 'Authorized Capitalization PHP 10,000,000.00', 2, 3),
      generateSamplePageImage('CORPORATE BY-LAWS & DIRECTORS ATTESTATION', 'Board Governance & Annual Meetings', 3, 3),
    ],
    pageCount: 3,
    copyType: 'Certified True Copy',
    uploadedAt: '2021-05-03T14:00:00.000Z',
    expirationDate: '2071-05-01',
    referenceNumber: 'SEC-AOI-2021',
    notes: 'Certified true copy from SEC archive.',
    tags: ['Articles of Incorporation', 'By-Laws']
  },
  {
    id: 'doc_soterio_005',
    clientId: 'client_ab_soterio_001',
    folderId: 'folder_03_bir',
    folderCode: '03',
    fileName: 'BIR Form 2303 Certificate of Registration (TIN 602-486-232-00000).pdf',
    originalFileName: 'BIR_2303_COR_Soterio.pdf',
    fileType: 'application/pdf',
    fileSize: 490000,
    fileData: generateSamplePdfDataUri('BIR FORM 2303 - TAXPAYER CERTIFICATE OF REGISTRATION', 'TIN: 602-486-232-00000 | RDO 041 - Mandaluyong'),
    pages: [
      generateSamplePageImage('BIR FORM 2303 - CERTIFICATE OF REGISTRATION', 'Taxpayer Name: A.B Soterio Construction Corp | TIN: 602-486-232', 1, 2),
      generateSamplePageImage('BIR TAX TYPES TABLE & FILING DUE DATES', 'VAT, Income Tax, Withholding Expanded & Compensation', 2, 2),
    ],
    pageCount: 2,
    copyType: 'Original',
    uploadedAt: '2021-05-04T09:45:00.000Z',
    expirationDate: '2026-12-31',
    referenceNumber: 'BIR-2303-RDO041-0027',
    notes: 'Registered with BIR RDO 041 Mandaluyong.',
    tags: ['BIR', 'Form 2303', 'TIN']
  },
  {
    id: 'doc_soterio_006',
    clientId: 'client_ab_soterio_001',
    folderId: 'folder_03_bir',
    folderCode: '03',
    fileName: 'BIR Authority to Print (ATP) & Official Invoices OCN.pdf',
    originalFileName: 'BIR_ATP_OCN_Soterio.pdf',
    fileType: 'application/pdf',
    fileSize: 310000,
    fileData: generateSamplePdfDataUri('BIR AUTHORITY TO PRINT & OFFICIAL INVOICES', 'OCN: OCN-BIR-RR7-2021-008921 | ATP: ATP-2021-094412-BIR'),
    pages: [
      generateSamplePageImage('BIR AUTHORITY TO PRINT (ATP) FORM 1921', 'Authorized Invoices Series: 0001 to 5000', 1, 1),
    ],
    pageCount: 1,
    copyType: 'Photocopy',
    uploadedAt: '2021-05-05T10:00:00.000Z',
    expirationDate: '2026-05-04',
    referenceNumber: 'ATP-2021-094412-BIR',
    notes: 'Registered official receipt and invoice series.',
    tags: ['ATP', 'OCN', 'Receipts']
  },
  {
    id: 'doc_soterio_007',
    clientId: 'client_ab_soterio_001',
    folderId: 'folder_04_lgu',
    folderCode: '04',
    fileName: 'Mandaluyong City Hall Business Permit & License 2024.pdf',
    originalFileName: 'Mandaluyong_Permit_Soterio_2024.pdf',
    fileType: 'application/pdf',
    fileSize: 420000,
    fileData: generateSamplePdfDataUri('CITY OF MANDALUYONG - MAYOR’S BUSINESS PERMIT', 'Business: A.B Soterio Construction Corp | Plainview, Mandaluyong City'),
    pages: [
      generateSamplePageImage('CITY OF MANDALUYONG - BUSINESS PERMIT 2024', 'Permit Plate No: 2024-0881 | Line of Business: General Contractor', 1, 2),
      generateSamplePageImage('CITY HEALTH, SANITATION & FIRE SAFETY CERT', 'Bureau of Fire Protection Assessment Mandaluyong', 2, 2),
    ],
    pageCount: 2,
    copyType: 'Photocopy',
    uploadedAt: '2021-05-06T13:20:00.000Z',
    expirationDate: '2024-12-31',
    referenceNumber: 'BP-MANDALUYONG-2024-0881',
    notes: 'Expired LGU business permit plate for Mandaluyong office.',
    tags: ['Mayor’s Permit', 'LGU', 'Mandaluyong']
  },
  {
    id: 'doc_soterio_008',
    clientId: 'client_ab_soterio_001',
    folderId: 'folder_05_pcab',
    folderCode: '05',
    fileName: 'PCAB Contractor License & Accreditation Certificate.pdf',
    originalFileName: 'PCAB_License_Soterio_CategoryB.pdf',
    fileType: 'application/pdf',
    fileSize: 510000,
    fileData: generateSamplePdfDataUri('PHILIPPINE CONTRACTORS ACCREDITATION BOARD (PCAB)', 'License No: PCAB-2021-99812 | Category: General Building / Engineering'),
    pages: [
      generateSamplePageImage('PHILIPPINE CONTRACTORS ACCREDITATION BOARD LICENSE', 'Principal Classification: General Engineering | Category B', 1, 2),
      generateSamplePageImage('PCAB SUSTAINING TECHNICAL EMPLOYEES (STE)', 'Accredited Civil Engineers & Safety Officers', 2, 2),
    ],
    pageCount: 2,
    copyType: 'Original',
    uploadedAt: '2021-05-08T15:00:00.000Z',
    expirationDate: '2025-06-30',
    referenceNumber: 'PCAB-2021-99812',
    notes: 'Philippine Contractors Accreditation Board national license.',
    tags: ['PCAB', 'License', 'Contractor']
  },
  {
    id: 'doc_soterio_009',
    clientId: 'client_ab_soterio_001',
    folderId: 'folder_06_statutory',
    folderCode: '06',
    fileName: 'SSS, PhilHealth & Pag-IBIG HDMF Employer Compliance Clearance.pdf',
    originalFileName: 'Statutory_Employer_Clearance_Soterio.pdf',
    fileType: 'application/pdf',
    fileSize: 370000,
    fileData: generateSamplePdfDataUri('STATUTORY EMPLOYER REGISTRATIONS', 'SSS No: 03-9981234-1 | PhilHealth: 00291823910 | Pag-IBIG: 1210-9982-1200'),
    pages: [
      generateSamplePageImage('SOCIAL SECURITY SYSTEM (SSS) EMPLOYER CLEARANCE', 'Employer ID: 03-9981234-1 | Status: Compliant', 1, 3),
      generateSamplePageImage('PHILHEALTH CERTIFICATE OF GOOD STANDING', 'PhilHealth Employer No: 00291823910', 2, 3),
      generateSamplePageImage('PAG-IBIG FUND (HDMF) COMPLIANCE CERTIFICATE', 'Pag-IBIG Employer No: 1210-9982-1200', 3, 3),
    ],
    pageCount: 3,
    copyType: 'Photocopy',
    uploadedAt: '2021-05-10T11:00:00.000Z',
    expirationDate: '2026-05-09',
    referenceNumber: 'STAT-CLR-2021',
    notes: 'Statutory benefit registration records.',
    tags: ['SSS', 'PhilHealth', 'Pag-IBIG']
  },
  {
    id: 'doc_soterio_010',
    clientId: 'client_ab_soterio_001',
    folderId: 'folder_08_annual',
    folderCode: '08',
    fileName: 'SEC General Information Sheet (GIS) & Financial Statements 2023.pdf',
    originalFileName: 'SEC_GIS_AFS_Soterio_2023.pdf',
    fileType: 'application/pdf',
    fileSize: 630000,
    fileData: generateSamplePdfDataUri('SEC ANNUAL GENERAL INFORMATION SHEET (GIS)', 'A.B Soterio Construction Corp | Annual Corporate Report'),
    pages: [
      generateSamplePageImage('SEC ANNUAL GENERAL INFORMATION SHEET 2023', 'A.B Soterio Construction Corp - Page 1 Corporate Information', 1, 3),
      generateSamplePageImage('SEC GIS - DIRECTORS & OFFICERS SCHEDULE', 'Elected Board of Directors and Shareholdings', 2, 3),
      generateSamplePageImage('AUDITED FINANCIAL STATEMENTS (AFS) ATTACHMENT', 'Independent Auditor’s Report & Balance Sheet', 3, 3),
    ],
    pageCount: 3,
    copyType: 'Photocopy',
    uploadedAt: '2023-05-12T14:30:00.000Z',
    expirationDate: '2024-04-30',
    referenceNumber: 'SEC-GIS-2023-091',
    notes: 'Last filed SEC annual corporate submission.',
    tags: ['SEC GIS', 'Annual Submission', 'Expired']
  },
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
    pages: [
      generateSamplePageImage('IEN REALTY INC. - ENGAGEMENT AGREEMENT', 'Solaris Prime Commercial Tower Holdings - Master Brokerage', 1, 3),
      generateSamplePageImage('COMMISSION SCHEDULE & FACILITY LEASE TERMS', 'BGC Commercial Office Tower Asset Portfolio', 2, 3),
      generateSamplePageImage('OFFICIAL NOTARIAL ATTESTATION & SIGNATURES', 'Notary Public Taguig City - Series of 2024', 3, 3),
    ],
    pageCount: 3,
    copyType: 'Original',
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
    pages: [
      generateSamplePageImage('DTI BUSINESS NAME REGISTRATION CERTIFICATE', 'Business Name: Solaris Commercial Plaza | BN No: 5892014', 1, 1),
    ],
    pageCount: 1,
    copyType: 'Certified True Copy',
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
    pages: [
      generateSamplePageImage('BIR FORM 2303 - CERTIFICATE OF REGISTRATION', 'Solaris Prime Commercial Tower Holdings | TIN: 009-876-543-000', 1, 2),
      generateSamplePageImage('BIR TAX SCHEDULE & PERMIT TO OPERATE', 'RDO 044 Taguig City - Tax Compliance Matrix', 2, 2),
    ],
    pageCount: 2,
    copyType: 'Original',
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
    pages: [
      generateSamplePageImage('BIR AUTHORITY TO PRINT (ATP) OFFICIAL RECEIPTS', 'Approved Serial Series 000001 - 050000', 1, 1),
    ],
    pageCount: 1,
    copyType: 'Original',
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
    pages: [
      generateSamplePageImage('CITY OF TAGUIG - MAYOR’S PERMIT 2026', 'Permit No: BGC-2026-009182 | Commercial Tower Leasing', 1, 2),
      generateSamplePageImage('TAGUIG BPLO TAX BILL RECEIPT & SANITARY CLEARANCE', 'Official Receipt No. 8920192-BGC', 2, 2),
    ],
    pageCount: 2,
    copyType: 'Original',
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
    pages: [
      generateSamplePageImage('SSS EMPLOYER REGISTRATION (FORM R-1A)', 'Employer SSS No: 03-9988112-4 | Taguig City Branch', 1, 1),
    ],
    pageCount: 1,
    copyType: 'Photocopy',
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
    pages: [
      generateSamplePageImage('BMBE CERTIFICATE OF AUTHORITY (RA 9178)', 'Micro Business Enterprise Tax Exemption Authority', 1, 1),
    ],
    pageCount: 1,
    copyType: 'Original',
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
    pages: [
      generateSamplePageImage('REGISTRY OF DEEDS - CONDOMINIUM CERTIFICATE OF TITLE', 'CCT No. 014-202400981 | Unit 2804 Solaris Tower BGC', 1, 3),
      generateSamplePageImage('TECHNICAL DESCRIPTION & FLOOR PLAN ATTACHMENT', 'Survey Plan No. PSD-00-089124 - 450 sq. meters', 2, 3),
      generateSamplePageImage('MASTER DEED WITH DECLARATION OF RESTRICTIONS', 'Condominium Corporation Registration & Easements', 3, 3),
    ],
    pageCount: 3,
    copyType: 'Certified True Copy',
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
    pages: [
      generateSamplePageImage('COMMERCIAL LEASE & BROKERAGE AGREEMENT', 'Avenue Heights Realty & Development Corp', 1, 2),
      generateSamplePageImage('SCHEDULE OF RENTALS & NOTARIAL ACKNOWLEDGMENT', 'Monthly Rental PHP 350,000.00 + VAT', 2, 2),
    ],
    pageCount: 2,
    copyType: 'Original',
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
    pages: [
      generateSamplePageImage('BIR FORM 2303 - CERTIFICATE OF REGISTRATION', 'Avenue Heights Realty | TIN: 412-339-810-000', 1, 1),
    ],
    pageCount: 1,
    copyType: 'Photocopy',
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
    pages: [
      generateSamplePageImage('CITY OF PASIG - MAYOR’S BUSINESS PERMIT 2026', 'Permit No: PSG-2026-118920 | Ortigas Center Pasig', 1, 1),
    ],
    pageCount: 1,
    copyType: 'Original',
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
    pages: [
      generateSamplePageImage('INDUSTRIAL LEASE & WAREHOUSING CONTRACT', 'Zenith Logistics & Warehousing Hub - Biñan Laguna', 1, 3),
      generateSamplePageImage('WAREHOUSE COLD STORAGE & YARD SPECIFICATIONS', 'High-Bay Storage Facility - 12,000 sq. meters', 2, 3),
      generateSamplePageImage('INSURANCE, INDEMNITY & NOTARIAL REGISTRATION', 'Atty. Cristina Bautista - Notary Laguna', 3, 3),
    ],
    pageCount: 3,
    copyType: 'Original',
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
    pages: [
      generateSamplePageImage('CITY OF BIÑAN - INDUSTRIAL BUSINESS PERMIT', 'Permit No: LAG-BIN-2026-4412 | Laguna Technopark', 1, 1),
    ],
    pageCount: 1,
    copyType: 'Photocopy',
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
    pages: [
      generateSamplePageImage('COMMERCIAL FACILITY MANAGEMENT AGREEMENT', 'Apex Innovations BPO Solutions Phils. - Makati Hub', 1, 2),
      generateSamplePageImage('PEZA COMPLIANCE & 24/7 POWER BACKUP ANNEX', 'IT Park Accreditation & Redundant Genset Terms', 2, 2),
    ],
    pageCount: 2,
    copyType: 'Original',
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
    pages: [
      generateSamplePageImage('BIR FORM 2303 - TAX REGISTRATION CERTIFICATE', 'Apex Innovations BPO | TIN: 008-542-190-000', 1, 1),
    ],
    pageCount: 1,
    copyType: 'Certified True Copy',
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
    pages: [
      generateSamplePageImage('CITY OF MAKATI - MAYOR’S BUSINESS PERMIT 2026', 'Permit No: MKT-2026-990142 | Ayala Avenue Makati', 1, 1),
    ],
    pageCount: 1,
    copyType: 'Original',
    uploadedAt: '2026-01-14T10:15:00.000Z',
    expirationDate: '2026-12-31',
    referenceNumber: 'MKT-MP-2026-990142',
    notes: 'Annual Makati City business license.',
    tags: ['LGU', 'Mayor Permit']
  }
];

export const INITIAL_CUSTOM_FOLDERS: FolderDefinition[] = [];

