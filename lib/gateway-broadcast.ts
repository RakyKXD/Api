export async function broadcastGatewayEvent(t: string, d: unknown) {
  try {
    const port = process.env.GATEWAY_PORT || 3002
    await fetch(`http://localhost:${port}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ t, d }),
    })
  } catch {
    // Gateway might be restarting or offline; ignore gracefully
  }
}
