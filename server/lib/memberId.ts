import { prisma } from '../db.js';

type MemberIdSource = { member: { findMany: (args: { select: { id: true } }) => Promise<Array<{ id: string }>> } };

/** Next ID in sequence: MEM-0001, MEM-0002, … based on the highest existing MEM-n. */
export async function nextMemberId(db: MemberIdSource = prisma): Promise<string> {
  const members = await db.member.findMany({ select: { id: true } });
  let max = 0;
  for (const m of members) {
    const match = /^MEM-(\d+)$/i.exec(m.id.trim());
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `MEM-${String(max + 1).padStart(4, '0')}`;
}
