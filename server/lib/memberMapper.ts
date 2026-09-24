import { Member as PrismaMember } from '@prisma/client';
import { Member } from '../../src/types.js';

export function toClientMember(m: PrismaMember): Member {
  return {
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    whatsapp: m.whatsapp ?? undefined,
    dateOfBirth: m.dateOfBirth ?? undefined,
    address: m.address ?? undefined,
    photo: m.photo,
    joinDate: m.joinDate,
    expiryDate: m.expiryDate,
    planId: m.planId,
    membershipType: m.membershipType as Member['membershipType'],
    status: m.status as Member['status'],
    emergencyContact: m.emergencyContact as Member['emergencyContact'],
    medicalHistory: m.medicalHistory as string[],
    idProofUrl: m.idProofUrl ?? undefined,
    qrCodeValue: m.qrCodeValue,
    weightHistory: m.weightHistory as Member['weightHistory'],
    measurementsHistory: m.measurementsHistory as Member['measurementsHistory'],
    bmi: m.bmi,
    bodyFat: m.bodyFat,
    progressImages: m.progressImages as string[] | undefined,
    workoutPlan: m.workoutPlan as Member['workoutPlan'],
    dietPlan: m.dietPlan as Member['dietPlan'],
    messages: m.messages as unknown as Member['messages'],
  };
}

export function memberToDb(data: Partial<Member> & { passwordHash?: string }) {
  const { password, ...rest } = data as Partial<Member> & { password?: string; passwordHash?: string };
  return {
    ...rest,
    emergencyContact: rest.emergencyContact ?? {},
    medicalHistory: rest.medicalHistory ?? [],
    weightHistory: rest.weightHistory ?? [],
    measurementsHistory: rest.measurementsHistory ?? [],
    progressImages: rest.progressImages ?? [],
    workoutPlan: rest.workoutPlan ?? [],
    dietPlan: rest.dietPlan ?? [],
    messages: rest.messages ?? [],
  };
}
