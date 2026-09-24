import React, { useState } from 'react';
import { Member, Staff, Expense, InventoryItem, Payment, AttendanceRecord, Plan, Review } from '../types';
import { MEMBERSHIP_PLANS } from '../data/mockData';
import { 
  Users, DollarSign, ArrowDownRight, ArrowUpRight, Shield, ShoppingBag, 
  Settings, UserPlus, Eye, Coffee, Sliders, AlertTriangle, Check, Trash2, 
  Pause, Play, Calendar, ClipboardCheck, Plus, Package, Radio, Bell, 
  Send, UserCheck, Key, ListFilter, Activity, BarChart3, HelpCircle,
  QrCode, RefreshCw, User, Image as ImageIcon, Flame, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDashboardProps {
  plans: Plan[];
  onUpdatePlans: (plans: Plan[]) => void;
  lobbyToken: string;
  onRefreshLobbyToken: () => void;
  members: Member[];
  staff: Staff[];
  expenses: Expense[];
  inventory: InventoryItem[];
  payments: Payment[];
  attendance: AttendanceRecord[];
  auditLogs: string[];
  onAddAuditLog: (log: string) => void;
  onUpdateMember: (updated: Member) => void;
  onDeleteMember: (id: string) => void;
  onAddExpense: (exp: Expense) => void;
  onUpdateExpenses?: (updated: Expense[]) => void;
  onAddPayment: (pay: Payment) => void;
  onUpdateInventory: (updated: InventoryItem[]) => void;
  onUpdateStaff: (updated: Staff[]) => void;
  onCheckInMember?: (memberId: string, timestamp: string) => void;
  onCheckOutMember?: (memberId: string, timestamp: string, duration: number) => void;
  ownerPhoto: string;
  onUpdateOwnerPhoto: (photo: string) => void;
  gallery: string[];
  onUpdateGallery: (gallery: string[]) => void;
  logoUrl: string;
  onUpdateLogoUrl: (logo: string) => void;
  testimonials?: Review[];
  onApproveTestimonial?: (id: string) => void;
  onDeleteTestimonial?: (id: string) => void;
}

export default function AdminDashboard({
  plans,
  onUpdatePlans,
  lobbyToken,
  onRefreshLobbyToken,
  members,
  staff,
  expenses,
  inventory,
  payments,
  attendance,
  auditLogs,
  onAddAuditLog,
  onUpdateMember,
  onDeleteMember,
  onAddExpense,
  onUpdateExpenses,
  onAddPayment,
  onUpdateInventory,
  onUpdateStaff,
  onCheckInMember,
  onCheckOutMember,
  ownerPhoto,
  onUpdateOwnerPhoto,
  gallery,
  onUpdateGallery,
  logoUrl,
  onUpdateLogoUrl,
  testimonials = [],
  onApproveTestimonial,
  onDeleteTestimonial
}: AdminDashboardProps) {
  
  // Security & Role State
  const [adminRole, setAdminRole] = useState<'Owner' | 'Manager' | 'Reception' | 'Trainer'>('Owner');
  
  // Navigation Tabs
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'members' | 'staff' | 'finance' | 'expenses' | 'inventory' | 'marketing' | 'plans' | 'testimonials'>('overview');

  // Plans Editor state
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planDuration, setPlanDuration] = useState('3 Months');
  const [planPrice, setPlanPrice] = useState('');
  const [planFeatures, setPlanFeatures] = useState('');

  // Search & Filter state
  const [memberSearch, setMemberSearch] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState<'all' | 'Active' | 'Expired' | 'Frozen' | 'Pending'>('all');
  
  // Expense Form State
  const [expCategory, setExpCategory] = useState<Expense['category']>('Rent');
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expMethod, setExpMethod] = useState<'Bank Transfer' | 'Card' | 'Cash'>('Bank Transfer');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Inventory POS Sale state
  const [selectedInventoryId, setSelectedInventoryId] = useState(inventory[0]?.id || '');
  const [posMemberId, setPosMemberId] = useState(members[0]?.id || '');
  const [posQuantity, setPosQuantity] = useState(1);
  const [posPaymentMethod, setPosPaymentMethod] = useState<'UPI' | 'Card' | 'Cash'>('UPI');
  const [posSuccessMsg, setPosSuccessMsg] = useState('');

  // Restock trigger state
  const [restockItemId, setRestockItemId] = useState(inventory[0]?.id || '');
  const [restockQty, setRestockQty] = useState(10);

  // Broadcast Alert Notification state
  const [broadcastType, setBroadcastType] = useState('Membership Expiration Reminder');
  const [broadcastChannel, setBroadcastChannel] = useState<'SMS' | 'WhatsApp' | 'Email'>('WhatsApp');
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'expired' | 'active'>('all');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [customBroadcastText, setCustomBroadcastText] = useState('Notice from Fit X Gym: We are closed today due to heavy rains. Stay safe and see you tomorrow!');
  const [selectedMarketingMembers, setSelectedMarketingMembers] = useState<string[]>([]);

  // Admin Profile & Gallery upload handlers
  const handleOwnerPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onUpdateOwnerPhoto(reader.result);
          onAddAuditLog(`PROFILE: ${adminRole} updated gym owner profile photograph.`);
          alert("Profile photo updated successfully!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onUpdateLogoUrl(reader.result);
          onAddAuditLog(`BRAND: ${adminRole} updated gym brand logo visual.`);
          alert("Gym Brand Logo updated successfully!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryPhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onUpdateGallery([...gallery, reader.result]);
          onAddAuditLog(`GALLERY: ${adminRole} added a new visual image to the gym gallery.`);
          alert("Gallery image added successfully!");
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleGalleryPhotoDelete = (indexToDelete: number) => {
    const updated = gallery.filter((_, idx) => idx !== indexToDelete);
    onUpdateGallery(updated);
    onAddAuditLog(`GALLERY: ${adminRole} removed an image from the gym gallery.`);
    alert("Gallery image removed.");
  };

  // Member operational state modals
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingMemberDetails, setEditingMemberDetails] = useState<Member | null>(null);
  const [extendDays, setExtendDays] = useState(30);

  // State fields for Editing Member Details Modal
  const [editMemName, setEditMemName] = useState('');
  const [editMemPhone, setEditMemPhone] = useState('');
  const [editMemEmail, setEditMemEmail] = useState('');
  const [editMemStatus, setEditMemStatus] = useState<'Active' | 'Expired' | 'Frozen' | 'Pending'>('Active');
  const [editMemPlanId, setEditMemPlanId] = useState('');
  const [editMemExpiry, setEditMemExpiry] = useState('');

  // Filter members based on search
  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
                          m.id.toLowerCase().includes(memberSearch.toLowerCase()) || 
                          m.phone.includes(memberSearch);
    const matchesStatus = memberStatusFilter === 'all' ? true : m.status === memberStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate Financial stats
  const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const activeMembersCount = members.filter(m => m.status === 'Active').length;

  const membersRenewCount = members.filter(m => {
    if (m.status !== 'Active') return false;
    const expiry = new Date(m.expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 15;
  }).length;

  // Active checked-in members count
  const todayStr = new Date().toISOString().split('T')[0];
  const checkedInCount = attendance.filter(r => r.date === todayStr && r.checkOut === undefined).length;

  // Total items in low stock alert list
  const lowStockCount = inventory.filter(i => i.stock <= i.lowStockLimit).length;

  // Handlers for Editing Member Details
  const handleOpenEditMemberDetails = (member: Member) => {
    setEditingMemberDetails(member);
    setEditMemName(member.name);
    setEditMemPhone(member.phone);
    setEditMemEmail(member.email || '');
    setEditMemStatus(member.status);
    setEditMemPlanId(member.planId);
    setEditMemExpiry(member.expiryDate);
  };

  const handleSaveMemberDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemberDetails) return;

    const updated: Member = {
      ...editingMemberDetails,
      name: editMemName,
      phone: editMemPhone,
      email: editMemEmail,
      status: editMemStatus,
      planId: editMemPlanId,
      expiryDate: editMemExpiry
    };

    onUpdateMember(updated);
    onAddAuditLog(`MEMBERSHIP: ${adminRole} updated profile details for ${editMemName} (${editingMemberDetails.id})`);
    setEditingMemberDetails(null);
  };

  // Handlers for Member Extensions, Freezing & Upgrading
  const handleFreezeToggle = (member: Member) => {
    const isFrozen = member.status === 'Frozen';
    const updatedStatus = isFrozen ? 'Active' : 'Frozen';
    
    const updatedMember: Member = {
      ...member,
      status: updatedStatus
    };

    onUpdateMember(updatedMember);
    onAddAuditLog(`MEMBERSHIP: ${adminRole} ${isFrozen ? 'UNFROZE' : 'FROZE'} access for ${member.name} (${member.id})`);
  };

  const handleExtendExpiry = (member: Member, days: number) => {
    const currentExpiry = new Date(member.expiryDate);
    currentExpiry.setDate(currentExpiry.getDate() + days);
    const formattedExpiry = currentExpiry.toISOString().split('T')[0];

    const updatedMember: Member = {
      ...member,
      expiryDate: formattedExpiry,
      status: 'Active' // Extensions automatically reactive-enable expired accounts
    };

    onUpdateMember(updatedMember);
    onAddAuditLog(`MEMBERSHIP: ${adminRole} EXTENDED expiry for ${member.name} by ${days} days (New Expiry: ${formattedExpiry})`);
  };

  const handleSuspendMember = (member: Member) => {
    const updatedMember: Member = {
      ...member,
      status: 'Expired'
    };
    onUpdateMember(updatedMember);
    onAddAuditLog(`MEMBERSHIP: ${adminRole} SUSPENDED ${member.name} (${member.id}) - set status to Expired`);
  };

  // Handler for adding Expense logs
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(expAmount);
    if (isNaN(amountVal) || amountVal <= 0) return;

    const newExp: Expense = {
      id: `EXP-${Math.floor(200 + Math.random() * 800)}`,
      category: expCategory,
      amount: amountVal,
      date: new Date().toISOString().split('T')[0],
      description: expDesc || `Procurement charges for ${expCategory}`,
      paymentMethod: expMethod,
      status: 'Paid'
    };

    onAddExpense(newExp);
    onAddAuditLog(`FINANCE: ${adminRole} logged a new EXPENSE under ${expCategory} of ₹${amountVal}`);
    setExpAmount('');
    setExpDesc('');
  };

  // Handler for Inventory item Point of Sale (POS) checkout
  const handlePOSCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const item = inventory.find(i => i.id === selectedInventoryId);
    const member = members.find(m => m.id === posMemberId);

    if (!item || !member) return;
    if (item.stock < posQuantity) {
      alert(`ERROR: Insufficient stock. Only ${item.stock} left.`);
      return;
    }

    // Deduct stock
    const updatedInventory = inventory.map(i => {
      if (i.id === item.id) {
        return {
          ...i,
          stock: i.stock - posQuantity,
          salesCount: i.salesCount + posQuantity
        };
      }
      return i;
    });

    onUpdateInventory(updatedInventory);

    // Create payment entry
    const finalPrice = item.price * posQuantity;
    const paymentCat = item.category === 'Supplements' ? 'Supplements' as const : 'Merchandise' as const;
    const newPay: Payment = {
      id: `PAY-${Math.floor(300 + Math.random() * 700)}`,
      memberId: member.id,
      memberName: member.name,
      amount: finalPrice,
      date: new Date().toISOString().split('T')[0],
      category: paymentCat,
      paymentMethod: posPaymentMethod,
      status: 'Completed',
      invoiceNo: `FTX-POS-${Math.floor(1000 + Math.random() * 9000)}`
    };

    onAddPayment(newPay);
    onAddAuditLog(`INVENTORY POS: Sold ${posQuantity}x ${item.name} to member ${member.name} (${member.id}) total ₹${finalPrice}`);
    
    setPosSuccessMsg(`Success! Sold ${posQuantity}x ${item.name} to ${member.name}. Total: ₹${finalPrice}`);
    setTimeout(() => setPosSuccessMsg(''), 4000);
  };

  // Handler for restock supplies
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = inventory.find(i => i.id === restockItemId);
    if (!item) return;

    const updatedInventory = inventory.map(i => {
      if (i.id === item.id) {
        return { ...i, stock: i.stock + restockQty };
      }
      return i;
    });

    onUpdateInventory(updatedInventory);

    // Create custom expense log for procurement
    const totalCost = item.costPrice * restockQty;
    const newExp: Expense = {
      id: `EXP-${Math.floor(500 + Math.random() * 500)}`,
      category: 'Protein/Supplements',
      amount: totalCost,
      date: new Date().toISOString().split('T')[0],
      description: `Restocked ${restockQty} units of ${item.name}`,
      paymentMethod: 'Bank Transfer',
      status: 'Paid'
    };

    onAddExpense(newExp);
    onAddAuditLog(`INVENTORY: Restocked ${restockQty}x ${item.name}. Procurement Expense logged: ₹${totalCost}`);
    
    alert(`Successfully restocked ${restockQty} units of ${item.name}. Total cost logged: ₹${totalCost}`);
  };

  // Handler for staff task checklist toggling
  const handleToggleStaffTask = (staffId: string, taskId: string) => {
    const updatedStaffList = staff.map(stf => {
      if (stf.id === staffId) {
        const updatedTasks = stf.tasks.map(tsk => {
          if (tsk.id === taskId) {
            return { ...tsk, completed: !tsk.completed };
          }
          return tsk;
        });
        return { ...stf, tasks: updatedTasks };
      }
      return stf;
    });

    onUpdateStaff(updatedStaffList);
    onAddAuditLog(`STAFF: Toggle task completion for staff member ID ${staffId}`);
  };

  // Broadcast campaign alert trigger simulation
  const handleBroadcastCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcastSent(true);
    
    let targetCount = members.length;
    if (broadcastTarget === 'expired') targetCount = members.filter(m => m.status === 'Expired').length;
    else if (broadcastTarget === 'active') targetCount = members.filter(m => m.status === 'Active').length;

    onAddAuditLog(`CAMPAIGN: Siddharth triggered a ${broadcastChannel} broadcast regarding "${broadcastType}" to ${targetCount} selected targets.`);

    setTimeout(() => {
      setBroadcastSent(false);
      alert(`Broadcast Dispatched Successfully!\nChannel: ${broadcastChannel}\nTrigger: ${broadcastType}\nDispatched to: ${targetCount} member devices.`);
    }, 1500);
  };

  // Custom SVG render helper for Revenue vs Expense
  const renderFinancialChart = () => {
    const width = 500;
    const height = 180;
    const padding = 30;

    // Standard pre-defined monthly parameters
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const revs = [120000, 145000, 160000, 155000, 175000, 190000, totalRevenue];
    const exps = [90000, 105000, 110000, 95000, 115000, 130000, totalExpenses];

    const maxVal = Math.max(...revs, ...exps) + 20000;
    const stepX = (width - 2 * padding) / (months.length - 1);

    // Line paths coords
    const revPoints = revs.map((r, i) => ({
      x: padding + i * stepX,
      y: height - padding - (r / maxVal) * (height - 2 * padding)
    }));

    const expPoints = exps.map((e, i) => ({
      x: padding + i * stepX,
      y: height - padding - (e / maxVal) * (height - 2 * padding)
    }));

    let revPath = `M ${revPoints[0].x} ${revPoints[0].y}`;
    let expPath = `M ${expPoints[0].x} ${expPoints[0].y}`;

    for (let i = 1; i < months.length; i++) {
      revPath += ` L ${revPoints[i].x} ${revPoints[i].y}`;
      expPath += ` L ${expPoints[i].x} ${expPoints[i].y}`;
    }

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Grids */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#27272a" strokeDasharray="2,2" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#27272a" strokeDasharray="2,2" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#27272a" strokeDasharray="2,2" />

        {/* Paths */}
        <path d={revPath} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
        <path d={expPath} fill="none" stroke="#a1a1aa" strokeWidth="2" strokeDasharray="4,4" strokeLinecap="round" />

        {/* Data points */}
        {revPoints.map((pt, i) => (
          <circle key={`rev-${i}`} cx={pt.x} cy={pt.y} r="3.5" fill="#f97316" />
        ))}
        {expPoints.map((pt, i) => (
          <circle key={`exp-${i}`} cx={pt.x} cy={pt.y} r="3" fill="#a1a1aa" />
        ))}

        {/* Month labels */}
        {months.map((m, i) => (
          <text key={i} x={padding + i * stepX} y={height - 8} fill="#71717a" fontSize="8" textAnchor="middle">
            {m}
          </text>
        ))}

        {/* Legend */}
        <text x="35" y="15" fill="#f97316" fontSize="8" fontWeight="bold">● Income (₹)</text>
        <text x="125" y="15" fill="#a1a1aa" fontSize="8">--- Expenses (₹)</text>
      </svg>
    );
  };

  return (
    <div className="bg-zinc-950 text-white p-4 md:p-8 min-h-screen">
      
      {/* SECURITY CONTROLLER ROLE SELECTOR */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-600/10 text-orange-400 border border-orange-600/20 rounded">
            <Key size={18} />
          </div>
          <div>
            <h4 className="text-sm font-extrabold uppercase text-white">Admin Control Console</h4>
            <p className="text-[10px] text-zinc-500 font-light">Fit X Gym runs granular role-based permissions.</p>
          </div>
        </div>

        {/* Role Toggle Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase">LOGGED IN ROLE:</span>
          <select 
            value={adminRole}
            onChange={(e) => {
              const newRole = e.target.value as any;
              setAdminRole(newRole);
              onAddAuditLog(`SECURITY: Switched console operational role to: ${newRole}`);
            }}
            className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 text-xs text-orange-400 font-bold uppercase focus:outline-none rounded"
          >
            <option value="Owner">Owner (Super Admin)</option>
            <option value="Manager">General Manager</option>
            <option value="Reception">Neha (Receptionist)</option>
            <option value="Trainer">Siddharth (Trainer)</option>
          </select>
        </div>
      </div>

      {/* DASHBOARD TAB NAVIGATION BAR */}
      <div className="flex bg-zinc-900 p-1.5 rounded-lg border border-zinc-850 overflow-x-auto gap-1 text-xs font-bold uppercase mb-8">
        <button 
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2.5 rounded-md transition-all flex items-center gap-2 ${activeSubTab === 'overview' ? 'bg-orange-600 text-black shadow' : 'text-zinc-400 hover:text-white'}`}
        >
          <BarChart3 size={14} />
          <span>Bento Overview</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('members')}
          className={`px-4 py-2.5 rounded-md transition-all flex items-center gap-2 ${activeSubTab === 'members' ? 'bg-orange-600 text-black shadow' : 'text-zinc-400 hover:text-white'}`}
        >
          <Users size={14} />
          <span>Members Portal</span>
        </button>
        {(adminRole === 'Owner' || adminRole === 'Manager') && (
          <button 
            onClick={() => setActiveSubTab('staff')}
            className={`px-4 py-2.5 rounded-md transition-all flex items-center gap-2 ${activeSubTab === 'staff' ? 'bg-orange-600 text-black shadow' : 'text-zinc-400 hover:text-white'}`}
          >
            <UserCheck size={14} />
            <span>Staff Schedules</span>
          </button>
        )}
        <button 
          onClick={() => setActiveSubTab('finance')}
          className={`px-4 py-2.5 rounded-md transition-all flex items-center gap-2 ${activeSubTab === 'finance' ? 'bg-orange-600 text-black shadow' : 'text-zinc-400 hover:text-white'}`}
        >
          <DollarSign size={14} />
          <span>Cash Ledger</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('expenses')}
          className={`px-4 py-2.5 rounded-md transition-all flex items-center gap-2 ${activeSubTab === 'expenses' ? 'bg-orange-600 text-black shadow' : 'text-zinc-400 hover:text-white'}`}
        >
          <ClipboardCheck size={14} />
          <span>Expense Tracker</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('inventory')}
          className={`px-4 py-2.5 rounded-md transition-all flex items-center gap-2 ${activeSubTab === 'inventory' ? 'bg-orange-600 text-black shadow' : 'text-zinc-400 hover:text-white'}`}
        >
          <Package size={14} />
          <span>Supplement POS</span>
        </button>
        {(adminRole === 'Owner' || adminRole === 'Manager') && (
          <button 
            onClick={() => setActiveSubTab('marketing')}
            className={`px-4 py-2.5 rounded-md transition-all flex items-center gap-2 ${activeSubTab === 'marketing' ? 'bg-orange-600 text-black shadow' : 'text-zinc-400 hover:text-white'}`}
          >
            <Bell size={14} />
            <span>Text Blaster</span>
          </button>
        )}
        {(adminRole === 'Owner' || adminRole === 'Manager') && (
          <button 
            onClick={() => setActiveSubTab('plans')}
            className={`px-4 py-2.5 rounded-md transition-all flex items-center gap-2 ${activeSubTab === 'plans' ? 'bg-orange-600 text-black shadow' : 'text-zinc-400 hover:text-white'}`}
          >
            <Sliders size={14} />
            <span>Plans Config</span>
          </button>
        )}
        <button 
          onClick={() => setActiveSubTab('testimonials')}
          className={`px-4 py-2.5 rounded-md transition-all flex items-center gap-2 ${activeSubTab === 'testimonials' ? 'bg-orange-600 text-black shadow' : 'text-zinc-400 hover:text-white'}`}
        >
          <Star size={14} />
          <span>Reviews Approval</span>
        </button>
      </div>

      {/* SUB-TAB CONTENTS */}

      {/* OVERVIEW SUB-TAB */}
      {activeSubTab === 'overview' && (
        <div className="space-y-8">
          
          {/* BENTO STAT CARDS GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 bg-zinc-900 border border-zinc-850/80 rounded-2xl relative overflow-hidden">
              <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold block">Active Gym Members</span>
              <span className="text-3xl md:text-4xl font-black text-orange-500 block mt-2">{activeMembersCount} Active</span>
              <p className="text-[10px] text-zinc-450 mt-2 font-medium">
                Out of <span className="text-zinc-300 font-bold">{members.length}</span> registered accounts
              </p>
            </div>

            <div className="p-6 bg-zinc-900 border border-zinc-850/80 rounded-2xl relative overflow-hidden">
              <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold block">About to Renew (15 Days)</span>
              <span className="text-3xl md:text-4xl font-black text-amber-500 block mt-2">{membersRenewCount} Due</span>
              <p className="text-[10px] text-zinc-450 mt-2">
                Renewal notification targets
              </p>
            </div>

            <div className="p-6 bg-zinc-900 border border-zinc-850/80 rounded-2xl relative overflow-hidden">
              <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold block">Gross Inflow (Revenue)</span>
              <span className="text-3xl md:text-4xl font-black text-emerald-400 block mt-2">₹{totalRevenue.toLocaleString('en-IN')}</span>
              <p className="text-[10px] text-emerald-550 mt-2 flex items-center gap-1 font-bold">
                <ArrowUpRight size={12} />
                <span>Membership & POS purchases</span>
              </p>
            </div>

            <div className="p-6 bg-zinc-900 border border-zinc-850/80 rounded-2xl relative overflow-hidden">
              <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold block">Gross Outflow (Expenses)</span>
              <span className="text-3xl md:text-4xl font-black text-rose-500 block mt-2">₹{totalExpenses.toLocaleString('en-IN')}</span>
              <p className="text-[10px] text-zinc-450 mt-2 flex items-center justify-between font-medium">
                <span>Net Profit: <span className="text-emerald-400 font-bold">₹{netProfit.toLocaleString('en-IN')}</span></span>
              </p>
            </div>

          </div>

          {/* LOBBY SECURE QR ACTIVE STATUS BANNER */}
          <div className="p-4 bg-zinc-900 border border-zinc-850/80 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-600/10 text-orange-500 border border-orange-600/20 rounded-xl">
                <QrCode size={18} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wide text-white">Live Gym Lobby Check-In Kiosk Poster</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Secure rotating token: <span className="font-mono text-zinc-300 font-bold">{lobbyToken}</span> (Rotated to secure check-ins)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={onRefreshLobbyToken}
                className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[10px] font-black uppercase text-orange-400 hover:text-orange-300 rounded-lg flex items-center gap-1 transition-all"
                title="Rotate the dynamic secure QR signature"
              >
                <RefreshCw size={12} className="text-orange-500" />
                <span>Rotate Lobby Token</span>
              </button>
              <span className="px-2 py-1 bg-emerald-600/10 border border-emerald-600/20 text-[9px] font-black text-emerald-400 uppercase rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Lobby Active</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* IN-DEPTH FINANCIAL CHART */}
            <div className="lg:col-span-7 bg-zinc-900 border border-zinc-850/80 p-6 rounded-2xl space-y-4">
              <div>
                <h3 className="font-extrabold uppercase text-white tracking-wide text-sm">Monthly Revenue Cycle vs Expenditures</h3>
                <p className="text-xs text-zinc-500 font-light">Visual trend chart generated on actual ledger entries.</p>
              </div>

              <div className="aspect-[12/5] w-full flex items-center justify-center">
                {renderFinancialChart()}
              </div>
            </div>

            {/* AUDIT LOG EVENTS TIMELINE */}
            <div className="lg:col-span-5 bg-zinc-900 border border-zinc-850/80 p-6 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <h3 className="font-extrabold uppercase text-white tracking-wide text-sm flex items-center gap-1.5">
                  <Radio size={14} className="text-orange-500 animate-pulse" />
                  <span>Real-time Operations Ticker</span>
                </h3>
                <p className="text-xs text-zinc-500 font-light">Granular logging of POS sales, registrations and staff changes.</p>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-[10px] font-mono text-zinc-400 space-y-2 h-[180px] overflow-y-auto scrollbar-thin flex-grow">
                {auditLogs.slice(-10).reverse().map((log, index) => (
                  <div key={index} className="p-2 bg-zinc-900/60 rounded border border-zinc-850 flex gap-2">
                    <span className="text-orange-500 font-bold flex-shrink-0">➔</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* OWNER & GALLERY VISUAL MANAGER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
            
            {/* BRANDING & OWNER PROFILE VISUALS */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* GYM BRAND LOGO EDIT */}
              <div className="bg-zinc-900 border border-zinc-850 p-6 rounded-2xl space-y-4">
                <div>
                  <h3 className="font-extrabold uppercase text-white tracking-wide text-sm flex items-center gap-2">
                    <ImageIcon size={16} className="text-orange-500" />
                    <span>Gym Brand Logo</span>
                  </h3>
                  <p className="text-xs text-zinc-500 font-light">Update the primary brand logo displayed at the top-left of the platform.</p>
                </div>

                <div className="flex flex-col items-center gap-4 py-4 bg-zinc-950 rounded-xl border border-zinc-900">
                  <div className="w-20 h-20 rounded-full overflow-hidden border border-orange-500 bg-zinc-900 flex items-center justify-center relative group shadow-lg shadow-orange-500/10">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Gym Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Flame size={24} className="text-orange-500" />
                    )}
                  </div>
                  
                  <div className="flex flex-col items-center gap-1 w-full px-4 text-center">
                    <span className="text-white text-xs font-black uppercase tracking-wide">Fit X Power Gym Logo</span>
                    <span className="text-[9px] text-zinc-500 font-mono">Current format: {logoUrl ? 'Custom Image' : 'Prebuilt Vector Icon'}</span>
                  </div>

                  <div className="flex gap-2">
                    <label className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[10px] font-black uppercase text-orange-400 rounded cursor-pointer transition-all">
                      Upload Logo
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoChange} 
                        className="hidden" 
                      />
                    </label>
                    {logoUrl && (
                      <button
                        onClick={() => {
                          onUpdateLogoUrl('');
                          onAddAuditLog(`BRAND: ${adminRole} reset the gym logo back to default.`);
                          alert("Gym logo reset to default!");
                        }}
                        className="px-3 py-1.5 bg-zinc-950 hover:bg-red-950 border border-zinc-855 hover:border-red-900 text-[10px] font-black uppercase text-zinc-400 hover:text-red-400 rounded transition-all"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* OWNER PROFILE IMAGE EDIT */}
              <div className="bg-zinc-900 border border-zinc-850 p-6 rounded-2xl space-y-4">
                <div>
                  <h3 className="font-extrabold uppercase text-white tracking-wide text-sm flex items-center gap-2">
                    <User size={16} className="text-orange-500" />
                    <span>Owner Profile Visual</span>
                  </h3>
                  <p className="text-xs text-zinc-500 font-light">Update Deepak's public profile picture displayed across guest portals.</p>
                </div>

                <div className="flex flex-col items-center gap-4 py-4 bg-zinc-950 rounded-xl border border-zinc-900">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-orange-500 bg-zinc-900 flex items-center justify-center relative group">
                    <img src={ownerPhoto} alt="Deepak Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  
                  <div className="flex flex-col items-center gap-1.5 w-full px-4">
                    <span className="text-white text-xs font-black uppercase tracking-wide">Deepak (Mr. UP Champion)</span>
                    <span className="text-[10px] text-zinc-500">Bodybuilder & Gym Owner</span>
                  </div>

                  <div className="flex gap-2">
                    <label className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[10px] font-black uppercase text-orange-400 rounded cursor-pointer transition-all">
                      Upload Photo
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleOwnerPhotoChange} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* GALLERY VISUALS INDEX & NEW IMAGE TRIGGER */}
            <div className="lg:col-span-7 bg-zinc-900 border border-zinc-850 p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold uppercase text-white tracking-wide text-sm flex items-center gap-2">
                    <ImageIcon size={16} className="text-orange-500" />
                    <span>Gym Atmosphere Gallery</span>
                  </h3>
                  <p className="text-xs text-zinc-500 font-light">Publish live aesthetic interior photos of Fit X Power Gym Noida.</p>
                </div>

                <label className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-black text-[10px] font-black uppercase tracking-wider rounded cursor-pointer transition-all">
                  Add Image
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleGalleryPhotoAdd} 
                    className="hidden" 
                  />
                </label>
              </div>

              {gallery.length === 0 ? (
                <div className="h-44 flex items-center justify-center bg-zinc-950 rounded-xl border border-zinc-900">
                  <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">No atmosphere visuals active</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-900 max-h-[188px] overflow-y-auto">
                  {gallery.map((photo, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-zinc-850 bg-zinc-900 relative group">
                      <img src={photo} alt="Gym atmosphere" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        type="button"
                        onClick={() => handleGalleryPhotoDelete(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-red-600 text-white rounded transition-all text-[8px] uppercase font-black"
                        title="Delete visual"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* MEMBERS PORTAL SUB-TAB */}
      {activeSubTab === 'members' && (
        <div className="space-y-6">
          
          {/* SEARCH BAR & FILTER MODULES */}
          <div className="p-5 bg-zinc-900 border border-zinc-850 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="w-full sm:w-1/2">
              <input 
                type="text" 
                placeholder="Search member profiles by ID, Name or phone..." 
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <select 
                value={memberStatusFilter}
                onChange={(e: any) => setMemberStatusFilter(e.target.value)}
                className="px-3 py-2 bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 focus:outline-none rounded uppercase font-bold"
              >
                <option value="all">All statuses</option>
                <option value="Active">Active only</option>
                <option value="Expired">Expired only</option>
                <option value="Frozen">Frozen only</option>
              </select>
            </div>
          </div>

          {/* MEMBER DIRECTORY TABLE */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-850 bg-zinc-950/40 text-zinc-500 uppercase tracking-widest text-[9px] font-black">
                    <th className="py-4 px-6">Member ID</th>
                    <th className="py-4">Full Name</th>
                    <th className="py-4">Phone No</th>
                    <th className="py-4">Registered Date</th>
                    <th className="py-4">Contract Expiry</th>
                    <th className="py-4 text-center">Current Status</th>
                    <th className="py-4 text-right px-6">Management Triggers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-950 text-zinc-300">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-zinc-950/20">
                      <td className="py-4 px-6 font-mono font-bold text-zinc-400">{member.id}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-800 flex-shrink-0 bg-zinc-950">
                            <img src={member.photo} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <span className="font-bold text-white">{member.name}</span>
                        </div>
                      </td>
                      <td className="py-4 font-light">{member.phone}</td>
                      <td className="py-4 font-mono text-zinc-500 text-[10px]">{member.joinDate}</td>
                      <td className="py-4 font-mono font-bold text-white">{member.expiryDate}</td>
                      <td className="py-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                          member.status === 'Active' 
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                            : member.status === 'Frozen'
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                            : 'bg-red-500/10 border border-red-500/20 text-red-400'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          
                          {/* WhatsApp Reminder for Due Members */}
                          {(new Date(member.expiryDate) < new Date() || member.status === 'Expired') && (
                            <button 
                              onClick={() => {
                                const cleanPhone = member.phone.replace(/[^0-9]/g, '');
                                const message = `Hi ${member.name}, this is Fit X Gym. Your membership payment is currently due (Expired on ${member.expiryDate}). Please renew your plan to avoid check-in disruption. Thank you!`;
                                const waUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(message)}`;
                                window.open(waUrl, '_blank');
                                onAddAuditLog(`MARKETING: Sent WhatsApp renewal reminder to ${member.name} (${member.id})`);
                              }}
                              className="px-2 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold text-[10px] uppercase flex items-center gap-1 transition-all"
                              title="Send WhatsApp Payment Reminder"
                            >
                              <Send size={10} />
                              <span>Remind</span>
                            </button>
                          )}

                          {/* Edit Details trigger */}
                          <button 
                            onClick={() => handleOpenEditMemberDetails(member)}
                            className="px-2 py-1.5 rounded bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-amber-500 font-bold text-[10px] uppercase transition-all"
                            title="Edit Member Details"
                          >
                            Edit
                          </button>

                          {/* Extend Expiry trigger */}
                          <button 
                            onClick={() => {
                              setEditingMember(member);
                              setExtendDays(30);
                            }}
                            className="px-2 py-1.5 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-orange-400 font-bold text-[10px] uppercase transition-all"
                            title="Extend Membership Contract"
                          >
                            Extend
                          </button>

                          {/* Suspend triggers */}
                          <button 
                            onClick={() => handleSuspendMember(member)}
                            className="p-1.5 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-red-400 hover:text-red-300 transition-all text-xs"
                            title="Suspend/Set Expired"
                          >
                            <Trash2 size={12} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* STAFF SCHEDULES SUB-TAB */}
      {activeSubTab === 'staff' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 gap-8">
            
            {/* STAFF ROSTER SCHEDULES */}
            <div className="bg-zinc-900 border border-zinc-850 p-6 rounded-2xl space-y-4">
              <div>
                <h3 className="font-extrabold uppercase text-white tracking-wide text-sm">Fit X Gym Human Resources</h3>
                <p className="text-xs text-zinc-500 font-light">Listing active trainer shifts, role-based salary structures, and schedule info.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staff.map((stf) => (
                  <div key={stf.id} className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 bg-orange-600/10 border border-orange-600/20 text-[9px] text-orange-500 font-bold uppercase rounded">
                          {stf.role}
                        </span>
                        <h4 className="font-extrabold text-sm text-white uppercase mt-1">{stf.name}</h4>
                        <p className="text-[10px] text-zinc-500">Employee ID: <span className="font-mono text-zinc-300">{stf.id}</span> • Joined: {stf.joiningDate}</p>
                      </div>

                      <div className="text-right text-xs">
                        <span className="text-zinc-500 text-[10px] uppercase block">SHIFTS</span>
                        <span className="font-bold text-white block">{stf.shift}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-900 text-[10px] font-mono text-zinc-500">
                      <div>Salary Base: <span className="text-white font-bold">₹{stf.salary.toLocaleString('en-IN')}/mo</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* CASH LEDGER SUB-TAB */}
      {activeSubTab === 'finance' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* INCOMING REVENUE LEDGER LIST */}
            <div className="lg:col-span-7 bg-zinc-900 border border-zinc-850 p-6 rounded-2xl space-y-4">
              <div>
                <h3 className="font-extrabold uppercase text-white tracking-wide text-sm">Income Stream Ledger Logs</h3>
                <p className="text-xs text-zinc-500 font-light">Real-time incoming payment transactions processed.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-850 bg-zinc-950/40 text-zinc-500 uppercase tracking-widest text-[9px] font-black">
                      <th className="py-3 px-4">Invoice No</th>
                      <th className="py-3">Member Name</th>
                      <th className="py-3">Category</th>
                      <th className="py-3 text-right">Gross Amount</th>
                      <th className="py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-950 text-zinc-300">
                    {payments.slice(-8).reverse().map((pay) => (
                      <tr key={pay.id} className="hover:bg-zinc-950/20">
                        <td className="py-3 px-4 font-mono font-bold text-zinc-500">{pay.invoiceNo}</td>
                        <td className="py-3 font-semibold text-white">{pay.memberName}</td>
                        <td className="py-3 text-zinc-400">
                          <span className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded">
                            {pay.category}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-emerald-400">₹{pay.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3 text-center">
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold">
                            {pay.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* EXPENSE INVOICER REGISTER FORM */}
            <div className="lg:col-span-5 bg-zinc-900 border border-zinc-850 p-6 rounded-2xl space-y-4">
              <div>
                <h3 className="font-extrabold uppercase text-white tracking-wide text-sm">Register Custom Expenditure</h3>
                <p className="text-xs text-zinc-500 font-light">Add custom commercial expenses to balance accounting statements.</p>
              </div>

              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase text-zinc-500 font-bold">CATEGORY</label>
                    <select 
                      value={expCategory}
                      onChange={(e: any) => setExpCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500 rounded"
                    >
                      <option value="Rent">Rent</option>
                      <option value="Electricity">Electricity</option>
                      <option value="Water">Water</option>
                      <option value="Equipment">Equipment Purchase</option>
                      <option value="Protein/Supplements">Supplements Procurement</option>
                      <option value="Cleaning">Cleaning / Sanitize</option>
                      <option value="Maintenance/Repairs">Maintenance & Repair</option>
                      <option value="Marketing">Geo-Marketing Ad campaigns</option>
                      <option value="Salary">Staff Salaries</option>
                      <option value="Miscellaneous">Miscellaneous</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase text-zinc-500 font-bold">AMOUNT (INR)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="Amount value" 
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase text-zinc-500 font-bold">BILL SPECIFICATIONS DESCRIPTION</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter bill description (e.g., Water tank clean bill)" 
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase text-zinc-500 font-bold">PAYMENT TYPE</label>
                  <select 
                    value={expMethod}
                    onChange={(e: any) => setExpMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500 rounded"
                  >
                    <option value="Bank Transfer">Commercial Bank Wire</option>
                    <option value="Card">Business Debit Card</option>
                    <option value="Cash">Cash Ledger</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2.5 bg-zinc-850 hover:bg-zinc-800 text-white border border-zinc-800 hover:border-zinc-700 font-extrabold uppercase tracking-wider text-[10px] rounded"
                >
                  LOG EXPENDITURE BILL
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

      {/* EXPENSES SUB-TAB */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* REGISTER / EDIT EXPENSE FORM */}
            <div className="lg:col-span-4 bg-zinc-900 border border-zinc-850 p-6 rounded-2xl space-y-4">
              <div>
                <h3 className="font-extrabold uppercase text-white tracking-wide text-sm">
                  {editingExpense ? 'Modify Registered Expense' : 'Register Gym Expenditure'}
                </h3>
                <p className="text-xs text-zinc-500 font-light">
                  {editingExpense ? 'Update details for this expenditure.' : 'Add custom commercial expenses to balance statements.'}
                </p>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const amountVal = parseFloat(expAmount);
                  if (isNaN(amountVal) || amountVal <= 0) return;

                  if (editingExpense) {
                    const updated = expenses.map(ex => ex.id === editingExpense.id ? {
                      ...ex,
                      category: expCategory,
                      amount: amountVal,
                      description: expDesc,
                      paymentMethod: expMethod
                    } : ex);
                    if (onUpdateExpenses) onUpdateExpenses(updated);
                    onAddAuditLog(`FINANCE: Updated expense ${editingExpense.id} (Category: ${expCategory}, Amount: ₹${amountVal})`);
                    setEditingExpense(null);
                    alert("Expense updated successfully!");
                  } else {
                    const newExp: Expense = {
                      id: `EXP-${Math.floor(200 + Math.random() * 800)}`,
                      category: expCategory,
                      amount: amountVal,
                      date: new Date().toISOString().split('T')[0],
                      description: expDesc || `Procurement charges for ${expCategory}`,
                      paymentMethod: expMethod,
                      status: 'Paid'
                    };
                    onAddExpense(newExp);
                    onAddAuditLog(`FINANCE: ${adminRole} logged a new EXPENSE under ${expCategory} of ₹${amountVal}`);
                  }
                  setExpAmount('');
                  setExpDesc('');
                }} 
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase text-zinc-500 font-bold">CATEGORY</label>
                  <select 
                    value={expCategory}
                    onChange={(e: any) => setExpCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500 rounded"
                  >
                    <option value="Rent">Rent</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Water">Water</option>
                    <option value="Equipment">Equipment Purchase</option>
                    <option value="Protein/Supplements">Supplements Procurement</option>
                    <option value="Cleaning">Cleaning / Sanitize</option>
                    <option value="Maintenance/Repairs">Maintenance & Repair</option>
                    <option value="Marketing">Geo-Marketing Ad campaigns</option>
                    <option value="Salary">Staff Salaries</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase text-zinc-500 font-bold">AMOUNT (INR)</label>
                  <input 
                    type="number" 
                    required
                    placeholder="Amount value" 
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase text-zinc-500 font-bold">BILL DESCRIPTION</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter bill description (e.g., Water tank clean bill)" 
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase text-zinc-500 font-bold">PAYMENT TYPE</label>
                  <select 
                    value={expMethod}
                    onChange={(e: any) => setExpMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500 rounded"
                  >
                    <option value="Bank Transfer">Commercial Bank Wire</option>
                    <option value="Card">Business Debit Card</option>
                    <option value="Cash">Cash Ledger</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  {editingExpense && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setEditingExpense(null);
                        setExpAmount('');
                        setExpDesc('');
                      }}
                      className="w-1/3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold text-[10px] rounded uppercase"
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    type="submit" 
                    className="flex-grow py-2.5 bg-orange-600 hover:bg-orange-500 text-black font-extrabold uppercase tracking-wider text-[10px] rounded"
                  >
                    {editingExpense ? 'UPDATE BILL' : 'LOG EXPENDITURE BILL'}
                  </button>
                </div>
              </form>
            </div>

            {/* EXPENSES DIRECTORY */}
            <div className="lg:col-span-8 bg-zinc-900 border border-zinc-850 p-6 rounded-2xl space-y-4">
              <div>
                <h3 className="font-extrabold uppercase text-white tracking-wide text-sm">Central Expense Ledger Directory</h3>
                <p className="text-xs text-zinc-500 font-light">Listing all historic and pending outgoings of Fit X Gym Noida.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-850 bg-zinc-950/40 text-zinc-500 uppercase tracking-widest text-[9px] font-black">
                      <th className="py-3 px-4">Expense ID</th>
                      <th className="py-3">Category</th>
                      <th className="py-3">Description</th>
                      <th className="py-3 text-right">Amount</th>
                      <th className="py-3 text-center">Payment Method</th>
                      <th className="py-3 text-right px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-950 text-zinc-300">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-zinc-950/20">
                        <td className="py-3 px-4 font-mono font-bold text-zinc-500">{exp.id}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded font-bold text-orange-500">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 font-medium text-zinc-300">{exp.description}</td>
                        <td className="py-3 text-right font-bold text-rose-500 font-mono">₹{exp.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3 text-center text-zinc-400 font-mono text-[10px]">{exp.paymentMethod}</td>
                        <td className="py-3 text-right px-4">
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => {
                                setEditingExpense(exp);
                                setExpCategory(exp.category);
                                setExpAmount(exp.amount.toString());
                                setExpDesc(exp.description);
                                setExpMethod(exp.paymentMethod as 'Cash' | 'Bank Transfer' | 'Card');
                              }}
                              className="px-2 py-1 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-amber-500 font-bold text-[9px] uppercase"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this expense?")) {
                                  const updated = expenses.filter(ex => ex.id !== exp.id);
                                  if (onUpdateExpenses) onUpdateExpenses(updated);
                                  onAddAuditLog(`FINANCE: Deleted expense entry ${exp.id}`);
                                }
                              }}
                              className="p-1 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-red-500 hover:text-red-400"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* INVENTORY & POS CHECKOUT SUB-TAB */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-6">
          
          {/* STOCK MONITORING INDEX LIST */}
          <div className="bg-zinc-900 border border-zinc-850 p-6 rounded-2xl space-y-4">
            <div>
              <h3 className="font-extrabold uppercase text-white tracking-wide text-sm flex items-center gap-1.5">
                <Package size={16} className="text-orange-500" />
                <span>Supplement Bar & Merchandise Stock Matrix</span>
              </h3>
              <p className="text-xs text-zinc-500 font-light">Monitor whey protein, shakers, creatine, and powerlifting belts.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {inventory.map((item) => {
                const outOfStock = item.stock === 0;
                const lowStock = item.stock <= item.lowStockLimit;

                return (
                  <div key={item.id} className="p-4 bg-zinc-950 border border-zinc-850/80 rounded-xl space-y-3 relative">
                    {outOfStock ? (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-600/10 border border-red-600/20 text-[8px] font-bold text-red-500 uppercase rounded">
                        OUT OF STOCK
                      </span>
                    ) : lowStock ? (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-amber-600/10 border border-amber-600/20 text-[8px] font-bold text-amber-500 uppercase rounded">
                        LOW STOCK
                      </span>
                    ) : (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-emerald-600/10 border border-emerald-600/20 text-[8px] font-bold text-emerald-500 uppercase rounded">
                        OK
                      </span>
                    )}

                    <div className="space-y-1">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase block">{item.category}</span>
                      <h4 className="font-extrabold text-xs text-white leading-tight uppercase truncate">{item.name}</h4>
                    </div>

                    <div className="flex justify-between items-baseline pt-2 border-t border-zinc-900 text-xs">
                      <span className="text-zinc-500 uppercase text-[8px]">REMAIN STOCK</span>
                      <span className={`font-black ${outOfStock ? 'text-red-500' : lowStock ? 'text-amber-500' : 'text-white'}`}>{item.stock} Units</span>
                    </div>

                    <div className="text-[10px] font-mono text-zinc-500 flex justify-between">
                      <span>Price: ₹{item.price}</span>
                      <span>Sold: {item.salesCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* checkout pos terminal counter */}
            <div className="lg:col-span-7 bg-zinc-900 border border-zinc-850 p-6 rounded-2xl space-y-4">
              <div>
                <h3 className="font-extrabold uppercase text-white tracking-wide text-sm">Supplement POS Terminal checkout counter</h3>
                <p className="text-xs text-zinc-500 font-light">Direct billing system. Checkout protein supplements or shakers to active members.</p>
              </div>

              {posSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs rounded text-center">
                  {posSuccessMsg}
                </div>
              )}

              <form onSubmit={handlePOSCheckout} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase text-zinc-500 font-bold">SELECT PRODUCT</label>
                    <select 
                      value={selectedInventoryId}
                      onChange={(e) => setSelectedInventoryId(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500 rounded font-semibold"
                    >
                      {inventory.map(i => (
                        <option key={i.id} value={i.id}>{i.name} (₹{i.price}) — Stock: {i.stock}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase text-zinc-500 font-bold">SELECT MEMBER RECIPIENT</label>
                    <select 
                      value={posMemberId}
                      onChange={(e) => setPosMemberId(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500 rounded font-semibold"
                    >
                      {members.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase text-zinc-500 font-bold">QUANTITY</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="10"
                      required
                      value={posQuantity}
                      onChange={(e) => setPosQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase text-zinc-500 font-bold">BILLING SOURCE</label>
                    <select 
                      value={posPaymentMethod}
                      onChange={(e: any) => setPosPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500 rounded"
                    >
                      <option value="UPI">UPI / GPay Scan</option>
                      <option value="Card">Terminal POS Swiper Card</option>
                      <option value="Cash">Lobby Cashbox Drawer</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950 rounded border border-zinc-900 flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Gross Payable checkout cost:</span>
                  <span className="text-orange-500 font-black text-sm">
                    ₹{((inventory.find(i => i.id === selectedInventoryId)?.price || 0) * posQuantity).toLocaleString('en-IN')}
                  </span>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-black font-extrabold uppercase tracking-wider text-[10px] rounded"
                >
                  BILL SALE & DISPATCH PRODUCTS
                </button>
              </form>
            </div>

            {/* RESTOCK / PROCUREMENT TRIGGER */}
            <div className="lg:col-span-5 bg-zinc-900 border border-zinc-850 p-6 rounded-2xl space-y-4">
              <div>
                <h3 className="font-extrabold uppercase text-white tracking-wide text-sm">Procurement supply restocker</h3>
                <p className="text-xs text-zinc-500 font-light">Procure fresh inventory batches from local trade suppliers.</p>
              </div>

              <form onSubmit={handleRestockSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase text-zinc-500 font-bold font-mono">SUPPLEMENT INVENTORY TARGET</label>
                  <select 
                    value={restockItemId}
                    onChange={(e) => setRestockItemId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500 rounded"
                  >
                    {inventory.map(i => (
                      <option key={i.id} value={i.id}>{i.name} (Stock: {i.stock})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase text-zinc-500 font-bold font-mono">RESTOCK QUANTITY UNITS</label>
                  <input 
                    type="number" 
                    min="5" 
                    max="100"
                    required
                    value={restockQty}
                    onChange={(e) => setRestockQty(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-zinc-950 rounded border border-zinc-900/60 text-zinc-500 text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span>Vendor Cost per unit:</span>
                    <span className="font-bold text-white">₹{inventory.find(i => i.id === restockItemId)?.costPrice}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-zinc-900/40">
                    <span>Est. Bill cost (charged to supplies exp):</span>
                    <span className="font-bold text-white">₹{((inventory.find(i => i.id === restockItemId)?.costPrice || 0) * restockQty).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-750 font-bold uppercase text-[10px] rounded"
                >
                  DISPATCH SUPPLIER PROCUREMENT WIRE
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

      {/* MARKETING TEXT BLASTS SUB-TAB */}
      {activeSubTab === 'marketing' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: MESSAGE COMPOSER */}
            <div className="lg:col-span-6 bg-zinc-900 border border-zinc-850 p-6 md:p-8 rounded-2xl space-y-6 shadow-xl">
              <div>
                <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <Bell className="text-orange-500 animate-pulse" size={18} />
                  <span>Broadcast Composer</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Compose custom announcements or select quick presets to push to members.</p>
              </div>

              {/* Quick Template Presets */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">Quick Preset Templates</span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setCustomBroadcastText("Fit X Gym Notice: Due to heavy rainfall and street flooding, the gym will remain closed today. Stay safe, see you tomorrow!")}
                    className="p-2.5 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-[10px] text-zinc-300 rounded text-left transition-all font-semibold leading-tight"
                  >
                    🌧️ Rain & Flood Closure
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCustomBroadcastText("Fit X Gym Notice: The gym will be closed tomorrow on account of local festival holidays. Have a wonderful holiday!")}
                    className="p-2.5 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-[10px] text-zinc-300 rounded text-left transition-all font-semibold leading-tight"
                  >
                    🎉 Festival Holiday Closure
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCustomBroadcastText("Fit X Gym Alert: Ready to test your strength? Noida Sector 15 Power Championship is happening this Sunday! Big cash prizes. Register today at front desk!")}
                    className="p-2.5 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-[10px] text-zinc-300 rounded text-left transition-all font-semibold leading-tight"
                  >
                    🏆 Powerlifting Meet Invite
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCustomBroadcastText("Fit X Gym Special: Unlock 25% Off ISSA Coach Siddharth personal training slots this week. Book your slot at the reception!")}
                    className="p-2.5 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-[10px] text-zinc-300 rounded text-left transition-all font-semibold leading-tight"
                  >
                    🔥 25% Off Personal Training
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">CUSTOM BROADCAST ANNOUNCEMENT MESSAGE</label>
                <textarea 
                  rows={5}
                  value={customBroadcastText}
                  onChange={(e) => setCustomBroadcastText(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none resize-none leading-relaxed font-medium"
                  placeholder="Enter your custom announcement message here..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">BROADCAST DELIVERY CHANNEL</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setBroadcastChannel('WhatsApp')}
                    className={`p-3 rounded border text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${broadcastChannel === 'WhatsApp' ? 'bg-emerald-600 border-emerald-600 text-black font-extrabold' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'}`}
                  >
                    <Send size={12} />
                    <span>WhatsApp</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setBroadcastChannel('SMS')}
                    className={`p-3 rounded border text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${broadcastChannel === 'SMS' ? 'bg-orange-600 border-orange-600 text-black font-extrabold' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'}`}
                  >
                    <Radio size={12} />
                    <span>Transactional SMS</span>
                  </button>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: RECIPIENT SELECTOR & DISPATCH */}
            <div className="lg:col-span-6 bg-zinc-900 border border-zinc-850 p-6 md:p-8 rounded-2xl space-y-6 shadow-xl flex flex-col justify-between">
              <div className="space-y-4 flex-grow">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-extrabold uppercase text-white">Recipient List Directory</h4>
                    <p className="text-[10px] text-zinc-500">Select specific members or target in bulk.</p>
                  </div>
                  
                  {/* Select All / Clear All buttons */}
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setSelectedMarketingMembers(members.map(m => m.id))}
                      className="px-2 py-1 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-[9px] font-bold text-zinc-400 rounded uppercase text-[10px]"
                    >
                      Select All
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSelectedMarketingMembers([])}
                      className="px-2 py-1 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-[9px] font-bold text-zinc-400 rounded uppercase text-[10px]"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Recipient select options */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl max-h-[220px] overflow-y-auto divide-y divide-zinc-900">
                  {members.map(member => {
                    const isSelected = selectedMarketingMembers.includes(member.id);
                    return (
                      <div key={member.id} className="p-3 flex items-center justify-between gap-4 text-xs font-medium">
                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedMarketingMembers(prev => prev.filter(id => id !== member.id));
                              } else {
                                setSelectedMarketingMembers(prev => [...prev, member.id]);
                              }
                            }}
                            className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${isSelected ? 'bg-orange-600 border-orange-600 text-black' : 'border-zinc-800 bg-zinc-900'}`}
                          >
                            {isSelected && '✓'}
                          </button>
                          <div>
                            <span className="text-white font-bold block">{member.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{member.phone} • Status: <span className={member.status === 'Active' ? 'text-emerald-500 font-bold' : 'text-rose-500'}>{member.status}</span></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg text-[10px] text-zinc-500 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Recipients Chosen:</span>
                    <span className="text-white">{selectedMarketingMembers.length} Members</span>
                  </div>
                </div>
              </div>

              {/* Dispatch Action */}
              <div className="pt-4 border-t border-zinc-850 mt-4">
                {broadcastChannel === 'WhatsApp' ? (
                  <div className="space-y-3">
                    <p className="text-[10px] text-zinc-500 leading-relaxed bg-emerald-950/10 border border-emerald-950/20 p-2.5 rounded text-center">
                      ℹ️ Browser sandboxing prevents opening multiple automated tabs at once. Open individual WhatsApp targets below to dispatch customized messages:
                    </p>
                    
                    <div className="space-y-2 max-h-[140px] overflow-y-auto border border-zinc-900 bg-zinc-950 p-2 rounded-lg">
                      {selectedMarketingMembers.length === 0 ? (
                        <p className="text-center text-zinc-600 text-xs py-3 font-medium">No recipients selected. Check members above.</p>
                      ) : (
                        selectedMarketingMembers.map(id => {
                          const mb = members.find(m => m.id === id);
                          if (!mb) return null;
                          return (
                            <div key={id} className="flex justify-between items-center p-2 bg-zinc-900/60 border border-zinc-850 rounded">
                              <span className="text-white font-bold text-[11px] truncate">{mb.name}</span>
                              <button 
                                type="button"
                                onClick={() => {
                                  const cleanPhone = mb.phone.replace(/[^0-9]/g, '');
                                  const waUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(customBroadcastText)}`;
                                  window.open(waUrl, '_blank');
                                  onAddAuditLog(`MARKETING: Redirected broadcast messaging for ${mb.name} (${mb.id}) to WhatsApp`);
                                }}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold text-[9px] uppercase rounded transition-all"
                              >
                                Send Msg
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => {
                      if (selectedMarketingMembers.length === 0) {
                        alert("Please select at least one recipient first!");
                        return;
                      }
                      setBroadcastSent(true);
                      setTimeout(() => {
                        setBroadcastSent(false);
                        onAddAuditLog(`SMS BROADCAST: Dispatched transactional bulk SMS announcement regarding "${customBroadcastText.slice(0, 30)}..." to ${selectedMarketingMembers.length} selected recipients.`);
                        alert(`Successfully dispatched bulk Transactional SMS announcement to ${selectedMarketingMembers.length} active contacts!`);
                      }, 1500);
                    }}
                    disabled={broadcastSent || selectedMarketingMembers.length === 0}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-black font-extrabold uppercase tracking-wider text-xs rounded transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Radio size={14} />
                    <span>{broadcastSent ? 'DISPATCHING BULK SMS...' : 'DISPATCH BULK TRANSACTIONAL SMS'}</span>
                  </button>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* MEMBERSHIP PLANS CONFIGURATOR SUB-TAB */}
      {activeSubTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-900 border border-zinc-850 p-5 rounded-2xl gap-4">
            <div>
              <h3 className="font-extrabold uppercase text-white tracking-wide text-sm">Membership Plans & Pricing Structures</h3>
              <p className="text-xs text-zinc-500 font-light">Dynamically configure membership pricing, durations, and features propagated across portals.</p>
            </div>
            <button 
              onClick={() => {
                setEditingPlan(null);
                setPlanName('');
                setPlanDuration('3 Months');
                setPlanPrice('');
                setPlanFeatures('Access to all Cardio & Strength areas, Locker access, Wi-Fi');
                setIsAddingPlan(true);
              }}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-black text-xs font-extrabold uppercase tracking-wider rounded-lg flex items-center gap-1 transition-all shadow-md shadow-orange-600/15"
            >
              <Plus size={14} />
              <span>Create New Plan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div key={p.id} className="p-6 bg-zinc-900 border border-zinc-850 rounded-2xl relative flex flex-col justify-between">
                {p.popular && (
                  <div className="absolute top-4 right-4 bg-orange-600 text-black font-extrabold uppercase text-[9px] tracking-widest px-2 py-0.5 rounded shadow">
                    Popular
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">{p.duration} contract</span>
                    <h4 className="font-black text-lg text-white uppercase leading-tight mt-0.5">{p.name}</h4>
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-sm font-bold text-zinc-500">₹</span>
                    <span className="text-3xl font-black text-white">{p.price.toLocaleString('en-IN')}</span>
                  </div>
                  <ul className="space-y-1.5 text-zinc-400 text-xs">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <Check size={10} className="text-emerald-500" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2 mt-6 pt-4 border-t border-zinc-950">
                  <button 
                    onClick={() => {
                      setEditingPlan(p);
                      setPlanName(p.name);
                      setPlanDuration(p.duration);
                      setPlanPrice(p.price.toString());
                      setPlanFeatures(p.features.join(', '));
                      setIsAddingPlan(true);
                    }}
                    className="flex-1 py-1.5 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 rounded font-bold text-[10px] uppercase transition-all"
                  >
                    Modify Plan
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete the plan "${p.name}"?`)) {
                        const updated = plans.filter(plan => plan.id !== p.id);
                        onUpdatePlans(updated);
                        onAddAuditLog(`PLANS: Deleted membership plan: ${p.name} (${p.id})`);
                      }
                    }}
                    className="py-1.5 px-2 bg-zinc-950 hover:bg-red-950/20 hover:text-red-400 border border-zinc-800 hover:border-red-950/40 rounded transition-all text-xs text-zinc-500"
                    title="Delete Plan"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ADD / EDIT PLAN MODAL DIALOG */}
          {isAddingPlan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
              <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl max-w-md w-full space-y-5">
                <div className="flex justify-between items-start border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-base font-black uppercase text-white">{editingPlan ? 'Modify Plan Structure' : 'Create Custom Membership Package'}</h3>
                    <p className="text-xs text-zinc-500 mt-1">Specify price tag, contract periods, and featured perks.</p>
                  </div>
                  <button 
                    onClick={() => setIsAddingPlan(false)}
                    className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Plan Title Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Pro Quarterly, Weekend Warrior" 
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Duration Segment</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 3 Months, 12 Months" 
                        value={planDuration}
                        onChange={(e) => setPlanDuration(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Price (₹ INR)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 5999" 
                        value={planPrice}
                        onChange={(e) => setPlanPrice(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Plan Features (Comma separated)</label>
                    <textarea 
                      rows={3}
                      placeholder="e.g. Access to strength, 2 Personal Training, Free Diet Consult, Wi-Fi" 
                      value={planFeatures}
                      onChange={(e) => setPlanFeatures(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none resize-none"
                    />
                  </div>

                  <button 
                    onClick={() => {
                      if (!planName || !planDuration || !planPrice) {
                        alert('Please fill out all plan credentials.');
                        return;
                      }

                      const featuresArr = planFeatures.split(',').map(f => f.trim()).filter(Boolean);
                      
                      if (editingPlan) {
                        // Edit existing
                        const updated = plans.map(p => p.id === editingPlan.id ? {
                          ...p,
                          name: planName,
                          duration: planDuration,
                          price: parseInt(planPrice) || 0,
                          features: featuresArr
                        } : p);
                        onUpdatePlans(updated);
                        onAddAuditLog(`PLANS: Siddharth updated membership package ${planName} (Price: ₹${planPrice})`);
                      } else {
                        // Add new
                        const newId = `plan_${planName.toLowerCase().replace(/\s+/g, '_')}_${Math.floor(Math.random() * 100)}`;
                        const newPlan: Plan = {
                          id: newId,
                          name: planName,
                          duration: planDuration,
                          price: parseInt(planPrice) || 0,
                          features: featuresArr
                        };
                        onUpdatePlans([...plans, newPlan]);
                        onAddAuditLog(`PLANS: Siddharth added a new membership plan: ${planName} (Price: ₹${planPrice})`);
                      }
                      setIsAddingPlan(false);
                    }}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-black font-extrabold uppercase tracking-wider text-xs rounded transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>{editingPlan ? 'SAVE PLAN MODIFICATIONS' : 'DISPATCH NEW PACKAGE LIVE'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TESTIMONIALS / FEEDBACK APPROVAL SUB-TAB */}
      {activeSubTab === 'testimonials' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-850 p-5 rounded-2xl">
            <h3 className="font-extrabold uppercase text-white tracking-wide text-sm flex items-center gap-2">
              <Star className="text-orange-500 fill-orange-500" size={16} />
              <span>Reviews & Testimonials Moderation Queue</span>
            </h3>
            <p className="text-xs text-zinc-500 font-light mt-1">
              Verify feedback posted by visitors or members. Approve them to immediately display them on the landing page community section.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* PENDING APPROVAL LIST */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
                <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Pending Approval ({testimonials.filter(t => !t.approved).length})</span>
                </h4>
              </div>

              {testimonials.filter(t => !t.approved).length === 0 ? (
                <div className="p-8 text-center bg-zinc-900/40 border border-zinc-900 rounded-xl text-zinc-600 text-xs font-light">
                  No testimonials are currently waiting for verification. Beautiful!
                </div>
              ) : (
                <div className="space-y-3">
                  {testimonials.filter(t => !t.approved).map((rev) => (
                    <div key={rev.id} className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl space-y-3 relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-xs text-white uppercase block">{rev.name}</span>
                          <span className="text-[9px] text-zinc-500 font-mono">{rev.date} • ID: {rev.id}</span>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} size={11} className="fill-yellow-500" />
                          ))}
                        </div>
                      </div>

                      <p className="text-zinc-300 text-xs italic font-light leading-relaxed bg-zinc-950 p-3 rounded border border-zinc-900">
                        "{rev.text}"
                      </p>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => {
                            if (onApproveTestimonial) onApproveTestimonial(rev.id);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold text-[10px] uppercase rounded flex items-center gap-1 transition-all"
                        >
                          <Check size={11} />
                          <span>Approve Review</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to decline and delete this review?")) {
                              if (onDeleteTestimonial) onDeleteTestimonial(rev.id);
                            }
                          }}
                          className="px-3 py-1.5 bg-zinc-950 hover:bg-red-950/20 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-950/40 font-bold text-[10px] uppercase rounded flex items-center gap-1 transition-all"
                        >
                          <Trash2 size={11} />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LIVE APPROVED LIST */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
                <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Live on Website ({testimonials.filter(t => t.approved).length})</span>
                </h4>
              </div>

              {testimonials.filter(t => t.approved).length === 0 ? (
                <div className="p-8 text-center bg-zinc-900/40 border border-zinc-900 rounded-xl text-zinc-600 text-xs font-light">
                  No testimonials are live on the public website.
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {testimonials.filter(t => t.approved).map((rev) => (
                    <div key={rev.id} className="p-4 bg-zinc-900 border border-zinc-850/80 rounded-xl space-y-3 flex justify-between items-start gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-bold text-xs text-white uppercase block">{rev.name}</span>
                            <span className="text-[9px] text-zinc-500 font-mono">{rev.date}</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-yellow-500">
                            {Array.from({ length: rev.rating }).map((_, i) => (
                              <Star key={i} size={10} className="fill-yellow-500" />
                            ))}
                          </div>
                        </div>
                        <p className="text-zinc-400 text-xs italic font-light leading-relaxed">
                          "{rev.text}"
                        </p>
                      </div>
                      
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to remove this review from the public website?")) {
                            if (onDeleteTestimonial) onDeleteTestimonial(rev.id);
                          }
                        }}
                        className="p-2 bg-zinc-950 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 border border-zinc-800 hover:border-red-950/40 rounded transition-all mt-1"
                        title="Delete Review"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MEMBER EXPIRY EXTENSION DIALOG MODAL */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-xl max-w-sm w-full space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold uppercase text-white">Extend Expiry Contract</h3>
                <p className="text-xs text-zinc-500 mt-1">Add additional days to {editingMember.name}'s membership.</p>
              </div>
              <button 
                onClick={() => setEditingMember(null)}
                className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">DAYS TO ADD</label>
                <select 
                  value={extendDays}
                  onChange={(e) => setExtendDays(parseInt(e.target.value) || 30)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500 rounded"
                >
                  <option value={7}>Add 7 Days (Short extension)</option>
                  <option value={15}>Add 15 Days (Half month extension)</option>
                  <option value={30}>Add 30 Days (One Month extension)</option>
                  <option value={90}>Add 90 Days (Three Months extension)</option>
                </select>
              </div>

              <button 
                onClick={() => {
                  handleExtendExpiry(editingMember, extendDays);
                  setEditingMember(null);
                }}
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-black font-extrabold uppercase tracking-wider text-xs rounded transition-all"
              >
                CONFIRM CONTRACT EXTENSION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEMBER DETAILS EDIT DIALOG MODAL */}
      {editingMemberDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <form onSubmit={handleSaveMemberDetails} className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-xl max-w-md w-full space-y-6">
            <div className="flex justify-between items-start border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-black uppercase text-white">Edit Member Details</h3>
                <p className="text-xs text-zinc-500 mt-1">Modify account profiles for Member ID: <span className="font-mono text-zinc-300 font-bold">{editingMemberDetails.id}</span></p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingMemberDetails(null)}
                className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={editMemName}
                  onChange={(e) => setEditMemName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Phone Number</label>
                  <input 
                    type="text" 
                    required
                    value={editMemPhone}
                    onChange={(e) => setEditMemPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    value={editMemEmail}
                    onChange={(e) => setEditMemEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Membership Status</label>
                  <select 
                    value={editMemStatus}
                    onChange={(e: any) => setEditMemStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none font-bold text-orange-400"
                  >
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Frozen">Frozen</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Contract Expiry Date</label>
                  <input 
                    type="date" 
                    required
                    value={editMemExpiry}
                    onChange={(e) => setEditMemExpiry(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Assigned Membership Plan</label>
                <select 
                  value={editMemPlanId}
                  onChange={(e) => setEditMemPlanId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.duration} • ₹{p.price})</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-black font-extrabold uppercase tracking-wider text-xs rounded transition-all flex items-center justify-center gap-2"
              >
                <Check size={14} />
                <span>SAVE PROFILE MODIFICATIONS</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
