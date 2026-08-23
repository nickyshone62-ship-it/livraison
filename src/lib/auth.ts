import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'ouagadougou-livraison-secret-key-2026';
export const TOKEN_COOKIE_NAME = 'ouaga_livraison_token';

export interface UserSessionPayload {
  userId: string;
  phone: string;
  role: 'PARTICULIER' | 'COMMERCANT' | 'ENTREPRISE' | 'LIVREUR' | 'ADMIN' | string;
  fullName: string;
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
  if (role === 'ADMIN') return { active: true };

  const sub = await db.subscription.findFirst({
    where: { userId, status: 'ACTIVE' },
    orderBy: { endsAt: 'desc' },
  });

  if (!sub || new Date(sub.endsAt) <= new Date()) {
    return {
      active: false,
      message: role === 'LIVREUR'
        ? '⚠️ Votre abonnement mensuel livreur (1 000 FCFA/mois) est inactif ou expiré. Veuillez renouveler votre abonnement pour effectuer des actions sur la plateforme.'
        : '⚠️ Votre abonnement mensuel boutique (1 000 FCFA/mois) est inactif ou expiré. Veuillez renouveler votre abonnement pour effectuer des actions sur la plateforme.',
    };
  }

  return { active: true };
}
