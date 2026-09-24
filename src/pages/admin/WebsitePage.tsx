import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, Eye, Globe, Pencil, Save, Trash2, Upload } from 'lucide-react';
import { dedupeGalleryByUrl } from '../../lib/galleryUtils';
import {
  displayFieldValue,
  fieldPlaceholder,
  fieldSiteHint,
} from '../../lib/websiteFieldDefaults';
import {
  parseWebsiteDraft,
  serializeWebsiteDraft,
  stripInternalSettings,
  WEBSITE_DRAFT_KEY,
} from '../../lib/websiteDraft';
import { useGymData } from '../../context/GymDataProvider';
import { GalleryImage, Plan, Review } from '../../types';
import WebsitePreview from '../../components/admin/WebsitePreview';
import { adminApi } from '../../api/client';

function SettingsField({
  field,
  label,
  rows,
  value,
  placeholder,
  siteHint,
  onChange,
}: {
  field: string;
  label: string;
  rows?: number;
  value: string;
  placeholder?: string;
  siteHint?: string | null;
  onChange: (field: string, value: string) => void;
}) {
  const className =
    'w-full mt-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm placeholder:text-zinc-600';

  return (
    <div>
      <label className="text-xs text-zinc-500">{label}</label>
      {rows ? (
        <textarea
          value={value}
          onChange={e => onChange(field, e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className={className}
        />
      ) : (
        <input
          value={value}
          onChange={e => onChange(field, e.target.value)}
          placeholder={placeholder}
          className={className}
        />
      )}
      {siteHint && <p className="text-[10px] text-zinc-600 mt-1">{siteHint}</p>}
    </div>
  );
}

function ImageField({
  label,
  hint,
  value,
  onUpload,
  onRemove,
  tall,
}: {
  label: string;
  hint?: string;
  value?: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  tall?: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-zinc-500">{label}</label>
      {hint && <p className="text-[10px] text-zinc-600 mt-0.5">{hint}</p>}
      {value && (
        <div className="relative mt-2 group">
          <img
            src={value}
            alt=""
            className={`w-full rounded-lg border border-zinc-800 bg-zinc-950 object-cover ${tall ? 'h-36 object-contain p-3' : 'max-h-40'}`}
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/75 text-[10px] text-red-300 hover:text-red-200"
          >
            <Trash2 size={12} /> Remove
          </button>
        </div>
      )}
      <label className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 text-xs cursor-pointer hover:bg-zinc-700">
        <Upload size={14} /> {value ? 'Replace image' : 'Upload image'}
        <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
      </label>
    </div>
  );
}

const BASIC_FIELDS = [
  { key: 'gymName', label: 'Gym name' },
  { key: 'tagline', label: 'Hero tagline' },
  { key: 'heroHeading', label: 'Hero heading' },
  { key: 'heroDescription', label: 'Hero description', rows: 3 },
  { key: 'phone', label: 'Phone' },
  { key: 'whatsapp', label: 'WhatsApp number (country code, no +)' },
  { key: 'email', label: 'Business email (shown on public website & contact)' },
  { key: 'address', label: 'Address' },
  { key: 'weekdayHours', label: 'Weekday hours' },
  { key: 'weekendHours', label: 'Weekend hours' },
  { key: 'instagram', label: 'Instagram URL or @handle' },
  { key: 'facebook', label: 'Facebook URL' },
  { key: 'youtube', label: 'YouTube URL' },
  { key: 'mapsUrl', label: 'Google Maps URL' },
];

const TEXT_FIELDS = [
  { key: 'aboutHeading', label: 'Section heading', section: 'about' as const },
  { key: 'aboutDescription', label: 'Gym description', rows: 4, section: 'about' as const },
  { key: 'aboutExtra', label: 'Extra welcome lines (one paragraph per line)', rows: 4, section: 'about' as const },
  { key: 'aboutFeatures', label: 'Features (one per line)', rows: 6, section: 'about' as const },
  { key: 'ownerName', label: 'Owner / coach name', section: 'about' as const },
  { key: 'ownerTitle', label: 'Owner title (e.g. Founder & Head Coach)', section: 'about' as const },
  { key: 'ownerBio', label: 'Short owner bio (about section)', rows: 2, section: 'about' as const },
  { key: 'ownerPageBio', label: 'Full owner bio (/owner page)', rows: 4, section: 'about' as const },
  { key: 'ownerCertifications', label: 'Certifications (one per line)', rows: 5, section: 'about' as const },
  { key: 'ownerAchievements', label: 'Competition wins (one per line)', rows: 5, section: 'about' as const },
  { key: 'ptTitle', label: 'Plan title', section: 'pt' as const },
  { key: 'ptDescription', label: 'Description', rows: 3, section: 'pt' as const },
  { key: 'ptPrice', label: 'Price (₹)', section: 'pt' as const },
  { key: 'ptDuration', label: 'Duration label (e.g. / month)', section: 'pt' as const },
  { key: 'ptFeatures', label: 'What you get (one per line)', rows: 6, section: 'pt' as const },
  { key: 'privacyPolicy', label: 'Privacy policy', rows: 8, section: 'legal' as const },
  { key: 'termsConditions', label: 'Terms & conditions', rows: 8, section: 'legal' as const },
  { key: 'refundPolicy', label: 'Refund policy', rows: 8, section: 'legal' as const },
];

export default function WebsitePage() {
  const { settings, onUpdateSettings, gallery, onUpdateGallery, plans, testimonials, refresh } = useGymData();
  const [form, setForm] = useState<Record<string, string>>({});
  const [gal, setGal] = useState<GalleryImage[]>([]);
  const [draftSaved, setDraftSaved] = useState(false);
  const [published, setPublished] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const settingsHydrated = useRef(false);
  const publishedRef = useRef<{ settings: Record<string, string>; gallery: GalleryImage[] } | null>(null);

  const publishedLive = useMemo(() => stripInternalSettings(settings), [settings]);

  useEffect(() => {
    if (settingsHydrated.current || Object.keys(settings).length === 0) return;

    const liveSettings = stripInternalSettings(settings);
    const liveGallery = dedupeGalleryByUrl(gallery);
    const draft = parseWebsiteDraft(settings[WEBSITE_DRAFT_KEY]);

    const initialForm = { ...liveSettings, ...(draft?.settings ?? {}) };
    const initialGal = draft?.gallery ? dedupeGalleryByUrl(draft.gallery) : liveGallery;

    setForm(initialForm);
    setGal(initialGal);
    publishedRef.current = { settings: liveSettings, gallery: liveGallery };
    settingsHydrated.current = true;
  }, [settings, gallery]);

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const fieldProps = (key: string, label: string, rows?: number) => {
    const raw = form[key];
    const value = displayFieldValue(form, key, publishedLive);
    return {
      field: key,
      label,
      rows,
      value,
      placeholder: fieldPlaceholder(key, publishedLive),
      siteHint: fieldSiteHint(key, raw ?? '', publishedLive),
      onChange: updateField,
    };
  };

  const hasUnpublishedChanges = useMemo(() => {
    if (!publishedRef.current) return false;
    const pub = publishedRef.current;
    return JSON.stringify(form) !== JSON.stringify(pub.settings)
      || JSON.stringify(gal) !== JSON.stringify(pub.gallery);
  }, [form, gal]);

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await adminApi.updateSettings({
        [WEBSITE_DRAFT_KEY]: serializeWebsiteDraft(form, gal),
      });
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2500);
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Publish all changes to the live website? Visitors will see these updates.')) return;
    setPublishing(true);
    try {
      await onUpdateSettings(form);
      const unique = dedupeGalleryByUrl(gal);
      await onUpdateGallery(unique);
      await adminApi.updateSettings({
        [WEBSITE_DRAFT_KEY]: JSON.stringify({
          settings: form,
          gallery: unique,
          publishedAt: new Date().toISOString(),
        }),
      });
      publishedRef.current = { settings: { ...form }, gallery: unique };
      setGal(unique);
      setPublished(true);
      await refresh();
      setTimeout(() => setPublished(false), 3000);
    } finally {
      setPublishing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({ ...prev, [field]: reader.result as string }));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeImageField = (field: string) => {
    setForm(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const addGalleryImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    Promise.all(Array.from(files).map(file => new Promise<GalleryImage>(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve({ url: reader.result as string, caption: '', active: true, featured: false, sortOrder: 0 });
      reader.readAsDataURL(file);
    }))).then(newItems => {
      setGal(prev => {
        const existing = new Set(prev.map(g => g.url));
        const fresh = newItems.filter(item => !existing.has(item.url));
        if (fresh.length === 0) return prev;
        return [...prev, ...fresh.map((item, i) => ({ ...item, sortOrder: prev.length + i }))];
      });
    });
    e.target.value = '';
  };

  const aboutFields = TEXT_FIELDS.filter(f => f.section === 'about');
  const ptFields = TEXT_FIELDS.filter(f => f.section === 'pt');
  const legalFields = TEXT_FIELDS.filter(f => f.section === 'legal');

  const formContent = (
    <div className="space-y-8 pb-8">
      <section className="space-y-4 rounded-xl border border-zinc-800 p-5">
        <h2 className="text-sm font-semibold text-orange-500 uppercase">About us section</h2>
        {aboutFields.map(({ key, label, rows }) => (
          <SettingsField key={key} {...fieldProps(key, label, rows)} />
        ))}
        <ImageField
          label="About section image"
          value={form.aboutImage}
          onUpload={e => handleImageUpload(e, 'aboutImage')}
          onRemove={() => removeImageField('aboutImage')}
        />
      </section>

      <section className="space-y-4 rounded-xl border border-zinc-800 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-orange-500 uppercase">Personal training section</h2>
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={form.ptEnabled !== 'false'}
              onChange={e => setForm(prev => ({ ...prev, ptEnabled: e.target.checked ? 'true' : 'false' }))}
            />
            Show on website
          </label>
        </div>
        {ptFields.slice(0, 2).map(({ key, label, rows }) => (
          <SettingsField key={key} {...fieldProps(key, label, rows)} />
        ))}
        <div className="grid sm:grid-cols-2 gap-3">
          {ptFields.slice(2, 4).map(({ key, label }) => (
            <SettingsField key={key} {...fieldProps(key, label)} />
          ))}
        </div>
        <SettingsField {...fieldProps('ptFeatures', 'What you get (one per line)', 6)} />
        <ImageField
          label="Training image"
          value={form.ptImage}
          onUpload={e => handleImageUpload(e, 'ptImage')}
          onRemove={() => removeImageField('ptImage')}
        />
        <p className="text-[10px] text-zinc-600">
          Also manage the PT plan in <a href="/admin/plans" className="text-orange-500">Plans</a> (plan_pt).
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-zinc-800 p-5">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase">Hero &amp; branding</h2>
        {BASIC_FIELDS.map(({ key, label, rows }) => (
          <SettingsField key={key} {...fieldProps(key, label, rows)} />
        ))}
        <div className="grid sm:grid-cols-3 gap-4">
          <ImageField
            label="Logo"
            hint="PNG with transparent background works best."
            value={form.logoUrl}
            tall
            onUpload={e => handleImageUpload(e, 'logoUrl')}
            onRemove={() => removeImageField('logoUrl')}
          />
          <ImageField
            label="Hero image"
            value={form.heroImage}
            onUpload={e => handleImageUpload(e, 'heroImage')}
            onRemove={() => removeImageField('heroImage')}
          />
          <ImageField
            label="Owner photo"
            value={form.ownerPhoto}
            onUpload={e => handleImageUpload(e, 'ownerPhoto')}
            onRemove={() => removeImageField('ownerPhoto')}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-zinc-800 p-5">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase">Legal pages (footer links)</h2>
        {legalFields.map(({ key, label, rows }) => (
          <SettingsField key={key} {...fieldProps(key, label, rows)} />
        ))}
        <p className="text-[10px] text-zinc-600">Published at /legal/privacy, /legal/terms, /legal/refund</p>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase mb-3">Gallery</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {gal.map((img, i) => (
            <div key={img.id || img.url || i} className="rounded-lg overflow-hidden border border-zinc-800 relative group">
              <button
                type="button"
                onClick={() => setGal(prev => prev.filter((_, j) => j !== i))}
                className="absolute top-1.5 right-1.5 z-10 p-1.5 rounded-md bg-black/75 text-zinc-300 hover:text-red-400"
                title="Remove image"
              >
                <Trash2 size={14} />
              </button>
              <img src={img.url} alt="" className="w-full aspect-square object-cover" />
              <input
                value={img.caption || ''}
                onChange={e => setGal(prev => prev.map((g, j) => j === i ? { ...g, caption: e.target.value } : g))}
                placeholder="Caption"
                className="w-full px-2 py-1 text-[10px] bg-zinc-950 border-t border-zinc-800"
              />
              <div className="flex gap-1 p-1 bg-zinc-950 text-[10px]">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={img.featured}
                    onChange={e => setGal(prev => prev.map((g, j) => j === i ? { ...g, featured: e.target.checked } : g))}
                  />
                  Featured
                </label>
                <label className="flex items-center gap-1 ml-auto">
                  <input
                    type="checkbox"
                    checked={img.active !== false}
                    onChange={e => setGal(prev => prev.map((g, j) => j === i ? { ...g, active: e.target.checked } : g))}
                  />
                  Active
                </label>
              </div>
            </div>
          ))}
        </div>
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-sm cursor-pointer">
          <Upload size={16} /> Add images (multiple)
          <input type="file" accept="image/*" multiple className="hidden" onChange={addGalleryImages} />
        </label>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase mb-2">Membership plans</h2>
        <p className="text-xs text-zinc-500">
          {(plans as Plan[]).filter(p => p.active !== false).length} active plans · edit in{' '}
          <a href="/admin/plans" className="text-orange-500">Plans</a>
        </p>
      </section>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
      <div className="flex-shrink-0 px-4 md:px-6 pt-4 pb-3 border-b border-zinc-800/80 bg-zinc-950/95">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-xl font-bold">Website content</h1>
            <p className="text-xs text-zinc-500">Preview updates instantly · Publish when ready for visitors</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-white text-sm font-medium disabled:opacity-60"
            >
              <Save size={16} />
              {savingDraft ? 'Saving...' : draftSaved ? 'Draft saved!' : 'Save draft'}
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing || !hasUnpublishedChanges}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-black text-sm font-semibold disabled:opacity-50"
            >
              {published ? <CheckCircle size={16} /> : <Globe size={16} />}
              {publishing ? 'Publishing...' : published ? 'Published!' : 'Publish to live site'}
            </button>
          </div>
        </div>

        <div className="xl:hidden flex gap-2 mt-3 max-w-[1600px] mx-auto">
          <button
            type="button"
            onClick={() => setMobileTab('edit')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium ${
              mobileTab === 'edit' ? 'bg-orange-600 text-black' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            <Pencil size={16} /> Edit
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium ${
              mobileTab === 'preview' ? 'bg-orange-600 text-black' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            <Eye size={16} /> Preview
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-rows-[minmax(0,1fr)] xl:gap-5 px-4 md:px-6 py-3 w-full max-w-[1800px] mx-auto">
        <div
          className={`min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain xl:pr-1 ${
            mobileTab === 'preview' ? 'hidden xl:block' : 'block'
          }`}
        >
          {formContent}
        </div>

        <div
          className={`min-h-0 min-w-0 flex-1 overflow-hidden flex flex-col ${
            mobileTab === 'edit' ? 'hidden xl:flex' : 'flex'
          }`}
        >
          <WebsitePreview
            settings={form}
            gallery={gal}
            plans={plans as Plan[]}
            testimonials={testimonials as Review[]}
            hasUnpublishedChanges={hasUnpublishedChanges}
          />
        </div>
      </div>
    </div>
  );
}
