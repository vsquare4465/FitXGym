import React, { useState, useRef } from 'react';
import { Plan, Member } from '../types';
import { MEMBERSHIP_PLANS } from '../data/mockData';
import { User, Phone, Mail, Award, Clipboard, ShieldCheck, Heart, Users, CreditCard, ChevronRight, CheckCircle2, QrCode, Camera, Upload, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RegistrationPortalProps {
  plans?: Plan[];
  onRegisterSuccess: (newMember: Member, planPrice: number, paymentMethod: 'UPI' | 'Card' | 'Cash') => void | Promise<void>;
  preSelectedPlanId?: string;
}

export default function RegistrationPortal({ plans = [], onRegisterSuccess, preSelectedPlanId }: RegistrationPortalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80');
  const [idProof, setIdProof] = useState('');
  const [password, setPassword] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState(preSelectedPlanId || 'plan_quarterly');
  const [registerWithoutPlan, setRegisterWithoutPlan] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Cash'>('UPI');
  const [isPaying, setIsPaying] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  // Camera integration states
  const [cameraActive, setCameraActive] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // Registration Complete Welcome Screen
  const [registeredMember, setRegisteredMember] = useState<Member | null>(null);

  const activePlansList = plans.length > 0 ? plans : MEMBERSHIP_PLANS;

  const selectedPlan = activePlansList.find(p => p.id === selectedPlanId) || activePlansList[1] || activePlansList[0];

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300 } });
      setVideoStream(stream);
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera access failed", err);
      alert("Could not access camera. Please select or choose a file instead.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 300, 300);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    setVideoStream(null);
    setCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!name || !email || !phone) return;
      
      let isValid = true;
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError('Please enter a valid email address (e.g., name@domain.com)');
        isValid = false;
      } else {
        setEmailError('');
      }

      // Phone validation
      const phoneDigits = phone.replace(/[\s\-\(\)\+]/g, '');
      const phoneRegex = /^[0-9]{10,15}$/;
      if (!phoneRegex.test(phoneDigits)) {
        setPhoneError('Please enter a valid phone number (10 to 15 digits)');
        isValid = false;
      } else {
        setPhoneError('');
      }

      if (!isValid) return;
      setStep(2);
    } else if (step === 2) {
      // Emergency contact should not be mandatory
      setStep(3);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPaying(true);

    setTimeout(async () => {
      const generatedId = `MEM-${Math.floor(1000 + Math.random() * 9000)}`;
      const qrValue = `FITX_${generatedId}`;

      const today = new Date();
      const formattedToday = today.toISOString().split('T')[0];
      
      // Calculate expiry date based on plan
      let expiryMonths = 1;
      if (selectedPlanId.includes('quarterly')) expiryMonths = 3;
      else if (selectedPlanId.includes('half_yearly')) expiryMonths = 6;
      else if (selectedPlanId.includes('annual')) expiryMonths = 12;
      
      const expiryDate = new Date();
      expiryDate.setMonth(today.getMonth() + expiryMonths);
      const formattedExpiry = expiryDate.toISOString().split('T')[0];

      const finalPlanId = registerWithoutPlan ? 'no_plan' : selectedPlanId;
      const finalStatus = registerWithoutPlan ? 'Pending' : 'Active';
      const finalExpiry = registerWithoutPlan ? formattedToday : formattedExpiry;
      const finalPrice = registerWithoutPlan ? 0 : selectedPlan.price;

      const newMember: Member = {
        id: generatedId,
        name,
        email,
        phone,
        password: password || '123456',
        photo: photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        joinDate: formattedToday,
        expiryDate: finalExpiry,
        planId: finalPlanId,
        status: finalStatus,
        emergencyContact: {
          name: emergencyName,
          phone: emergencyPhone,
          relationship: emergencyRelation
        },
        medicalHistory: medicalNotes ? [medicalNotes] : ['None'],
        idProofUrl: idProof || 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop&q=80',
        qrCodeValue: qrValue,
        weightHistory: [
          { date: today.toLocaleString('en-US', { month: 'short', day: '2-digit' }), weight: 75.0 }
        ],
        measurementsHistory: [],
        bmi: 24.5,
        bodyFat: 19.5,
        workoutPlan: [
          {
            day: 'Monday',
            workout: 'Standard Full Body Conditioning',
            exercises: [
              { name: 'Goblet Squat', sets: '3 Sets x 12 Reps' },
              { name: 'Push-Ups (Chest Focus)', sets: '3 Sets x Max Reps' },
              { name: 'Seated Cable Lat Pull-down', sets: '3 Sets x 10 Reps' },
              { name: 'Dumbbell Hammer Curls', sets: '3 Sets x 12 Reps' }
            ]
          }
        ],
        dietPlan: [
          {
            meal: 'Breakfast',
            time: '08:30 AM',
            items: ['3 Boiled Egg Whites', '1 Bowl Oatmeal', '1 Apple'],
            macros: { protein: 24, carbs: 32, fats: 4, calories: 260 }
          }
        ],
        messages: [
          { id: 'welcome', sender: 'Trainer', text: `Welcome to Fit X Gym, ${name}! Your membership registration is received. Let me know when you are visiting next for your physical assessment.`, timestamp: new Date().toISOString() }
        ]
      };

      try {
        await onRegisterSuccess(newMember, finalPrice, registerWithoutPlan ? 'Cash' : paymentMethod);
        setRegisteredMember(newMember);
      } catch {
        alert('Registration could not be saved. Please try again or contact the gym.');
      } finally {
        setIsPaying(false);
        stopCamera();
      }
    }, 2000);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setIdProof('');
    setPassword('');
    setEmergencyName('');
    setEmergencyPhone('');
    setEmergencyRelation('');
    setMedicalNotes('');
    setRegisterWithoutPlan(false);
    setStep(1);
    setRegisteredMember(null);
    stopCamera();
  };

  return (
    <div className="bg-zinc-950 text-white p-4 md:p-8 min-h-screen flex items-center justify-center">
      
      {/* 1. SUCCESS WELCOME CARD */}
      {registeredMember ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-lg w-full text-center space-y-6 shadow-2xl"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black uppercase text-white">Welcome to the Club!</h2>
            <p className="text-zinc-400 text-xs">Your Fit X Gym membership has been registered. Welcome email and QR copy dispatched.</p>
          </div>

          {/* Member Card Details */}
          <div className="p-5 bg-zinc-950 rounded-xl border border-zinc-850 space-y-4">
            <div className="flex gap-4 text-left">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-zinc-800 flex-shrink-0 bg-zinc-900">
                <img src={registeredMember.photo} alt="Member photo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white uppercase">{registeredMember.name}</h4>
                <p className="text-[10px] text-zinc-500 font-mono">Member ID: {registeredMember.id}</p>
                <p className="text-xs text-orange-400 font-bold mt-1">{selectedPlan.name} • {selectedPlan.duration}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-900 flex flex-col items-center justify-center space-y-2">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">YOUR ATTENDANCE QR CODE</span>
              <div className="p-3 bg-white rounded-lg">
                <QrCode size={100} className="text-black" />
              </div>
              <span className="font-mono text-[10px] text-zinc-400 tracking-widest">{registeredMember.qrCodeValue}</span>
              <p className="text-[9px] text-zinc-500 max-w-[280px]">Save or screenshot this QR code. Present it at the front lobby scanner to log your check-ins and check-outs.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={resetForm}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 font-bold uppercase tracking-wider text-xs rounded transition-all"
            >
              Register Another Member
            </button>
          </div>
        </motion.div>
      ) : (
        
        /* 2. REGISTRATION WORKFLOW WIZARD */
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl">
          
          {/* Header */}
          <div className="border-b border-zinc-800/60 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <div className="flex items-center gap-2 text-orange-500 font-bold text-xs uppercase tracking-widest">
                <ShieldCheck size={14} className="animate-pulse" />
                <span>ONLINE PORTAL REGISTRATION</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mt-1">Get Your Membership ID</h2>
            </div>

            {/* Stepper tracker dots */}
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              <span className={step === 1 ? 'text-orange-500' : 'text-zinc-300'}>1. Bio</span>
              <span className="text-zinc-700">➔</span>
              <span className={step === 2 ? 'text-orange-500' : 'text-zinc-300'}>2. Health</span>
              <span className="text-zinc-700">➔</span>
              <span className={step === 3 ? 'text-orange-500' : 'text-zinc-300'}>3. Plan</span>
            </div>
          </div>

          {/* Form bodies */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            
            {/* STEP 1: BIO AND DOCUMENT COPIES */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">FULL NAME</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                      <input 
                        type="text" 
                        required
                        placeholder="E.g., Vaishali Varshney" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">PHONE NUMBER</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                      <input 
                        type="tel" 
                        required
                        placeholder="+91 XXXXX XXXXX" 
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (phoneError) setPhoneError('');
                        }}
                        className={`w-full pl-10 pr-4 py-3 bg-zinc-950 border ${phoneError ? 'border-red-500 focus:border-red-500' : 'border-zinc-800 focus:border-orange-500'} rounded text-xs text-white focus:outline-none transition-all`}
                      />
                    </div>
                    {phoneError && (
                      <p className="text-[10px] text-red-500 font-medium">{phoneError}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">EMAIL ADDRESS</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                      <input 
                        type="email" 
                        required
                        placeholder="you@domain.com" 
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) setEmailError('');
                        }}
                        className={`w-full pl-10 pr-4 py-3 bg-zinc-950 border ${emailError ? 'border-red-500 focus:border-red-500' : 'border-zinc-800 focus:border-orange-500'} rounded text-xs text-white focus:outline-none transition-all`}
                      />
                    </div>
                    {emailError && (
                      <p className="text-[10px] text-red-500 font-medium">{emailError}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">AADHAAR / GOVT ID PROOF NO</label>
                    <input 
                      type="text" 
                      required
                      placeholder="xxxx-xxxx-xxxx" 
                      value={idProof}
                      onChange={(e) => setIdProof(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Dynamic Camera or Upload Widget */}
                <div className="space-y-3 p-4 bg-zinc-950 border border-zinc-850 rounded-xl">
                  <span className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold block">Profile Photo (Choose File or Use Live Camera)</span>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-20 h-20 rounded-full border border-zinc-800 bg-zinc-900 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                      {photo ? (
                        <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} className="text-zinc-700" />
                      )}
                    </div>

                    <div className="space-y-2 w-full">
                      <div className="flex flex-wrap gap-2">
                        {cameraActive ? (
                          <button 
                            type="button"
                            onClick={capturePhoto}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black text-[10px] font-black uppercase rounded flex items-center gap-1"
                          >
                            <Camera size={12} />
                            <span>Capture Frame</span>
                          </button>
                        ) : (
                          <button 
                            type="button"
                            onClick={startCamera}
                            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] border border-zinc-800 font-bold uppercase rounded flex items-center gap-1"
                          >
                            <Camera size={12} className="text-orange-500" />
                            <span>Use Web Camera</span>
                          </button>
                        )}

                        {cameraActive && (
                          <button 
                            type="button"
                            onClick={stopCamera}
                            className="px-3 py-1.5 bg-red-600/10 border border-red-600/20 text-red-400 text-[10px] font-bold uppercase rounded"
                          >
                            Cancel Camera
                          </button>
                        )}

                        <label className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] border border-zinc-800 font-bold uppercase rounded flex items-center gap-1 cursor-pointer">
                          <Upload size={12} className="text-orange-500" />
                          <span>Choose Image File</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileUpload} 
                          />
                        </label>
                      </div>
                      <p className="text-[10px] text-zinc-500">Live webcam snap or upload an image file from device storage.</p>
                    </div>
                  </div>

                  {cameraActive && (
                    <div className="border border-orange-500/30 rounded-lg overflow-hidden bg-black max-w-[300px] mx-auto aspect-square relative">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover scale-x-[-1]" 
                      />
                      <div className="absolute inset-0 border-2 border-orange-500 animate-pulse pointer-events-none" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">CREATE ACCOUNT PASSWORD</label>
                    <input 
                      type="password" 
                      required
                      placeholder="Choose a login password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={handleNextStep}
                  disabled={!name || !email || !phone || !password}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-black font-extrabold uppercase tracking-wider text-xs rounded transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <span>PROCEED TO EMERGENCY DETAILS</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            {/* STEP 2: EMERGENCY CONTACTS & MEDICAL CONDITIONS */}
            {step === 2 && (
              <div className="space-y-4">
                
                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-lg space-y-4">
                  <div className="flex items-center gap-1.5 text-xs text-orange-500 font-bold uppercase tracking-wider">
                    <Users size={16} />
                    <span>Emergency Contact Parameters</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase text-zinc-500 font-bold">CONTACT NAME (OPTIONAL)</label>
                      <input 
                        type="text" 
                        placeholder="E.g., Rohan Verma" 
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                        className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase text-zinc-500 font-bold">RELATIONSHIP (OPTIONAL)</label>
                      <input 
                        type="text" 
                        placeholder="Brother/Father/Spouse" 
                        value={emergencyRelation}
                        onChange={(e) => setEmergencyRelation(e.target.value)}
                        className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase text-zinc-500 font-bold">EMERGENCY PHONE (OPTIONAL)</label>
                      <input 
                        type="tel" 
                        placeholder="+91 XXXXX XXXXX" 
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-lg space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-orange-500 font-bold uppercase tracking-wider">
                    <Heart size={16} />
                    <span>Medical History & Health Declarations</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase text-zinc-500 font-bold">DESCRIBE PRIOR INJURIES / COMPLICATIONS</label>
                    <textarea 
                      rows={3}
                      placeholder="Specify if you suffer from Mild Asthma, Hypertension, joint replacements or spinal disk issues. Enter 'None' if perfectly healthy." 
                      value={medicalNotes}
                      onChange={(e) => setMedicalNotes(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="w-1/3 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-wider text-xs rounded transition-all"
                  >
                    Back
                  </button>
                  <button 
                    type="button" 
                    onClick={handleNextStep}
                    className="w-2/3 py-3 bg-orange-600 hover:bg-orange-500 text-black font-extrabold uppercase tracking-wider text-xs rounded transition-all flex items-center justify-center gap-1"
                  >
                    <span>SELECT MEMBERSHIP PACKAGE</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PLAN SELECTION & CHECKOUT */}
            {step === 3 && (
              <div className="space-y-5">
                
                {/* Optional Plan Selection toggle */}
                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase">Membership Activation Path</span>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={registerWithoutPlan} 
                        onChange={(e) => setRegisterWithoutPlan(e.target.checked)} 
                        className="rounded border-zinc-800 text-orange-600 focus:ring-orange-500 bg-zinc-900 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-orange-400">Register Only (Pay Gym Owner Directly)</span>
                    </label>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    If you select "Register Only", you can register your profile today and finalize your plan pricing and cash/offline payment directly with our head bodybuilder & owner Siddharth Sharma at the gym front desk.
                  </p>
                </div>

                {!registerWithoutPlan ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">CHOOSE MEMBERSHIP PACKAGE</label>
                        <select 
                          value={selectedPlanId}
                          onChange={(e) => setSelectedPlanId(e.target.value)}
                          className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500 rounded font-semibold"
                        >
                          {activePlansList.map((plan) => (
                            <option key={plan.id} value={plan.id}>{plan.name} ({plan.duration}) — ₹{plan.price.toLocaleString('en-IN')}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">GATEWAY METHOD</label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <button 
                            type="button"
                            onClick={() => setPaymentMethod('UPI')}
                            className={`py-2.5 px-3 border rounded text-center font-bold ${paymentMethod === 'UPI' ? 'border-orange-500 bg-orange-600/5 text-orange-400' : 'border-zinc-800 text-zinc-400'}`}
                          >
                            UPI / QR Code Scan
                          </button>
                          <button 
                            type="button"
                            onClick={() => setPaymentMethod('Card')}
                            className={`py-2.5 px-3 border rounded text-center font-bold ${paymentMethod === 'Card' ? 'border-orange-500 bg-orange-600/5 text-orange-400' : 'border-zinc-800 text-zinc-400'}`}
                          >
                            Credit Card / NetBanking
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Invoice Break-down */}
                    <div className="p-5 bg-zinc-950 rounded-xl border border-zinc-850/80 space-y-3 text-xs">
                      <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Invoicing summary</p>
                      <div className="flex justify-between text-zinc-400">
                        <span>Base package price ({selectedPlan.name}):</span>
                        <span>₹{selectedPlan.price.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>GST Registration (18%):</span>
                        <span>₹{Math.round(selectedPlan.price * 0.18).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Gateway Processing charges:</span>
                        <span className="text-emerald-400 font-bold">Free / ₹0</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-zinc-900 font-bold text-sm text-white">
                        <span>Total Amount Dues (Tax Inc):</span>
                        <span className="text-orange-500 text-base font-extrabold">₹{Math.round(selectedPlan.price * 1.18).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-5 bg-zinc-950 rounded-xl border border-orange-500/20 space-y-3 text-xs">
                    <div className="flex items-center gap-2 text-orange-400 font-bold">
                      <AlertTriangle size={16} />
                      <span className="uppercase tracking-wider">Regarding offline payment</span>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Your profile will be created with <span className="text-white font-bold">"Pending"</span> status. To activate your gym membership access card and biometric/scanner check-in, please visit Fit X Gym front desk at Khurja or contact our owner and trainer:
                    </p>
                    <div className="p-3 bg-zinc-900 rounded border border-zinc-850 space-y-1">
                      <p className="font-bold text-white">Siddharth Sharma (Owner & Bodybuilder)</p>
                      <p className="text-zinc-400 text-[11px]">Phone: +91 98765 43210 / WhatsApp</p>
                      <p className="text-zinc-400 text-[11px]">Address: Fit X Gym, Near Landmark, Khurja, Uttar Pradesh</p>
                    </div>
                  </div>
                )}

                {/* Agreements */}
                <p className="text-[10px] text-zinc-500 leading-relaxed text-center">
                  By clicking register, you agree to comply with the Fit X Gym terms, code of conduct, and acknowledge that memberships are non-refundable after processing.
                </p>

                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setStep(2)}
                    className="w-1/3 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-wider text-xs rounded transition-all"
                  >
                    Back
                  </button>
                  <button 
                    type="button" 
                    onClick={handleRegisterSubmit}
                    disabled={isPaying}
                    className="w-2/3 py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 text-black font-extrabold uppercase tracking-wider text-xs rounded transition-all disabled:opacity-50"
                  >
                    {isPaying ? 'PROCESSING REGISTRATION...' : 'CONFIRM & REGISTER'}
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>
      )}

    </div>
  );
}
