import { NextResponse } from 'next/server'
import { isBillingEnabled } from '@/lib/stripe'

export async function GET() {
  const flag = process.env.NEXT_PUBLIC_BILLING_ENABLED
  const explicitlyOff = flag === 'false' || flag === '0'
  const enabled = !explicitlyOff && isBillingEnabled()

  return NextResponse.json({
    enabled,
    flag: flag ?? null,
  })
}
