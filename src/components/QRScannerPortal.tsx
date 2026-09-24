import React, { useState } from 'react';
import { Member, AttendanceRecord } from '../types';
import { QrCode, Scan, Users, Flame, CheckCircle, AlertTriangle, ArrowRightLeft, Clock, MapPin, RefreshCw, Smartphone, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QRScannerPortalProps {
  members: Member[];
  attendance: AttendanceRecord[];
  lobbyToken: string;
  onRefreshLobbyToken: () => void;
  onCheckInSuccess: (memberId: string, timestamp: string) => void;
  onCheckOutSuccess: (memberId: string, timestamp: string, duration: number) => void;
}

export default function QRScannerPortal({ 
  members, 
  attendance, 
  lobbyToken,
  onRefreshLobbyToken,
  onCheckInSuccess, 
  onCheckOutSuccess 
}: QRScannerPortalProps) {
  const [memberIdInput, setMemberIdInput] = useState('');
  const [scanStatus, setScanStatus] = useState<{ status: 'success' | 'error' | 'idle'; message: string }>({ status: 'idle', message: '' });
  const [isScanning, setIsScanning] = useState(false);

  // Check which members are currently inside the gym (have a checkIn today but NO checkOut)
  const isMemberInside = (memberId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const record = attendance.find(
      r => r.memberId === memberId && r.date === today && r.checkOut === undefined
    );
    return !!record;
  };

  const handleLobbyCheckAction = (memberIdToScan: string) => {
    if (!memberIdToScan) return;
    
    // Normalize and search
    const cleanId = memberIdToScan.trim().toUpperCase();
    const member = members.find(m => m.id.toUpperCase() === cleanId || m.phone === cleanId);
    
    if (!member) {
      setScanStatus({ status: 'error', message: `ERROR: UNKNOWN ID "${cleanId}". Please register or check your profile for your exact ID.` });
      return;
    }

    if (member.status === 'Expired') {
      setScanStatus({ status: 'error', message: `ACCESS DENIED: ${member.name}'s membership expired on ${member.expiryDate}. Please renew first!` });
      return;
    }

    setIsScanning(true);
    setScanStatus({ status: 'idle', message: '' });

    setTimeout(() => {
      setIsScanning(false);
      const now = new Date();
      const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const currentlyInside = isMemberInside(member.id);

      if (currentlyInside) {
        // Log Check Out: calculate duration
        const workoutMinutes = Math.floor(45 + Math.random() * 75);
        onCheckOutSuccess(member.id, formattedTime, workoutMinutes);
        setScanStatus({
          status: 'success',
          message: `CHECK-OUT SUCCESSFUL: Goodbye ${member.name}! Worked out for ${workoutMinutes} mins. Recover well!`
        });
      } else {
        // Log Check In
        onCheckInSuccess(member.id, formattedTime);
        setScanStatus({
          status: 'success',
          message: `ACCESS GRANTED: Welcome back ${member.name}! Checked in at ${formattedTime}. Have an intense workout!`
        });
      }
      setMemberIdInput('');
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLobbyCheckAction(memberIdInput);
  };

  // Currently Inside Gym Lobby list
  const insideMembers = members.filter(m => isMemberInside(m.id));

  return (
    <div className="bg-zinc-950 text-white p-4 md:p-8 min-h-screen">
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: ACTIVE SCANNER SIMULATOR SCREEN */}
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-850 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
          
          <div className="space-y-2 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2 text-orange-500 font-bold text-xs uppercase tracking-widest">
              <QrCode className="animate-pulse" size={16} />
              <span>LOBBY POSTER CHECK-IN STATION</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">Fit X Gym Lobby Poster</h2>
            <p className="text-xs text-zinc-500">Scan this single lobby QR code from your phone or enter your member ID below to check in and check out.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* BIG SINGLE LOBBY POSTER QR CARD (1 QR Pattern) */}
            <div className="md:col-span-6 bg-gradient-to-b from-zinc-950 to-zinc-900 border-2 border-orange-500/30 rounded-2xl p-6 flex flex-col items-center text-center shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/5 blur-2xl rounded-full" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-amber-500/5 blur-xl rounded-full" />

              <span className="text-[9px] uppercase tracking-widest font-black text-orange-500">FIT X GYM OFFICIAL</span>
              <p className="text-xs font-black text-white uppercase mt-0.5 tracking-wider">Lobby Entry Poster</p>
              
              {/* QR Code Container */}
              <div className="my-5 p-4 bg-white rounded-xl border-4 border-zinc-950 relative shadow-inner">
                <QrCode size={135} className="text-black" />
                <div className="absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-orange-500 to-amber-500 animate-bounce" />
              </div>

              {/* Monospace token signatures */}
              <div className="p-2 bg-zinc-950/80 rounded border border-zinc-850 w-full text-center space-y-1">
                <p className="text-[8px] uppercase text-zinc-500 font-bold font-mono">SECURE LOBBY SIGNATURE</p>
                <p className="text-[10px] text-orange-400 font-mono font-bold tracking-wider">{lobbyToken}</p>
              </div>

              {/* Quick Admin Refresh rotation trigger */}
              <button 
                onClick={onRefreshLobbyToken}
                className="mt-4 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[9px] font-black uppercase text-zinc-400 hover:text-white rounded transition-all"
                title="Rotate/Refresh secure Lobby Token to invalidate screenshots"
              >
                <RefreshCw size={10} className="animate-spin-slow text-orange-500" />
                <span>Rotate Lobby Token</span>
              </button>
            </div>

            {/* INTERACTIVE SELF-CHECKOUT TERMINAL */}
            <div className="md:col-span-6 space-y-4">
              <div className="p-5 bg-zinc-950 rounded-xl border border-zinc-850 space-y-3">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  <Smartphone size={14} className="text-orange-500" />
                  <span>Kiosk Self-Terminal</span>
                </div>
                <h3 className="text-xs font-black uppercase text-white tracking-wide">Scan Confirmation Phone Screen</h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Enter your unique Member ID (e.g., <span className="font-mono text-white font-bold">MEM-101</span>, <span className="font-mono text-white font-bold">MEM-102</span>) or registered Phone Number to record check-in/out.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-zinc-500 font-black tracking-widest">ENTER MEMBER ID / PHONE</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. MEM-101" 
                      value={memberIdInput}
                      onChange={(e) => setMemberIdInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none font-mono placeholder:text-zinc-600 font-bold"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isScanning || !memberIdInput.trim()}
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-black font-extrabold uppercase tracking-wider text-[10px] rounded transition-all flex items-center justify-center gap-1.5 shadow shadow-orange-600/10"
                  >
                    <Scan size={12} />
                    <span>Confirm Attendance Slot</span>
                  </button>
                </form>
              </div>

              {/* QUICK CHIP SELECT FOR EASY SIMULATION/DEMONSTRATION */}
              <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-900 space-y-2">
                <span className="text-[9px] uppercase text-zinc-500 font-bold block tracking-wider">Quick Select (Simulation helper):</span>
                <div className="flex flex-wrap gap-1.5">
                  {members.slice(0, 5).map(m => (
                    <button 
                      key={m.id}
                      onClick={() => setMemberIdInput(m.id)}
                      className={`px-2 py-1 text-[10px] rounded border transition-all font-mono ${memberIdInput === m.id ? 'bg-orange-600/10 border-orange-500 text-orange-400' : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-white'}`}
                    >
                      {m.id} ({m.name.split(' ')[0]})
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* SCREEN DISPLAY FEEDBACK HUD */}
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-850 font-mono text-xs min-h-[56px] flex items-center justify-center relative overflow-hidden">
            <AnimatePresence mode="wait">
              {isScanning ? (
                <motion.div 
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-orange-500 text-center text-[11px] flex items-center gap-2 animate-pulse"
                >
                  <Scan size={14} className="animate-spin text-orange-500" />
                  <span>DECRYPTING SECURE TOKEN BLOCK AND WEIGHT METRICS...</span>
                </motion.div>
              ) : scanStatus.status === 'success' ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-emerald-400 text-center text-[11px] flex items-center gap-2"
                >
                  <CheckCircle size={15} className="flex-shrink-0 text-emerald-400" />
                  <span>{scanStatus.message}</span>
                </motion.div>
              ) : scanStatus.status === 'error' ? (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-center text-[11px] flex items-center gap-2"
                >
                  <AlertTriangle size={15} className="flex-shrink-0 text-red-500 animate-bounce" />
                  <span>{scanStatus.message}</span>
                </motion.div>
              ) : (
                <motion.p 
                  key="idle"
                  className="text-zinc-500 text-center text-[10px]"
                >
                  AWAITING LOBBY SCAN DISPATCH. SCAN POSTER WITH MOBILE OR TYPE YOUR MEMBER ID.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* RIGHT COLUMN: WHO'S CURRENTLY INSIDE THE GYM */}
        <div className="lg:col-span-5 bg-zinc-900 border border-zinc-850 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-lg font-bold uppercase text-white flex items-center gap-2">
                <Users size={18} className="text-orange-500" />
                <span>Active Lobby Occupants</span>
              </h3>
              <p className="text-[11px] text-zinc-500">Live feed of members currently sweating on the workout floor.</p>
            </div>
            <span className="px-2 py-1 bg-orange-600/10 border border-orange-600/20 text-xs font-black text-orange-400 rounded-full">
              {insideMembers.length} INSIDE
            </span>
          </div>

          {/* OCCUPANTS LIST */}
          {insideMembers.length > 0 ? (
            <div className="divide-y divide-zinc-950 max-h-[440px] overflow-y-auto pr-2 scrollbar-thin">
              {insideMembers.map((member) => {
                const today = new Date().toISOString().split('T')[0];
                const record = attendance.find(
                  r => r.memberId === member.id && r.date === today && r.checkOut === undefined
                );

                return (
                  <div key={member.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-850 bg-zinc-950 flex-shrink-0">
                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs uppercase text-white">{member.name}</h4>
                        <p className="text-[10px] text-zinc-500 font-mono">Member ID: {member.id}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end text-[10px] text-emerald-400 font-semibold uppercase">
                        <Clock size={10} />
                        <span>Entered: {record?.checkIn || '06:00 AM'}</span>
                      </div>
                      <p className="text-[9px] text-zinc-500 mt-0.5">Biometrics: {member.weightHistory[member.weightHistory.length - 1]?.weight} kg</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <Users size={32} className="text-zinc-700 mx-auto animate-pulse" />
              <p className="text-zinc-500 text-xs font-light">The gym lobby is currently unoccupied.<br />Confirm attendance slots on the left to check in members!</p>
            </div>
          )}
          
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850/60 flex items-start gap-3">
            <ArrowRightLeft size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-[10px] text-zinc-500 leading-relaxed">
              <p className="text-zinc-400 font-bold uppercase text-[9px] tracking-wider text-orange-400">STAFF LOBBY NOTICE</p>
              Once members check out, their workout durations are computed automatically and logged in the Cash ledger and attendance analysis tabs on the Admin Dashboard.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
