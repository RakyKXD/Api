import { NextResponse } from 'next/server'

/**
 * GET /experiments
 *
 * The Discord web client expects an object with:
 * - fingerprint: string
 * - assignments: array of user experiments (can be empty [])
 * - guild_experiments: array of guild experiments (can be empty [])
 *
 * An array payload causes `Cannot read properties of undefined (reading 'forEach')`
 * inside `ei` (ExperimentStore).
 */
export async function GET() {
  return NextResponse.json({
    fingerprint: '900000000000000001.mock_fingerprint',
    assignments: [],
    guild_experiments: []
  })
}
