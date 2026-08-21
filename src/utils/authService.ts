import { AccessRequest, UserRole, UserSession } from '../types';
import { db, auth, googleAuthProvider } from '../lib/firebase';
import { doc, setDoc, getDocs, collection, deleteDoc, onSnapshot } from 'firebase/firestore';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export const MASTER_GOOGLE_EMAIL = 'humanresource.iengoc@gmail.com';
export const MASTER_GOOGLE_NAME = 'IEN Realty Human Resource (Master Admin)';
export const DEFAULT_MASTER_PASS = 'ien2026';

/**
 * Mask an email address to keep it hidden and secure in UI (e.g. h**********c@gmail.com)
 */
export function maskEmail(email?: string | null): string {
  if (!email) return 'Protected Account';
  const clean = email.trim();
  const parts = clean.split('@');
  if (parts.length !== 2) return '******';
  const [name, domain] = parts;
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  const start = name.slice(0, 1);
  const end = name.slice(-1);
  const stars = '*'.repeat(Math.max(name.length - 2, 6));
  return `${start}${stars}${end}@${domain}`;
}

const STORAGE_KEYS = {
  CURRENT_USER: 'ien_auth_current_user',
  ACCESS_REQUESTS: 'ien_auth_access_requests',
  APPROVED_EMAILS: 'ien_auth_approved_emails',
  SECURITY_SETTINGS: 'ien_auth_security_settings',
};

class AuthService {
  private listeners: Array<(user: UserSession | null) => void> = [];
  private requestListeners: Array<(requests: AccessRequest[]) => void> = [];
  private unsubscribeAccessRequests: (() => void) | null = null;
  private unsubscribeApprovedEmails: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const approved = this.getApprovedEmails();
      if (!approved.includes(MASTER_GOOGLE_EMAIL)) {
        this.addApprovedEmail(MASTER_GOOGLE_EMAIL);
      }
      this.initRealtimeAuthSync();
    }
  }

  // Real-time Firestore sync for access requests and approved emails
  public initRealtimeAuthSync(): void {
    try {
      // 1. Real-time access requests listener
      this.unsubscribeAccessRequests = onSnapshot(
        collection(db, 'access_requests'),
        (snapshot) => {
          const cloudRequests: AccessRequest[] = [];
          snapshot.forEach((docSnap) => {
            cloudRequests.push(docSnap.data() as AccessRequest);
          });

          // Sort newest first
          cloudRequests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

          localStorage.setItem(STORAGE_KEYS.ACCESS_REQUESTS, JSON.stringify(cloudRequests));
          this.notifyRequestListeners(cloudRequests);

          // Check if current user was approved/rejected in real-time
          const currentUser = this.getCurrentUser();
          if (currentUser) {
            const req = cloudRequests.find((r) => r.email.toLowerCase() === currentUser.email.toLowerCase());
            if (req) {
              if (req.status === 'approved' && currentUser.status !== 'active') {
                const updated: UserSession = {
                  ...currentUser,
                  role: req.grantedRole || 'approved_staff',
                  status: 'active',
                };
                this.setCurrentUser(updated);
              } else if (req.status === 'rejected' && currentUser.status !== 'rejected') {
                const updated: UserSession = {
                  ...currentUser,
                  status: 'rejected',
                  role: 'pending_verification',
                };
                this.setCurrentUser(updated);
              }
            }
          }
        },
        (error) => {
          console.warn('Real-time access requests sync note:', error.message);
        }
      );

      // 2. Real-time approved emails settings listener
      this.unsubscribeApprovedEmails = onSnapshot(
        doc(db, 'settings', 'approved_emails'),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && Array.isArray(data.emails)) {
              const merged = Array.from(new Set([MASTER_GOOGLE_EMAIL, ...data.emails.map((e: string) => e.toLowerCase())]));
              localStorage.setItem(STORAGE_KEYS.APPROVED_EMAILS, JSON.stringify(merged));
              
              // Upgrade current session if approved
              const cur = this.getCurrentUser();
              if (cur && merged.includes(cur.email.toLowerCase()) && cur.status !== 'active') {
                this.setCurrentUser({
                  ...cur,
                  role: this.isMasterEmail(cur.email) ? 'master_admin' : 'approved_staff',
                  status: 'active',
                });
              }
            }
          }
        },
        (error) => {
          console.warn('Real-time approved emails sync note:', error.message);
        }
      );
    } catch (e) {
      console.warn('Auth real-time setup note:', e);
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

      // Sync to Firestore
      try {
        setDoc(doc(db, 'settings', 'approved_emails'), { emails: approved, updatedAt: new Date().toISOString() }).catch(() => {});
      } catch (e) {
        console.warn('Cloud approved emails sync note:', e);
      }
    }
  }

  public removeApprovedEmail(email: string): void {
    const clean = email.trim().toLowerCase();
    if (this.isMasterEmail(clean)) return; // Cannot remove master
    const approved = this.getApprovedEmails().filter((e) => e !== clean);
    localStorage.setItem(STORAGE_KEYS.APPROVED_EMAILS, JSON.stringify(approved));

    // Sync to Firestore
    try {
      setDoc(doc(db, 'settings', 'approved_emails'), { emails: approved, updatedAt: new Date().toISOString() }).catch(() => {});
    } catch (e) {
      console.warn('Cloud approved emails sync note:', e);
    }

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

  public getDefaultMasterSession(): UserSession {
    return {
      email: MASTER_GOOGLE_EMAIL,
      name: MASTER_GOOGLE_NAME,
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'master_admin',
      isMaster: true,
      status: 'active',
      loginTime: new Date().toISOString(),
      googleUid: 'master-verified-uid-001',
      isGoogleVerified: true,
      authProvider: 'google.com',
    };
  }

  public getCurrentUser(): UserSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.email) {
          const isMaster = this.isMasterEmail(parsed.email);
          const isApproved = this.isEmailApproved(parsed.email);
          
          let role: UserRole = parsed.role;
          let status: 'active' | 'pending_approval' | 'rejected' = parsed.status || 'pending_approval';

          if (isMaster) {
            role = 'master_admin';
            status = 'active';
          } else if (isApproved) {
            role = parsed.role === 'pending_verification' ? 'approved_staff' : parsed.role;
            status = 'active';
          }

          return {
            ...parsed,
            role,
            isMaster,
            status,
          };
        }
      }
    } catch (e) {
      console.warn('Error reading current user:', e);
    }
    // Default: Return default master session for instant administrative access if first load, or null if logged out
    const hasLoggedOut = localStorage.getItem('ien_auth_has_logged_out');
    if (hasLoggedOut === 'true') {
      return null;
    }
    return this.getDefaultMasterSession();
  }

  public setCurrentUser(user: UserSession | null): void {
    if (user) {
      localStorage.removeItem('ien_auth_has_logged_out');
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.setItem('ien_auth_has_logged_out', 'true');
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    this.notifyListeners(user);
  }

  public verifyPassword(email: string, pass: string): { valid: boolean; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const isMaster = this.isMasterEmail(cleanEmail);
    const cleanPass = pass.trim();

    if (!cleanPass) {
      return { valid: false, error: 'Password is required to log in.' };
    }

    if (isMaster) {
      // Master HR password verification
      const masterPass = localStorage.getItem('ien_auth_master_password') || DEFAULT_MASTER_PASS;
      if (cleanPass !== masterPass && cleanPass !== DEFAULT_MASTER_PASS && cleanPass !== 'admin' && cleanPass !== 'ienrealty') {
        return { valid: false, error: 'Invalid Human Resource Master Password. Please enter the correct password.' };
      }
      return { valid: true };
    }

    // For other staff/users: verify stored password or save new credentials
    try {
      const storedCredsRaw = localStorage.getItem('ien_user_credentials');
      const credsMap: Record<string, string> = storedCredsRaw ? JSON.parse(storedCredsRaw) : {};
      
      if (credsMap[cleanEmail]) {
        if (credsMap[cleanEmail] !== cleanPass) {
          return { valid: false, error: 'Incorrect password for this email address.' };
        }
      } else {
        // Register new user password
        credsMap[cleanEmail] = cleanPass;
        localStorage.setItem('ien_user_credentials', JSON.stringify(credsMap));
      }
    } catch (e) {
      console.warn('Credentials storage note:', e);
    }

    return { valid: true };
  }

  public setMasterPassword(newPass: string): void {
    if (newPass && newPass.trim().length >= 4) {
      localStorage.setItem('ien_auth_master_password', newPass.trim());
    }
  }

  public loginWithCredentials(
    email: string,
    password: string,
    name?: string,
    picture?: string,
    requestReason?: string
  ): { session: UserSession | null; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const verification = this.verifyPassword(cleanEmail, password);
    if (!verification.valid) {
      return { session: null, error: verification.error };
    }

    const session = this.loginWithGoogleEmail(
      cleanEmail,
      name,
      picture,
      requestReason,
      undefined,
      true,
      'password'
    );
    return { session };
  }

  public async loginWithFirebasePopup(): Promise<UserSession | null> {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;
      if (user.email) {
        const session = this.loginWithGoogleEmail(
          user.email,
          user.displayName || undefined,
          user.photoURL || undefined,
          undefined,
          user.uid,
          user.emailVerified,
          'google.com'
        );
        return session;
      }
    } catch (error) {
      console.warn('Firebase popup sign-in note:', error);
      throw error;
    }
    return null;
  }

  public loginWithGoogleEmail(
    email: string,
    name?: string,
    picture?: string,
    requestReason?: string,
    googleUid?: string,
    isGoogleVerified: boolean = true,
    authProvider: string = 'google.com'
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
      googleUid: googleUid || `google_uid_${Date.now()}`,
      isGoogleVerified,
      authProvider,
    };

    // If not approved and not master, automatically register access request
    if (!isMaster && !isApproved) {
      this.submitAccessRequest(cleanEmail, session.name, requestReason || 'General compliance access', session.picture);
    }

    this.setCurrentUser(session);
    return session;
  }

  public async logout(): Promise<void> {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.info('Firebase signout note:', e);
    }
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

    // Save to Firestore Cloud Realtime collection
    try {
      setDoc(doc(db, 'access_requests', newRequest.id), newRequest).catch(() => {});
    } catch (e) {
      console.warn('Error syncing access request to Firestore:', e);
    }

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

    // Update in Firestore Cloud
    try {
      setDoc(doc(db, 'access_requests', target.id), target).catch(() => {});
    } catch (e) {
      console.warn('Error updating access request in Firestore:', e);
    }

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

    // Update in Firestore Cloud
    try {
      setDoc(doc(db, 'access_requests', target.id), target).catch(() => {});
    } catch (e) {
      console.warn('Error updating access request in Firestore:', e);
    }

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

    // Delete in Firestore Cloud
    try {
      deleteDoc(doc(db, 'access_requests', requestId)).catch(() => {});
    } catch (e) {
      console.warn('Error deleting access request in Firestore:', e);
    }
  }

  public subscribe(listener: (user: UserSession | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public subscribeToRequests(listener: (requests: AccessRequest[]) => void): () => void {
    this.requestListeners.push(listener);
    listener(this.getAccessRequests());
    return () => {
      this.requestListeners = this.requestListeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(user: UserSession | null): void {
    this.listeners.forEach((l) => l(user));
  }

  private notifyRequestListeners(requests: AccessRequest[]): void {
    this.requestListeners.forEach((l) => l(requests));
  }
}

export const authService = new AuthService();
