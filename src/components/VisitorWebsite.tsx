import React, { useState } from 'react';
import { Plan, Blog, Transformation, Review } from '../types';
import { MEMBERSHIP_PLANS, MOCK_TRAINERS, MOCK_TRANSFORMATIONS, MOCK_BLOGS, MOCK_REVIEWS } from '../data/mockData';
import { Dumbbell, Clock, MapPin, Award, Users, BookOpen, Star, Phone, MessageSquare, ChevronRight, Check, CheckCircle2, ShieldCheck, Instagram, Facebook, Flame, Calendar, ArrowRight, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VisitorWebsiteProps {
  plans?: Plan[];
  ownerPhoto?: string;
  gallery?: string[];
  onJoinNow: (planId: string) => void;
  onBookTrialSuccess: (name: string, date: string, time: string) => void;
  testimonials?: Review[];
  onAddTestimonial?: (name: string, rating: number, text: string) => void;
}

export default function VisitorWebsite({ plans = [], ownerPhoto, gallery = [], onJoinNow, onBookTrialSuccess, testimonials = [], onAddTestimonial }: VisitorWebsiteProps) {
  const [activePlanTab, setActivePlanTab] = useState<'all' | 'individual' | 'special'>('all');
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [trialName, setTrialName] = useState('');
  const [trialPhone, setTrialPhone] = useState('');
  const [trialDate, setTrialDate] = useState('');
  const [trialTime, setTrialTime] = useState('07:00 AM - 09:00 AM');
  const [isBooking, setIsBooking] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Testimonial Form States
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName || !newReviewText) return;
    if (onAddTestimonial) {
      onAddTestimonial(newReviewName, newReviewRating, newReviewText);
    }
    setNewReviewName('');
    setNewReviewRating(5);
    setNewReviewText('');
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 5000);
  };

  // Fallback to pre-seeded list if plans prop is empty
  const activePlansList = plans.length > 0 ? plans : MEMBERSHIP_PLANS;

  // Filter plans
  const filteredPlans = activePlansList.filter(plan => {
    if (activePlanTab === 'all') return true;
    if (activePlanTab === 'individual') return !['plan_couple', 'plan_pt'].includes(plan.id);
    if (activePlanTab === 'special') return ['plan_couple', 'plan_pt'].includes(plan.id);
    return true;
  });

  const handleBookTrialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trialName || !trialPhone || !trialDate) return;
    setIsBooking(true);
    setTimeout(() => {
      onBookTrialSuccess(trialName, trialDate, trialTime);
      setTrialName('');
      setTrialPhone('');
      setTrialDate('');
      setIsBooking(false);
    }, 1000);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMsg) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactName('');
      setContactEmail('');
      setContactMsg('');
    }, 3000);
  };

  return (
    <div className="bg-zinc-950 text-white min-h-screen font-sans selection:bg-orange-500 selection:text-black">
      
      {/* SECTION QUICK-FLYER FLOATING SUB-NAV */}
      <div className="sticky top-[72px] z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900/60 py-2.5 px-4 overflow-x-auto scrollbar-none shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-1.5 min-w-max md:min-w-0">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mr-2 hidden md:inline">NAVIGATE SITE:</span>
          {[
            { label: "Details", href: "#details" },
            { label: "About", href: "#about" },
            { label: "History", href: "#history" },
            { label: "Location", href: "#location" },
            { label: "Founder", href: "#founder" },
            { label: "Plans", href: "#plans" },
            { label: "Gallery", href: "#gallery" }
          ].map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              className="px-3.5 py-1.5 rounded-full bg-zinc-900 hover:bg-orange-600/10 border border-zinc-850 hover:border-orange-500/30 text-[10px] text-zinc-400 hover:text-orange-500 font-extrabold uppercase tracking-wider transition-all shadow-sm"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden border-b border-zinc-900 px-4 md:px-8">
        {/* Animated background overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(39,39,42,0.6),transparent_50%)]" />
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="max-w-7xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-12">
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-sm font-medium text-orange-500"
            >
              <Flame size={16} className="animate-pulse text-orange-500" />
              <span>THE ULTIMATE FITNESS SANCTUARY</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight uppercase font-sans"
            >
              Forge Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400">
                Ultimate Self
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 font-light"
            >
              No shortcuts. No excuses. At Fit X Gym, we combine a high-intensity, premium iron atmosphere with elite professional coaching to build your dream physique.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <a 
                href="#plans" 
                className="px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-black font-bold tracking-wider rounded-lg shadow-lg hover:shadow-orange-500/20 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
              >
                <span>JOIN FIT X NOW</span>
                <ArrowRight size={18} />
              </a>
              <a 
                href="#free-trial" 
                className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white font-semibold tracking-wider rounded-lg transition-all active:scale-95 text-center flex items-center justify-center gap-2"
              >
                <span>BOOK FREE TRIAL</span>
                <Calendar size={18} />
              </a>
            </motion.div>

            {/* Quick Metrics */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="grid grid-cols-3 gap-4 pt-8 border-t border-zinc-900/80 max-w-md mx-auto lg:mx-0"
            >
              <div>
                <div className="text-3xl font-extrabold text-white">10k+ sq.ft</div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Premium Arena</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-orange-500">25+</div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Championship Prizes</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white">4.9★</div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Google Rating</div>
              </div>
            </motion.div>
          </div>

          {/* Premium Hero Visual Placeholder */}
          <div className="lg:col-span-5 relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative aspect-square w-full max-w-[420px] mx-auto rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl shadow-orange-500/5"
            >
              {/* Overlay with high-intensity visual */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10" />
              <img 
                src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80" 
                alt="Fit X Gym" 
                className="w-full h-full object-cover grayscale opacity-90 hover:scale-105 hover:grayscale-0 transition-all duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-6 left-6 right-6 z-20 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs tracking-wider text-emerald-400 font-bold uppercase">LIVE ATMOSPHERE</span>
                </div>
                <div className="text-lg font-bold text-white uppercase tracking-tight">Heavy Duty Hammer Strength & Eleiko Rigs</div>
                <p className="text-xs text-zinc-400">100% pure premium iron arena loaded with specialized training tools.</p>
              </div>
            </motion.div>
            
            {/* Ambient Floating Elements */}
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-orange-500/10 blur-2xl rounded-full" />
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />
          </div>
        </div>
      </section>

      {/* 2. ABOUT THE GYM & FACILITIES */}
      <section id="about" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-xs text-orange-500 tracking-widest font-bold uppercase">ABOUT FIT X GYM</h2>
          <p className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase">Uncompromised Power & Elegance</p>
          <p className="text-zinc-400 max-w-3xl mx-auto font-light">
            Founded with the philosophy of providing heavy-duty, commercial-grade strength machines and elite performance equipment paired with locker facilities and customized fitness coaching.
          </p>
        </div>

        <div id="details" className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-xl bg-zinc-900 border border-zinc-800/80 hover:border-orange-500/30 transition-all group">
            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-all">
              <Dumbbell size={24} />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-wide mb-3">ELITE WORLD-CLASS EQUIPMENT</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              We stock authentic Hammer Strength plate-loaded machines, Eleiko competition powerlifting bars, rogue bumper plates, and a comprehensive dumbbell line up extending up to 60kg.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-zinc-900 border border-zinc-800/80 hover:border-orange-500/30 transition-all group">
            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-all">
              <Clock size={24} />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-wide mb-3">24/7 OPENING HOURS</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              We understand your busy routine. Our biometric-secured arena is open 24 hours on weekdays and has extended weekend slots for early-bird lifters and late-night grinders.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-zinc-900 border border-zinc-800/80 hover:border-orange-500/30 transition-all group">
            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-all">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-wide mb-3">VIBRANT COMMUNITY</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              No toxicity. We foster a respectful, motivating atmosphere where beginners receive assistance, and experts push boundaries. Enjoy active group CrossFit, HIIT, and Yoga meets.
            </p>
          </div>
        </div>

        {/* History & Opening Hours */}
        <div id="history" className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-zinc-900/40 p-8 rounded-2xl border border-zinc-900">
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-xs text-orange-500 font-bold uppercase rounded">
              OUR MISSION & TIMELINE
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight">HISTORY OF EXCELLENCE</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Fit X Gym began in 2018 with a humble 2,000 sq ft space. Today, we have evolved into Uttar Pradesh’s premium fitness powerhouse, housing national athletes and certification courses. Our vision is to empower individuals to realize their absolute physical potential through scientific coaching and world-class mechanical systems.
            </p>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 text-xs uppercase tracking-wider block mb-1">WEEKDAYS</span>
                <span className="text-white font-bold text-sm block">05:00 AM - 11:30 PM</span>
              </div>
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 text-xs uppercase tracking-wider block mb-1">WEEKENDS</span>
                <span className="text-white font-bold text-sm block">06:00 AM - 09:30 PM</span>
              </div>
            </div>
          </div>

          {/* Google Maps Simulation & Details */}
          <div id="location" className="relative aspect-[4/3] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
            <div className="absolute inset-0 flex flex-col justify-between p-6 z-10">
              <div className="bg-zinc-900/90 backdrop-blur px-4 py-3 rounded-lg border border-zinc-800 w-fit space-y-2">
                <div className="flex items-center gap-2 text-orange-500 font-bold text-sm uppercase">
                  <MapPin size={16} />
                  <span>PREMIUM LOCATION</span>
                </div>
                <div className="text-xs text-white mt-1">Opp. Radha Krishna Mandir, Khurja, Bulandshahr, UP 203131</div>
                
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=Fit+X+Gym+Opp+Radha+Krishna+Mandir+Khurja+Bulandshahr+UP+203131"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-black font-extrabold text-[9px] uppercase tracking-wider rounded transition-all mt-1"
                >
                  <span>Open in Google Maps</span>
                  <ArrowRight size={10} />
                </a>
              </div>

              <div className="bg-zinc-900/90 backdrop-blur p-4 rounded-lg border border-zinc-800 text-xs text-zinc-400 space-y-2">
                <p className="text-white font-semibold uppercase text-[10px] tracking-wider text-orange-500">RECEPTION PHONE</p>
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Phone size={14} className="text-zinc-500" />
                  <span>+91 99999 88888</span>
                </div>
              </div>
            </div>
            
            {/* Custom Styled premium dark Map vector illustration using Canvas or clean grid */}
            <a 
              href="https://www.google.com/maps/search/?api=1&query=Fit+X+Gym+Opp+Radha+Krishna+Mandir+Khurja+Bulandshahr+UP+203131"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 bg-zinc-950 flex items-center justify-center group cursor-pointer"
              title="Click to view on Google Maps"
            >
              <div className="w-full h-full opacity-30 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] relative group-hover:opacity-45 transition-opacity">
                {/* Simulated streets */}
                <div className="absolute h-[2px] w-full bg-zinc-800 top-1/3" />
                <div className="absolute h-[2px] w-full bg-zinc-800 top-2/3" />
                <div className="absolute w-[2px] h-full bg-zinc-800 left-1/3" />
                <div className="absolute w-[2px] h-full bg-zinc-800 left-2/3" />
                {/* Gym Landmark pin */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-10 h-10 bg-orange-600 rounded-full border-4 border-zinc-950 flex items-center justify-center animate-bounce group-hover:scale-110 transition-transform shadow-xl">
                    <Dumbbell size={16} className="text-black" />
                  </div>
                  <div className="w-3 h-3 bg-orange-600/50 rounded-full blur-xs mt-1" />
                </div>
              </div>
              <div className="absolute bottom-4 right-4 bg-black/90 backdrop-blur px-2.5 py-1 rounded border border-zinc-800 text-[9px] uppercase font-bold text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-20">
                <span>View on Google Maps ➔</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* 3. MEET THE OWNER - PREMIUM PROFILE */}
      <section id="founder" className="py-24 bg-zinc-900/40 border-y border-zinc-900 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[3/4] max-w-[380px] mx-auto rounded-xl overflow-hidden border-2 border-zinc-800 bg-zinc-950 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10" />
              <img 
                src={ownerPhoto || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80"} 
                alt="Deepak Solanki Gym Owner" 
                className="w-full h-full object-cover grayscale brightness-95"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-6 left-6 right-6 z-20">
                <p className="text-orange-500 font-bold text-xs uppercase tracking-widest">FOUNDER & CEO</p>
                <p className="text-2xl font-black text-white uppercase tracking-tight">DEEPAK SOLANKI</p>
                <p className="text-zinc-400 text-xs mt-1">"Your mind limits your body. Forge the discipline."</p>
              </div>
            </div>
            
            {/* Mr Uttar Pradesh absolute seal */}
            <div className="absolute -top-4 -right-4 md:-right-8 bg-gradient-to-br from-amber-500 to-yellow-600 p-4 rounded-xl text-black font-extrabold text-xs shadow-xl rotate-12 flex flex-col items-center border border-yellow-400/30">
              <Award size={24} className="text-black animate-spin-slow mb-1" />
              <span>IFBB PRO COACH</span>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-orange-500/10 border border-orange-500/20 text-xs text-orange-500 font-bold uppercase">
              <UserCheck size={14} />
              <span>MEET THE FOUNDER</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight">DEEPAK "IRON" SOLANKI</h2>
            <p className="text-zinc-300 font-light leading-relaxed">
              With 15+ years of competitive bodybuilding, powerlifting, and clinical nutrition research, Deepak founded Fit X Gym to revolutionize fitness spaces. He is an ISSA Certified Elite Trainer, having coached over 200+ athletes to competitive success, and has designed customizable calorie cycles used by top-tier fitness professionals.
            </p>

            {/* Timelines */}
            <div className="space-y-4">
              <p className="text-xs uppercase text-zinc-500 tracking-widest font-bold">CHAMPIONSHIPS & ACHIEVEMENTS TIMELINE</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex gap-3">
                  <div className="text-2xl font-bold text-amber-500 flex-shrink-0">🥇</div>
                  <div>
                    <h4 className="font-bold text-sm uppercase text-white">Mr. Uttar Pradesh (Overall)</h4>
                    <p className="text-xs text-zinc-500 mt-1">Federation Champion (2018)</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex gap-3">
                  <div className="text-2xl font-bold text-amber-500 flex-shrink-0">🥇</div>
                  <div>
                    <h4 className="font-bold text-sm uppercase text-white">National Bodybuilding Gold</h4>
                    <p className="text-xs text-zinc-500 mt-1">Light Heavyweight Division (2020)</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex gap-3">
                  <div className="text-2xl font-bold text-zinc-400 flex-shrink-0">🥈</div>
                  <div>
                    <h4 className="font-bold text-sm uppercase text-white">Sheru Classic District Champion</h4>
                    <p className="text-xs text-zinc-500 mt-1">Men’s Physique Category (2017)</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex gap-3">
                  <div className="text-2xl font-bold text-orange-500 flex-shrink-0">🎓</div>
                  <div>
                    <h4 className="font-bold text-sm uppercase text-white">ISSA Sports Science Specialist</h4>
                    <p className="text-xs text-zinc-500 mt-1">Elite Level 3 Specialist</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CHAMPION COACHING & SCIENCE */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto border-t border-zinc-900/60">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-xs text-orange-500 tracking-widest font-bold uppercase">CHAMPION'S PHILOSOPHY</h2>
          <p className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase">ELITE BODYBUILDING COCHING</p>
          <p className="text-zinc-400 max-w-2xl mx-auto font-light text-sm">
            At Fit X Gym, you are mentored directly by an IFBB Pro. No general fitness trainers. We focus on real muscle hypertrophy, competitive athletic prep, and metabolic adaptation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-3xl">⚔️</span>
              <h3 className="text-lg font-extrabold text-white uppercase tracking-tight">Pro Hypertrophy Systems</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-light">
                Every member receives direct access to Deepak's signature "Iron Blueprint" workout regimes. We focus on progressive mechanical tension, custom volume loading, and perfect mechanical form.
              </p>
            </div>
            <div className="text-xs text-orange-400 font-bold uppercase tracking-wider">Direct Owner Guidance ➔</div>
          </div>

          <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-3xl">🥗</span>
              <h3 className="text-lg font-extrabold text-white uppercase tracking-tight">Advanced Calorie Cycling</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-light">
                Say goodbye to generic meal charts. We utilize science-based carbohydrate cycling and exact protein-fat partitions tailored to your lean mass and basal metabolic rate.
              </p>
            </div>
            <div className="text-xs text-orange-400 font-bold uppercase tracking-wider">Custom Diet Templates ➔</div>
          </div>

          <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-3xl">🏆</span>
              <h3 className="text-lg font-extrabold text-white uppercase tracking-tight">Contest & Show Prep</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-light">
                Planning to step on stage or crush powerlifting weight classes? Get private coaching on posing mechanics, water depletion curves, peak week loading protocols, and psychological stamina.
              </p>
            </div>
            <div className="text-xs text-orange-400 font-bold uppercase tracking-wider">IFBB Standards ➔</div>
          </div>
        </div>
      </section>

      {/* 5. MEMBERSHIP PLANS WITH TABS */}
      <section id="plans" className="py-24 bg-zinc-900/20 border-y border-zinc-900/60 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-xs text-orange-500 tracking-widest font-bold uppercase">PLANS & PRICING</h2>
            <p className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase">MEMBERSHIP PLANS</p>
            <p className="text-zinc-400 max-w-2xl mx-auto font-light text-sm">
              Choose an elite plan and start your fitness revolution. No hidden charges. Fully tax inclusive values.
            </p>

            {/* Tabs */}
            <div className="flex justify-center gap-2 pt-6">
              <button 
                onClick={() => setActivePlanTab('all')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activePlanTab === 'all' ? 'bg-orange-600 text-black shadow-lg shadow-orange-600/10' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}
              >
                All Packages
              </button>
              <button 
                onClick={() => setActivePlanTab('individual')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activePlanTab === 'individual' ? 'bg-orange-600 text-black shadow-lg shadow-orange-600/10' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}
              >
                Individual Standard
              </button>
              <button 
                onClick={() => setActivePlanTab('special')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activePlanTab === 'special' ? 'bg-orange-600 text-black shadow-lg shadow-orange-600/10' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}
              >
                Couples & Personal coaching
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPlans.map((plan) => (
              <div 
                key={plan.id} 
                className={`rounded-2xl p-8 border transition-all relative flex flex-col justify-between ${
                  plan.popular 
                    ? 'bg-zinc-900 border-orange-500 shadow-xl shadow-orange-500/5' 
                    : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-600 text-black font-extrabold uppercase text-[10px] tracking-widest px-4 py-1 rounded-full shadow">
                    MOST POPULAR
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">{plan.duration} ACCESS</p>
                    <h3 className="text-2xl font-extrabold uppercase tracking-tight text-white mt-1">{plan.name}</h3>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-medium text-zinc-500">₹</span>
                    <span className="text-4xl md:text-5xl font-black text-white">{plan.price.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-zinc-500 ml-1">/ {plan.duration}</span>
                  </div>

                  <ul className="space-y-3 pt-6 border-t border-zinc-900">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-zinc-300">
                        <Check size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8 mt-auto">
                  <button 
                    onClick={() => onJoinNow(plan.id)}
                    className={`w-full py-3 px-4 rounded-lg font-bold uppercase tracking-wider text-xs transition-all active:scale-95 text-center block ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-black hover:from-orange-500 hover:to-amber-400 shadow-lg' 
                        : 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    SELECT PLAN & REGISTER
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Premium Feature Comparison Panel */}
          <div className="mt-16 bg-zinc-900/30 p-8 rounded-2xl border border-zinc-900/80">
            <h4 className="text-lg font-bold uppercase tracking-wide text-white mb-6 text-center lg:text-left">Feature Matrix Comparison</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 uppercase tracking-wider">
                    <th className="py-3 font-semibold">Features</th>
                    <th className="py-3 font-semibold text-center">Elite Monthly</th>
                    <th className="py-3 font-semibold text-center text-orange-500">Pro Quarterly</th>
                    <th className="py-3 font-semibold text-center">Power Half Year</th>
                    <th className="py-3 font-semibold text-center">Champion Annual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
                  <tr>
                    <td className="py-4 font-medium">Access Duration</td>
                    <td className="py-4 text-center">30 Days</td>
                    <td className="py-4 text-center text-orange-500 font-semibold">90 Days</td>
                    <td className="py-4 text-center">180 Days</td>
                    <td className="py-4 text-center">365 Days</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-medium">Gym Floor Access</td>
                    <td className="py-4 text-center">Yes</td>
                    <td className="py-4 text-center text-orange-500">Yes</td>
                    <td className="py-4 text-center">Yes</td>
                    <td className="py-4 text-center">Yes</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-medium">Free Personal Coaching</td>
                    <td className="py-4 text-center">None</td>
                    <td className="py-4 text-center text-orange-500">2 Sessions</td>
                    <td className="py-4 text-center">5 Sessions</td>
                    <td className="py-4 text-center font-bold">12 Sessions</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-medium">Diet Sheet consul</td>
                    <td className="py-4 text-center">None</td>
                    <td className="py-4 text-center text-orange-500">Yes</td>
                    <td className="py-4 text-center">Yes</td>
                    <td className="py-4 text-center">Yes</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-medium">Biometric QR Check-In</td>
                    <td className="py-4 text-center">Yes</td>
                    <td className="py-4 text-center text-orange-500">Yes</td>
                    <td className="py-4 text-center">Yes</td>
                    <td className="py-4 text-center">Yes</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-medium">Digital Progress Portal</td>
                    <td className="py-4 text-center">Basic</td>
                    <td className="py-4 text-center text-orange-500">Premium</td>
                    <td className="py-4 text-center">Premium</td>
                    <td className="py-4 text-center font-bold">Premium</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BEFORE/AFTER TRANSFORMATIONS */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-xs text-orange-500 tracking-widest font-bold uppercase">SUCCESS STORIES</h2>
          <p className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase">REAL TRANSFORMATIONS</p>
          <p className="text-zinc-400 max-w-2xl mx-auto font-light text-sm">
            We don’t compromise on results. Explore how standard individuals achieved phenomenal strength and low body-fat ratios in record times.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {MOCK_TRANSFORMATIONS.map((trans) => (
            <div key={trans.id} className="p-6 rounded-xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Simulated Before After box */}
                <div className="grid grid-cols-2 gap-2 relative rounded-lg overflow-hidden border border-zinc-800">
                  <div className="relative aspect-[3/4]">
                    <div className="absolute top-2 left-2 bg-black/80 backdrop-blur px-2 py-0.5 rounded text-[10px] uppercase font-bold text-red-500 z-10">
                      BEFORE
                    </div>
                    <img 
                      src={trans.beforeImg} 
                      alt="Before" 
                      className="w-full h-full object-cover grayscale brightness-90"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-zinc-300">
                      {trans.beforeWeight} KG
                    </div>
                  </div>
                  <div className="relative aspect-[3/4]">
                    <div className="absolute top-2 left-2 bg-orange-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-black z-10">
                      AFTER
                    </div>
                    <img 
                      src={trans.afterImg} 
                      alt="After" 
                      className="w-full h-full object-cover grayscale-0 brightness-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-orange-500 font-bold">
                      {trans.afterWeight} KG
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-lg text-white">{trans.name}</h4>
                  <span className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-[10px] text-orange-500 font-bold uppercase">
                    {trans.duration}
                  </span>
                </div>

                <p className="text-zinc-400 text-xs italic leading-relaxed">
                  "{trans.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-950 flex items-center justify-between text-xs">
                <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold">Focus Area</span>
                <span className="text-orange-400 font-bold uppercase">{trans.category}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. EXPERT BLOGS */}
      <section className="py-24 bg-zinc-900/40 border-y border-zinc-900 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-xs text-orange-500 tracking-widest font-bold uppercase">FITNESS & SCIENCE BLOG</h2>
            <p className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase">WORKOUT & NUTRITION SHEETS</p>
            <p className="text-zinc-400 max-w-2xl mx-auto font-light text-sm">
              Science-backed guidance written by the Founder & certified nutritionists. No misinformation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {MOCK_BLOGS.map((blog) => (
              <div key={blog.id} className="p-6 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-all space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="aspect-video rounded-lg overflow-hidden border border-zinc-900 bg-zinc-950">
                    <img src={blog.image} alt={blog.title} className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                  </div>
                  <span className="px-2 py-0.5 bg-orange-600/10 border border-orange-600/20 text-[10px] text-orange-500 font-bold uppercase rounded">
                    {blog.category}
                  </span>
                  <h4 className="font-extrabold text-lg text-white uppercase leading-snug line-clamp-2">{blog.title}</h4>
                  <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3">
                    {blog.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-900 flex items-center justify-between">
                  <span className="text-zinc-500 text-[10px] uppercase font-semibold">{blog.readTime} • {blog.author}</span>
                  <button 
                    onClick={() => setSelectedBlog(blog)}
                    className="text-orange-500 text-xs font-bold hover:text-orange-400 flex items-center gap-1 transition-all"
                  >
                    <span>Read More</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG MODAL DETAILS */}
      <AnimatePresence>
        {selectedBlog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto space-y-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-xs text-orange-500 font-bold uppercase rounded">
                    {selectedBlog.category}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mt-3">{selectedBlog.title}</h3>
                  <p className="text-zinc-500 text-xs mt-1">Written by {selectedBlog.author} on {selectedBlog.date} • {selectedBlog.readTime}</p>
                </div>
                <button 
                  onClick={() => setSelectedBlog(null)}
                  className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-all text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="aspect-video rounded-lg overflow-hidden border border-zinc-800">
                <img src={selectedBlog.image} alt={selectedBlog.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>

              <div className="text-zinc-300 text-sm leading-relaxed space-y-4 whitespace-pre-line font-light">
                {selectedBlog.content}
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end">
                <button 
                  onClick={() => setSelectedBlog(null)}
                  className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded"
                >
                  Close Article
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7.5 GYM PHOTO GALLERY */}
      <section id="gallery" className="py-24 px-4 md:px-8 bg-zinc-900/10 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-xs text-orange-500 tracking-widest font-bold uppercase">GYM ATMOSPHERE</h2>
            <p className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase">FIT X GALLERY</p>
            <p className="text-zinc-400 max-w-2xl mx-auto font-light text-sm">
              Explore the premium training floor, heavy duty Hammer Strength racks, powerlifting rigs, and motivating atmosphere.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.map((img, index) => (
              <div key={index} className="aspect-square rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950 group relative">
                <img 
                  src={img} 
                  alt={`Fit X Atmosphere ${index + 1}`} 
                  className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4">
                  <span className="text-xs text-orange-500 font-extrabold uppercase">Fit X Area #{index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. TESTIMONIALS / GOOGLE REVIEWS */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-xs text-orange-500 tracking-widest font-bold uppercase">REVIEWS & FEEDBACK</h2>
          <p className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase">COMMUNITY FEEDBACK</p>
          <p className="text-zinc-400 max-w-2xl mx-auto font-light text-sm">
            Verified members sharing their real feedback. Check why our iron sanctuary is rated 4.9 stars.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Testimonial List (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            <h3 className="text-lg font-extrabold uppercase text-white tracking-wider flex items-center gap-2">
              <span>⭐ Approved Member Reviews</span>
              <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 text-xs font-mono">
                {testimonials.filter(t => t.approved).length} Live
              </span>
            </h3>

            {testimonials.filter(t => t.approved).length === 0 ? (
              <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 text-xs">
                No approved reviews yet. Be the first to share your experience on the right!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {testimonials.filter(t => t.approved).map((review) => (
                  <div key={review.id} className="p-5 rounded-xl bg-zinc-900 border border-zinc-800/85 space-y-4 relative flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-1 text-yellow-500">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} size={12} className="fill-yellow-500 text-yellow-500" />
                        ))}
                      </div>

                      <p className="text-zinc-300 text-xs italic leading-relaxed font-light">
                        "{review.text}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-zinc-950 flex justify-between items-center text-[11px] mt-2">
                      <span className="font-bold text-white uppercase">{review.name}</span>
                      <span className="text-zinc-500 font-mono text-[9px]">{review.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Testimonial Form (4 columns) */}
          <div className="lg:col-span-4 p-6 rounded-2xl bg-zinc-900 border border-zinc-850 space-y-6 relative overflow-hidden">
            <div className="space-y-2">
              <p className="text-orange-500 font-bold text-[10px] uppercase tracking-widest">SHARE YOUR EXPERIENCE</p>
              <h4 className="text-xl font-black text-white uppercase tracking-tight">Submit a Review</h4>
              <p className="text-zinc-400 text-xs font-light">Your review will be automatically submitted to the management hub for administrator verification and approved within 24 hours.</p>
            </div>

            {reviewSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center space-y-2"
              >
                <CheckCircle2 className="mx-auto text-emerald-400" size={28} />
                <h5 className="font-bold text-emerald-400 text-xs uppercase tracking-wide">Review Sent</h5>
                <p className="text-[10px] text-zinc-400 leading-relaxed">Thank you! Your testimonial has been routed to the admin approval queue and will appear live once verified.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase text-zinc-500 font-bold tracking-wider">YOUR NAME</label>
                  <input 
                    type="text" 
                    required
                    placeholder="E.g., Nikita Roy" 
                    value={newReviewName}
                    onChange={(e) => setNewReviewName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase text-zinc-500 font-bold tracking-wider block">YOUR RATING</label>
                  <div className="flex items-center gap-1.5 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewReviewRating(star)}
                        className="text-yellow-500 hover:scale-110 transition-transform"
                      >
                        <Star 
                          size={20} 
                          className={star <= newReviewRating ? "fill-yellow-500 text-yellow-500" : "text-zinc-600"} 
                        />
                      </button>
                    ))}
                    <span className="text-xs text-zinc-400 font-bold ml-2">{newReviewRating} / 5 Stars</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase text-zinc-500 font-bold tracking-wider">REVIEW COMMENT</label>
                  <textarea 
                    rows={4}
                    required
                    placeholder="Tell everyone what you love about Fit X Power Gym..." 
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newReviewName || !newReviewText}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-black font-extrabold uppercase tracking-wider text-[10px] rounded transition-all"
                >
                  Submit For Admin Approval
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* 9. FREE TRIAL BOOKER & CONTACT INQUIRIES */}
      <section className="py-24 bg-zinc-950 border-t border-zinc-900 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.05),transparent_40%)]" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
          
          {/* FREE TRIAL FORM */}
          <div id="free-trial" className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-900 space-y-6">
            <div className="space-y-2">
              <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-xs text-orange-500 font-bold uppercase rounded">
                COMPLIMENTARY SESSION
              </span>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mt-1">Book Your Free Trial</h3>
              <p className="text-zinc-400 text-xs">Experience the premium equipment, clean environment, and steam sauna for free today.</p>
            </div>

            <form onSubmit={handleBookTrialSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">FULL NAME</label>
                  <input 
                    type="text" 
                    required
                    placeholder="E.g., Devendra Varshney" 
                    value={trialName}
                    onChange={(e) => setTrialName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-sm text-white focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">PHONE NUMBER</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="+91 XXXXX XXXXX" 
                    value={trialPhone}
                    onChange={(e) => setTrialPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-sm text-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">DATE OF VISIT</label>
                  <input 
                    type="date" 
                    required
                    value={trialDate}
                    onChange={(e) => setTrialDate(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-sm text-white focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">PREFER TIME SLOT</label>
                  <select 
                    value={trialTime}
                    onChange={(e) => setTrialTime(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-sm text-white focus:outline-none transition-all"
                  >
                    <option value="06:00 AM - 08:00 AM">Morning 06:00 AM - 08:00 AM</option>
                    <option value="08:00 AM - 10:00 AM">Morning 08:00 AM - 10:00 AM</option>
                    <option value="11:00 AM - 01:00 PM">Noon 11:00 AM - 01:00 PM</option>
                    <option value="05:00 PM - 07:00 PM">Evening 05:00 PM - 07:00 PM</option>
                    <option value="07:00 PM - 09:00 PM">Night 07:00 PM - 09:00 PM</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isBooking}
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-black font-extrabold uppercase tracking-wider text-xs rounded transition-all disabled:opacity-50"
              >
                {isBooking ? 'SUBMITTING...' : 'SECURE COMPLIMENTARY SPOT'}
              </button>
            </form>
          </div>

          {/* CONTACT INQUIRY FORM */}
          <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-900 space-y-6">
            <div className="space-y-2">
              <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-xs text-orange-500 font-bold uppercase rounded">
                GET IN TOUCH
              </span>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mt-1">Submit General Inquiry</h3>
              <p className="text-zinc-400 text-xs">Have questions about couple plans, corporate discounts or trainer shifts? Drop a quick line.</p>
            </div>

            {contactSubmitted ? (
              <div className="p-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
                <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
                <h4 className="font-bold text-white text-base">Inquiry Submitted!</h4>
                <p className="text-xs text-zinc-400">Our receptionist Neha Kapoor will get back to you via email or phone within 2 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">NAME</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Your Name" 
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">EMAIL ADDRESS</label>
                    <input 
                      type="email" 
                      required
                      placeholder="you@domain.com" 
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-sm text-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">MESSAGE</label>
                  <textarea 
                    rows={3}
                    required
                    placeholder="Enter your message regarding corporate memberships or trainer timings..." 
                    value={contactMsg}
                    onChange={(e) => setContactMsg(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-sm text-white focus:outline-none transition-all resize-none"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-wider text-xs rounded transition-all"
                >
                  SEND MESSAGE
                </button>
              </form>
            )}

            {/* Social handles */}
            <div className="pt-4 border-t border-zinc-950 flex flex-wrap gap-6 items-center justify-between text-xs text-zinc-500">
              <span className="font-bold text-zinc-400">CONNECT ON SOCIALS:</span>
              <div className="flex gap-4">
                <a href="https://instagram.com/fitxgym" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 flex items-center gap-1 transition-all">
                  <Instagram size={14} />
                  <span>@fitxgym</span>
                </a>
                <a href="https://facebook.com/fitxgym" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 flex items-center gap-1 transition-all">
                  <Facebook size={14} />
                  <span>Fit X Khurja</span>
                </a>
                <a href="https://wa.me/919999988888" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 flex items-center gap-1 transition-all">
                  <MessageSquare size={14} />
                  <span>WhatsApp Chat</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black py-12 px-4 md:px-8 border-t border-zinc-900 text-center text-xs text-zinc-600">
        <p className="font-bold text-zinc-400 uppercase tracking-widest text-[10px]">FIT X GYM • KHURJA • EST. 2018</p>
        <p className="mt-2 font-light">Equipped with Hammer Strength & Elite Performance Equipment. Developed for visitors, members, and elite coaches.</p>
        <p className="mt-6 text-[10px]">© 2026 Fit X Gym. All rights reserved. Built with high performance client local storage state persistence.</p>
      </footer>
    </div>
  );
}
