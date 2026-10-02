import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    recipient_status: [],
    has_sent_referrals: false,
    trial_id: 'nitro_referral_trial',
  })
}
