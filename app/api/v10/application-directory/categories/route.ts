import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    categories: [
      { id: 1, name: 'Gaming', description: 'Bots and apps for gamers' },
      { id: 2, name: 'Social', description: 'Community management, games, and entertainment' },
      { id: 3, name: 'Productivity', description: 'Reminders, notes, and automation' },
      { id: 4, name: 'Utilities', description: 'Moderation, logs, and system tools' },
    ],
  })
}
