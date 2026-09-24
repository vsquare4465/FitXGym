import { AdminPermissionsMap, AdminTeamUser, DashboardData, GalleryImage, Lead, MemberProfile } from '../types';
import { AdminPermissions } from '../lib/adminPermissions';

const TOKEN_KEY = 'fitx_auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = false, ...init } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`/api${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.error || res.statusText);
  }
  return data as T;
}

export const publicApi = {
  plans: () => api<Array<{ id: string; name: string; duration: string; price: number; features: string[]; popular?: boolean; description?: string }>>('/public/plans'),
  settings: () => api<Record<string, string>>('/public/settings'),
  gallery: () => api<Array<{ url: string; caption?: string; featured?: boolean }>>('/public/gallery'),
  testimonials: () => api<Array<{ id: string; name: string; rating: number; text: string; date: string; approved: boolean }>>('/public/testimonials'),
  postTestimonial: (body: { name: string; rating: number; text: string }) =>
    api('/public/testimonials', { method: 'POST', body: JSON.stringify(body) }),
  postLead: (body: { name: string; phone: string; whatsapp?: string; email?: string; message?: string; interestedPlan?: string; subject?: string; source: string }) =>
    api('/public/leads', { method: 'POST', body: JSON.stringify(body) }),
  register: (body: unknown) => api('/public/register', { method: 'POST', body: JSON.stringify(body) }),
  validateCheckinToken: (token: string) => api<{ valid: boolean }>(`/public/checkin-token/${token}`),
  checkinStatus: (token: string, memberId: string) =>
    api<{ memberName: string; checkedIn: boolean; checkIn: string | null }>(
      `/public/checkin-status?token=${encodeURIComponent(token)}&memberId=${encodeURIComponent(memberId)}`,
    ),
  checkIn: (body: { token: string; memberId: string; phone?: string; action?: 'in' | 'out' }) =>
    api<{ action: string; memberName: string; record?: unknown; checkIn?: string }>('/public/checkin', { method: 'POST', body: JSON.stringify(body) }),
};

export const authApi = {
  loginAdmin: (email: string, password: string) =>
    api<{
      token: string;
      user: {
        role: 'admin';
        name: string;
        email: string;
        adminRole: 'OWNER' | 'RECEPTION' | 'TRAINER';
        jobTitle?: string | null;
        permissions: AdminPermissions;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, loginType: 'admin' }),
    }),
  loginMember: (email: string, password: string) =>
    api<{ token: string; user: { role: 'member'; memberId: string; name: string; email: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, loginType: 'member' }),
    }),
  me: () => api<{
    user:
      | { role: 'admin'; name: string; email: string; adminRole: 'OWNER' | 'RECEPTION' | 'TRAINER'; jobTitle?: string | null; permissions: AdminPermissions }
      | { role: 'member'; name: string; email: string; memberId: string };
  }>('/auth/me', { auth: true }),
  updateProfile: (data: { name?: string; email?: string }) =>
    api<{ user: { role: 'admin'; name: string; email: string; adminRole: 'OWNER' | 'RECEPTION' | 'TRAINER'; jobTitle?: string | null; permissions: AdminPermissions } }>(
      '/auth/me',
      { method: 'PUT', auth: true, body: JSON.stringify(data) },
    ),
  changePassword: (currentPassword: string, newPassword: string) =>
    api('/auth/password', { method: 'PUT', auth: true, body: JSON.stringify({ currentPassword, newPassword }) }),
  logout: () => api('/auth/logout', { method: 'POST', auth: true }),
};

export const teamApi = {
  list: () => api<AdminTeamUser[]>('/team', { auth: true }),
  create: (data: {
    name: string;
    email: string;
    password: string;
    role: 'RECEPTION' | 'TRAINER';
    jobTitle?: string;
    permissions?: Partial<AdminPermissionsMap>;
  }) => api<AdminTeamUser>('/team', { method: 'POST', auth: true, body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{
    name: string;
    email: string;
    password: string;
    role: 'RECEPTION' | 'TRAINER';
    jobTitle: string;
    permissions: Partial<AdminPermissionsMap>;
  }>) => api<AdminTeamUser>(`/team/${id}`, { method: 'PUT', auth: true, body: JSON.stringify(data) }),
  remove: (id: string) => api(`/team/${id}`, { method: 'DELETE', auth: true }),
};

function dashboardQuery(period: string, from?: string, to?: string) {
  const params = new URLSearchParams({ period });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return params.toString();
}

export const adminApi = {
  dashboard: (period = 'month', from?: string, to?: string) =>
    api<DashboardData>(`/dashboard?${dashboardQuery(period, from, to)}`, { auth: true }),
  members: () => api<unknown[]>('/members', { auth: true }),
  memberProfile: (id: string) => api<MemberProfile>(`/members/${id}/profile`, { auth: true }),
  createMember: (data: unknown) => api('/members', { method: 'POST', auth: true, body: JSON.stringify(data) }),
  updateMember: (id: string, data: unknown) => api(`/members/${id}`, { method: 'PUT', auth: true, body: JSON.stringify(data) }),
  deactivateMember: (id: string) => api(`/members/${id}/deactivate`, { method: 'POST', auth: true }),
  renewMember: (id: string, data: unknown) => api(`/members/${id}/renew`, { method: 'POST', auth: true, body: JSON.stringify(data) }),
  deleteMember: (id: string) => api(`/members/${id}`, { method: 'DELETE', auth: true }),
  plans: () => api<unknown[]>('/plans', { auth: true }),
  updatePlans: (plans: unknown[]) => api('/plans', { method: 'PUT', auth: true, body: JSON.stringify(plans) }),
  payments: () => api<unknown[]>('/payments', { auth: true }),
  addPayment: (p: unknown) => api('/payments', { method: 'POST', auth: true, body: JSON.stringify(p) }),
  updatePayment: (id: string, p: unknown) => api(`/payments/${id}`, { method: 'PUT', auth: true, body: JSON.stringify(p) }),
  expenses: () => api<unknown[]>('/expenses', { auth: true }),
  addExpense: (e: unknown) => api('/expenses', { method: 'POST', auth: true, body: JSON.stringify(e) }),
  updateExpense: (id: string, e: unknown) => api(`/expenses/${id}`, { method: 'PUT', auth: true, body: JSON.stringify(e) }),
  updateExpenses: (expenses: unknown[]) => api('/expenses', { method: 'PUT', auth: true, body: JSON.stringify(expenses) }),
  attendance: (params?: { date?: string; memberId?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return api<unknown[]>(`/attendance${q ? `?${q}` : ''}`, { auth: true });
  },
  checkIn: (memberId: string, timestamp: string) =>
    api('/attendance/checkin', { method: 'POST', auth: true, body: JSON.stringify({ memberId, timestamp }) }),
  checkOut: (memberId: string, timestamp: string, duration: number) =>
    api('/attendance/checkout', { method: 'POST', auth: true, body: JSON.stringify({ memberId, timestamp, duration }) }),
  updateAttendance: (id: string, data: unknown) => api(`/attendance/${id}`, { method: 'PUT', auth: true, body: JSON.stringify(data) }),
  leads: () => api<Lead[]>('/leads', { auth: true }),
  updateLead: (id: string, data: Partial<Lead>) => api<Lead>(`/leads/${id}`, { method: 'PATCH', auth: true, body: JSON.stringify(data) }),
  convertLead: (id: string, planId?: string) => api(`/leads/${id}/convert`, { method: 'POST', auth: true, body: JSON.stringify({ planId }) }),
  staff: () => api<unknown[]>('/staff', { auth: true }),
  updateStaff: (staff: unknown[]) => api('/staff', { method: 'PUT', auth: true, body: JSON.stringify(staff) }),
  inventory: () => api<unknown[]>('/inventory', { auth: true }),
  updateInventory: (items: unknown[]) => api('/inventory', { method: 'PUT', auth: true, body: JSON.stringify(items) }),
  auditLogs: () => api<string[]>('/audit-logs', { auth: true }),
  addAuditLog: (message: string) => api('/audit-logs', { method: 'POST', auth: true, body: JSON.stringify({ message }) }),
  qrToken: () => api<{ token: string }>('/qr-token', { auth: true }),
  rotateQrToken: () => api<{ token: string }>('/qr-token/rotate', { method: 'POST', auth: true }),
  settings: () => api<Record<string, string>>('/settings', { auth: true }),
  updateSettings: (s: Record<string, string>) => api('/settings', { method: 'PUT', auth: true, body: JSON.stringify(s) }),
  gallery: () => api<GalleryImage[]>('/gallery', { auth: true }),
  updateGallery: (items: GalleryImage[]) => api<GalleryImage[]>('/gallery', { method: 'PUT', auth: true, body: JSON.stringify(items) }),
  testimonials: () => api<unknown[]>('/testimonials', { auth: true }),
  approveTestimonial: (id: string) => api(`/testimonials/${id}/approve`, { method: 'PATCH', auth: true }),
  deleteTestimonial: (id: string) => api(`/testimonials/${id}`, { method: 'DELETE', auth: true }),
};

export const memberApi = {
  me: () => api<unknown>('/member/me', { auth: true }),
  updateMe: (data: unknown) => api('/member/me', { method: 'PUT', auth: true, body: JSON.stringify(data) }),
  payments: () => api<unknown[]>('/member/payments', { auth: true }),
  renew: (planId: string, paidAmount: number, paymentMethod: string) =>
    api('/member/renew', { method: 'POST', auth: true, body: JSON.stringify({ planId, paidAmount, paymentMethod }) }),
};
