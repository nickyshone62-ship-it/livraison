import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'ouagadougou-livraison-secret-key-2026';
export const TOKEN_COOKIE_NAME = 'ouaga_livraison_token';

export interface UserSessionPayload {
  userId: string;
  phone: string;
  email?: string | null;
  role: 'client' | 'driver' | 'admin' | string;
  fullName: string;
  accountStatus: 'pending' | 'approved' | 'rejected' | 'suspended' | string;
  driverStatus?: 'pending' | 'approved' | 'rejected' | 'suspended' | string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function signToken(payload: UserSessionPayload): string {
  return jwt.sign(payload as object, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSessionPayload;
  } catch (error) {
    return null;
  }
}

export async function getAuthSession(): Promise<UserSessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuthSession(): Promise<UserSessionPayload> {
  const session = await getAuthSession();
  if (!session) {
    throw new Error('Non autorisé');
  }
  return session;
}

export function generateOTPCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function generateTrackingNumber(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `LIV-2026-${randomNum}`;
}

export function generateDisputeNumber(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `LIT-2026-${randomNum}`;
}

export async function validateActiveSubscription(userId: string, role: string): Promise<{ active: boolean; message?: string }> {
  if (role === 'admin') return { active: true };

  // 1. Check active subscription record in DB
  const sub = await db.subscription.findFirst({
    where: { userId, status: 'active' },
    orderBy: { expiresAt: 'desc' },
  });

  if (sub && sub.expiresAt && new Date(sub.expiresAt) > new Date()) {
    return { active: true };
  }

  // 2. 1st Month (30 days) of usage is offered starting from registration/approval date
  const profile = await db.profile.findUnique({
    where: { id: userId },
    select: { createdAt: true, updatedAt: true },
  });

  if (profile) {
    const creationDate = new Date(profile.createdAt);
    const oneMonthLater = new Date(creationDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (new Date() <= oneMonthLater) {
      return { active: true };
    }
  }

  return {
    active: false,
    message: '⚠️ Votre période d\'utilisation (1er mois offert) est arrivée à terme. Veuillez contacter l\'administrateur ou renouveler votre abonnement mensuel (1 000 FCFA/mois) pour continuer.',
  };
}
