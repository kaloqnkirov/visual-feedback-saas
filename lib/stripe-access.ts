/** Client-safe helpers (no secret keys). */

export function isBillingEnabled() {
  return process.env.NEXT_PUBLIC_BILLING_ENABLED === 'true'
}

export function hasPaidAccess(status: string | null | undefined) {
  return status === 'active' || status === 'trialing'
}
