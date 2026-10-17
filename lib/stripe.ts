import Stripe from 'stripe'

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY')
  }
  return new Stripe(key)
}

export function isBillingEnabled() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID
  )
}

export function hasPaidAccess(status: string | null | undefined) {
  return status === 'active' || status === 'trialing'
}
