import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { authMiddleware, requireAdmin, requirePermission } from '../middleware/auth.js';
import { isPaymentExempt } from '../lib/permissions.js';
import { toClientMember } from '../lib/memberMapper.js';
import { buildDashboard, getMemberProfile } from '../lib/dashboardStats.js';
import { daysUntil } from '../lib/dateRange.js';

const router = Router();
router.use(authMiddleware);
router.use(requireAdmin());

function formatAuditTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

async function addLog(message: string) {
  await prisma.auditLog.create({ data: { message: `[${formatAuditTime()}] ${message}` } });
}

function nextMemberId(): string {
  return `MEM-${Math.floor(1000 + Math.random() * 9000)}`;
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function planDurationMonths(duration: string): number {
  const m = duration.match(/(\d+)/);
  if (!m) return 1;
  const n = parseInt(m[1], 10);
  if (/year|annual|12/i.test(duration)) return n * 12;
  if (/month/i.test(duration)) return n;
  return n;
}

// --- Dashboard ---
router.get('/dashboard', requirePermission('dashboard', 'read'), async (req, res) => {
  const { period, from, to } = req.query;
  const data = await buildDashboard({
    period: String(period || 'month'),
    from: from ? String(from) : undefined,
    to: to ? String(to) : undefined,
  });
  res.json(data);
});

// --- Members ---
router.get('/members', requirePermission('members', 'read'), async (_req, res) => {
  const members = await prisma.member.findMany({ orderBy: { name: 'asc' } });
  res.json(members.map(toClientMember));
});

router.get('/members/:id/profile', requirePermission('members', 'read'), async (req, res) => {
  const profile = await getMemberProfile(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Member not found' });
  res.json(profile);
});

router.post('/members', requirePermission('members', 'write'), async (req, res) => {
  const body = req.body;
  const id = body.id || nextMemberId();
  const password = body.password || '123456';
  const passwordHash = await bcrypt.hash(password, 10);
  const joinDate = body.joinDate || new Date().toISOString().split('T')[0];
  const plan = await prisma.plan.findUnique({ where: { id: body.planId } });
  const months = plan ? planDurationMonths(plan.duration) : 1;
  const expiryDate = body.expiryDate || addMonths(joinDate, months);
  const membershipType = body.membershipType || 'Paid';
  const paymentExempt = isPaymentExempt(membershipType);

  const created = await prisma.member.create({
    data: {
      id,
      name: body.name,
      email: body.email,
      phone: body.phone,
      whatsapp: body.whatsapp || body.phone,
      dateOfBirth: body.dateOfBirth,
      address: body.address,
      passwordHash,
      photo: body.photo || '',
      joinDate,
      expiryDate,
      planId: body.planId,
      membershipType,
      status: body.status || 'Active',
      emergencyContact: body.emergencyContact || {},
      medicalHistory: body.medicalHistory || [],
      qrCodeValue: body.qrCodeValue || id,
      weightHistory: [],
      measurementsHistory: [],
      workoutPlan: [],
      dietPlan: [],
      messages: [],
    },
  });

  await prisma.user.create({
    data: {
      email: body.email,
      passwordHash,
      name: body.name,
      role: 'MEMBER',
      memberId: id,
    },
  });

  const planPrice = paymentExempt ? 0 : (plan?.price || 0);
  const paidAmount = paymentExempt ? 0 : Math.max(0, Number(body.paidAmount) || 0);
  const membership = await prisma.membership.create({
    data: {
      memberId: id,
      planId: body.planId,
      startDate: joinDate,
      endDate: expiryDate,
      status: 'Active',
      amount: planPrice,
      paidAmount,
    },
  });

  if (!paymentExempt && planPrice > 0) {
    await prisma.payment.create({
      data: {
        memberId: id,
        memberName: body.name,
        amount: paidAmount,
        expectedAmount: planPrice > paidAmount ? planPrice : undefined,
        date: joinDate,
        category: 'New Membership',
        paymentMethod: body.paymentMethod || 'Cash',
        status: paidAmount >= planPrice ? 'Completed' : 'Pending',
        invoiceNo: `FTX-INV-${Math.floor(6000 + Math.random() * 3000)}`,
        membershipId: membership.id,
        recordedBy: body.recordedBy,
        notes: body.notes,
      },
    });
  }

  await addLog(`MEMBERSHIP: Added member ${body.name} (${id})`);
  res.json(toClientMember(created));
});

router.put('/members/:id', requirePermission('members', 'write'), async (req, res) => {
  const { id } = req.params;
  const body = req.body;
  const updated = await prisma.member.update({
    where: { id },
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone,
      whatsapp: body.whatsapp,
      dateOfBirth: body.dateOfBirth,
      address: body.address,
      photo: body.photo,
      joinDate: body.joinDate,
      expiryDate: body.expiryDate,
      planId: body.planId,
      membershipType: body.membershipType,
      status: body.status,
      emergencyContact: body.emergencyContact,
      medicalHistory: body.medicalHistory,
      idProofUrl: body.idProofUrl,
      qrCodeValue: body.qrCodeValue,
      weightHistory: body.weightHistory,
      measurementsHistory: body.measurementsHistory,
      bmi: body.bmi,
      bodyFat: body.bodyFat,
      progressImages: body.progressImages ?? [],
      workoutPlan: body.workoutPlan,
      dietPlan: body.dietPlan,
      messages: body.messages,
    },
  });

  const linkedUser = await prisma.user.findUnique({ where: { memberId: id } });
  if (linkedUser && (body.email || body.name)) {
    await prisma.user.update({
      where: { id: linkedUser.id },
      data: {
        email: body.email || linkedUser.email,
        name: body.name || linkedUser.name,
      },
    });
  }

  await addLog(`MEMBERSHIP: Updated profile for ${updated.name} (${id})`);
  res.json(toClientMember(updated));
});

router.post('/members/:id/deactivate', requirePermission('members', 'write'), async (req, res) => {
  const updated = await prisma.member.update({
    where: { id: req.params.id },
    data: { status: 'Frozen' },
  });
  await addLog(`MEMBERSHIP: Deactivated ${updated.name}`);
  res.json(toClientMember(updated));
});

router.post('/members/:id/renew', requirePermission('members', 'write'), async (req, res) => {
  const { planId, paidAmount, paymentMethod, notes, recordedBy } = req.body;
  const member = await prisma.member.findUnique({ where: { id: req.params.id } });
  if (!member) return res.status(404).json({ error: 'Member not found' });

  const plan = await prisma.plan.findUnique({ where: { id: planId || member.planId } });
  if (!plan) return res.status(400).json({ error: 'Plan not found' });

  const startDate = new Date().toISOString().split('T')[0];
  const months = planDurationMonths(plan.duration);
  const base = daysUntil(member.expiryDate) >= 0 ? member.expiryDate : startDate;
  const endDate = addMonths(base, months);
  const paymentExempt = isPaymentExempt(member.membershipType);
  const amount = paymentExempt ? 0 : plan.price;
  const paid = paymentExempt ? 0 : Math.max(0, Number(paidAmount) || 0);

  const membership = await prisma.membership.create({
    data: {
      memberId: member.id,
      planId: plan.id,
      startDate,
      endDate,
      status: 'Active',
      amount,
      paidAmount: paid,
    },
  });

  const updated = await prisma.member.update({
    where: { id: member.id },
    data: { planId: plan.id, expiryDate: endDate, status: 'Active' },
  });

  if (!paymentExempt) {
    await prisma.payment.create({
      data: {
        memberId: member.id,
        memberName: member.name,
        amount: paid,
        expectedAmount: amount > paid ? amount : undefined,
        date: startDate,
        category: 'Renewal',
        paymentMethod: paymentMethod || 'Cash',
        status: paid >= amount ? 'Completed' : 'Pending',
        invoiceNo: `FTX-INV-${Math.floor(6000 + Math.random() * 3000)}`,
        membershipId: membership.id,
        notes,
        recordedBy,
      },
    });
  }

  await addLog(`RENEWAL: ${member.name} renewed ${plan.name} until ${endDate}`);
  res.json({ member: toClientMember(updated), membership });
});

router.delete('/members/:id', requirePermission('members', 'write'), async (req, res) => {
  const { id } = req.params;
  const m = await prisma.member.findUnique({ where: { id } });
  if (!m) return res.status(404).json({ error: 'Not found' });
  await prisma.member.delete({ where: { id } });
  await addLog(`DELETION: ${m.name} (${id}) removed`);
  res.json({ ok: true });
});

// --- Plans ---
router.get('/plans', requirePermission('plans', 'read'), async (_req, res) => {
  const plans = await prisma.plan.findMany({ orderBy: { price: 'asc' } });
  res.json(plans.map(p => ({ ...p, features: p.features as string[] })));
});

router.put('/plans', requirePermission('plans', 'write'), async (req, res) => {
  const plans = req.body as Array<{
    id: string; name: string; duration: string; price: number;
    features: string[]; popular?: boolean; description?: string; active?: boolean;
  }>;
  for (const p of plans) {
    await prisma.plan.upsert({
      where: { id: p.id },
      create: {
        id: p.id, name: p.name, duration: p.duration, price: p.price,
        features: p.features, popular: p.popular ?? false,
        description: p.description ?? '', active: p.active ?? true,
      },
      update: {
        name: p.name, duration: p.duration, price: p.price,
        features: p.features, popular: p.popular ?? false,
        description: p.description ?? '', active: p.active ?? true,
      },
    });
  }
  res.json(plans);
});

// --- Payments ---
router.get('/payments', requirePermission('payments', 'read'), async (_req, res) => {
  res.json(await prisma.payment.findMany({ orderBy: { createdAt: 'desc' } }));
});

router.post('/payments', requirePermission('payments', 'write'), async (req, res) => {
  const p = req.body;
  const created = await prisma.payment.create({ data: p });
  if (p.membershipId && p.status === 'Completed') {
    const ms = await prisma.membership.findUnique({ where: { id: p.membershipId } });
    if (ms) {
      await prisma.membership.update({
        where: { id: p.membershipId },
        data: { paidAmount: ms.paidAmount + p.amount },
      });
    }
  }
  await addLog(`PAYMENT: Rs.${p.amount} from ${p.memberName} (${p.category})`);
  res.json(created);
});

router.put('/payments/:id', requirePermission('payments', 'write'), async (req, res) => {
  const updated = await prisma.payment.update({ where: { id: req.params.id }, data: req.body });
  res.json(updated);
});

// --- Expenses ---
router.get('/expenses', requirePermission('expenses', 'read'), async (_req, res) => {
  res.json(await prisma.expense.findMany({ orderBy: { date: 'desc' } }));
});

router.post('/expenses', requirePermission('expenses', 'write'), async (req, res) => {
  const created = await prisma.expense.create({ data: req.body });
  await addLog(`FINANCE: Expense ${created.category} Rs.${created.amount}`);
  res.json(created);
});

router.put('/expenses/:id', requirePermission('expenses', 'write'), async (req, res) => {
  const updated = await prisma.expense.update({ where: { id: req.params.id }, data: req.body });
  res.json(updated);
});

router.put('/expenses', requirePermission('expenses', 'write'), async (req, res) => {
  const expenses = req.body;
  for (const e of expenses) {
    await prisma.expense.upsert({ where: { id: e.id }, create: e, update: e });
  }
  res.json(expenses);
});

// --- Attendance ---
router.get('/attendance', requirePermission('attendance', 'read'), async (req, res) => {
  const { date, memberId } = req.query;
  const where: { date?: string; memberId?: string } = {};
  if (date) where.date = String(date);
  if (memberId) where.memberId = String(memberId);
  res.json(await prisma.attendanceRecord.findMany({ where, orderBy: { createdAt: 'desc' } }));
});

router.post('/attendance/checkin', requirePermission('attendance', 'write'), async (req, res) => {
  const { memberId, timestamp } = req.body;
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) return res.status(404).json({ error: 'Member not found' });
  if (member.status === 'Expired' || member.status === 'Frozen') {
    return res.status(403).json({ error: 'Membership not active' });
  }

  const today = new Date().toISOString().split('T')[0];
  const open = await prisma.attendanceRecord.findFirst({
    where: { memberId, date: today, checkOut: null },
  });
  if (open) return res.status(409).json({ error: 'Already checked in', record: open });

  const record = await prisma.attendanceRecord.create({
    data: {
      memberId, memberName: member.name, photo: member.photo,
      role: 'Member', date: today, checkIn: timestamp, status: 'On Time',
    },
  });
  await addLog(`ATTENDANCE: ${member.name} checked in at ${timestamp}`);
  res.json(record);
});

router.post('/attendance/checkout', requirePermission('attendance', 'write'), async (req, res) => {
  const { memberId, timestamp, duration } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const open = await prisma.attendanceRecord.findFirst({
    where: { memberId, date: today, checkOut: null },
  });
  if (!open) return res.status(404).json({ error: 'No open check-in' });

  const updated = await prisma.attendanceRecord.update({
    where: { id: open.id },
    data: { checkOut: timestamp, duration },
  });
  await addLog(`ATTENDANCE: ${open.memberName} checked out (${duration} min)`);
  res.json(updated);
});

router.put('/attendance/:id', requirePermission('attendance', 'write'), async (req, res) => {
  const updated = await prisma.attendanceRecord.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(updated);
});

// --- Leads ---
router.get('/leads', requirePermission('leads', 'read'), async (_req, res) => {
  res.json(await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } }));
});

router.patch('/leads/:id', requirePermission('leads', 'write'), async (req, res) => {
  const updated = await prisma.lead.update({ where: { id: req.params.id }, data: req.body });
  res.json(updated);
});

router.post('/leads/:id/convert', requirePermission('leads', 'write'), async (req, res) => {
  const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const planId = req.body.planId || 'plan_monthly';
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  const id = nextMemberId();
  const joinDate = new Date().toISOString().split('T')[0];
  const months = plan ? planDurationMonths(plan.duration) : 1;
  const expiryDate = addMonths(joinDate, months);
  const passwordHash = await bcrypt.hash('123456', 10);
  const email = lead.email || `${lead.phone}@fitxgym.local`;

  const member = await prisma.member.create({
    data: {
      id, name: lead.name, email, phone: lead.phone,
      whatsapp: lead.whatsapp || lead.phone,
      passwordHash, joinDate, expiryDate, planId,
      status: 'Active', qrCodeValue: id,
      emergencyContact: {}, medicalHistory: [],
      weightHistory: [], measurementsHistory: [],
      workoutPlan: [], dietPlan: [], messages: [],
    },
  });

  await prisma.user.create({
    data: { email, passwordHash, name: lead.name, role: 'MEMBER', memberId: id },
  });

  await prisma.membership.create({
    data: { memberId: id, planId, startDate: joinDate, endDate: expiryDate, status: 'Active', amount: plan?.price || 0, paidAmount: 0 },
  });

  await prisma.lead.update({ where: { id: lead.id }, data: { status: 'Converted' } });
  await addLog(`LEAD: Converted ${lead.name} to member ${id}`);
  res.json(toClientMember(member));
});

// --- Staff, Inventory (legacy) ---
router.get('/staff', async (_req, res) => {
  const staff = await prisma.staff.findMany();
  res.json(staff.map(s => ({
    ...s,
    documents: s.documents as string[],
    salaryHistory: s.salaryHistory as object[],
    tasks: s.tasks as object[],
  })));
});

router.put('/staff', async (req, res) => {
  const staff = req.body;
  for (const s of staff) {
    await prisma.staff.upsert({ where: { id: s.id }, create: s, update: s });
  }
  res.json(staff);
});

router.get('/inventory', async (_req, res) => {
  res.json(await prisma.inventoryItem.findMany());
});

router.put('/inventory', async (req, res) => {
  const items = req.body;
  for (const i of items) {
    await prisma.inventoryItem.upsert({ where: { id: i.id }, create: i, update: i });
  }
  res.json(items);
});

// --- Audit logs ---
router.get('/audit-logs', requirePermission('dashboard', 'read'), async (_req, res) => {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  res.json(logs.map(l => l.message));
});

router.post('/audit-logs', async (req, res) => {
  await addLog(req.body.message);
  res.json({ ok: true });
});

// --- QR Token ---
router.get('/qr-token', requirePermission('attendance', 'read'), async (_req, res) => {
  let token = await prisma.qrToken.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
  if (!token) {
    token = await prisma.qrToken.create({ data: { token: `FTX_${Date.now()}` } });
  }
  res.json({ token: token.token });
});

router.post('/qr-token/rotate', requirePermission('attendance', 'write'), async (_req, res) => {
  await prisma.qrToken.updateMany({ data: { isActive: false } });
  const token = await prisma.qrToken.create({ data: { token: `FTX_${Date.now()}` } });
  await addLog('SECURITY: Rotated lobby QR token');
  res.json({ token: token.token });
});

// --- Settings & gallery ---
router.get('/settings', requirePermission('dashboard', 'read'), async (_req, res) => {
  const rows = await prisma.websiteSetting.findMany();
  const settings: Record<string, string> = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  res.json(settings);
});

router.put('/settings', requirePermission('website', 'write'), async (req, res) => {
  const settings = req.body as Record<string, string>;
  for (const [key, value] of Object.entries(settings)) {
    await prisma.websiteSetting.upsert({
      where: { key }, create: { key, value }, update: { value },
    });
  }
  await addLog('WEBSITE: Updated site content');
  res.json(settings);
});

router.get('/gallery', requirePermission('website', 'read'), async (_req, res) => {
  const images = await prisma.galleryImage.findMany({ orderBy: { sortOrder: 'asc' } });
  res.json(dedupeGalleryItems(images));
});

function dedupeGalleryItems<T extends { url: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (!item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

router.put('/gallery', requirePermission('website', 'write'), async (req, res) => {
  const items = dedupeGalleryItems(req.body as Array<{ id?: string; url: string; caption?: string; featured?: boolean; active?: boolean; sortOrder?: number }>);
  await prisma.galleryImage.deleteMany();
  await prisma.galleryImage.createMany({
    data: items.map((item, i) => ({
      url: item.url,
      caption: item.caption ?? '',
      featured: item.featured ?? false,
      active: item.active ?? true,
      sortOrder: item.sortOrder ?? i,
    })),
  });
  const images = await prisma.galleryImage.findMany({ orderBy: { sortOrder: 'asc' } });
  res.json(images);
});

// --- Testimonials ---
router.get('/testimonials', requirePermission('website', 'read'), async (_req, res) => {
  res.json(await prisma.testimonial.findMany({ orderBy: { date: 'desc' } }));
});

router.patch('/testimonials/:id/approve', async (req, res) => {
  const t = await prisma.testimonial.update({
    where: { id: req.params.id },
    data: { approved: true },
  });
  res.json(t);
});

router.delete('/testimonials/:id', async (req, res) => {
  await prisma.testimonial.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
