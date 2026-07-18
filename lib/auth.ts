import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export type TokenPayload = {
  userId: string;
  role: Role;
  name: string;
};

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error('JWT_SECRET is missing from environment variables');
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET!, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, SECRET!) as TokenPayload;
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  try {
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

// --- Permission Matrix Guards (RULES.md authoritative) ---
// requireCustomerAccess() — allows CUSTOMER or ADMIN. Used for Cart, Checkout.
// requireVendorAccess()   — allows VENDOR or ADMIN. Used for Vendor Dashboard, Create Product.
// requireAdminOnly()      — allows ADMIN only. Used for Admin Dashboard, Delete Product, Manage Users, Reports, Settings.

export async function requireCustomerAccess(): Promise<TokenPayload> {
  const session = await getSession();
  if (!session) {
    throw new AuthError('Not authenticated', 401);
  }
  if (session.role !== Role.CUSTOMER && session.role !== Role.ADMIN) {
    throw new AuthError('Forbidden: Customer access required', 403);
  }
  return session;
}

export async function requireVendorAccess(): Promise<TokenPayload> {
  const session = await getSession();
  if (!session) {
    throw new AuthError('Not authenticated', 401);
  }
  if (session.role !== Role.VENDOR && session.role !== Role.ADMIN) {
    throw new AuthError('Forbidden: Vendor access required', 403);
  }
  return session;
}

export async function requireAdminOnly(): Promise<TokenPayload> {
  const session = await getSession();
  if (!session) {
    throw new AuthError('Not authenticated', 401);
  }
  if (session.role !== Role.ADMIN) {
    throw new AuthError('Forbidden: Admin access required', 403);
  }
  return session;
}
