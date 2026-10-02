import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/* ---------------------------------------------------------------------------
 * Sentry tunnel used by the Discord client
 *
 * The client funnels its crash/error reports through
 * `/error-reporting-proxy/{web|oversized|...}` (an envelope POSTed to the
 * origin, not to /api). While no route existed, every boot logged
 * `POST http://localhost:3000/error-reporting-proxy/web 404 (Not Found)` and
 * the report was retried; an empty 204 tells the reporter the envelope was
 * accepted without persisting anything.
 * ------------------------------------------------------------------------- */
const accepted = () => new NextResponse(null, {
  status: 204,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  },
})

export async function POST() { return accepted() }
export async function GET() { return accepted() }
export async function OPTIONS() { return accepted() }
