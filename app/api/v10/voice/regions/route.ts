import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json([
    {
      id: 'us-east',
      name: 'US East',
      optimal: false,
      deprecated: false,
      custom: false,
    },
    {
      id: 'us-central',
      name: 'US Central',
      optimal: false,
      deprecated: false,
      custom: false,
    },
    {
      id: 'us-west',
      name: 'US West',
      optimal: false,
      deprecated: false,
      custom: false,
    },
    {
      id: 'rotterdam',
      name: 'Rotterdam',
      optimal: true,
      deprecated: false,
      custom: false,
    },
    {
      id: 'brazil',
      name: 'Brazil',
      optimal: false,
      deprecated: false,
      custom: false,
    },
    {
      id: 'singapore',
      name: 'Singapore',
      optimal: false,
      deprecated: false,
      custom: false,
    },
  ])
}
