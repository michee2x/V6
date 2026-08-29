import { createHmac } from 'crypto';
import { createAdminClient } from '@/utils/supabase/admin';

// Plan → credits mapping (per month/interval)
const PLAN_CREDITS: Record<string, number> = {
  starter: 1500, // $15 plan
  growth:  3000, // $29 plan
  pro:     5500, // $49 plan
};

// Sandbox + Live price IDs → plan name
// NOTE: Ensure these match your actual Paddle catalog price IDs for recrea8.app
const PRICE_TO_PLAN: Record<string, string> = {
  // Add your sandbox / live price IDs here
  'pri_01kyj6v0qyavxvd9v10c5xf459': 'starter',
  'pri_01kyj6n8yckwsd2ybzkb80k614': 'growth',
  'pri_01kyj6f94bvanvps5edphqzywv': 'pro',
};

// ── Paddle webhook signature verification ─────────────────────
function parsePaddleSignatureHeader(header: string): { ts: string; h1Values: string[] } | null {
  try {
    const parts = header.split(';');
    let ts = '';
    const h1Values: string[] = [];
    for (const part of parts) {
      const eqIdx = part.indexOf('=');
      if (eqIdx === -1) continue;
      const key = part.slice(0, eqIdx).trim();
      const val = part.slice(eqIdx + 1).trim();
      if (key === 'ts') ts = val;
      if (key === 'h1') h1Values.push(val);
    }
    if (!ts || h1Values.length === 0) return null;
    return { ts, h1Values };
  } catch {
    return null;
  }
}

function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string | null,
  secretsEnv: string
): boolean {
  if (!signatureHeader || !secretsEnv) return false;

  const parsed = parsePaddleSignatureHeader(signatureHeader);
  if (!parsed) {
    return false;
  }

  const { ts, h1Values } = parsed;
  const payload = `${ts}:${rawBody}`;
  const secrets = secretsEnv.split(',').map(s => s.trim()).filter(Boolean);

  for (const secret of secrets) {
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    if (h1Values.includes(expected)) {
      return true;
    }
  }
  return false;
}

// ── Handlers ──────────────────────────────────────────────────
// Removed handleSubscriptionCreated to avoid duplicate grants and race conditions.
// We handle all initial grants and renewals in handleTransactionCompleted.

async function handleSubscriptionUpdated(data: any) {
  const supabaseAdmin = createAdminClient();
  const customerId    = data.customer_id;
  const subscriptionId = data.id;
  const status        = data.status;
  const priceId       = data.items?.[0]?.price?.id;

  const plan = PRICE_TO_PLAN[priceId] ?? null;

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, plan, credits_remaining')
    .eq('paddle_customer_id', customerId)
    .single();

  if (error || !user) return;

  const updatePayload: Record<string, any> = {
    subscription_status:    status,
    paddle_subscription_id: subscriptionId,
  };

  // If canceled or past_due, downgrade
  if (status === 'canceled' || status === 'past_due') {
    updatePayload.plan              = 'free';
    updatePayload.credits_remaining = 0;
    updatePayload.credits_total     = 0;
  } else if (plan && plan !== user.plan) {
    // If plan changed, just update the plan.
    // The actual credit grant is handled by handleTransactionCompleted.
    updatePayload.plan = plan;
  }

  await supabaseAdmin.from('users').update(updatePayload).eq('id', user.id);
}

async function handleTransactionCompleted(data: any) {
  const supabaseAdmin = createAdminClient();
  // We handle initial purchases and renewals here
  if (!data.subscription_id) return;
  const customerId = data.customer_id;
  const subscriptionId = data.subscription_id;
  const userId = data.custom_data?.user_id;
  const priceId = data.items?.[0]?.price?.id;

  const plan = PRICE_TO_PLAN[priceId] ?? 'starter';
  const addedCredits = PLAN_CREDITS[plan] ?? 0;
  if (addedCredits === 0) return;

  // Find user by userId (first purchase) or customerId (renewals)
  let userQuery = supabaseAdmin.from('users').select('id, plan, credits_remaining');
  if (userId) {
    userQuery = userQuery.eq('id', userId) as any;
  } else {
    userQuery = userQuery.eq('paddle_customer_id', customerId) as any;
  }

  const { data: user, error } = await (userQuery as any).single();
  if (error || !user) return;

  const newCredits = (user.credits_remaining || 0) + addedCredits;

  await supabaseAdmin
    .from('users')
    .update({
      plan,
      paddle_customer_id: customerId,
      paddle_subscription_id: subscriptionId,
      subscription_status: 'active',
      credits_remaining: newCredits,
      credits_total: newCredits,
      credits_reset_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  let txType = 'monthly_reset';
  if (data.origin === 'web') txType = 'subscription_created';
  else if (data.origin === 'subscription_update') txType = 'plan_changed';

  await supabaseAdmin.from('credit_transactions').insert({
    user_id:       user.id,
    type:          txType,
    amount:        addedCredits,
    balance_after: newCredits,
    note:          `Payment completed — ${plan} plan`,
  });
}

// ── Main route handler ─────────────────────────────────────────
export async function POST(req: Request) {
  const rawBody   = await req.text();
  const sigHeader = req.headers.get('paddle-signature');
  const secretsEnv = process.env.PADDLE_WEBHOOK_SECRET ?? '';

  if (!verifyPaddleSignature(rawBody, sigHeader, secretsEnv)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { event_type, data } = event;

  try {
    switch (event_type) {
      // case 'subscription.created':
      //   We rely on transaction.completed for initial setup to avoid race conditions.
      //   break;
      case 'subscription.updated':
        await handleSubscriptionUpdated(data);
        break;
      case 'transaction.completed':
        await handleTransactionCompleted(data);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(`[paddle] error handling ${event_type}:`, err);
  }

  return Response.json({ received: true });
}
