import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Smartphone, 
  Volume2, 
  VolumeX, 
  ShieldAlert,
  Building,
  Send,
  Filter,
  Check
} from 'lucide-react';
import { DeadlineAlert, ClientProfile } from '../types';
import { formatDateDisplay, formatRemainingDaysText } from '../utils/dateUtils';
import { notificationService } from '../utils/notificationService';

interface AlertCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: DeadlineAlert[];
  clients: ClientProfile[];
  onSelectClientAndDoc?: (clientId: string, docId?: string) => void;
}

export const AlertCenterModal: React.FC<AlertCenterModalProps> = ({
  isOpen,
  onClose,
  alerts,
  clients,
  onSelectClientAndDoc,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    notificationService.getPermissionStatus()
  );
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const handleRequestPush = async () => {
    const perm = await notificationService.requestPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      notificationService.playAlertChime('info');
      notificationService.sendPushNotification('IEN REALTY INC. - Alert System Activated', {
        body: 'You will now receive notifications for contract maturities and document expiration dates.',
      });
    }
  };

  const handleSendTestPush = () => {
    notificationService.playAlertChime('urgent');
    const urgentAlert = alerts.find((a) => a.severity === 'expired' || a.severity === 'urgent');
    const title = urgentAlert ? `URGENT DEADLINE: ${urgentAlert.title}` : 'IEN REALTY INC. - Upcoming Deadline Alert';
    const body = urgentAlert
      ? `${urgentAlert.clientName} - Due: ${formatDateDisplay(urgentAlert.dueDate)} (${formatRemainingDaysText(urgentAlert.daysRemaining)})`
      : 'All compliance records are currently up to date for IEN Realty Inc. clients.';

    notificationService.sendPushNotification(title, { body });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const filteredAlerts = alerts.filter((a) => {
    if (selectedCategory === 'ALL') return true;
    return a.category === selectedCategory;
  });

  const expiredCount = alerts.filter((a) => a.severity === 'expired').length;
  const urgentCount = alerts.filter((a) => a.severity === 'urgent').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold shadow-md">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  Compliance Deadline Alert Center
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase">
                  IEN Realty Inc.
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Push notifications & countdowns for Contract Maturities, Annual Submissions, and Document Expirations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Push Notification Activation Banner */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Browser Push Notifications:{' '}
                <span className={notificationPermission === 'granted' ? 'text-emerald-600 font-extrabold' : 'text-sky-700'}>
                  {notificationPermission === 'granted' ? 'ACTIVE & ENABLED' : 'PERMISSION REQUIRED'}
                </span>
              </p>
              <p className="text-[11px] text-slate-500">
                Receive instant pop-up notifications on your desktop or device when deadlines approach.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {notificationPermission !== 'granted' ? (
              <button
                onClick={handleRequestPush}
                className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Push Alerts</span>
              </button>
            ) : (
              <button
                onClick={handleSendTestPush}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition border border-slate-700 flex items-center gap-1.5"
              >
                {testSent ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Send className="w-3.5 h-3.5 text-sky-400" />}
                <span>{testSent ? 'Alert Dispatched!' : 'Send Test Alert'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats & Category Filter */}
        <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Quick Urgency Badges */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              {expiredCount} Overdue
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              {urgentCount + warningCount} Upcoming (Next 30d)
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg transition font-medium text-xs ${
                selectedCategory === 'ALL' ? 'bg-sky-500 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setSelectedCategory('CONTRACT_MATURITY')}
              className={`px-3 py-1.5 rounded-lg transition font-medium text-xs ${
                selectedCategory === 'CONTRACT_MATURITY' ? 'bg-sky-500 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Maturities
            </button>
            <button
              onClick={() => setSelectedCategory('ANNUAL_SUBMISSION')}
              className={`px-3 py-1.5 rounded-lg transition font-medium text-xs ${
                selectedCategory === 'ANNUAL_SUBMISSION' ? 'bg-sky-500 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual Sub
            </button>
            <button
              onClick={() => setSelectedCategory('DOCUMENT_EXPIRATION')}
              className={`px-3 py-1.5 rounded-lg transition font-medium text-xs ${
                selectedCategory === 'DOCUMENT_EXPIRATION' ? 'bg-sky-500 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Doc Expiry
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-150 p-2">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => {
              const isExpired = alert.severity === 'expired';
              const isUrgent = alert.severity === 'urgent';

              return (
                <div
                  key={alert.id}
                  onClick={() => {
                    if (onSelectClientAndDoc) {
                      onSelectClientAndDoc(alert.clientId, alert.documentId);
                      onClose();
                    }
                  }}
                  className={`p-3.5 hover:bg-sky-50/50 cursor-pointer rounded-xl transition flex items-start justify-between gap-3 ${
                    isExpired ? 'bg-rose-50/40 border-l-4 border-rose-500' : isUrgent ? 'bg-sky-50/60 border-l-4 border-sky-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isExpired ? 'bg-rose-100 text-rose-700' : isUrgent ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {alert.category === 'CONTRACT_MATURITY' ? (
                        <Calendar className="w-4 h-4" />
                      ) : alert.category === 'ANNUAL_SUBMISSION' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {alert.category.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {alert.clientName}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                        {alert.title}
                      </p>

                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Due Date: <span className="font-semibold text-slate-700">{formatDateDisplay(alert.dueDate)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Urgency Badge */}
                  <div className="shrink-0 text-right">
                    <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-md ${
                      isExpired
                        ? 'bg-rose-600 text-white shadow-sm'
                        : isUrgent
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : alert.severity === 'warning'
                        ? 'bg-sky-100 text-sky-800 border border-sky-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {formatRemainingDaysText(alert.daysRemaining)}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-700">All Deadlines in Good Standing</p>
              <p className="text-slate-500 mt-1">No alerts found under this category filter.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <p className="text-slate-500 text-[11px]">
            Alerts evaluate automatically based on Contract Maturity & Document Expiration dates.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
