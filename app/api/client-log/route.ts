import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// The mock client retries in a loop when an endpoint answers the wrong shape, so
// client-errors.log grew without bound (thousands of lines) and the newest events -
// the ones worth debugging - could not be read. The log is now trimmed by size
// (keeping the newest slice) and API calls go to a separate, compact, one-line-per
// -call file so the failing request can be identified at a glance.
const LOG_PATH = path.join(process.cwd(), 'client-errors.log')
const API_LOG_PATH = path.join(process.cwd(), 'client-api-calls.log')
const MAX_LOG_CHARS = 120000
const KEEP_LOG_CHARS = 20000
const MAX_API_CALL_LINES = 300

function appendText(file: string, text: string) {
  try {
    fs.appendFileSync(file, text)
  } catch {
    return
  }
  try {
    if (fs.statSync(file).size <= MAX_LOG_CHARS) return
    const current = fs.readFileSync(file, 'utf8')
    fs.writeFileSync(file, `[truncated - keeping the newest ${KEEP_LOG_CHARS} characters]\n${current.slice(-KEEP_LOG_CHARS)}`)
  } catch {
    /* best effort */
  }
}

function appendLine(file: string, line: string, maxLines: number) {
  try {
    const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean) : []
    existing.push(line)
    const capped = existing.length > maxLines ? existing.slice(existing.length - maxLines) : existing
    fs.writeFileSync(file, capped.join('\n') + '\n')
  } catch {
    /* best effort */
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json().catch(() => null)

    // API call trace produced by the fetch/XHR instrumentation in app.html.
    if (data && data.type === 'api_call') {
      const compact = `[${new Date().toISOString()}] ${String(data.method || 'GET').toUpperCase()} ${data.status ?? '???'} ${data.url}`
      appendLine(API_LOG_PATH, compact, MAX_API_CALL_LINES)
      console.log(compact)
      return NextResponse.json({ ok: true })
    }

    const logLine = `[CLIENT LOG ${new Date().toISOString()}] ${JSON.stringify(data)}\n`
    console.log(logLine)
    appendText(LOG_PATH, logLine)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
