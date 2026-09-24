import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { publicApi } from '../../api/client';

const PAGES: Record<string, { title: string; settingKey: string; fallback: string }> = {
  privacy: {
    title: 'Privacy Policy',
    settingKey: 'privacyPolicy',
    fallback: 'We respect your privacy. Contact information submitted through our website is used only to respond to your enquiry and manage your gym membership. We do not sell your data to third parties.',
  },
  terms: {
    title: 'Terms & Conditions',
    settingKey: 'termsConditions',
    fallback: 'By using Fit X Gym facilities you agree to follow gym rules, train safely, and respect staff and other members. Membership fees and gym policies are explained at the front desk before joining.',
  },
  refund: {
    title: 'Refund Policy',
    settingKey: 'refundPolicy',
    fallback: 'Membership fees are generally non-refundable once activated. Special cases (medical relocation, etc.) may be reviewed by management at the gym. Please speak with the owner for any refund request.',
  },
};

export default function LegalPage() {
  const { page } = useParams<{ page: string }>();
  const meta = page ? PAGES[page] : null;
  const [content, setContent] = useState('');
  const [gymName, setGymName] = useState('Fit X Gym');

  useEffect(() => {
    if (!meta) return;
    publicApi.settings().then(s => {
      setGymName(s.gymName || 'Fit X Gym');
      setContent(s[meta.settingKey] || meta.fallback);
      document.title = `${meta.title} | ${s.gymName || 'Fit X Gym'}`;
    });
  }, [meta]);

  if (!meta) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-zinc-400">Page not found.</p>
        <Link to="/" className="text-orange-500 text-sm mt-4 inline-block">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 md:py-16">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-white mb-8">
        <ArrowLeft size={16} /> Back to {gymName}
      </Link>
      <h1 className="text-3xl font-bold mb-6">{meta.title}</h1>
      <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
      <p className="mt-10 pt-6 border-t border-zinc-800 text-sm text-zinc-500">
        Questions? <Link to="/#contact" className="text-orange-500 hover:text-orange-400">Contact us</Link>
      </p>
    </div>
  );
}
