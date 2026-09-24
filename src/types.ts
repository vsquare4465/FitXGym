export interface Plan {
  id: string;
  name: string;
  duration: string;
  price: number;
  description?: string;
  features: string[];
  popular?: boolean;
  active?: boolean;
}

export type PaymentCategory =
  | 'New Membership'
  | 'Renewal'
  | 'Partial Payment'
  | 'Advance Payment'
  | 'Membership'
  | 'Registration'
  | 'Personal Training'
  | 'Product Sales'
  | 'Other Income';

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other' | 'NetBanking';

export interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  expectedAmount?: number;
  date: string;
  category: PaymentCategory | string;
  paymentMethod: PaymentMethod | string;
  status: 'Completed' | 'Pending' | 'Failed';
  invoiceNo: string;
  referenceNo?: string;
  membershipId?: string;
  notes?: string;
  recordedBy?: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  photo?: string;
  role: 'Member' | 'Staff';
  date: string;
  checkIn: string;
  checkOut?: string;
  duration?: number;
  status: 'On Time' | 'Late' | 'Absent' | 'Present';
}

export interface TrainerMessage {
  id: string;
  sender: 'Trainer' | 'Member';
  text: string;
  timestamp: string;
}

export type MemberDbStatus = 'Active' | 'Expired' | 'Frozen' | 'Pending';

export type MembershipType = 'Paid' | 'Complimentary' | 'Staff';

export type MemberDisplayStatus =
  | 'Active'
  | 'Expiring Soon'
  | 'Expired'
  | 'Payment Pending'
  | 'Inactive'
  | 'Pending';

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  dateOfBirth?: string;
  address?: string;
  password?: string;
  photo: string;
  joinDate: string;
  expiryDate: string;
  planId: string;
  membershipType?: MembershipType;
  status: MemberDbStatus;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory: string[];
  idProofUrl?: string;
  qrCodeValue: string;
  weightHistory: { date: string; weight: number }[];
  measurementsHistory: {
    date: string;
    chest: number;
    biceps: number;
    waist: number;
    thighs: number;
  }[];
  bmi: number;
  bodyFat: number;
  progressImages?: string[];
  workoutPlan: {
    day: string;
    workout: string;
    exercises: { name: string; sets: string; completed?: boolean }[];
  }[];
  dietPlan: {
    meal: string;
    time: string;
    items: string[];
    macros: { protein: number; carbs: number; fats: number; calories: number };
  }[];
  messages: TrainerMessage[];
}

export interface Membership {
  id: string;
  memberId: string;
  planId: string;
  planName?: string;
  startDate: string;
  endDate: string;
  status: string;
  amount: number;
  paidAmount: number;
  pending?: number;
}

export interface MemberProfile {
  member: Member;
  displayStatus: MemberDisplayStatus;
  currentMembership: Membership | null;
  currentPlan: Plan | null;
  memberships: Membership[];
  payments: Payment[];
  attendance: {
    totalVisits: number;
    lastVisit: AttendanceRecord | null;
    recent: AttendanceRecord[];
  };
  pendingAmount: number;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  message?: string;
  interestedPlan?: string;
  subject?: string;
  notes?: string;
  source: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GalleryImage {
  id?: string;
  url: string;
  caption?: string;
  featured?: boolean;
  active?: boolean;
  sortOrder?: number;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  paymentMethod: string;
  vendor?: string;
  paidBy?: string;
  receipt?: string;
  notes?: string;
  status: 'Paid' | 'Pending';
}

export interface DashboardData {
  range: { start: string; end: string; label: string };
  stats: {
    totalMembers: number;
    activeMembers: number;
    newMembers: number;
    renewalsDue: number;
    pendingPayments: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    monthlyProfit: number;
    yearlyRevenue: number;
    yearlyExpenses: number;
    yearlyProfit: number;
    revenue: number;
    expenses: number;
    profit: number;
    todayAttendance: number;
    currentlyInside: number;
    membershipRevenue: number;
    otherIncome: number;
  };
  trends: {
    revenue: { label: string; amount: number }[];
    expenses: { label: string; amount: number }[];
    profit: { label: string; amount: number }[];
  };
  todayAttendanceList: AttendanceRecord[];
  upcomingRenewals: Array<Member & { planName: string; daysLeft: number; displayStatus: MemberDisplayStatus }>;
  pendingPaymentsList: Payment[];
  recentActivity: { message: string; createdAt: string }[];
}

export type AdminPermissionsMap = Record<
  'dashboard' | 'members' | 'plans' | 'payments' | 'expenses' | 'attendance' | 'leads' | 'messages' | 'website' | 'team',
  'none' | 'read' | 'write'
>;

export interface AdminTeamUser {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'RECEPTION' | 'TRAINER';
  jobTitle?: string | null;
  permissions: AdminPermissionsMap;
  createdAt: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  salary: number;
  shift: string;
  joiningDate: string;
  attendanceRate: number;
  performance: number;
  leavesRemaining: number;
  documents: string[];
  salaryHistory: { date: string; amount: number; status: 'Paid' | 'Pending' }[];
  tasks: { id: string; text: string; completed: boolean; deadline: string }[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  costPrice: number;
  supplier: string;
  lowStockLimit: number;
  image?: string;
  salesCount: number;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
  approved: boolean;
}

export interface Blog {
  id: string;
  title: string;
  category: string;
  author: string;
  excerpt: string;
  content: string;
  readTime: string;
  date: string;
  image: string;
}

export interface Transformation {
  id: string;
  name: string;
  beforeWeight: number;
  afterWeight: number;
  duration: string;
  quote: string;
  beforeImg: string;
  afterImg: string;
  category: string;
}
