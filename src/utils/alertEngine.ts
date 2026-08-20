import { ClientProfile, DocumentItem, DeadlineAlert, UrgencySeverity } from '../types';
import { calculateDaysRemaining, getUrgencySeverity } from './dateUtils';

export function generateAllAlerts(
  clients: ClientProfile[],
  documents: DocumentItem[],
  targetClientId?: string
): DeadlineAlert[] {
  const alerts: DeadlineAlert[] = [];

  const filteredClients = targetClientId
    ? clients.filter((c) => c.id === targetClientId)
    : clients;

  for (const client of filteredClients) {
    // 1. Contract Maturity Alert
    if (client.maturityDate) {
      const days = calculateDaysRemaining(client.maturityDate);
      if (days !== null) {
        const severity = getUrgencySeverity(days);
        alerts.push({
          id: `alert_maturity_${client.id}`,
          clientId: client.id,
          clientName: client.clientName,
          title: `Contract Maturity Date: ${client.clientName}`,
          category: 'CONTRACT_MATURITY',
          dueDate: client.maturityDate,
          daysRemaining: days,
          severity,
        });
      }
    }

    // 2. Annual Submission (BIR 0605 / SEC GIS / LGU)
    if (client.annualSubDate) {
      const days = calculateDaysRemaining(client.annualSubDate);
      if (days !== null) {
        const severity = getUrgencySeverity(days);
        alerts.push({
          id: `alert_annual_${client.id}`,
          clientId: client.id,
          clientName: client.clientName,
          title: `Annual Submission Filing: ${client.annualSubNotes || 'Corporate Compliance / BIR / LGU'}`,
          category: 'ANNUAL_SUBMISSION',
          dueDate: client.annualSubDate,
          daysRemaining: days,
          severity,
        });
      }
    }

    // 3. Document Expiration Alerts
    const clientDocs = documents.filter((d) => d.clientId === client.id);
    for (const doc of clientDocs) {
      if (doc.expirationDate) {
        const days = calculateDaysRemaining(doc.expirationDate);
        if (days !== null) {
          const severity = getUrgencySeverity(days);
          alerts.push({
            id: `alert_doc_${doc.id}`,
            clientId: client.id,
            clientName: client.clientName,
            title: `Doc Expiry: ${doc.fileName}`,
            category: 'DOCUMENT_EXPIRATION',
            dueDate: doc.expirationDate,
            daysRemaining: days,
            severity,
            documentId: doc.id,
            folderCode: doc.folderCode,
          });
        }
      }
    }
  }

  // Sort by urgency: Expired first (most overdue), then closest to 0 days, then upcoming
  return alerts.sort((a, b) => {
    // If both expired, most negative first
    if (a.daysRemaining < 0 && b.daysRemaining < 0) {
      return a.daysRemaining - b.daysRemaining;
    }
    // If one is expired and the other is not, expired comes first
    if (a.daysRemaining < 0) return -1;
    if (b.daysRemaining < 0) return 1;
    // Otherwise ascending days remaining
    return a.daysRemaining - b.daysRemaining;
  });
}
