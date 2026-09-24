/** Fallback text shown on the public site when a setting is empty in the database. */
export const WEBSITE_FIELD_DEFAULTS: Record<string, string> = {
  gymName: 'Fit X Gym',
  tagline: 'Your neighborhood gym in Khurja',
  heroHeading: 'Train hard. Stay consistent.',
  heroDescription:
    'Modern equipment, friendly coaches, and flexible memberships for every fitness level — right here in Khurja.',
  phone: '+91 9760260553',
  whatsapp: '919760260553',
  email: 'info@fitxgym.com',
  address: 'Opp. Radha Krishna Mandir, Khurja, Bulandshahr, UP 203131',
  weekdayHours: '05:00 AM – 11:00 PM',
  weekendHours: '06:00 AM – 09:00 PM',
  instagram: 'https://instagram.com/fitxgym',
  facebook: 'https://facebook.com/fitxgym',
  youtube: '',
  mapsUrl: '',
  aboutHeading: 'Welcome to Fit X Gym',
  aboutDescription:
    'Fit X Gym has been helping people in Khurja build strength and healthy habits since 2018. Whether you are just starting out or training seriously, you will find a welcoming space and practical guidance.',
  aboutExtra:
    'We believe fitness should feel approachable, not intimidating — whether you are 18 or 55.\nOur coaches focus on form, consistency, and habits you can keep for years, not just weeks.\nDrop in anytime for a walkthrough — we would love to meet you at the front desk.',
  aboutFeatures:
    'Modern cardio & strength equipment\nClean, well-maintained facility\nExperienced on-floor support\nFlexible membership options\nFriendly local community\nConvenient Khurja location',
  ownerName: 'Deepak Solanki',
  ownerTitle: 'Founder & Head Coach',
  ownerBio: 'Certified coach helping Khurja stay fit since 2018.',
  ownerPageBio:
    'Deepak Solanki founded Fit X Gym with one goal — make serious fitness accessible to everyone in Khurja. With years of competition experience and hands-on coaching, he helps members train with confidence, eat smart, and stay consistent.\n\nWhether you want fat loss, muscle gain, or general health, Deepak builds programs that fit your life — not the other way around.',
  ownerCertifications:
    'ACE Certified Personal Trainer\nSports Nutrition & Diet Planning\nStrength & Conditioning Specialist\nFirst Aid & Gym Safety',
  ownerAchievements:
    'Gold — Uttar Pradesh State Bodybuilding Championship\nSilver — North India Fitness Classic\nPodium — Regional Powerlifting Meet\nMultiple local physique & strength titles',
  ptTitle: 'Personal Training',
  ptDescription:
    'One-on-one coaching with a personalised workout program and diet schedule — built around your goals.',
  ptPrice: '7999',
  ptDuration: '/ month',
  ptFeatures:
    '1-on-1 certified personal coaching\nPersonalised workout program\nCustom diet & nutrition schedule\nProgress tracking & adjustments\nFlexible session scheduling',
  privacyPolicy:
    'Fit X Gym respects your privacy. Information you submit through our website or at the gym is used only to manage your membership, respond to enquiries, and improve our services. We do not sell your personal data to third parties.',
  termsConditions:
    'By using Fit X Gym facilities you agree to follow gym rules, train safely, and respect staff and other members. Membership terms, fees, and facility rules are explained at the front desk before joining.',
  refundPolicy:
    'Membership fees are generally non-refundable once activated. Special circumstances may be reviewed by management at the gym. Please speak with the owner for any refund request.',
};

export function fieldPlaceholder(key: string, published?: Record<string, string>): string {
  const live = published?.[key]?.trim();
  if (live) return live;
  const fallback = WEBSITE_FIELD_DEFAULTS[key]?.trim();
  if (fallback) return fallback;
  return 'Enter text…';
}

/** Shown under the field when cleared — explains what visitors currently see. */
export function fieldSiteHint(key: string, value: string, published?: Record<string, string>): string | null {
  if (value.trim()) return null;
  const live = published?.[key]?.trim();
  if (live) return `Currently on live site: ${truncate(live, 120)}`;
  const fallback = WEBSITE_FIELD_DEFAULTS[key]?.trim();
  if (fallback) return `Default if empty: ${truncate(fallback, 120)}`;
  return null;
}

function truncate(text: string, max: number): string {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max)}…`;
}

/** Value shown in the editor — live DB text, then site default, without writing defaults into form state. */
export function displayFieldValue(
  form: Record<string, string>,
  key: string,
  published?: Record<string, string>,
): string {
  if (key in form) return form[key];
  const live = published?.[key]?.trim();
  if (live) return live;
  return WEBSITE_FIELD_DEFAULTS[key] || '';
}
