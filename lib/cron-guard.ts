import { NextRequest } from 'next/server';

/**
 * Verify that a cron route is called with the correct CRON_SECRET.
 * Checks both Authorization header and ?secret= query param (for Vercel Cron).
 *
 * Usage:
 *   export async function POST(req: NextRequest) {
 *     const err = verifyCronSecret(req);
 *     if (err) return err;
 *     ...
 *   }
 */
export function verifyCronSecret(req: NextRequest): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('CRON_SECRET not set — cron route is unprotected!');
    return new Response('Server misconfiguration', { status: 500 });
  }

  // Vercel Cron sends Authorization: Bearer <secret>
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.replace('Bearer ', '');

  // Also allow ?secret= query param for local testing
  const querySecret = new URL(req.url).searchParams.get('secret');

  if (bearerToken === secret || querySecret === secret) {
    return null; // Authorized
  }

  return new Response('Unauthorized', { status: 401 });
}
