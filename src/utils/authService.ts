import { AccessRequest, UserRole, UserSession } from '../types';

export const MASTER_GOOGLE_EMAIL = 'humanresource.iengoc@gmail.com';
export const MASTER_GOOGLE_NAME = 'IEN Realty Corporate HR (Master Admin)';

const STORAGE_KEYS = {
  CURRENT_USER: 'ien_auth_current_user',
  ACCESS_REQUESTS: 'ien_auth_access_requests',
  APPROVED_EMAILS: 'ien_auth_approved_emails',
  SECURITY_SETTINGS: 'ien_auth_security_settings',
};

class AuthService {
  private listeners: Array<(user: UserSession | null) => void> = [];

  constructor() {
    // Ensure storage has defaults
    if (typeof window !== 'undefined') {
      const approved = this.getApprovedEmails();
      if (!approved.includes(MASTER_GOOGLE_EMAIL)) {
        this.addApprovedEmail(MASTER_GOOGLE_EMAIL);
      }
    }
  }

  public isMasterEmail(email: string): boolean {
    return email.trim().toLowerCase() === MASTER_GOOGLE_EMAIL.toLowerCase();
  }

  public getApprovedEmails(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.APPROVED_EMAILS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return Array.from(new Set([MASTER_GOOGLE_EMAIL, ...parsed.map((e: string) => e.toLowerCase())]));
        }
      }
    } catch (e) {
      console.warn('Error reading approved emails:', e);
    }
    return [MASTER_GOOGLE_EMAIL];
  }

  public isEmailApproved(email: string): boolean {
    const clean = email.trim().toLowerCase();
    if (this.isMasterEmail(clean)) return true;
    const approved = this.getApprovedEmails();
    return approved.includes(clean);
  }

  public addApprovedEmail(email: string): void {
    const clean = email.trim().toLowerCase();
    const approved = this.getApprovedEmails();
    if (!approved.includes(clean)) {
      approved.push(clean);
      localStorage.setItem(STORAGE_KEYS.APPROVED_EMAILS, JSON.stringify(approved));
    }
  }

  public removeApprovedEmail(email: string): void {
    const clean = email.trim().toLowerCase();
    if (this.isMasterEmail(clean)) return; // Cannot remove master
    const approved = this.getApprovedEmails().filter((e) => e !== clean);
    localStorage.setItem(STORAGE_KEYS.APPROVED_EMAILS, JSON.stringify(approved));

    // If current logged-in user is removed, update their session
    const current = this.getCurrentUser();
    if (current && current.email.toLowerCase() === clean) {
      this.setCurrentUser({
        ...current,
        role: 'pending_verification',
        status: 'pending_approval',
      });
    }
  }

  public getCurrentUser(): UserSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Error reading current user:', e);
    }
    return null;
  }

  public setCurrentUser(user: UserSession | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    this.notifyListeners(user);
  }

  public loginWithMasterAccount(): UserSession {
    const masterSession: UserSession = {
      email: MASTER_GOOGLE_EMAIL,
      name: MASTER_GOOGLE_NAME,
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'master_admin',
      isMaster: true,
      status: 'active',
      loginTime: new Date().toISOString(),
    };
    this.setCurrentUser(masterSession);
    return masterSession;
  }

  public loginWithGoogleEmail(
    email: string,
    name?: string,
    picture?: string,
    requestReason?: string
  ): UserSession {
    const cleanEmail = email.trim().toLowerCase();
    const isMaster = this.isMasterEmail(cleanEmail);
    const isApproved = this.isEmailApproved(cleanEmail);

    let role: UserRole = 'pending_verification';
    let status: 'active' | 'pending_approval' | 'rejected' = 'pending_approval';

    if (isMaster) {
      role = 'master_admin';
      status = 'active';
    } else if (isApproved) {
      role = 'approved_staff';
      status = 'active';
    }

    const session: UserSession = {
      email: cleanEmail,
      name: name || (isMaster ? MASTER_GOOGLE_NAME : cleanEmail.split('@')[0].toUpperCase()),
      picture: picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanEmail)}`,
      role,
      isMaster,
      status,
      loginTime: new Date().toISOString(),
      requestNote: requestReason,
    };

    // If not approved and not master, automatically register access request
    if (!isMaster && !isApproved) {
      this.submitAccessRequest(cleanEmail, session.name, requestReason || 'General compliance access', session.picture);
    }

    this.setCurrentUser(session);
    return session;
  }

  public logout(): void {
    this.setCurrentUser(null);
  }

  // Access Requests Management
  public getAccessRequests(): AccessRequest[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACCESS_REQUESTS);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Error reading access requests:', e);
    }
    return [];
  }

  public submitAccessRequest(
    email: string,
    name: string,
    reason?: string,
    picture?: string
  ): AccessRequest {
    const cleanEmail = email.trim().toLowerCase();
    const requests = this.getAccessRequests();
    const existingIdx = requests.findIndex((r) => r.email.toLowerCase() === cleanEmail);

    const newRequest: AccessRequest = {
      id: existingIdx >= 0 ? requests[existingIdx].id : `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      name,
      picture: picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanEmail)}`,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      reason: reason || 'Requested access to compliance vault',
    };

    if (existingIdx >= 0) {
      requests[existingIdx] = newRequest;
    } else {
      requests.unshift(newRequest);
    }

    localStorage.setItem(STORAGE_KEYS.ACCESS_REQUESTS, JSON.stringify(requests));
    return newRequest;
  }

  public approveAccessRequest(requestId: string, role: UserRole = 'approved_staff'): void {
    const requests = this.getAccessRequests();
    const target = requests.find((r) => r.id === requestId);
    if (!target) return;

    target.status = 'approved';
    target.reviewedAt = new Date().toISOString();
    target.reviewedBy = MASTER_GOOGLE_EMAIL;
    target.grantedRole = role;

    this.addApprovedEmail(target.email);
    localStorage.setItem(STORAGE_KEYS.ACCESS_REQUESTS, JSON.stringify(requests));

    // If current session is this user, upgrade session immediately
    const current = this.getCurrentUser();
    if (current && current.email.toLowerCase() === target.email.toLowerCase()) {
      this.setCurrentUser({
        ...current,
        role,
        status: 'active',
      });
    }
  }

  public rejectAccessRequest(requestId: string): void {
    const requests = this.getAccessRequests();
    const target = requests.find((r) => r.id === requestId);
    if (!target) return;

    target.status = 'rejected';
    target.reviewedAt = new Date().toISOString();
    target.reviewedBy = MASTER_GOOGLE_EMAIL;

    this.removeApprovedEmail(target.email);
    localStorage.setItem(STORAGE_KEYS.ACCESS_REQUESTS, JSON.stringify(requests));

    const current = this.getCurrentUser();
    if (current && current.email.toLowerCase() === target.email.toLowerCase()) {
      this.setCurrentUser({
        ...current,
        role: 'pending_verification',
        status: 'rejected',
      });
    }
  }

  public deleteAccessRequest(requestId: string): void {
    const requests = this.getAccessRequests().filter((r) => r.id !== requestId);
    localStorage.setItem(STORAGE_KEYS.ACCESS_REQUESTS, JSON.stringify(requests));
  }

  public subscribe(listener: (user: UserSession | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(user: UserSession | null): void {
    this.listeners.forEach((l) => l(user));
  }
}

export const authService = new AuthService();
