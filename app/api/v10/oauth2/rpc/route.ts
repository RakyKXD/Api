import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    // Standard RPC mock origins and scopes
    rpc_origins: ['*'],
  })
}
