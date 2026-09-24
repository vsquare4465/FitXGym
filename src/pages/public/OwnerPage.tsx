import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Medal, Trophy, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { publicApi } from '../../api/client';
import { useIsCompactPreview } from '../../context/PreviewViewportContext';
import ImageFrame3D from '../../components/public/ImageFrame3D';
import ScrollReveal3D from '../../components/public/ScrollReveal3D';
import { parseFeatureList } from '../../lib/parseFeatures';
import { grid1Or2, sectionPadding } from '../../lib/previewLayoutClasses';

interface OwnerPageProps {
  previewSettings?: Record<string, string>;
  previewMode?: boolean;
}

export default function OwnerPage({ previewSettings, previewMode = false }: OwnerPageProps = {}) {
  const compact = useIsCompactPreview();
  const [settings, setSettings] = useState<Record<string, string>>(previewSettings || {});

  useEffect(() => {
    if (previewSettings) {
      setSettings(previewSettings);
      return;
    }
    publicApi.settings().then(setSettings).catch(console.error);
  }, [previewSettings]);

  const name = settings.ownerName || 'Deepak Solanki';
  const title = settings.ownerTitle || 'Founder & Head Coach';
  const photo = settings.ownerPhoto || settings.aboutImage;
  const bio = settings.ownerPageBio || settings.ownerBio || 'Passionate about helping Khurja train smarter, eat better, and stay consistent for life.';
  const gymName = settings.gymName || 'Fit X Gym';

  const certifications = parseFeatureList(settings.ownerCertifications).length
    ? parseFeatureList(settings.ownerCertifications)
    : [
      'ACE Certified Personal Trainer',
      'Sports Nutrition & Diet Planning',
      'Strength & Conditioning Specialist',
    ];

  const achievements = parseFeatureList(settings.ownerAchievements).length
    ? parseFeatureList(settings.ownerAchievements)
    : [
      'Gold — Uttar Pradesh State Bodybuilding Championship',
      'Silver — North India Fitness Classic',
      'Multiple regional powerlifting podium finishes',
    ];

  useEffect(() => {
    if (!previewMode) document.title = `${name} | ${gymName}`;
  }, [name, gymName, previewMode]);

  return (
    <div className="bg-zinc-950">
      <section className={`relative ${sectionPadding(compact)} overflow-hidden border-b border-white/5`}>
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 via-transparent to-zinc-950 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <Link to={{ pathname: '/', hash: '#about' }} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to home
          </Link>

          <div className={`${compact ? 'grid grid-cols-1 gap-8' : 'grid lg:grid-cols-[280px_1fr] gap-10'} items-start`}>
            {photo && (
              <ScrollReveal3D className={`mx-auto w-full max-w-[280px] ${compact ? '' : 'lg:mx-0'}`}>
                <div className="[&_.image-frame-3d>div:last-child]:aspect-[3/4]">
                  <ImageFrame3D src={photo} alt={name} />
                </div>
              </ScrollReveal3D>
            )}

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <p className="text-orange-500 text-sm font-semibold mb-2">Meet your coach</p>
              <h1 className={`font-bold mb-2 ${compact ? 'text-2xl' : 'text-3xl md:text-5xl'}`}>{name}</h1>
              <p className={`text-zinc-400 mb-6 ${compact ? 'text-base' : 'text-lg'}`}>{title} · {gymName}</p>
              <p className="text-zinc-300 leading-relaxed max-w-2xl whitespace-pre-line">{bio}</p>
              <Link
                to={{ pathname: '/', hash: '#contact' }}
                className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-black font-semibold text-sm transition-colors"
              >
                Train with {name.split(' ')[0]} <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className={`max-w-6xl mx-auto ${grid1Or2(compact)} gap-10`}>
          <div className={`rounded-2xl border border-zinc-800 bg-zinc-900/50 ${compact ? 'p-6' : 'p-6 md:p-8'}`}>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
              <Award className="text-orange-500" size={22} />
              Certifications & training
            </h2>
            <ul className="space-y-4">
              {certifications.map(item => (
                <li key={item} className="flex gap-3 text-sm text-zinc-300">
                  <CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className={`rounded-2xl border border-zinc-800 bg-zinc-900/50 ${compact ? 'p-6' : 'p-6 md:p-8'}`}>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
              <Trophy className="text-orange-500" size={22} />
              Competitions & wins
            </h2>
            <ul className="space-y-4">
              {achievements.map(item => (
                <li key={item} className="flex gap-3 text-sm text-zinc-300">
                  <Medal size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 border-t border-white/5 bg-zinc-900/20">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-zinc-400 mb-4">Ready to start your transformation?</p>
          <Link to={{ pathname: '/', hash: '#contact' }} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-700 hover:border-orange-500/50 text-white font-medium text-sm transition-colors">
            Contact us at the front desk <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
