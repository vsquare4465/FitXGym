import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import {
  MEMBERSHIP_PLANS,
  INITIAL_MEMBERS,
  INITIAL_STAFF,
  INITIAL_EXPENSES,
  INITIAL_PAYMENTS,
  INITIAL_INVENTORY,
  INITIAL_ATTENDANCE,
  MOCK_REVIEWS,
} from '../src/data/mockData.js';

const prisma = new PrismaClient();

const isProd = process.env.NODE_ENV === 'production';
/** Demo members, payments, expenses — off in production unless explicitly enabled. */
const seedDemo =
  process.env.SEED_DEMO_DATA === 'true' ||
  (!isProd && process.env.SEED_DEMO_DATA !== 'false');

async function main() {
  console.log(`Seeding Fit X Gym database (${isProd ? 'production' : 'development'} mode)...`);
  if (isProd && !seedDemo) {
    console.log('Demo data skipped (SEED_DEMO_DATA is not true).');
  }

  const owner1Email = process.env.SEED_OWNER1_EMAIL || 'owner1@fitxgym.com';
  const owner1Pass = process.env.SEED_OWNER1_PASSWORD || 'FitXOwner1!';
  const owner2Email = process.env.SEED_OWNER2_EMAIL || 'owner2@fitxgym.com';
  const owner2Pass = process.env.SEED_OWNER2_PASSWORD || 'FitXOwner2!';

  const hash1 = await bcrypt.hash(owner1Pass, 12);
  const hash2 = await bcrypt.hash(owner2Pass, 12);

  // In production, create missing owners/plans only — never overwrite live passwords or prices.
  async function upsertOwner(email: string, passwordHash: string, name: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: { email, passwordHash, name, role: 'OWNER' },
      });
      return;
    }
    if (!isProd) {
      await prisma.user.update({
        where: { email },
        data: { passwordHash, name, role: 'OWNER' },
      });
    }
  }

  await upsertOwner(owner1Email, hash1, 'Gym Owner 1');
  await upsertOwner(owner2Email, hash2, 'Gym Owner 2');

  for (const p of MEMBERSHIP_PLANS) {
    const existing = await prisma.plan.findUnique({ where: { id: p.id } });
    if (!existing) {
      await prisma.plan.create({
        data: {
          id: p.id,
          name: p.name,
          duration: p.duration,
          price: p.price,
          features: p.features,
          popular: p.popular ?? false,
        },
      });
    } else if (!isProd) {
      await prisma.plan.update({
        where: { id: p.id },
        data: {
          name: p.name,
          duration: p.duration,
          price: p.price,
          features: p.features,
          popular: p.popular ?? false,
        },
      });
    }
  }

  if (seedDemo) for (const m of INITIAL_MEMBERS) {
    const memberHash = await bcrypt.hash(m.password || '123456', 10);
    await prisma.member.upsert({
      where: { id: m.id },
      create: {
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        passwordHash: memberHash,
        photo: m.photo,
        joinDate: m.joinDate,
        expiryDate: m.expiryDate,
        planId: m.planId,
        status: m.status as 'Active' | 'Expired' | 'Frozen' | 'Pending',
        emergencyContact: m.emergencyContact,
        medicalHistory: m.medicalHistory,
        idProofUrl: m.idProofUrl,
        qrCodeValue: m.qrCodeValue,
        weightHistory: m.weightHistory,
        measurementsHistory: m.measurementsHistory,
        bmi: m.bmi,
        bodyFat: m.bodyFat,
        workoutPlan: m.workoutPlan,
        dietPlan: m.dietPlan,
        messages: m.messages as object,
      },
      update: {
        name: m.name,
        expiryDate: m.expiryDate,
        planId: m.planId,
        status: m.status as 'Active' | 'Expired' | 'Frozen' | 'Pending',
      },
    });

    await prisma.membership.upsert({
      where: { id: `memship_${m.id}` },
      create: {
        id: `memship_${m.id}`,
        memberId: m.id,
        planId: m.planId,
        startDate: m.joinDate,
        endDate: m.expiryDate,
        status: m.status,
      },
      update: {
        endDate: m.expiryDate,
        planId: m.planId,
        status: m.status,
      },
    });

    await prisma.user.upsert({
      where: { email: m.email },
      create: {
        email: m.email,
        passwordHash: memberHash,
        name: m.name,
        role: 'MEMBER',
        memberId: m.id,
      },
      update: { memberId: m.id },
    });
  }

  if (seedDemo) for (const s of INITIAL_STAFF) {
    await prisma.staff.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        name: s.name,
        role: s.role,
        salary: s.salary,
        shift: s.shift,
        joiningDate: s.joiningDate,
        attendanceRate: s.attendanceRate,
        performance: s.performance,
        leavesRemaining: s.leavesRemaining,
        documents: s.documents,
        salaryHistory: s.salaryHistory,
        tasks: s.tasks,
      },
      update: s,
    });
  }

  if (seedDemo) for (const e of INITIAL_EXPENSES) {
    await prisma.expense.upsert({
      where: { id: e.id },
      create: {
        id: e.id,
        category: e.category,
        amount: e.amount,
        date: e.date,
        description: e.description,
        paymentMethod: e.paymentMethod,
        status: e.status as 'Paid' | 'Pending',
      },
      update: e,
    });
  }

  if (seedDemo) for (const p of INITIAL_PAYMENTS) {
    await prisma.payment.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        memberId: p.memberId,
        memberName: p.memberName,
        amount: p.amount,
        date: p.date,
        category: p.category,
        paymentMethod: p.paymentMethod,
        status: p.status as 'Completed' | 'Pending' | 'Failed',
        invoiceNo: p.invoiceNo,
      },
      update: p,
    });
  }

  if (seedDemo) for (const i of INITIAL_INVENTORY) {
    await prisma.inventoryItem.upsert({ where: { id: i.id }, create: i, update: i });
  }

  if (seedDemo) for (const a of INITIAL_ATTENDANCE) {
    await prisma.attendanceRecord.upsert({
      where: { id: a.id },
      create: {
        id: a.id,
        memberId: a.memberId,
        memberName: a.memberName,
        photo: a.photo,
        role: a.role,
        date: a.date,
        checkIn: a.checkIn,
        checkOut: a.checkOut,
        duration: a.duration,
        status: a.status,
      },
      update: a,
    });
  }

  if (seedDemo) for (const r of MOCK_REVIEWS) {
    await prisma.testimonial.upsert({
      where: { id: r.id },
      create: { id: r.id, name: r.name, rating: r.rating, text: r.text, date: r.date, approved: true },
      update: { approved: true },
    });
  }

  const galleryUrls = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
  ];
  const galleryCount = await prisma.galleryImage.count();
  if (galleryCount === 0 || seedDemo) {
    if (seedDemo) await prisma.galleryImage.deleteMany();
    await prisma.galleryImage.createMany({
      data: galleryUrls.map((url, i) => ({ url, sortOrder: i })),
      skipDuplicates: true,
    });
  }

  const defaultSettings: Record<string, string> = {
    gymName: 'Fit X Gym',
    tagline: 'Your neighborhood gym in Khurja',
    heroHeading: 'Train hard. Stay consistent.',
    heroDescription: 'Modern equipment, friendly coaches, and flexible memberships for every fitness level — right here in Khurja.',
    phone: '+91 9760260553',
    whatsapp: '919760260553',
    email: 'info@fitxgym.com',
    address: 'Opp. Radha Krishna Mandir, Khurja, Bulandshahr, UP 203131',
    weekdayHours: '05:00 AM – 11:00 PM',
    weekendHours: '06:00 AM – 09:00 PM',
    instagram: 'https://instagram.com/fitxgym',
    facebook: 'https://facebook.com/fitxgym',
    ownerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    ownerName: 'Deepak Solanki',
    ownerTitle: 'Founder & Head Coach',
    ownerBio: 'Certified coach helping Khurja stay fit since 2018.',
    ownerPageBio: 'Deepak Solanki founded Fit X Gym with one goal — make serious fitness accessible to everyone in Khurja. With years of competition experience and hands-on coaching, he helps members train with confidence, eat smart, and stay consistent.\n\nWhether you want fat loss, muscle gain, or general health, Deepak builds programs that fit your life — not the other way around.',
    ownerCertifications: 'ACE Certified Personal Trainer\nSports Nutrition & Diet Planning\nStrength & Conditioning Specialist\nFirst Aid & Gym Safety',
    ownerAchievements: 'Gold — Uttar Pradesh State Bodybuilding Championship\nSilver — North India Fitness Classic\nPodium — Regional Powerlifting Meet\nMultiple local physique & strength titles',
    aboutHeading: 'Welcome to Fit X Gym',
    aboutDescription: 'Fit X Gym has been helping people in Khurja build strength and healthy habits since 2018. Whether you are just starting out or training seriously, you will find a welcoming space and practical guidance.',
    aboutExtra: 'We believe fitness should feel approachable, not intimidating — whether you are 18 or 55.\nOur coaches focus on form, consistency, and habits you can keep for years, not just weeks.\nDrop in anytime for a walkthrough — we would love to meet you at the front desk.',
    aboutFeatures: 'Modern cardio & strength equipment\nClean, well-maintained facility\nExperienced on-floor support\nFlexible membership options\nFriendly local community\nConvenient Khurja location',
    ptEnabled: 'true',
    ptTitle: 'Personal Training',
    ptDescription: 'One-on-one coaching with a personalised workout program and diet schedule — built around your goals.',
    ptPrice: '7999',
    ptDuration: '/ month',
    ptFeatures: '1-on-1 certified personal coaching\nPersonalised workout program\nCustom diet & nutrition schedule\nProgress tracking & adjustments\nFlexible session scheduling',
    ptImage: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=80',
    privacyPolicy: 'Fit X Gym respects your privacy. Information you submit through our website or at the gym is used only to manage your membership, respond to enquiries, and improve our services. We do not sell your personal data to third parties.',
    termsConditions: 'By using Fit X Gym facilities you agree to follow gym rules, train safely, and respect staff and other members. Membership terms, fees, and facility rules are explained at the front desk before joining.',
    refundPolicy: 'Membership fees are generally non-refundable once activated. Special circumstances may be reviewed by management at the gym. Please speak with the owner for any refund request.',
    heroImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&auto=format&fit=crop&q=80',
    metaTitle: 'Fit X Gym Khurja | Local Gym & Fitness Center',
    metaDescription: 'Join Fit X Gym in Khurja — modern equipment, friendly coaches, flexible memberships.',
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    const existing = await prisma.websiteSetting.findUnique({ where: { key } });
    if (!existing) {
      await prisma.websiteSetting.create({ data: { key, value } });
    } else if (!isProd) {
      await prisma.websiteSetting.update({ where: { key }, data: { value } });
    }
  }

  const activeQr = await prisma.qrToken.findFirst({ where: { isActive: true } });
  if (!activeQr) {
    await prisma.qrToken.create({ data: { token: `FTX_${Date.now()}`, isActive: true } });
  }

  await prisma.auditLog.create({
    data: { message: 'SYSTEM: Database seeded successfully.' },
  });

  console.log('Seed complete.');
  console.log(`Owner 1: ${owner1Email} / (see SEED_OWNER1_PASSWORD in .env)`);
  console.log(`Owner 2: ${owner2Email} / (see SEED_OWNER2_PASSWORD in .env)`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
