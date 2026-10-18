import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { authMiddleware, requireAdmin, requirePermission } from '../middleware/auth.js';
import { isPaymentExempt } from '../lib/permissions.js';
import { toClientMember } from '../lib/memberMapper.js';
import { buildDashboard, getMemberProfile } from '../lib/dashboardStats.js';
import { nextMemberId } from '../lib/memberId.js';
import { isValidAadhaar, isValidEmail, isValidIndianPhone, normalizeAadhaar, parseRupees, shortAddress } from '../lib/validation.js';
import { normalizeWhatsAppNumber } from '../lib/whatsapp.js';
import { daysUntil } from '../lib/dateRange.js';
import { istNowTime, istToday, minutesBetweenIst } from '../lib/ist.js';
import { addPlanDuration } from '../lib/planDates.js';

const router = Router();
router.use(authMiddleware);
router.use(requireAdmin());

function formatAuditTime() {
  return istNowTime(new Date(), true);
}

async function addLog(message: string) {
  await prisma.auditLog.create({ data: { message: `[${formatAuditTime()}] ${message}` } });
}

function parseIsoDate(raw: unknown): string | null {
  const s = String(raw || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return s;
}

function todayIso(): string {
  return istToday();
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

function prismaErrorCode(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) return String((err as { code: unknown }).code);
  return '';
}

function applyDiscount(planPrice: number, discountRaw: unknown): { discount: number; charged: number; error?: string } {
  const parsed = parseRupees(discountRaw);
  if (!parsed.ok) return { discount: 0, charged: planPrice, error: 'Enter a valid discount amount' };
  const discount = Math.min(parsed.value, Math.max(0, planPrice));
  return { discount, charged: Math.max(0, planPrice - discount) };
}

const GENDERS = ['Male', 'Female'];
const OCCUPATIONS = ['Housewife', 'Business', 'Job', 'Other'];

function optionalProfileFields(body: { gender?: unknown; occupation?: unknown; alcoholic?: unknown; notes?: unknown }) {
  const gender = String(body.gender || '').trim();
  const occupation = String(body.occupation || '').trim();
  return {
    gender: GENDERS.includes(gender) ? gender : null,
    occupation: OCCUPATIONS.includes(occupation) ? occupation : occupation ? 'Other' : null,
    alcoholic: Boolean(body.alcoholic),
    notes: String(body.notes || '').trim() || null,
  };
}

router.post('/members', requirePermission('members', 'write'), async (req, res) => {
  const body = req.body;
  const name = String(body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const emailRaw = String(body.email || '').trim().toLowerCase();
  if (emailRaw && !isValidEmail(emailRaw)) {
    return res.status(400).json({ error: 'Enter a valid email address, or leave email blank' });
  }
  const phoneRaw = String(body.phone || '').trim();
  if (phoneRaw && !isValidIndianPhone(phoneRaw)) {
    return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile, or leave phone blank' });
  }
  const aadhaarRaw = normalizeAadhaar(body.aadhaar);
  if (aadhaarRaw && !isValidAadhaar(aadhaarRaw)) {
    return res.status(400).json({ error: 'Enter a 12-digit Aadhaar number, or leave it blank' });
  }
  const membershipType = body.membershipType || 'Paid';
  if (!['Paid', 'Complimentary', 'Staff'].includes(membershipType)) {
    return res.status(400).json({ error: 'Invalid membership type' });
  }
  const paidParsed = parseRupees(body.paidAmount);
  if (!paidParsed.ok) {
    return res.status(400).json({ error: 'Enter a valid amount, or choose Pay later if not paid yet' });
  }
  let paidAmount = paidParsed.value;
  const plan = body.planId ? await prisma.plan.findUnique({ where: { id: body.planId } }) : null;
  if (!plan) {
    return res.status(400).json({ error: 'Pick a membership plan' });
  }
  const email = emailRaw || null;
  const phone = phoneRaw ? phoneRaw.replace(/\D/g, '').slice(-10) : '';
  const aadhaar = aadhaarRaw;
  if (aadhaar) {
    const existingAadhaar = await prisma.member.findUnique({ where: { aadhaar } });
    if (existingAadhaar) {
      return res.status(400).json({ error: 'A member with this Aadhaar number already exists' });
    }
  }
  const existingUser = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (email) {
    const existingEmail = await prisma.member.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'A member with this email already exists' });
    }
    if (existingUser && existingUser.role !== 'MEMBER') {
      return res.status(400).json({ error: 'This email is already used by a staff login' });
    }
    if (existingUser?.memberId) {
      const linked = await prisma.member.findUnique({ where: { id: existingUser.memberId } });
      if (linked) {
        return res.status(400).json({ error: 'This email is already used by another login' });
      }
    }
  }

  const password = body.password || '123456';
  const passwordHash = email ? await bcrypt.hash(password, 10) : null;
  const joinDate = parseIsoDate(body.joinDate) || todayIso();
  const planStartDate = parseIsoDate(body.planStartDate) || joinDate;
  const expiryDate = addPlanDuration(planStartDate, plan.duration);
  const expiredAlready = expiryDate < todayIso();
  const memberStatus = body.status || (expiredAlready ? 'Expired' : 'Active');
  const membershipStatus = expiredAlready ? 'Expired' : 'Active';
  const paymentExempt = isPaymentExempt(membershipType);
  const planPrice = paymentExempt ? 0 : (plan.price || 0);
  const priced = applyDiscount(planPrice, body.discount);
  if (priced.error) return res.status(400).json({ error: priced.error });
  const charged = paymentExempt ? 0 : priced.charged;
  const discount = paymentExempt ? 0 : priced.discount;
  if (paymentExempt) paidAmount = 0;
  const profile = optionalProfileFields(body);
  const startingWeight = parseRupees(body.weight);
  const startingHistory = startingWeight.ok && startingWeight.value > 0
    ? [{ date: joinDate, weight: startingWeight.value }]
    : [];

  try {
    const created = await prisma.$transaction(async (tx) => {
      const id = await nextMemberId(tx);
      const member = await tx.member.create({
        data: {
          id,
          name,
          email,
          phone,
          whatsapp: body.whatsapp || phone || undefined,
          dateOfBirth: body.dateOfBirth,
          address: shortAddress(body.address),
          aadhaar,
          passwordHash,
          photo: typeof body.photo === 'string' ? body.photo : '',
          joinDate,
          expiryDate,
          planId: plan.id,
          membershipType,
          status: memberStatus,
          gender: profile.gender,
          occupation: profile.occupation,
          alcoholic: profile.alcoholic,
          notes: profile.notes,
          emergencyContact: body.emergencyContact || {},
          medicalHistory: body.medicalHistory || [],
          qrCodeValue: body.qrCodeValue || id,
          weightHistory: startingHistory,
          measurementsHistory: [],
          workoutPlan: [],
          dietPlan: [],
          messages: [],
        },
      });

      if (email && passwordHash) {
        if (existingUser) {
          await tx.user.update({
            where: { id: existingUser.id },
            data: { passwordHash, name, role: 'MEMBER', memberId: id },
          });
        } else {
          await tx.user.create({
            data: {
              email,
              passwordHash,
              name,
              role: 'MEMBER',
              memberId: id,
            },
          });
        }
      }

      const membership = await tx.membership.create({
        data: {
          memberId: id,
          planId: plan.id,
          startDate: planStartDate,
          endDate: expiryDate,
          status: membershipStatus,
          amount: charged,
          paidAmount,
          discount,
        },
      });

      if (!paymentExempt && charged > 0) {
        const fullyPaid = paidAmount >= charged;
        await tx.payment.create({
          data: {
            memberId: id,
            memberName: name,
            amount: paidAmount,
            expectedAmount: charged > paidAmount ? charged : undefined,
            date: planStartDate,
            category: 'New Membership',
            paymentMethod: body.paymentMethod || 'Cash',
            status: paidAmount <= 0 ? 'Pending' : fullyPaid ? 'Completed' : 'Pending',
            invoiceNo: `FTX-INV-${Math.floor(6000 + Math.random() * 3000)}`,
            membershipId: membership.id,
            recordedBy: body.recordedBy,
            notes:
              paidAmount <= 0
                ? 'Not paid yet'
                : discount > 0
                  ? `Discount ₹${discount} on plan ₹${planPrice}`
                  : undefined,
          },
        });
      }

      return member;
    });

    await addLog(`MEMBERSHIP: Added member ${name} (${created.id})`);
    res.json(toClientMember(created));
  } catch (err) {
    if (prismaErrorCode(err) === 'P2002') {
      return res.status(400).json({ error: 'A member with this Aadhaar or email already exists' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Could not create member. Try again.' });
  }
});

router.put('/members/:id', requirePermission('members', 'write'), async (req, res) => {
  const { id } = req.params;
  const body = req.body;
  const nextEmail = body.email !== undefined
    ? (String(body.email || '').trim().toLowerCase() || null)
    : undefined;
  const nextPhone = body.phone !== undefined
    ? (String(body.phone || '').trim() ? String(body.phone).replace(/\D/g, '').slice(-10) : '')
    : undefined;
  if (nextEmail && !isValidEmail(nextEmail)) {
    return res.status(400).json({ error: 'Enter a valid email address, or leave email blank' });
  }
  if (nextPhone && !isValidIndianPhone(nextPhone)) {
    return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile, or leave phone blank' });
  }
  const nextAadhaar = body.aadhaar !== undefined
    ? normalizeAadhaar(body.aadhaar)
    : undefined;
  if (nextAadhaar && !isValidAadhaar(nextAadhaar)) {
    return res.status(400).json({ error: 'Enter a 12-digit Aadhaar number, or leave it blank' });
  }
  const nextAddress = body.address !== undefined ? shortAddress(body.address) : undefined;
  const joinDate = body.joinDate !== undefined && body.joinDate !== '' ? parseIsoDate(body.joinDate) : undefined;
  const planStartDate = body.planStartDate !== undefined && body.planStartDate !== '' ? parseIsoDate(body.planStartDate) : undefined;
  if (body.joinDate && !joinDate) return res.status(400).json({ error: 'Enter a valid joining date' });
  if (body.planStartDate && !planStartDate) return res.status(400).json({ error: 'Enter a valid plan start date' });
  try {
  const existing = await prisma.member.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (nextEmail) {
    const emailTaken = await prisma.member.findFirst({ where: { email: nextEmail, NOT: { id } } });
    if (emailTaken) {
      return res.status(400).json({ error: 'A member with this email already exists' });
    }
  }
  if (nextAadhaar) {
    const aadhaarTaken = await prisma.member.findFirst({ where: { aadhaar: nextAadhaar, NOT: { id } } });
    if (aadhaarTaken) {
      return res.status(400).json({ error: 'A member with this Aadhaar number already exists' });
    }
  }

  const nextPlanId = body.planId || existing.planId;
  let nextExpiry: string | undefined;
  if (body.planId || planStartDate) {
    const plan = await prisma.plan.findUnique({ where: { id: nextPlanId } });
    const currentMs = await prisma.membership.findFirst({
      where: { memberId: id },
      orderBy: { endDate: 'desc' },
    });
    const start = planStartDate || currentMs?.startDate || existing.joinDate;
    if (plan) nextExpiry = addPlanDuration(start, plan.duration);
  }

  const updated = await prisma.member.update({
    where: { id },
    data: {
      name: body.name,
      email: nextEmail,
      phone: nextPhone,
      whatsapp: body.whatsapp,
      dateOfBirth: body.dateOfBirth,
      address: nextAddress,
      aadhaar: body.aadhaar !== undefined ? nextAadhaar : undefined,
      photo: body.photo,
      joinDate: joinDate ?? undefined,
      expiryDate: nextExpiry ?? undefined,
      planId: body.planId,
      membershipType: body.membershipType,
      status: body.status,
      gender: body.gender !== undefined ? optionalProfileFields(body).gender : undefined,
      occupation: body.occupation !== undefined ? optionalProfileFields(body).occupation : undefined,
      alcoholic: body.alcoholic !== undefined ? Boolean(body.alcoholic) : undefined,
      notes: body.notes !== undefined ? String(body.notes || '').trim() || null : undefined,
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

  if (planStartDate || nextExpiry || body.planId) {
    const current = await prisma.membership.findFirst({
      where: { memberId: id },
      orderBy: { endDate: 'desc' },
    });
    if (current) {
      await prisma.membership.update({
        where: { id: current.id },
        data: {
          ...(body.planId ? { planId: nextPlanId } : {}),
          ...(planStartDate ? { startDate: planStartDate } : {}),
          ...(nextExpiry ? { endDate: nextExpiry } : {}),
        },
      });
    }
  }

  const linkedUser = await prisma.user.findUnique({ where: { memberId: id } });
  if (linkedUser && (nextEmail || body.name)) {
    await prisma.user.update({
      where: { id: linkedUser.id },
      data: {
        ...(nextEmail ? { email: nextEmail } : {}),
        name: body.name || linkedUser.name,
      },
    });
  } else if (!linkedUser && nextEmail) {
    await prisma.user.create({
      data: {
        email: nextEmail,
        passwordHash: existing.passwordHash || await bcrypt.hash('123456', 10),
        name: body.name || existing.name,
        role: 'MEMBER',
        memberId: id,
      },
    });
  }

  await addLog(`MEMBERSHIP: Updated profile for ${updated.name} (${id})`);
  res.json(toClientMember(updated));
  } catch (err) {
    if (prismaErrorCode(err) === 'P2002') {
      return res.status(400).json({ error: 'A member with this Aadhaar or email already exists' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Could not update member. Try again.' });
  }
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
  const { planId, paymentMethod, notes, recordedBy } = req.body;
  const member = await prisma.member.findUnique({ where: { id: req.params.id } });
  if (!member) return res.status(404).json({ error: 'Member not found' });

  const plan = await prisma.plan.findUnique({ where: { id: planId || member.planId } });
  if (!plan) return res.status(400).json({ error: 'Pick a membership plan' });

  const paidParsed = parseRupees(req.body.paidAmount);
  if (!paidParsed.ok) {
    return res.status(400).json({ error: 'Enter a valid amount, or choose Pay later' });
  }

  const startDate = todayIso();
  const base = daysUntil(member.expiryDate) >= 0 ? member.expiryDate : startDate;
  const endDate = addPlanDuration(base, plan.duration);
  const paymentExempt = isPaymentExempt(member.membershipType);
  const planPrice = paymentExempt ? 0 : plan.price;
  const priced = applyDiscount(planPrice, req.body.discount);
  if (priced.error) return res.status(400).json({ error: priced.error });
  const amount = paymentExempt ? 0 : priced.charged;
  const discount = paymentExempt ? 0 : priced.discount;
  const paid = paymentExempt ? 0 : paidParsed.value;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const membership = await tx.membership.create({
        data: {
          memberId: member.id,
          planId: plan.id,
          startDate,
          endDate,
          status: 'Active',
          amount,
          paidAmount: paid,
          discount,
        },
      });

      const updated = await tx.member.update({
        where: { id: member.id },
        data: { planId: plan.id, expiryDate: endDate, status: 'Active' },
      });

      if (!paymentExempt && amount > 0) {
        await tx.payment.create({
          data: {
            memberId: member.id,
            memberName: member.name,
            amount: paid,
            expectedAmount: amount > paid ? amount : undefined,
            date: startDate,
            category: 'Renewal',
            paymentMethod: paymentMethod || 'Cash',
            status: paid <= 0 ? 'Pending' : paid >= amount ? 'Completed' : 'Pending',
            invoiceNo: `FTX-INV-${Math.floor(6000 + Math.random() * 3000)}`,
            membershipId: membership.id,
            notes: notes || (paid <= 0 ? 'Not paid yet' : discount > 0 ? `Discount ₹${discount} on plan ₹${planPrice}` : undefined),
            recordedBy,
          },
        });
      }

      return { updated, membership };
    });

    await addLog(`RENEWAL: ${member.name} renewed ${plan.name} until ${endDate}`);
    res.json({ member: toClientMember(result.updated), membership: result.membership });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not renew membership. Try again.' });
  }
});

router.delete('/members/:id', requirePermission('members', 'write'), async (req, res) => {
  const { id } = req.params;
  const m = await prisma.member.findUnique({ where: { id } });
  if (!m) return res.status(404).json({ error: 'Not found' });
  await prisma.user.deleteMany({ where: { memberId: id } });
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

router.delete('/plans/:id', requirePermission('plans', 'write'), async (req, res) => {
  const existing = await prisma.plan.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Plan not found' });
  await prisma.plan.delete({ where: { id: existing.id } });
  await addLog(`PLAN: Deleted ${existing.name}`);
  res.json({ ok: true });
});

// --- Payments ---
router.get('/payments', requirePermission('payments', 'read'), async (_req, res) => {
  res.json(await prisma.payment.findMany({ orderBy: { createdAt: 'desc' } }));
});

router.post('/payments', requirePermission('payments', 'write'), async (req, res) => {
  const p = req.body;
  if (!p.memberId) return res.status(400).json({ error: 'Select a member' });
  const member = await prisma.member.findUnique({ where: { id: String(p.memberId) } });
  if (!member) return res.status(400).json({ error: 'Member not found' });
  const paidParsed = parseRupees(p.amount);
  if (!paidParsed.ok) {
    return res.status(400).json({ error: 'Enter a valid amount, or record as not paid' });
  }
  const expectedParsed = parseRupees(p.expectedAmount);
  const expectedAmount = expectedParsed.ok ? expectedParsed.value : undefined;
  const amount = paidParsed.value;
  const status = p.status === 'Pending' || amount <= 0 ? 'Pending' : p.status === 'Failed' ? 'Failed' : 'Completed';
  try {
    const created = await prisma.payment.create({
      data: {
        memberId: member.id,
        memberName: p.memberName || member.name,
        amount,
        date: p.date || todayIso(),
        category: p.category || 'Partial Payment',
        paymentMethod: p.paymentMethod || 'Cash',
        status,
        invoiceNo: p.invoiceNo || `FTX-INV-${Math.floor(6000 + Math.random() * 3000)}`,
        referenceNo: p.referenceNo || undefined,
        membershipId: p.membershipId || undefined,
        notes: p.notes || (amount <= 0 ? 'Not paid yet' : undefined),
        recordedBy: p.recordedBy || undefined,
        expectedAmount: expectedAmount && expectedAmount > amount ? expectedAmount : undefined,
      },
    });
    if (p.membershipId && amount > 0) {
      const ms = await prisma.membership.findUnique({ where: { id: String(p.membershipId) } });
      if (ms) {
        await prisma.membership.update({
          where: { id: String(p.membershipId) },
          data: { paidAmount: ms.paidAmount + amount },
        });
      }
    }
    await addLog(`PAYMENT: Rs.${amount} from ${created.memberName} (${created.category})`);
    res.json(created);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not save payment. Try again.' });
  }
});

router.put('/payments/:id', requirePermission('payments', 'write'), async (req, res) => {
  const updated = await prisma.payment.update({ where: { id: req.params.id }, data: req.body });
  res.json(updated);
});

router.delete('/payments/:id', requirePermission('payments', 'write'), async (req, res) => {
  try {
    const existing = await prisma.$transaction(async (tx) => {
      const row = await tx.payment.findUnique({ where: { id: req.params.id } });
      if (!row) return null;
      await tx.payment.delete({ where: { id: row.id } });
      if (row.membershipId && row.amount > 0) {
        const ms = await tx.membership.findUnique({ where: { id: row.membershipId } });
        if (ms) {
          await tx.membership.update({
            where: { id: ms.id },
            data: { paidAmount: Math.max(0, ms.paidAmount - row.amount) },
          });
        }
      }
      return row;
    });
    if (!existing) return res.status(404).json({ error: 'Payment not found' });
    await addLog(`PAYMENT: Deleted Rs.${existing.amount} (${existing.memberName})`);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not delete payment. Try again.' });
  }
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

router.delete('/expenses/:id', requirePermission('expenses', 'write'), async (req, res) => {
  const existing = await prisma.expense.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Expense not found' });
  await prisma.expense.delete({ where: { id: existing.id } });
  await addLog(`FINANCE: Deleted expense ${existing.category} Rs.${existing.amount}`);
  res.json({ ok: true });
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
  const { memberId } = req.body;
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) return res.status(404).json({ error: 'Member not found' });
  if (member.status === 'Expired' || member.status === 'Frozen') {
    return res.status(403).json({ error: 'Membership not active' });
  }

  const today = istToday();
  const checkIn = istNowTime();
  const open = await prisma.attendanceRecord.findFirst({
    where: { memberId, date: today, checkOut: null },
  });
  if (open) return res.status(409).json({ error: 'Already checked in', record: open });

  const record = await prisma.attendanceRecord.create({
    data: {
      memberId, memberName: member.name, photo: member.photo,
      role: 'Member', date: today, checkIn, status: 'On Time',
    },
  });
  await addLog(`ATTENDANCE: ${member.name} checked in at ${checkIn} IST`);
  res.json(record);
});

router.post('/attendance/checkout', requirePermission('attendance', 'write'), async (req, res) => {
  const { memberId } = req.body;
  const today = istToday();
  const checkOut = istNowTime();
  const open = await prisma.attendanceRecord.findFirst({
    where: { memberId, date: today, checkOut: null },
  });
  if (!open) return res.status(404).json({ error: 'No open check-in' });

  const duration = minutesBetweenIst(open.date, open.checkIn);
  const updated = await prisma.attendanceRecord.update({
    where: { id: open.id },
    data: { checkOut, duration },
  });
  await addLog(`ATTENDANCE: ${open.memberName} checked out at ${checkOut} IST (${duration} min)`);
  res.json(updated);
});

router.put('/attendance/:id', requirePermission('attendance', 'write'), async (req, res) => {
  const updated = await prisma.attendanceRecord.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(updated);
});

router.delete('/attendance/:id', requirePermission('attendance', 'write'), async (req, res) => {
  const existing = await prisma.attendanceRecord.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Attendance record not found' });
  await prisma.attendanceRecord.delete({ where: { id: existing.id } });
  await addLog(`ATTENDANCE: Deleted ${existing.memberName} ${existing.date} ${existing.checkIn}`);
  res.json({ ok: true });
});

// --- Leads ---
router.get('/leads', requirePermission('leads', 'read'), async (_req, res) => {
  res.json(await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } }));
});

router.patch('/leads/:id', requirePermission('leads', 'write'), async (req, res) => {
  const updated = await prisma.lead.update({ where: { id: req.params.id }, data: req.body });
  res.json(updated);
});

router.delete('/leads/:id', requirePermission('leads', 'write'), async (req, res) => {
  const existing = await prisma.lead.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Lead not found' });
  await prisma.lead.delete({ where: { id: existing.id } });
  await addLog(`LEAD: Deleted enquiry from ${existing.name}`);
  res.json({ ok: true });
});

router.post('/leads/:id/convert', requirePermission('leads', 'write'), async (req, res) => {
  const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const planId = req.body.planId || 'plan_monthly';
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  const id = await nextMemberId();
  const joinDate = todayIso();
  const expiryDate = plan ? addPlanDuration(joinDate, plan.duration) : addPlanDuration(joinDate, '1 Month');
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
    let stored = value;
    if (key === 'whatsapp') stored = normalizeWhatsAppNumber(value);
    await prisma.websiteSetting.upsert({
      where: { key }, create: { key, value: stored }, update: { value: stored },
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
