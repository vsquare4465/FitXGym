import { Router } from 'express';
import { prisma } from '../db.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { toClientMember } from '../lib/memberMapper.js';
import { istToday } from '../lib/ist.js';
import { addPlanDuration } from '../lib/planDates.js';
import { daysUntil } from '../lib/dateRange.js';

const router = Router();
router.use(authMiddleware);
router.use(requireRole('MEMBER'));

router.get('/me', async (req, res) => {
  const member = await prisma.member.findUnique({ where: { id: req.user!.memberId! } });
  if (!member) return res.status(404).json({ error: 'Member not found' });
  res.json(toClientMember(member));
});

router.put('/me', async (req, res) => {
  const id = req.user!.memberId!;
  const body = req.body;
  const updated = await prisma.member.update({
    where: { id },
    data: {
      weightHistory: body.weightHistory,
      measurementsHistory: body.measurementsHistory,
      bmi: body.bmi,
      bodyFat: body.bodyFat,
      progressImages: body.progressImages,
      workoutPlan: body.workoutPlan,
      dietPlan: body.dietPlan,
    },
  });
  res.json(toClientMember(updated));
});

router.get('/payments', async (req, res) => {
  const payments = await prisma.payment.findMany({
    where: { memberId: req.user!.memberId! },
    orderBy: { date: 'desc' },
  });
  res.json(payments);
});

router.post('/renew', async (req, res) => {
  const { planId, paidAmount, paymentMethod } = req.body;
  const memberId = req.user!.memberId!;
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) return res.status(404).json({ error: 'Not found' });

  const plan = await prisma.plan.findUnique({ where: { id: planId || member.planId } });
  const formattedToday = istToday();
  const base = daysUntil(member.expiryDate) >= 0 ? member.expiryDate : formattedToday;
  const formattedExpiry = plan ? addPlanDuration(base, plan.duration) : addPlanDuration(base, '1 Month');

  const updated = await prisma.member.update({
    where: { id: memberId },
    data: { expiryDate: formattedExpiry, planId, status: 'Active' },
  });

  await prisma.membership.create({
    data: {
      memberId,
      planId,
      startDate: formattedToday,
      endDate: formattedExpiry,
      status: 'Active',
    },
  });

  await prisma.payment.create({
    data: {
      memberId,
      memberName: member.name,
      amount: paidAmount,
      date: formattedToday,
      category: 'Membership',
      paymentMethod: paymentMethod ?? 'UPI',
      status: 'Completed',
      invoiceNo: `FTX-REN-${Math.floor(1000 + Math.random() * 9000)}`,
    },
  });

  res.json(toClientMember(updated));
});

export default router;
