import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json([
    { id: 'WL-001', location: 'Nairobi, KE', flow: 12.4, valve: 'open', status: 'operational', txId: '0.0.101010@1699999999.000000010' },
    { id: 'WL-002', location: 'Kampala, UG', flow: 6.1, valve: 'closed', status: 'alert', txId: '0.0.202020@1699999999.000000011' },
    { id: 'WL-003', location: 'Accra, GH', flow: 0.0, valve: 'closed', status: 'offline', txId: '0.0.303030@1699999999.000000012' },
    { id: 'WL-004', location: 'Lagos, NG', flow: 3.2, valve: 'open', status: 'operational', txId: '0.0.404040@1699999999.000000013' },
  ])
}