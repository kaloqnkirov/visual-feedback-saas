export function isBillingAdmin(email: string | null | undefined) {
  if (!email) return false
  const raw =
    process.env.BILLING_ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_BILLING_ADMIN_EMAILS ||
    ''
  const list = raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.trim().toLowerCase())
}
