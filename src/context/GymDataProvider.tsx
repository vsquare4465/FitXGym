import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { Member, Staff, Expense, InventoryItem, Payment, AttendanceRecord, Plan, Review, GalleryImage } from '../types';
import { adminApi } from '../api/client';
import { useAuth } from './AuthContext';
import { AdminPermissions, canAccess } from '../lib/adminPermissions';

interface GymDataContextValue {
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  plans: Plan[];
  members: Member[];
  staff: Staff[];
  expenses: Expense[];
  inventory: InventoryItem[];
  payments: Payment[];
  attendance: AttendanceRecord[];
  auditLogs: string[];
  lobbyToken: string;
  settings: Record<string, string>;
  ownerPhoto: string;
  logoUrl: string;
  gallery: GalleryImage[];
  testimonials: Review[];
  setPlans: (p: Plan[]) => Promise<void>;
  onUpdateMember: (m: Member) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
  onAddExpense: (e: Expense) => Promise<void>;
  onUpdateExpenses: (e: Expense[]) => Promise<void>;
  onAddPayment: (p: Payment) => Promise<void>;
  onUpdateInventory: (i: InventoryItem[]) => Promise<void>;
  onUpdateStaff: (s: Staff[]) => Promise<void>;
  onCheckInMember: (memberId: string, timestamp: string) => Promise<void>;
  onCheckOutMember: (memberId: string, timestamp: string, duration: number) => Promise<void>;
  onRefreshLobbyToken: () => Promise<void>;
  onAddAuditLog: (msg: string) => Promise<void>;
  onUpdateSettings: (s: Record<string, string>) => Promise<void>;
  onUpdateOwnerPhoto: (url: string) => Promise<void>;
  onUpdateLogoUrl: (url: string) => Promise<void>;
  onUpdateGallery: (items: GalleryImage[]) => Promise<void>;
  onApproveTestimonial: (id: string) => Promise<void>;
  onDeleteTestimonial: (id: string) => Promise<void>;
}

const GymDataContext = createContext<GymDataContextValue | null>(null);

async function fetchIf<T>(
  allowed: boolean,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (!allowed) return fallback;
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export function GymDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlansState] = useState<Plan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [lobbyToken, setLobbyToken] = useState('');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [ownerPhoto, setOwnerPhoto] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [testimonials, setTestimonials] = useState<Review[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const perms: AdminPermissions | null = user?.role === 'admin' ? user.permissions : null;
      const [p, m, st, ex, inv, pay, att, logs, qr, settings, gal, test] = await Promise.all([
        fetchIf(canAccess(perms, 'plans', 'read'), () => adminApi.plans(), []),
        fetchIf(canAccess(perms, 'members', 'read'), () => adminApi.members(), []),
        fetchIf(canAccess(perms, 'dashboard', 'read'), () => adminApi.staff(), []),
        fetchIf(canAccess(perms, 'expenses', 'read'), () => adminApi.expenses(), []),
        fetchIf(canAccess(perms, 'dashboard', 'read'), () => adminApi.inventory(), []),
        fetchIf(canAccess(perms, 'payments', 'read'), () => adminApi.payments(), []),
        fetchIf(canAccess(perms, 'attendance', 'read'), () => adminApi.attendance(), []),
        fetchIf(canAccess(perms, 'dashboard', 'read'), () => adminApi.auditLogs(), []),
        fetchIf(canAccess(perms, 'attendance', 'read'), () => adminApi.qrToken(), { token: '' }),
        fetchIf(canAccess(perms, 'dashboard', 'read'), () => adminApi.settings(), {}),
        fetchIf(canAccess(perms, 'website', 'read'), () => adminApi.gallery(), []),
        fetchIf(canAccess(perms, 'website', 'read'), () => adminApi.testimonials(), []),
      ]);
      setPlansState(p as Plan[]);
      setMembers(m as Member[]);
      setStaff(st as Staff[]);
      setExpenses(ex as Expense[]);
      setInventory(inv as InventoryItem[]);
      setPayments(pay as Payment[]);
      setAttendance(att as AttendanceRecord[]);
      setAuditLogs(logs);
      setLobbyToken(qr.token);
      setSettings(settings);
      setOwnerPhoto(settings.ownerPhoto || '');
      setLogoUrl(settings.logoUrl || '');
      setGallery(Array.isArray(gal) ? gal as GalleryImage[] : []);
      setTestimonials(test as Review[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setPlans = async (next: Plan[]) => {
    await adminApi.updatePlans(next);
    setPlansState(next);
  };

  const onUpdateMember = async (updated: Member) => {
    const m = await adminApi.updateMember(updated.id, updated);
    setMembers(prev => prev.map(x => (x.id === updated.id ? (m as Member) : x)));
  };

  const onDeleteMember = async (id: string) => {
    await adminApi.deleteMember(id);
    setMembers(prev => prev.filter(x => x.id !== id));
  };

  const onAddExpense = async (exp: Expense) => {
    const created = await adminApi.addExpense(exp);
    setExpenses(prev => [...prev, created as Expense]);
  };

  const onUpdateExpenses = async (updated: Expense[]) => {
    await adminApi.updateExpenses(updated);
    setExpenses(updated);
  };

  const onAddPayment = async (pay: Payment) => {
    const created = await adminApi.addPayment(pay);
    setPayments(prev => [...prev, created as Payment]);
  };

  const onUpdateInventory = async (items: InventoryItem[]) => {
    await adminApi.updateInventory(items);
    setInventory(items);
  };

  const onUpdateStaff = async (s: Staff[]) => {
    await adminApi.updateStaff(s);
    setStaff(s);
  };

  const onCheckInMember = async (memberId: string, timestamp: string) => {
    const rec = await adminApi.checkIn(memberId, timestamp);
    setAttendance(prev => [...prev, rec as AttendanceRecord]);
  };

  const onCheckOutMember = async (memberId: string, timestamp: string, duration: number) => {
    const rec = await adminApi.checkOut(memberId, timestamp, duration);
    setAttendance(prev =>
      prev.map(r => (r.id === (rec as AttendanceRecord).id ? (rec as AttendanceRecord) : r))
    );
  };

  const onRefreshLobbyToken = async () => {
    const { token } = await adminApi.rotateQrToken();
    setLobbyToken(token);
  };

  const onAddAuditLog = async (message: string) => {
    await adminApi.addAuditLog(message);
    const logs = await adminApi.auditLogs();
    setAuditLogs(logs);
  };

  const onUpdateSettings = async (next: Record<string, string>) => {
    const saved = await adminApi.updateSettings(next) as Record<string, string>;
    setSettings(saved);
    setOwnerPhoto(saved.ownerPhoto || '');
    setLogoUrl(saved.logoUrl || '');
  };

  const onUpdateOwnerPhoto = async (url: string) => {
    await onUpdateSettings({ ...settings, ownerPhoto: url });
  };

  const onUpdateLogoUrl = async (url: string) => {
    await onUpdateSettings({ ...settings, logoUrl: url });
  };

  const onUpdateGallery = async (items: GalleryImage[]) => {
    const saved = await adminApi.updateGallery(items);
    setGallery(saved);
  };

  const onApproveTestimonial = async (id: string) => {
    await adminApi.approveTestimonial(id);
    setTestimonials(prev => prev.map(t => (t.id === id ? { ...t, approved: true } : t)));
  };

  const onDeleteTestimonial = async (id: string) => {
    await adminApi.deleteTestimonial(id);
    setTestimonials(prev => prev.filter(t => t.id !== id));
  };

  return (
    <GymDataContext.Provider
      value={{
        loading,
        error,
        refresh,
        plans,
        members,
        staff,
        expenses,
        inventory,
        payments,
        attendance,
        auditLogs,
        lobbyToken,
        settings,
        ownerPhoto,
        logoUrl,
        gallery,
        testimonials,
        setPlans,
        onUpdateMember,
        onDeleteMember,
        onAddExpense,
        onUpdateExpenses,
        onAddPayment,
        onUpdateInventory,
        onUpdateStaff,
        onCheckInMember,
        onCheckOutMember,
        onRefreshLobbyToken,
        onAddAuditLog,
        onUpdateSettings,
        onUpdateOwnerPhoto,
        onUpdateLogoUrl,
        onUpdateGallery,
        onApproveTestimonial,
        onDeleteTestimonial,
      }}
    >
      {children}
    </GymDataContext.Provider>
  );
}

export function useGymData() {
  const ctx = useContext(GymDataContext);
  if (!ctx) throw new Error('useGymData must be used within GymDataProvider');
  return ctx;
}
