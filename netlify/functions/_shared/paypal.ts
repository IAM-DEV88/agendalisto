const PAYPAL_API = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

export async function getPaypalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_SECRET!;

  if (!clientId || !clientSecret) {
    const similares = Object.keys(process.env).filter(k => /paypal/i.test(k));
    throw new Error(`Faltan PAYPAL_CLIENT_ID o PAYPAL_SECRET. Similares encontradas: ${similares.length ? similares.join(', ') : 'ninguna'}`);
  }

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    throw new Error(`PayPal auth error: ${data.error_description || data.error || res.statusText}`);
  }

  return data.access_token;
}

export const PLAN_PRICES_USD: Record<string, number> = {
  pro: 49.90,
  premium: 99.90,
};

export { PAYPAL_API };
