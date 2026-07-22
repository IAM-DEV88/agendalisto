import { createHash } from 'crypto';

const WOMPI_API = process.env.WOMPI_SANDBOX === 'true'
  ? 'https://sandbox.wompi.co/v1'
  : 'https://production.wompi.co/v1';

export function generateWompiSignature(reference: string, amountInCents: number, currency: string): string {
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET || '';
  const concat = reference + amountInCents + currency + integritySecret;
  return createHash('sha256').update(concat).digest('hex');
}

export function verifyWompiWebhook(event: any): boolean {
  const signature = event?.data?.transaction?.integrity_signature || event?.signature?.integrity_signature;
  if (!signature) return false;

  const transaction = event?.data?.transaction;
  if (!transaction) return false;

  const expected = generateWompiSignature(
    transaction.reference || '',
    transaction.amount_in_cents || 0,
    transaction.currency || 'COP'
  );

  return signature === expected;
}

export const PLAN_PRICES_IN_CENTS: Record<string, number> = {
  pro: 4990000,
  premium: 9990000,
};

export { WOMPI_API };
