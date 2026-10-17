import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

async function syncSubscription(
  userId: string,
  customerId: string | null,
  subscription: Stripe.Subscription | null
) {
  const admin = getSupabaseAdmin()
  const status = subscription?.status || 'inactive'
  await admin.from('profiles').upsert({
    id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription?.id || null,
    subscription_status: status,
    updated_at: new Date().toISOString(),
  })
}

async function resolveUserId(
  customerId: string | null | undefined,
  metadataUserId?: string | null
) {
  if (metadataUserId) return metadataUserId
  if (!customerId) return null
  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  return data?.id || null
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Missing webhook secret' }, { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid signature'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId =
          session.metadata?.supabase_user_id || session.client_reference_id
        if (!userId) break

        let subscription: Stripe.Subscription | null = null
        if (session.subscription) {
          subscription = await stripe.subscriptions.retrieve(
            String(session.subscription)
          )
        }

        await syncSubscription(
          userId,
          typeof session.customer === 'string' ? session.customer : null,
          subscription
        )
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id
        const userId = await resolveUserId(
          customerId,
          subscription.metadata?.supabase_user_id
        )
        if (!userId) break
        await syncSubscription(
          userId,
          customerId,
          event.type === 'customer.subscription.deleted' ? null : subscription
        )
        if (event.type === 'customer.subscription.deleted') {
          const admin = getSupabaseAdmin()
          await admin
            .from('profiles')
            .update({
              subscription_status: 'canceled',
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId)
        }
        break
      }
      default:
        break
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
