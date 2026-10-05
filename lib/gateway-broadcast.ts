export async function broadcastGatewayEvent(t: string, d: unknown, userId?: string | null) {
  try {
    const port = process.env.GATEWAY_PORT || 3002
    await fetch(`http://localhost:${port}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userId ? { t, d, user_id: userId } : { t, d }),
    })
  } catch {
    // Gateway might be restarting or offline; ignore gracefully
  }
}
