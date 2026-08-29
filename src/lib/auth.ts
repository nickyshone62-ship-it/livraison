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

export async function validateActiveSubscription(userId: string, role: string): Promise<{ active: boolean; code?: string; message?: string }> {
  if ((role || '').toLowerCase() === 'admin') return { active: true };

  // 1. Vérification de l'approbation du compte / paiement par l'administrateur
  const profile = await db.profile.findUnique({
    where: { id: userId },
    select: { accountStatus: true, createdAt: true },
  });

  if (!profile) {
    return {
      active: false,
      code: 'USER_NOT_FOUND',
      message: 'Utilisateur introuvable.',
    };
  }

  const accountStatus = (profile.accountStatus || 'pending').toLowerCase();
  if (accountStatus !== 'active' && accountStatus !== 'approved') {
    return {
      active: false,
      code: 'PAYMENT_UNAPPROVED',
      message: '⚠️ Votre paiement d\'inscription / compte n\'a pas encore été approuvé par l\'administrateur. Vous ne pouvez pas effectuer d\'actions sur la plateforme pour le moment.',
    };
  }

  // 2. Vérification de l'abonnement actif en base de données
  const sub = await db.subscription.findFirst({
    where: { userId, status: 'active' },
    select: { expiresAt: true },
    orderBy: { expiresAt: 'desc' },
  });

  if (sub && sub.expiresAt && new Date(sub.expiresAt) > new Date()) {
    return { active: true };
  }

  // Si aucun abonnement actif n'existe mais que le compte est approuvé, accorder automatiquement le 1er mois offert (30 jours) si pas encore consommé ou créer la fiche
  const existingSubsCount = await db.subscription.count({ where: { userId } });
  if (existingSubsCount === 0) {
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    await db.subscription.create({
      data: {
        userId,
        amount: 1000,
        currency: 'XOF',
        status: 'active',
        startsAt,
        expiresAt,
        approvedAt: startsAt,
      },
    }).catch(console.error);

    return { active: true };
  }

  return {
    active: false,
    code: 'SUBSCRIPTION_EXPIRED',
    message: '⚠️ Votre abonnement mensuel n\'est pas actif ou a expiré. Veuillez effectuer le paiement pour renouveler votre abonnement (1 000 FCFA/mois) et continuer d\'utiliser la plateforme.',
  };
}
