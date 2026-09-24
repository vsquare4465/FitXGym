import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, MapPin, Clock, Star, Check, MessageCircle, Phone, Mail,
  Dumbbell, User, Utensils, ClipboardList,
} from 'lucide-react';
import { motion } from 'motion/react';
import { publicApi } from '../../api/client';
import { Plan, Review } from '../../types';
import { parseFeatureList } from '../../lib/parseFeatures';
import SocialLinks from '../../components/public/SocialLinks';
import HeroBrand from '../../components/public/HeroBrand';
import HeroDepthLayers from '../../components/public/HeroDepthLayers';
import ImageFrame3D from '../../components/public/ImageFrame3D';
import GalleryCarousel from '../../components/public/GalleryCarousel';
import PlanCard3D from '../../components/public/PlanCard3D';
import ScrollReveal3D from '../../components/public/ScrollReveal3D';
import SectionHeading3D from '../../components/public/SectionHeading3D';
import TiltCard from '../../components/public/TiltCard';
import { useIsCompactPreview } from '../../context/PreviewViewportContext';
import { dedupeGalleryByUrl } from '../../lib/galleryUtils';
import { grid1Or2, grid1Or2Or3, grid1Or2Or4, grid1Or3, sectionPadding } from '../../lib/previewLayoutClasses';

const ENQUIRY_SUBJECTS = [
  'Membership Plan',
  'Personal Training',
  'Feedback',
  'Booking',
  'Other',
];

export interface HomePagePreviewProps {
  previewSettings?: Record<string, string>;
  previewGallery?: Array<{ url: string; caption?: string; featured?: boolean; active?: boolean }>;
  previewPlans?: Plan[];
  previewTestimonials?: Review[];
  previewMode?: boolean;
}

export default function HomePage({
  previewSettings,
  previewGallery,
  previewPlans,
  previewTestimonials,
  previewMode = false,
}: HomePagePreviewProps = {}) {
  const compact = useIsCompactPreview();
  const [settings, setSettings] = useState<Record<string, string>>(previewSettings || {});
  const [plans, setPlans] = useState<Plan[]>(previewPlans || []);
  const [gallery, setGallery] = useState<Array<{ url: string; caption?: string; featured?: boolean }>>(previewGallery || []);
  const [testimonials, setTestimonials] = useState<Review[]>(previewTestimonials || []);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSubject, setLeadSubject] = useState('Membership Plan');
  const [leadMessage, setLeadMessage] = useState('');
  const [leadSent, setLeadSent] = useState(false);

  useEffect(() => {
    if (previewSettings) {
      setSettings(previewSettings);
      setPlans(previewPlans || []);
      setGallery(previewGallery || []);
      setTestimonials(previewTestimonials || []);
      return;
    }
    Promise.all([
      publicApi.settings(),
      publicApi.plans(),
      publicApi.gallery(),
      publicApi.testimonials(),
    ]).then(([s, p, g, t]) => {
      setSettings(s);
      setPlans(p as Plan[]);
      setGallery(g);
      setTestimonials(t as Review[]);
    }).catch(console.error);
  }, [previewSettings, previewGallery, previewPlans, previewTestimonials]);

  useEffect(() => {
    if (!previewMode && settings.metaTitle) document.title = settings.metaTitle;
  }, [settings, previewMode]);

  const gymName = settings.gymName || 'Fit X Gym';
  const heroImage = settings.heroImage || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=80';
  const whatsapp = settings.whatsapp || '919760260553';
  const heroHeading = settings.heroHeading || 'Your neighborhood gym in Khurja';
  const heroDesc = settings.heroDescription || 'Strength training, cardio, and friendly guidance — whether you\'re just starting or already consistent.';

  const aboutFeatures = parseFeatureList(settings.aboutFeatures);
  const ptEnabled = settings.ptEnabled !== 'false';
  const ptFeatures = parseFeatureList(settings.ptFeatures);

  const membershipPlans = plans.filter(p => p.active !== false && p.id !== 'plan_pt');
  const ptPlan = plans.find(p => p.id === 'plan_pt' && p.active !== false);
  const uniqueGallery = dedupeGalleryByUrl(gallery);
  const featuredGallery = uniqueGallery.filter(g => g.featured).length
    ? uniqueGallery.filter(g => g.featured)
    : uniqueGallery;

  const handleLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (previewMode) return;
    await publicApi.postLead({
      name: leadName,
      phone: leadPhone,
      whatsapp: leadPhone,
      email: leadEmail || undefined,
      subject: leadSubject,
      message: leadMessage,
      source: 'Website Contact',
    });
    setLeadSent(true);
    setLeadName('');
    setLeadPhone('');
    setLeadEmail('');
    setLeadSubject('Membership Plan');
    setLeadMessage('');
    setTimeout(() => setLeadSent(false), 4000);
  };

  const defaultAboutFeatures = [
    'Modern cardio & strength equipment',
    'Clean, well-maintained facility',
    'Experienced on-floor guidance',
    'Flexible membership options',
    'Friendly local community',
    'Convenient Khurja location',
  ];

  const features = aboutFeatures.length ? aboutFeatures : defaultAboutFeatures;

  const defaultPtFeatures = [
    '1-on-1 certified personal coaching',
    'Personalised workout program',
    'Custom diet & nutrition schedule',
    'Progress tracking & adjustments',
    'Flexible session scheduling',
  ];

  const ptList = ptFeatures.length ? ptFeatures : defaultPtFeatures;
  const ptTitle = settings.ptTitle || ptPlan?.name || 'Personal Training';
  const ptDesc = settings.ptDescription || 'Get dedicated coaching tailored to your goals — fat loss, muscle gain, or general fitness.';

  const defaultAboutExtra = [
    'We believe fitness should feel approachable, not intimidating — whether you\'re 18 or 55.',
    'Our coaches focus on form, consistency, and habits you can keep for years, not just weeks.',
    'Drop in anytime for a walkthrough — we\'d love to meet you at the front desk.',
  ];
  const aboutExtra = parseFeatureList(settings.aboutExtra).length
    ? parseFeatureList(settings.aboutExtra)
    : defaultAboutExtra;

  return (
    <div className={`bg-zinc-950 ${previewMode ? 'overflow-x-hidden max-w-full' : ''}`}>
      {/* Hero */}
      <section className={`relative flex items-end overflow-hidden ${previewMode ? 'min-h-[520px]' : 'min-h-[90vh]'}`}>
        <img src={heroImage} alt={gymName} className="absolute inset-0 w-full h-full object-cover scale-105" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-zinc-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/40 to-transparent" />
        <HeroDepthLayers />
        <div className={`relative max-w-6xl mx-auto px-4 w-full ${compact ? 'pb-12 pt-20' : 'pb-16 md:pb-24 pt-28'}`}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-xl">
            <HeroBrand logoUrl={settings.logoUrl} gymName={gymName} />
            <p className="text-orange-500 font-semibold text-sm mb-3 tracking-wide tagline-3d">{settings.tagline || 'Khurja · Est. 2018'}</p>
            <h1 className={`font-bold tracking-tight text-white leading-[1.08] mb-5 ${
              compact ? 'text-2xl' : previewMode ? 'text-2xl sm:text-3xl' : 'text-4xl md:text-5xl lg:text-6xl'
            }`}>
              <span className="heading-3d">{heroHeading}</span>
            </h1>
            <p className={`text-zinc-300 mb-8 leading-relaxed max-w-lg ${compact || previewMode ? 'text-sm' : 'text-lg'}`}>{heroDesc}</p>
            <div className={`flex gap-3 ${compact ? 'flex-col' : 'flex-wrap'}`}>
              <a href="#contact" className={`btn-3d inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-black font-semibold ${compact ? 'w-full' : ''}`}>
                Enquire now <ArrowRight size={18} />
              </a>
              <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi, I'd like to know more about ${gymName}.`)}`} target="_blank" rel="noopener noreferrer" className={`btn-3d-outline inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-zinc-600 hover:border-zinc-400 text-white font-medium ${compact ? 'w-full' : ''}`}>
                <MessageCircle size={18} /> WhatsApp us
              </a>
              <a href="#plans" className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-zinc-300 hover:text-white font-medium text-sm transition-colors ${compact ? 'w-full' : ''}`}>View plans</a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Us */}
      <section id="about" className={`${sectionPadding(compact)} border-b border-white/5`}>
        <div className="max-w-6xl mx-auto">
          <div className={`${grid1Or2(compact)} gap-12 items-start`}>
            <ScrollReveal3D>
            <div>
              <SectionHeading3D
                align="left"
                eyebrow="About us"
                title={settings.aboutHeading || `Welcome to ${gymName}`}
                className="!mb-4"
              />
              <p className="text-zinc-400 leading-relaxed mb-4">
                {settings.aboutDescription || settings.ownerBio || `${gymName} is a local gym in Khurja built for everyday fitness — whether you're starting out or training seriously.`}
              </p>
              {aboutExtra.map(line => (
                <p key={line} className="text-zinc-400 leading-relaxed mb-3 text-sm md:text-base">{line}</p>
              ))}
              {(settings.ownerName || 'Deepak Solanki') && (
                <p className="text-sm text-zinc-500 mt-4 mb-2">
                  Led by{' '}
                  <span className="text-zinc-200 font-semibold">{settings.ownerName || 'Deepak Solanki'}</span>
                  {settings.ownerTitle && <span className="text-zinc-500"> · {settings.ownerTitle}</span>}
                </p>
              )}
              <Link
                to="/owner"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-500 hover:text-orange-400 transition-colors"
              >
                Learn more about our coach <ArrowRight size={14} />
              </Link>
            </div>
            </ScrollReveal3D>
            <ScrollReveal3D delay={0.08}>
              <ImageFrame3D
                src={settings.aboutImage || settings.ownerPhoto || gallery[0]?.url || heroImage}
                alt="About gym"
              />
            </ScrollReveal3D>
          </div>

          <ScrollReveal3D className="mt-12" delay={0.05}>
          <div>
            <h3 className={`text-lg font-semibold mb-6 ${compact ? 'text-center' : 'text-center md:text-left'}`}>What you get at our gym</h3>
            <div className={`${grid1Or2Or3(compact)} gap-4`} style={{ perspective: '1000px' }}>
              {features.map(f => (
                <TiltCard key={f} className="flex gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
                  <span className="icon-badge-3d flex-shrink-0 mt-0.5">
                    <Check size={14} className="text-orange-500" />
                  </span>
                  <p className="text-sm text-zinc-300">{f}</p>
                </TiltCard>
              ))}
            </div>
          </div>
          </ScrollReveal3D>
        </div>
      </section>

      {/* Membership Plans */}
      <section id="plans" className={`${sectionPadding(compact)} bg-zinc-900/20`}>
        <div className="max-w-6xl mx-auto">
          <SectionHeading3D
            eyebrow="Membership"
            title="Simple plans, no surprises"
            subtitle="Visit the gym to join · Pay at front desk"
          />
          <div className={`${grid1Or2Or4(compact)} gap-5`} style={{ perspective: '1200px' }}>
            {membershipPlans.slice(0, 4).map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <PlanCard3D plan={plan} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Personal Training */}
      {ptEnabled && (
        <section id="training" className={`${sectionPadding(compact)} border-y border-white/5`}>
          <div className={`max-w-6xl mx-auto ${grid1Or2(compact)} gap-10 items-center`}>
            <ScrollReveal3D className={compact ? 'order-2' : 'order-2 lg:order-1'}>
            <div>
              <p className="text-orange-500 text-sm font-semibold mb-2">Personal training</p>
              <h2 className={`font-bold mb-3 ${compact ? 'text-2xl' : 'text-3xl'}`}>{ptTitle}</h2>
              <p className="text-zinc-400 mb-6 leading-relaxed">{ptDesc}</p>
              <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-5 py-4 mb-6">
                <p className="text-sm font-semibold text-orange-200">Pricing varies by person & goal</p>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Every training plan is customised. Visit the front desk or send an enquiry — we&apos;ll recommend the best option for you.
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                {ptList.map(f => (
                  <li key={f} className="flex gap-3 text-sm text-zinc-300">
                    {f.toLowerCase().includes('coach') ? <User size={16} className="text-orange-500 flex-shrink-0" /> :
                     f.toLowerCase().includes('diet') ? <Utensils size={16} className="text-orange-500 flex-shrink-0" /> :
                     f.toLowerCase().includes('workout') || f.toLowerCase().includes('program') ? <ClipboardList size={16} className="text-orange-500 flex-shrink-0" /> :
                     <Dumbbell size={16} className="text-orange-500 flex-shrink-0" />}
                    {f}
                  </li>
                ))}
              </ul>
              <a href="#contact" onClick={() => setLeadSubject('Personal Training')} className="btn-3d inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-black font-semibold text-sm">
                Book a consultation <ArrowRight size={16} />
              </a>
            </div>
            </ScrollReveal3D>
            <ScrollReveal3D delay={0.1} className={compact ? 'order-1' : 'order-1 lg:order-2'}>
              <ImageFrame3D
                src={settings.ptImage || 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=80'}
                alt="Personal training"
              />
            </ScrollReveal3D>
          </div>
        </section>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <section id="gallery" className={`${compact ? 'py-16 px-4' : 'py-16 md:py-20 px-4'} bg-zinc-900/20 overflow-hidden`}>
          <div className="max-w-6xl mx-auto">
            <SectionHeading3D
              eyebrow="Gallery"
              title="Inside the gym"
              subtitle="Browse our space — swipe or use the arrows"
              className={compact ? 'mb-6' : 'mb-6 md:mb-8'}
            />
            <GalleryCarousel images={featuredGallery} />
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <SectionHeading3D title="What members say" className="mb-8" />
            <div className={`${grid1Or3(compact)} gap-4`} style={{ perspective: '1000px' }}>
              {testimonials.slice(0, 3).map(t => (
                <TiltCard key={t.id} glow className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50">
                  <div className="flex gap-0.5 text-yellow-500 mb-2">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={14} className="fill-yellow-500" />)}</div>
                  <p className="text-sm text-zinc-400 italic mb-3">&ldquo;{t.text}&rdquo;</p>
                  <p className="text-sm font-semibold">{t.name}</p>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact — info + enquiry side by side */}
      <section id="contact" className={`${sectionPadding(compact)} border-t border-white/5 bg-zinc-900/20`}>
        <div className="max-w-6xl mx-auto">
          <SectionHeading3D eyebrow="Contact" title="Get in touch" />

          <div className={`${grid1Or2(compact)} gap-10 items-start`}>
            {/* Left — contact details */}
            <div className="space-y-6">
              <TiltCard className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5">
                <div className="flex gap-4">
                  <MapPin size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Address</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">{settings.address || 'Khurja, Uttar Pradesh'}</p>
                    <a href={settings.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address || gymName)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-orange-500 mt-2 hover:text-orange-400">
                      Get directions <ArrowRight size={12} />
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Phone size={20} className="text-orange-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Phone</p>
                    <a href={`tel:${settings.phone?.replace(/\s/g, '')}`} className="text-sm text-zinc-300 hover:text-white">{settings.phone || '+91 9760260553'}</a>
                  </div>
                </div>

                {settings.email && (
                  <div className="flex gap-4">
                    <Mail size={20} className="text-orange-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Email</p>
                      <a href={`mailto:${settings.email}`} className="text-sm text-zinc-300 hover:text-white">{settings.email}</a>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Clock size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Operating hours</p>
                    <p className="text-sm text-zinc-300">Mon–Sat: {settings.weekdayHours || '5 AM – 11 PM'}</p>
                    <p className="text-sm text-zinc-300">Sun: {settings.weekendHours || '6 AM – 9 PM'}</p>
                  </div>
                </div>
              </TiltCard>

              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Connect with us</p>
                <SocialLinks whatsapp={whatsapp} email={settings.email} instagram={settings.instagram} facebook={settings.facebook} />
                {!settings.email && (
                  <p className="text-[10px] text-zinc-600 mt-2">Add your Gmail in Admin → Website to show email here.</p>
                )}
              </div>

              <div className="rounded-xl overflow-hidden border border-zinc-800 aspect-video">
                <iframe title="Location" className="w-full h-full border-0" loading="lazy" src={`https://maps.google.com/maps?q=${encodeURIComponent(settings.address || 'Khurja')}&output=embed`} />
              </div>
            </div>

            {/* Right — enquiry form */}
            <TiltCard glow className={`rounded-2xl border border-zinc-800 bg-zinc-900/50 ${compact ? 'p-6' : 'p-6 md:p-8'}`}>
              <h3 className="text-xl font-bold mb-1">Send us a message</h3>
              <p className="text-sm text-zinc-500 mb-6">We&apos;ll get back to you as soon as we can.</p>

              {leadSent ? (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                  Thank you! We&apos;ll contact you soon.
                </div>
              ) : (
                <form onSubmit={handleLead} className="space-y-4">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Subject</label>
                    <select value={leadSubject} onChange={e => setLeadSubject(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-sm focus:border-orange-500 outline-none">
                      {ENQUIRY_SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <input required type="text" placeholder="Your name" value={leadName} onChange={e => setLeadName(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-sm focus:border-orange-500 outline-none" />
                  <input required type="tel" placeholder="Phone / WhatsApp" value={leadPhone} onChange={e => setLeadPhone(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-sm focus:border-orange-500 outline-none" />
                  <input type="email" placeholder="Email (optional)" value={leadEmail} onChange={e => setLeadEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-sm focus:border-orange-500 outline-none" />
                  <textarea required rows={4} placeholder="Your message..." value={leadMessage} onChange={e => setLeadMessage(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-sm resize-none focus:border-orange-500 outline-none" />
                  <button type="submit" className="btn-3d w-full py-3.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-black font-semibold text-sm">Send enquiry</button>
                </form>
              )}
            </TiltCard>
          </div>
        </div>
      </section>
    </div>
  );
}
