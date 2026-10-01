import { prisma } from '../db.js';

/** Next ID in sequence: MEM-0001, MEM-0002, … based on the highest existing MEM-n. */
export async function nextMemberId(): Promise<string> {
  const members = await prisma.member.findMany({ select: { id: true } });
  let max = 0;
  for (const m of members) {
    const match = /^MEM-(\d+)$/i.exec(m.id.trim());
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `MEM-${String(max + 1).padStart(4, '0')}`;
}
