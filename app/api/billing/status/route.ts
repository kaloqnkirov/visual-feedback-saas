import { connection, NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth-server'
import { isBillingAdmin } from '@/lib/billing-admins'
import { hasPaidAccess, isBillingEnabled } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  await connection()

  const flag = process.env.NEXT_PUBLIC_BILLING_ENABLED
  const explicitlyOff = flag === 'false' || flag === '0'
  const enabled = !explicitlyOff && isBillingEnabled()

  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({
      enabled,
      flag: flag ?? null,
      isAdmin: false,
      hasAccess: !enabled,
      status: 'anonymous',
    })
  }

  const admin = isBillingAdmin(user.email)
  if (!enabled || admin) {
    return NextResponse.json({
      enabled,
      flag: flag ?? null,
      isAdmin: admin,
      hasAccess: true,
      status: admin ? 'admin' : 'active',
    })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .maybeSingle()

    const status = data?.subscription_status || 'inactive'
    return NextResponse.json({
      enabled,
      flag: flag ?? null,
      isAdmin: false,
      hasAccess: hasPaidAccess(status),
      status,
    })
  } catch {
    return NextResponse.json({
      enabled,
      flag: flag ?? null,
      isAdmin: false,
      hasAccess: false,
      status: 'inactive',
    })
  }
}
