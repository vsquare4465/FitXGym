import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
export const atomic = prisma.$transaction.bind(prisma) as typeof prisma.$transaction;
export async function saveRows(modelName: string, rows: Record<string, any>[], key = 'id', replace = false) {
  const delegate = (prisma as any)[modelName];
  const ops = replace ? [delegate.deleteMany()] : [];
  for (const row of rows) ops.push(replace ? delegate.create({ data: row }) : delegate.upsert({ where: { [key]: row[key] }, create: row, update: row }));
  await prisma.$transaction(ops);
}
