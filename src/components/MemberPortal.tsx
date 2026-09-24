import React, { useState } from 'react';
import { Member, Plan, Payment } from '../types';
import { MEMBERSHIP_PLANS } from '../data/mockData';
import { CreditCard, QrCode, TrendingDown, Weight, Flame, User, MessageSquare, Plus, FileText, Download, CheckCircle, Calendar, RefreshCw, Send, Sparkles, Activity, ShieldCheck, ShoppingBag, Dumbbell, Search, Users, Settings, Upload, X } from 'lucide-react';
import { motion } from 'motion/react';

interface MemberPortalProps {
  currentMember: Member;
  allMembers: Member[];
  onUpdateMember: (updated: Member) => void;
  onRenewSuccess: (memberId: string, planId: string, paidAmount: number, paymentMethod: 'UPI' | 'Card' | 'Cash') => void;
  payments: Payment[];
  loggedInUser?: { role: 'admin' | 'member'; name: string; email: string; memberId?: string } | null;
  onUpdateLoggedInUser?: (user: { role: 'admin' | 'member'; name: string; email: string; memberId?: string }) => void;
}

export default function MemberPortal({ currentMember, allMembers, onUpdateMember, onRenewSuccess, payments, loggedInUser, onUpdateLoggedInUser }: MemberPortalProps) {
  // Admin-specific states
  const [adminMainTab, setAdminMainTab] = useState<'profile' | 'members'>(
    loggedInUser?.role === 'admin' ? 'profile' : 'members'
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    allMembers[0]?.id || currentMember?.id || ''
  );
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState<'all' | 'Active' | 'Expired'>('all');

  // Determine active member context dynamically
  const memberToUse = loggedInUser?.role === 'admin' && adminMainTab === 'members'
    ? (allMembers.find(m => m.id === selectedMemberId) || currentMember)
    : currentMember;

  const [activeTab, setActiveTab] = useState<'overview' | 'routines' | 'billing'>('overview');
  const [newWeight, setNewWeight] = useState('');
  const [newChest, setNewChest] = useState('');
  const [newBiceps, setNewBiceps] = useState('');
  const [newWaist, setNewWaist] = useState('');
  const [newThighs, setNewThighs] = useState('');
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('plan_quarterly');
  const [renewMethod, setRenewMethod] = useState<'UPI' | 'Card' | 'Cash'>('UPI');
  const [renewingState, setRenewingState] = useState(false);

  // Filter payments for this member
  const memberPayments = payments.filter(p => p.memberId === memberToUse.id);

  // Find current plan
  const memberPlan = MEMBERSHIP_PLANS.find(p => p.id === memberToUse.planId);

  // Calculate days remaining
  const getDaysRemaining = () => {
    const expiry = new Date(memberToUse.expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining();

  // Handle saving weight and other body measurements entries
  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(newWeight);
    const chestNum = parseFloat(newChest);
    const bicepsNum = parseFloat(newBiceps);
    const waistNum = parseFloat(newWaist);
    const thighsNum = parseFloat(newThighs);

    if (isNaN(weightNum) || weightNum <= 0) {
      alert("Please enter a valid weight");
      return;
    }

    const today = new Date();
    const formattedDate = today.toLocaleString('en-US', { month: 'short', day: '2-digit' });
    
    // 1. Update Weight History
    const updatedWeightHistory = [...memberToUse.weightHistory, { date: formattedDate, weight: weightNum }];
    
    // 2. Update Measurements History
    const lastMeasurement = memberToUse.measurementsHistory[memberToUse.measurementsHistory.length - 1] || {
      chest: 38,
      biceps: 14,
      waist: 32,
      thighs: 22
    };

    const newMeasurement = {
      date: formattedDate,
      chest: isNaN(chestNum) ? lastMeasurement.chest : chestNum,
      biceps: isNaN(bicepsNum) ? lastMeasurement.biceps : bicepsNum,
      waist: isNaN(waistNum) ? lastMeasurement.waist : waistNum,
      thighs: isNaN(thighsNum) ? lastMeasurement.thighs : thighsNum,
    };
    const updatedMeasurements = [...memberToUse.measurementsHistory, newMeasurement];

    // 3. Recalculate BMI (Assuming height is 1.75m)
    const heightM = 1.75;
    const recalculatedBmi = parseFloat((weightNum / (heightM * heightM)).toFixed(1));

    const updatedMember: Member = {
      ...memberToUse,
      weightHistory: updatedWeightHistory,
      measurementsHistory: updatedMeasurements,
      bmi: recalculatedBmi
    };

    onUpdateMember(updatedMember);
    setNewWeight('');
    setNewChest('');
    setNewBiceps('');
    setNewWaist('');
    setNewThighs('');
    setShowProgressForm(false);
    alert("Progress logged successfully!");
  };

  const handleProgressPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const currentImages = memberToUse.progressImages || [];
      const updatedImages = [base64String, ...currentImages];

      onUpdateMember({
        ...memberToUse,
        progressImages: updatedImages
      });
      alert("Progress photo added successfully!");
    };
    reader.readAsDataURL(file);
  };

  // Handle checking/unchecking exercises
  const handleToggleExercise = (dayIdx: number, exIdx: number) => {
    const updatedWorkout = [...memberToUse.workoutPlan];
    const isCompleted = updatedWorkout[dayIdx].exercises[exIdx].completed;
    updatedWorkout[dayIdx].exercises[exIdx] = {
      ...updatedWorkout[dayIdx].exercises[exIdx],
      completed: !isCompleted
    };

    onUpdateMember({
      ...memberToUse,
      workoutPlan: updatedWorkout
    });
  };

  // Handle Membership renewal
  const handleRenewSubmit = () => {
    const planSelected = MEMBERSHIP_PLANS.find(p => p.id === selectedPlanId);
    if (!planSelected) return;

    setRenewingState(true);
    setTimeout(() => {
      onRenewSuccess(memberToUse.id, planSelected.id, planSelected.price, renewMethod);
      setRenewingState(false);
      setIsRenewing(false);
    }, 1500);
  };

  // Render a beautiful Custom SVG line chart for Weight History
  const renderWeightChart = () => {
    const data = memberToUse.weightHistory;
    if (data.length === 0) return null;

    const width = 450;
    const height = 180;
    const padding = 25;

    // Calculate Min & Max for weight scaling
    const weights = data.map(d => d.weight);
    const maxWeight = Math.max(...weights) + 1;
    const minWeight = Math.min(...weights) - 1;
    const weightRange = maxWeight - minWeight || 1;

    // Map coordinates
    const points = data.map((d, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((d.weight - minWeight) / weightRange) * (height - 2 * padding);
      return { x, y, label: d.date, val: d.weight };
    });

    // Create Path String
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-orange-500">
        {/* Background grid lines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1f2937" strokeDasharray="3,3" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#1f2937" strokeDasharray="3,3" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#1f2937" strokeDasharray="3,3" />

        {/* Dynamic Glow and Line */}
        <path d={pathD} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Fill Area below line */}
        <path 
          d={`${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`} 
          fill="url(#weight-chart-gradient)" 
          opacity="0.1" 
        />

        <defs>
          <linearGradient id="weight-chart-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Data circles & labels */}
        {points.map((pt, idx) => (
          <g key={idx}>
            <circle cx={pt.x} cy={pt.y} r="5" fill="#f97316" stroke="#09090b" strokeWidth="2" />
            
            {/* Tooltip text for values */}
            <text x={pt.x} y={pt.y - 10} fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
              {pt.val}kg
            </text>

            {/* Date label at bottom */}
            <text x={pt.x} y={height - 6} fill="#71717a" fontSize="8" textAnchor="middle">
              {pt.label}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  if (loggedInUser?.role === 'admin' && adminMainTab === 'profile') {
    return (
      <div className="bg-zinc-950 text-white p-4 md:p-8 min-h-screen">
        {/* Admin Navigation (Only if Admin is Logged In) */}
        <div className="mb-8 border-b border-zinc-900 pb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">ADMINISTRATOR WORKSPACE</p>
              <h1 className="text-xl font-black text-white uppercase tracking-tight">👤 Portal Profile Manager</h1>
            </div>
            
            <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 text-xs font-bold uppercase">
              <button 
                onClick={() => setAdminMainTab('profile')}
                className={`px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 ${adminMainTab === 'profile' ? 'bg-orange-600 text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
              >
                <ShieldCheck size={14} />
                <span>💼 Admin Profile</span>
              </button>
              <button 
                onClick={() => setAdminMainTab('members')}
                className="px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 text-zinc-400 hover:text-white"
              >
                <Users size={14} />
                <span>👥 Members</span>
              </button>
            </div>
          </div>
        </div>

        {/* Admin Identity Card and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          {/* Admin Identity Card (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-6 border-2 border-orange-500/20 shadow-2xl">
              {/* Ambient premium copper/orange glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-2xl rounded-full" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-amber-500/5 blur-xl rounded-full" />
              
              <div className="flex justify-between items-start border-b border-zinc-850 pb-4">
                <div>
                  <p className="text-[9px] tracking-widest uppercase font-extrabold text-orange-500">FIT X POWER GYM • SYSTEM PASS</p>
                  <p className="text-sm font-black tracking-tight text-white mt-1 uppercase">CHIEF ADMINISTRATOR</p>
                </div>
                <div className="w-9 h-9 bg-orange-600/10 rounded border border-orange-500/20 flex items-center justify-center text-orange-500">
                  <ShieldCheck size={18} />
                </div>
              </div>

              {/* Founder/CEO Photo */}
              <div className="py-6 flex flex-col items-center text-center space-y-3">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-orange-500 bg-zinc-900 shadow-xl shadow-orange-500/5">
                  <img 
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80" 
                    alt="Deepak Sharma Gym Owner" 
                    className="w-full h-full object-cover grayscale brightness-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <span className="text-[9px] bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-0.5 rounded font-mono font-bold tracking-widest uppercase">ROOT LEVEL PRIVILEGES</span>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight mt-2">{loggedInUser.name}</h3>
                  <p className="text-zinc-500 text-xs font-mono">{loggedInUser.email}</p>
                </div>
              </div>

              {/* Secure Info Badging */}
              <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-850 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Staff ID Code:</span>
                  <span className="font-mono font-bold text-white">FTX-ADMIN-9021</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Account Access:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span>Active (ONLINE)</span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-zinc-900 pt-2 mt-1">
                  <span className="text-zinc-500">Facility Station:</span>
                  <span className="font-bold text-zinc-300">Central HQ Hub</span>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Real-Time Analytics & Quick Actions (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
              <div>
                <h3 className="text-lg font-extrabold uppercase text-white tracking-wide">System Control Desk</h3>
                <p className="text-xs text-zinc-500">Real-time indicators and operational shortcuts for facility administrators.</p>
              </div>

              {/* Grid of Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl text-center">
                  <span className="text-[9px] text-zinc-500 uppercase font-black block">Facility Members</span>
                  <span className="text-2xl font-black text-white block mt-1">{allMembers.length}</span>
                  <span className="text-[9px] text-zinc-400 font-mono block mt-1">
                    {allMembers.filter(m => m.status === 'Active').length} Active • {allMembers.filter(m => m.status === 'Expired').length} Expired
                  </span>
                </div>

                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl text-center">
                  <span className="text-[9px] text-zinc-500 uppercase font-black block">Staff Roster</span>
                  <span className="text-2xl font-black text-white block mt-1">5</span>
                  <span className="text-[9px] text-orange-400 font-mono block mt-1">Active Shifts</span>
                </div>

                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl text-center">
                  <span className="text-[9px] text-zinc-500 uppercase font-black block">Monthly Sales</span>
                  <span className="text-2xl font-black text-emerald-400 block mt-1">
                    ₹{payments.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono block mt-1">Total receipts</span>
                </div>

                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl text-center">
                  <span className="text-[9px] text-zinc-500 uppercase font-black block">Lobby Scanner</span>
                  <span className="text-sm font-mono font-bold text-orange-400 block mt-2">FTX_ACTIVE_7841</span>
                  <span className="text-[9px] text-zinc-500 block mt-1">Signature secure</span>
                </div>
              </div>

              {/* Quick Workspace Shortcuts */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Operational Shortcuts</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-zinc-950 border border-zinc-850 text-left rounded-xl space-y-2">
                    <Users size={16} className="text-orange-500" />
                    <div>
                      <p className="text-xs font-bold text-white uppercase">Staff Roster</p>
                      <p className="text-[10px] text-zinc-500 font-light mt-0.5">Manage active instructors and receptionist shifts.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-850 text-left rounded-xl space-y-2">
                    <CreditCard size={16} className="text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-white uppercase">Sales Ledger</p>
                      <p className="text-[10px] text-zinc-500 font-light mt-0.5">Analyze payments, invoice logs, and facility operational expenses.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-850 text-left rounded-xl space-y-2">
                    <ShoppingBag size={16} className="text-amber-400" />
                    <div>
                      <p className="text-xs font-bold text-white uppercase">Inventory Stock</p>
                      <p className="text-[10px] text-zinc-500 font-light mt-0.5">Review protein shake supplies and bar consumables.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Administrative Security Guidelines */}
              <div className="p-4 bg-orange-600/5 border border-orange-500/10 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-orange-500 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck size={14} />
                  <span>Security Compliance Checklist</span>
                </div>
                <ul className="text-[11px] text-zinc-400 space-y-1.5 list-disc pl-4 leading-relaxed font-light">
                  <li>Never share your Root Admin password with any unauthorized personnel.</li>
                  <li>Ensure the lobby QR tablet is refreshed once every 24 hours to prevent check-in spoofing.</li>
                  <li>Verify all manual offline cash subscriptions against physical bank receipts.</li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 text-white p-4 md:p-8 min-h-screen">
      
      {/* Admin Navigation (Only if Admin is Logged In and on Members tab) */}
      {loggedInUser?.role === 'admin' && (
        <div className="mb-8 border-b border-zinc-900 pb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">ADMINISTRATOR WORKSPACE</p>
              <h1 className="text-xl font-black text-white uppercase tracking-tight">👤 Portal Profile Manager</h1>
            </div>
            
            <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 text-xs font-bold uppercase">
              <button 
                onClick={() => setAdminMainTab('profile')}
                className={`px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 ${adminMainTab === 'profile' ? 'bg-orange-600 text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
              >
                <ShieldCheck size={14} />
                <span>💼 Admin Profile</span>
              </button>
              <button 
                onClick={() => setAdminMainTab('members')}
                className={`px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 ${adminMainTab === 'members' ? 'bg-orange-600 text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
              >
                <Users size={14} />
                <span>👥 Members</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 flex-shrink-0">
            <img src={memberToUse.photo} alt={memberToUse.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold uppercase tracking-tight text-white">{memberToUse.name}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                memberToUse.status === 'Active' 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {memberToUse.status}
              </span>
            </div>
            <p className="text-zinc-500 text-xs mt-0.5">Member ID: <span className="font-mono text-zinc-300 font-bold">{memberToUse.id}</span> • Registered: {memberToUse.joinDate}</p>
          </div>
        </div>

        {/* Quick Tabs */}
        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs font-bold uppercase w-fit">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md transition-all ${activeTab === 'overview' ? 'bg-orange-600 text-black shadow' : 'text-zinc-400 hover:text-white'}`}
          >
            My Biometrics
          </button>
          <button 
            onClick={() => setActiveTab('routines')}
            className={`px-4 py-2 rounded-md transition-all ${activeTab === 'routines' ? 'bg-orange-600 text-black shadow' : 'text-zinc-400 hover:text-white'}`}
          >
            Schedules & Diet
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 rounded-md transition-all ${activeTab === 'billing' ? 'bg-orange-600 text-black shadow' : 'text-zinc-400 hover:text-white'}`}
          >
            Invoices
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: FLOATING VIRTUAL MEM CARD & QUICK STATS */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SEARCHABLE MEMBER DIRECTORY FOR ADMIN */}
          {loggedInUser?.role === 'admin' && adminMainTab === 'members' && (
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
              <div>
                <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest block">ADMIN ACCESS</span>
                <h4 className="text-sm font-black text-white uppercase tracking-tight">🔍 Quick Member Explorer</h4>
                <p className="text-[10px] text-zinc-500">Search & select active member files to inspect metrics.</p>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
                  <input 
                    type="text"
                    placeholder="Search name or ID..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-orange-500 text-xs text-white rounded focus:outline-none"
                  />
                </div>

                <div className="flex gap-1">
                  <button 
                    onClick={() => setMemberStatusFilter('all')}
                    className={`flex-1 py-1 text-[9px] font-bold uppercase rounded border transition-all ${memberStatusFilter === 'all' ? 'border-orange-500/30 bg-orange-600/10 text-orange-400' : 'border-zinc-800 text-zinc-500'}`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setMemberStatusFilter('Active')}
                    className={`flex-1 py-1 text-[9px] font-bold uppercase rounded border transition-all ${memberStatusFilter === 'Active' ? 'border-emerald-500/30 bg-emerald-600/10 text-emerald-400' : 'border-zinc-800 text-zinc-500'}`}
                  >
                    Active
                  </button>
                  <button 
                    onClick={() => setMemberStatusFilter('Expired')}
                    className={`flex-1 py-1 text-[9px] font-bold uppercase rounded border transition-all ${memberStatusFilter === 'Expired' ? 'border-red-500/30 bg-red-600/10 text-red-400' : 'border-zinc-800 text-zinc-500'}`}
                  >
                    Expired
                  </button>
                </div>

                {/* List container */}
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 border-t border-zinc-850 pt-2">
                  {allMembers
                    .filter(m => {
                      const matchesSearch = m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) || m.id.toLowerCase().includes(memberSearchQuery.toLowerCase());
                      const matchesStatus = memberStatusFilter === 'all' || m.status === memberStatusFilter;
                      return matchesSearch && matchesStatus;
                    })
                    .map(m => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMemberId(m.id)}
                        className={`w-full p-2 rounded text-left flex items-center justify-between transition-all ${
                          m.id === selectedMemberId 
                            ? 'bg-orange-600/10 border border-orange-500 text-white' 
                            : 'bg-zinc-950/40 border border-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img src={m.photo} alt={m.name} className="w-5 h-5 rounded-full object-cover" />
                          <span className="text-xs font-bold truncate uppercase">{m.name}</span>
                        </div>
                        <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* DIGITAL CARD (Apple wallet styled) */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-6 border-2 border-zinc-800 shadow-2xl">
            {/* Ambient orange glow inside */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 blur-2xl rounded-full" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-amber-500/10 blur-xl rounded-full" />
            
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] tracking-widest uppercase font-extrabold text-orange-500">FIT X GYM • MEMBERSHIP PASS</p>
                <p className="text-lg font-black tracking-tight text-white mt-1 uppercase">{memberPlan?.name || 'MEMBER PLAN'}</p>
              </div>
              <div className="w-10 h-10 bg-zinc-900/80 rounded border border-zinc-800 flex items-center justify-center text-orange-500">
                <Flame size={20} />
              </div>
            </div>

            {/* User-friendly Check-In ID Badge */}
            <div className="py-4 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-4 bg-zinc-950/95 rounded-xl border border-zinc-800 w-full flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
                <span className="text-[9px] uppercase tracking-widest font-black text-orange-500 block">CARD ID PASS</span>
                <span className="text-2xl font-mono font-black text-white tracking-widest mt-1">{memberToUse.id}</span>
                <p className="text-[9px] text-zinc-500 mt-1 font-bold">TYPE ID AT FRONT CHECK-IN TABLET</p>
              </div>
            </div>

            {/* Plan details and Days Remaining */}
            <div className="py-2 flex flex-col space-y-3">
              <div className="p-4 bg-zinc-950/90 rounded-xl border border-zinc-850 w-full flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
                <div>
                  <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500 block">MEMBERSHIP DETAILS</span>
                  <span className="text-xs font-black text-white block mt-1">{memberPlan?.name || 'Active Package'}</span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">{memberPlan?.duration || '1 Month'} • Access granted</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500 block">PLAN PRICE</span>
                  <span className="text-xs font-black text-orange-500 block mt-1">₹{(memberPlan?.price || 0).toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Paid</span>
                </div>
              </div>

              <div className="p-4 bg-orange-600/5 rounded-xl border border-orange-500/10 w-full flex justify-between items-center">
                <div>
                  <span className="text-[9px] uppercase tracking-widest font-bold text-orange-500 block">DAYS REMAINING</span>
                  <span className="text-lg font-black text-white mt-1 block">{daysRemaining} Days</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500 block">EXPIRY DATE</span>
                  <span className="text-xs font-bold text-zinc-300 mt-1 block">{memberToUse.expiryDate}</span>
                </div>
              </div>
            </div>

            {daysRemaining <= 15 && (
              <button 
                onClick={() => setIsRenewing(true)}
                className="w-full mt-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-black font-extrabold uppercase tracking-wider text-[10px] rounded shadow-lg shadow-orange-500/10"
              >
                RENEW MEMBERSHIP NOW
              </button>
            )}
          </div>

          {/* QUICK BIOMETRIC SUMMARY CHIPS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold block mb-1">Body Mass Index (BMI)</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{memberToUse.bmi}</span>
                <span className="text-xs text-orange-500 font-bold uppercase">Healthy</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold block mb-1">Body Fat Percentage</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{memberToUse.bodyFat}%</span>
                <span className="text-xs text-zinc-400 uppercase">Tracked</span>
              </div>
            </div>
          </div>

          {/* ANNOUNCEMENT BOARD */}
          <div className="p-5 rounded-xl bg-orange-500/5 border border-orange-500/10 space-y-3">
            <div className="flex items-center gap-1.5 text-orange-500 font-bold uppercase text-[10px] tracking-widest">
              <Sparkles size={14} />
              <span>GYM BROADCASTS & ALERTS</span>
            </div>
            <ul className="space-y-2 text-xs">
              <li className="p-2.5 bg-zinc-900/60 rounded border border-zinc-800/80">
                <p className="font-bold text-white">🏋️ Internal Powerlifting Meet on Sunday</p>
                <p className="text-[10px] text-zinc-500 mt-1">Starting 09:00 AM. Cash rewards up to ₹15,000. Register with receptionist Neha!</p>
              </li>
              <li className="p-2.5 bg-zinc-900/60 rounded border border-zinc-800/80">
                <p className="font-bold text-white">🚿 Scheduled Maintenance: Locker Rooms</p>
                <p className="text-[10px] text-zinc-500 mt-1">Locker rooms professional sanitization scheduled on Thursday 1 PM to 3 PM.</p>
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: MAIN CONTENT TABS */}
        <div className="lg:col-span-8">
          
          {/* TAB 1: OVERVIEW & BIOMETRIC CHART */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* WEIGHT HISTORY GRAPH AREA */}
              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/60 pb-4">
                  <div>
                    <h3 className="text-lg font-bold uppercase text-white flex items-center gap-2">
                      <Activity size={18} className="text-orange-500" />
                      <span>Weight Regression Logs</span>
                    </h3>
                    <p className="text-xs text-zinc-500">Your historical progress towards target weight criteria.</p>
                  </div>

                  {/* Toggle progress logging form */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowProgressForm(!showProgressForm)}
                      className="px-3 py-1.5 rounded bg-orange-600 text-black hover:bg-orange-500 font-extrabold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1"
                    >
                      <span>Log Body Progress</span>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {showProgressForm && (
                  <form onSubmit={handleSaveProgress} className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-4">
                    <h4 className="text-xs font-black text-orange-500 uppercase tracking-widest">Add New Biometrics Entry</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase font-bold">WEIGHT (KG)</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          required
                          placeholder="e.g. 74.5" 
                          value={newWeight}
                          onChange={(e) => setNewWeight(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 text-white rounded text-xs focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase font-bold">CHEST (INCH)</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          placeholder="e.g. 39" 
                          value={newChest}
                          onChange={(e) => setNewChest(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 text-white rounded text-xs focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase font-bold">BICEPS (INCH)</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          placeholder="e.g. 14.5" 
                          value={newBiceps}
                          onChange={(e) => setNewBiceps(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 text-white rounded text-xs focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase font-bold">WAIST (INCH)</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          placeholder="e.g. 31" 
                          value={newWaist}
                          onChange={(e) => setNewWaist(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 text-white rounded text-xs focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase font-bold">THIGHS (INCH)</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          placeholder="e.g. 21.5" 
                          value={newThighs}
                          onChange={(e) => setNewThighs(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 text-white rounded text-xs focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 text-xs">
                      <button 
                        type="button" 
                        onClick={() => setShowProgressForm(false)}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 font-bold"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-black font-black uppercase rounded"
                      >
                        Save Entries
                      </button>
                    </div>
                  </form>
                )}

                <div className="aspect-[12/5] w-full flex items-center justify-center">
                  {renderWeightChart()}
                </div>
              </div>

              {/* PHYSICAL MEASUREMENTS HISTORY GRID */}
              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                <h3 className="text-lg font-bold uppercase text-white">Physical Body Dimensions (cm)</h3>
                <p className="text-xs text-zinc-500">Compare your dimensions between the first day and the current week assessment.</p>
                
                {memberToUse.measurementsHistory.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800/80 text-center">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Chest size</span>
                      <span className="text-xl font-bold text-white block mt-1">{memberToUse.measurementsHistory[memberToUse.measurementsHistory.length - 1].chest} in</span>
                      <span className="text-[10px] text-emerald-400 font-bold block mt-1">
                        +{memberToUse.measurementsHistory[memberToUse.measurementsHistory.length - 1].chest - (memberToUse.measurementsHistory[0].chest || 0)} in gained
                      </span>
                    </div>
                    <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800/80 text-center">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Biceps flexed</span>
                      <span className="text-xl font-bold text-white block mt-1">{memberToUse.measurementsHistory[memberToUse.measurementsHistory.length - 1].biceps} in</span>
                      <span className="text-[10px] text-emerald-400 font-bold block mt-1">
                        +{memberToUse.measurementsHistory[memberToUse.measurementsHistory.length - 1].biceps - (memberToUse.measurementsHistory[0].biceps || 0)} in gained
                      </span>
                    </div>
                    <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800/80 text-center">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Waistline</span>
                      <span className="text-xl font-bold text-white block mt-1">{memberToUse.measurementsHistory[memberToUse.measurementsHistory.length - 1].waist} in</span>
                      <span className="text-[10px] text-green-400 font-bold block mt-1">
                        {memberToUse.measurementsHistory[memberToUse.measurementsHistory.length - 1].waist - (memberToUse.measurementsHistory[0].waist || 0)} in shred
                      </span>
                    </div>
                    <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800/80 text-center">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Thigh width</span>
                      <span className="text-xl font-bold text-white block mt-1">{memberToUse.measurementsHistory[memberToUse.measurementsHistory.length - 1].thighs} in</span>
                      <span className="text-[10px] text-emerald-400 font-bold block mt-1">
                        +{memberToUse.measurementsHistory[memberToUse.measurementsHistory.length - 1].thighs - (memberToUse.measurementsHistory[0].thighs || 0)} in gained
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 bg-zinc-950 rounded-lg text-center text-xs text-zinc-500 border border-zinc-800">
                    No physical measurements recorded yet. Ask Coach Siddharth during your next attendance to update your dimensional matrix.
                  </div>
                )}
              </div>

              {/* PROGRESS PHOTO JOURNAL */}
              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/60 pb-4">
                  <div>
                    <h3 className="text-lg font-bold uppercase text-white">Progress Photo Journal</h3>
                    <p className="text-xs text-zinc-500">Log visual milestones to track your physique definition gains.</p>
                  </div>
                  <div>
                    <label className="px-4 py-2 rounded bg-orange-600 text-black hover:bg-orange-500 font-extrabold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer">
                      <span>Add Progress Photo</span>
                      <Plus size={14} />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleProgressPhotoUpload} 
                      />
                    </label>
                  </div>
                </div>

                {(memberToUse.progressImages && memberToUse.progressImages.length > 0) ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {memberToUse.progressImages.map((img, index) => (
                      <div key={index} className="aspect-[3/4] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 group relative">
                        <img 
                          src={img} 
                          alt={`Progress Photo ${index + 1}`} 
                          className="w-full h-full object-cover grayscale opacity-85 hover:grayscale-0 hover:opacity-100 hover:scale-105 transition-all duration-300"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/80 px-2 py-1.5 flex justify-between items-center text-[10px] text-zinc-400">
                          <span>Log #{memberToUse.progressImages!.length - index}</span>
                          <button 
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this progress photo?")) {
                                const updatedImages = memberToUse.progressImages!.filter((_, i) => i !== index);
                                onUpdateMember({
                                  ...memberToUse,
                                  progressImages: updatedImages
                                });
                              }
                            }}
                            className="text-red-500 hover:text-red-400 font-bold"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-zinc-950 rounded-lg text-center text-xs text-zinc-500 border border-zinc-800">
                    No progress photos uploaded yet. Click "Add Progress Photo" above to upload your first physique check-in!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ROUTINES - WORKOUTS & DIET PLANS */}
          {activeTab === 'routines' && (
            <div className="space-y-6">
              
              {/* WORKOUT PLAN CARD */}
              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
                  <div>
                    <h3 className="text-lg font-bold uppercase text-white flex items-center gap-2">
                      <Dumbbell size={20} className="text-orange-500" />
                      <span>Customized Training split</span>
                    </h3>
                    <p className="text-xs text-zinc-500">Check off exercises as you complete your daily active routine.</p>
                  </div>
                  <span className="px-2 py-0.5 bg-orange-600/10 border border-orange-600/20 text-[10px] text-orange-500 font-bold uppercase rounded">
                    PHASE 2 INTENSITY
                  </span>
                </div>

                {memberToUse.workoutPlan.length > 0 ? (
                  <div className="space-y-6">
                    {memberToUse.workoutPlan.map((day, dayIdx) => (
                      <div key={dayIdx} className="space-y-3">
                        <div className="p-3 bg-zinc-950 rounded border border-zinc-800 flex justify-between items-center">
                          <span className="text-sm font-bold text-white uppercase">{day.day}</span>
                          <span className="text-xs text-orange-400 font-semibold">{day.workout}</span>
                        </div>

                        <ul className="divide-y divide-zinc-950 bg-zinc-950/40 rounded border border-zinc-800/60 overflow-hidden text-xs">
                          {day.exercises.map((ex, exIdx) => (
                            <li key={exIdx} className="p-3.5 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => handleToggleExercise(dayIdx, exIdx)}
                                  className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                    ex.completed 
                                      ? 'bg-orange-600 border-orange-600 text-black' 
                                      : 'border-zinc-800 hover:border-zinc-600 text-transparent'
                                  }`}
                                >
                                  ✓
                                </button>
                                <span className={`font-semibold ${ex.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                                  {ex.name}
                                </span>
                              </div>
                              <span className="text-zinc-500 font-mono text-[10px]">{ex.sets}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-zinc-950 rounded-lg text-center text-xs text-zinc-500 border border-zinc-800">
                    No active workout training plan assigned. Consult your assigned coach to compile your workout sheets.
                  </div>
                )}
              </div>

              {/* DIET SHEET CARD */}
              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
                  <div>
                    <h3 className="text-lg font-bold uppercase text-white flex items-center gap-2">
                      <Flame size={20} className="text-orange-500" />
                      <span>Customized Diet & Nutrition Program</span>
                    </h3>
                    <p className="text-xs text-zinc-500">Macronutrients customized daily for optimal muscle recovery.</p>
                  </div>
                </div>

                {memberToUse.dietPlan.length > 0 ? (
                  <div className="space-y-4">
                    {memberToUse.dietPlan.map((meal, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white uppercase">{meal.meal}</span>
                          <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 font-mono text-[10px] border border-zinc-800">{meal.time}</span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {meal.items.map((item, id) => (
                            <span key={id} className="px-2.5 py-1 bg-zinc-900 text-zinc-300 text-[10px] rounded border border-zinc-800/80">
                              {item}
                            </span>
                          ))}
                        </div>

                        {/* Macros breakdown */}
                        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-zinc-900/60 text-[10px] font-mono text-zinc-500">
                          <div>Protein: <span className="text-emerald-400 font-bold">{meal.macros.protein}g</span></div>
                          <div>Carbs: <span className="text-amber-400 font-bold">{meal.macros.carbs}g</span></div>
                          <div>Fats: <span className="text-red-400 font-bold">{meal.macros.fats}g</span></div>
                          <div className="text-right">Calories: <span className="text-white font-bold">{meal.macros.calories} kcal</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-zinc-950 rounded-lg text-center text-xs text-zinc-500 border border-zinc-800">
                    No active dietary sheet assigned. Ask our certified Nutritionist to construct your calorie profiles.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: BILLING / INVOICES */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              
              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                <h3 className="text-lg font-bold uppercase text-white">Financial Receipts & Invoices</h3>
                <p className="text-xs text-zinc-500 font-light">Download receipt copies and track paid transactions with Fit X Gym.</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest text-[10px] font-bold">
                        <th className="py-3">Invoice No</th>
                        <th className="py-3">Billing Date</th>
                        <th className="py-3">Payment Source</th>
                        <th className="py-3">Category</th>
                        <th className="py-3 text-right">Amount</th>
                        <th className="py-3 text-center">Status</th>
                        <th className="py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
                      {memberPayments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-zinc-950/40">
                          <td className="py-3 font-mono font-bold text-zinc-400">{pay.invoiceNo}</td>
                          <td className="py-3 font-light">{pay.date}</td>
                          <td className="py-3 font-semibold">{pay.paymentMethod}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 bg-zinc-950 text-zinc-400 border border-zinc-800 rounded">
                              {pay.category}
                            </span>
                          </td>
                          <td className="py-3 text-right font-bold text-white">₹{pay.amount.toLocaleString('en-IN')}</td>
                          <td className="py-3 text-center">
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold uppercase">
                              {pay.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button 
                              onClick={() => {
                                alert(`Downloading receipt: ${pay.invoiceNo}\nMember: ${memberToUse.name}\nAmount: ₹${pay.amount}\nDate: ${pay.date}`);
                              }}
                              className="px-2 py-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded flex items-center gap-1 text-[10px] font-bold float-right"
                            >
                              <Download size={10} />
                              <span>PDF</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* RENEW MEMBERSHIP DIALOG MODAL */}
      {isRenewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-xl max-w-md w-full space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold uppercase text-white">Renew Membership Portal</h3>
                <p className="text-xs text-zinc-500 mt-1">Select a premium package to seamlessly extend your access duration.</p>
              </div>
              <button 
                onClick={() => setIsRenewing(false)}
                className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">CHOOSE PACKAGE TIER</label>
                <select 
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500 rounded"
                >
                  {MEMBERSHIP_PLANS.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name} ({plan.duration}) — ₹{plan.price.toLocaleString('en-IN')}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">SELECT PAYMENT SOURCE</label>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button 
                    type="button"
                    onClick={() => setRenewMethod('UPI')}
                    className={`py-3 px-4 border rounded text-center font-bold ${renewMethod === 'UPI' ? 'border-orange-500 bg-orange-600/5 text-orange-400' : 'border-zinc-800 text-zinc-400'}`}
                  >
                    UPI / QR Code Scan
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRenewMethod('Card')}
                    className={`py-3 px-4 border rounded text-center font-bold ${renewMethod === 'Card' ? 'border-orange-500 bg-orange-600/5 text-orange-400' : 'border-zinc-800 text-zinc-400'}`}
                  >
                    Credit / Debit Card
                  </button>
                </div>
              </div>

              <div className="p-4 bg-zinc-950 rounded border border-zinc-850/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Selected Package:</span>
                  <span className="font-bold text-white">{MEMBERSHIP_PLANS.find(p => p.id === selectedPlanId)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Duration Added:</span>
                  <span className="font-bold text-white">{MEMBERSHIP_PLANS.find(p => p.id === selectedPlanId)?.duration}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-900 font-bold text-sm">
                  <span className="text-zinc-400">Total Payable Dues:</span>
                  <span className="text-orange-500">₹{MEMBERSHIP_PLANS.find(p => p.id === selectedPlanId)?.price.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button 
                onClick={handleRenewSubmit}
                disabled={renewingState}
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 text-black font-extrabold uppercase tracking-wider text-xs rounded transition-all disabled:opacity-50"
              >
                {renewingState ? 'CONNECTING GATEWAY...' : 'CONFIRM PAYMENT & EXTEND'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
