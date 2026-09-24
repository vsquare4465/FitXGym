import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { toClientMember } from '../lib/memberMapper.js';
import { rateLimit } from '../lib/rateLimit.js';

const router = Router();
const formLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: 'Too many submissions. Please wait a minute.' });
const checkinLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: 'Too many check-in attempts. Please wait.' });

router.get('/plans', async (_req, res) => {
  const plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { price: 'asc' } });
  res.json(plans.map(p => ({ ...p, features: p.features as string[] })));
});

router.get('/settings', async (_req, res) => {
  const rows = await prisma.websiteSetting.findMany();
  const settings: Record<string, string> = {};
  rows.forEach(r => {
    if (r.key === 'websiteDraft' || r.key.startsWith('_')) return;
    settings[r.key] = r.value;
  });
  res.json(settings);
});

router.get('/gallery', async (_req, res) => {
  const images = await prisma.galleryImage.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  });
  const seen = new Set<string>();
  const unique = images.filter(i => {
    if (!i.url || seen.has(i.url)) return false;
    seen.add(i.url);
    return true;
  });
  res.json(unique.map(i => ({ url: i.url, caption: i.caption, featured: i.featured })));
});

router.get('/testimonials', async (_req, res) => {
  const list = await prisma.testimonial.findMany({
    where: { approved: true },
    orderBy: { date: 'desc' },
  });
  res.json(list);
});

router.post('/testimonials', formLimiter, async (req, res) => {
  const { name, rating, text } = req.body;
  if (!name || !text) return res.status(400).json({ error: 'Name and text required' });
  const t = await prisma.testimonial.create({
    data: {
      name,
      rating: rating ?? 5,
      text,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      approved: false,
    },
  });
  await prisma.auditLog.create({
    data: { message: `FEEDBACK: New testimonial from ${name} pending approval` },
  });
  res.json(t);
});

router.post('/leads', formLimiter, async (req, res) => {
  const { name, phone, whatsapp, email, message, interestedPlan, subject, source } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
  const lead = await prisma.lead.create({
    data: {
      name,
      phone,
      whatsapp: whatsapp || phone,
      email: email ?? null,
      message: message ?? null,
      interestedPlan: interestedPlan ?? null,
      subject: subject ?? null,
      source: source ?? 'Contact',
    },
  });
  await prisma.auditLog.create({
    data: { message: `LEAD: ${source ?? 'Contact'} from ${name} (${phone})` },
  });
  res.json(lead);
});

router.post('/register', async (req, res) => {
  const { member, planPrice, paymentMethod } = req.body;
  if (!member?.email || !member?.name) {
    return res.status(400).json({ error: 'Invalid registration data' });
  }

  const passwordHash = await bcrypt.hash(member.password || '123456', 10);

  const created = await prisma.member.create({
    data: {
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      whatsapp: member.whatsapp || member.phone,
      passwordHash,
      photo: member.photo,
      joinDate: member.joinDate,
      expiryDate: member.expiryDate,
      planId: member.planId,
      status: member.status,
      emergencyContact: member.emergencyContact ?? {},
      medicalHistory: member.medicalHistory ?? [],
      idProofUrl: member.idProofUrl,
      qrCodeValue: member.qrCodeValue,
      weightHistory: member.weightHistory ?? [],
      measurementsHistory: member.measurementsHistory ?? [],
      bmi: member.bmi ?? 0,
      bodyFat: member.bodyFat ?? 0,
      workoutPlan: member.workoutPlan ?? [],
      dietPlan: member.dietPlan ?? [],
      messages: member.messages ?? [],
    },
  });

  await prisma.user.create({
    data: {
      email: member.email,
      passwordHash,
      name: member.name,
      role: 'MEMBER',
      memberId: created.id,
    },
  });

  const membership = await prisma.membership.create({
    data: {
      memberId: created.id,
      planId: member.planId,
      startDate: member.joinDate,
      endDate: member.expiryDate,
      status: member.status,
      amount: planPrice || 0,
      paidAmount: planPrice || 0,
    },
  });

  if (planPrice > 0) {
    await prisma.payment.create({
      data: {
        memberId: created.id,
        memberName: created.name,
        amount: planPrice,
        date: new Date().toISOString().split('T')[0],
        category: 'New Membership',
        paymentMethod: paymentMethod ?? 'UPI',
        status: 'Completed',
        invoiceNo: `FTX-INV-${Math.floor(6000 + Math.random() * 3000)}`,
        membershipId: membership.id,
      },
    });
  }

  await prisma.auditLog.create({
    data: { message: `REGISTRATION: ${created.name} (${created.id}) registered` },
  });

  res.json(toClientMember(created));
});

router.get('/checkin-token/:token', async (req, res) => {
  const valid = await prisma.qrToken.findFirst({
    where: { token: req.params.token, isActive: true },
  });
  res.json({ valid: !!valid });
});

router.get('/checkin-status', async (req, res) => {
  const token = String(req.query.token || '');
  const memberId = String(req.query.memberId || '').toUpperCase().trim();
  if (!token || !memberId) {
    return res.status(400).json({ error: 'Token and member ID required' });
  }

  const qrValid = await prisma.qrToken.findFirst({ where: { token, isActive: true } });
  if (!qrValid) return res.status(403).json({ error: 'Invalid or expired QR code' });

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) return res.status(404).json({ error: 'Member not found' });

  const today = new Date().toISOString().split('T')[0];
  const open = await prisma.attendanceRecord.findFirst({
    where: { memberId, date: today, checkOut: null },
  });

  res.json({
    memberName: member.name,
    checkedIn: !!open,
    checkIn: open?.checkIn ?? null,
  });
});

router.post('/checkin', checkinLimiter, async (req, res) => {
  const { token, phone, memberId, action } = req.body;
  if (!token || !memberId) {
    return res.status(400).json({ error: 'Token and member ID required' });
  }

  const qrValid = await prisma.qrToken.findFirst({ where: { token, isActive: true } });
  if (!qrValid) return res.status(403).json({ error: 'Invalid or expired QR code' });

  const member = await prisma.member.findUnique({ where: { id: memberId.toUpperCase().trim() } });
  if (!member) return res.status(404).json({ error: 'Member not found. Check your ID on your membership card.' });

  if (phone) {
    const normalizedPhone = phone.replace(/\D/g, '');
    const memberPhone = member.phone.replace(/\D/g, '');
    if (normalizedPhone && normalizedPhone !== memberPhone && !memberPhone.endsWith(normalizedPhone.slice(-10))) {
      return res.status(403).json({ error: 'Phone number does not match member record' });
    }
  }

  if (member.status === 'Expired' || member.status === 'Frozen') {
    return res.status(403).json({ error: 'Membership is not active. Please contact the front desk.' });
  }

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (action === 'out') {
    const open = await prisma.attendanceRecord.findFirst({
      where: { memberId, date: today, checkOut: null },
    });
    if (!open) return res.status(404).json({ error: 'No active check-in found for today' });

    const checkInDate = new Date(`${today} ${open.checkIn}`);
    const duration = Math.max(1, Math.round((Date.now() - checkInDate.getTime()) / 60000));

    const updated = await prisma.attendanceRecord.update({
      where: { id: open.id },
      data: { checkOut: now, duration },
    });
    await prisma.auditLog.create({ data: { message: `ATTENDANCE: ${member.name} self check-out` } });
    return res.json({ action: 'checkout', record: updated, memberName: member.name });
  }

  const open = await prisma.attendanceRecord.findFirst({
    where: { memberId, date: today, checkOut: null },
  });
  if (open) {
    return res.status(409).json({
      error: 'Already checked in',
      memberName: member.name,
      checkIn: open.checkIn,
    });
  }

  const record = await prisma.attendanceRecord.create({
    data: {
      memberId,
      memberName: member.name,
      photo: member.photo,
      role: 'Member',
      date: today,
      checkIn: now,
      status: 'On Time',
    },
  });
  await prisma.auditLog.create({ data: { message: `ATTENDANCE: ${member.name} self check-in via QR` } });
  res.json({ action: 'checkin', record, memberName: member.name });
});

export default router;
