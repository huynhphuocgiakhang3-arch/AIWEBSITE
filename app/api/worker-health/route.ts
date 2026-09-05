export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const base = process.env.HPGK_INFERENCE_URL?.replace(/\/$/, '')
  if (!base) return Response.json({ configured: false, ok: false, message: 'Set HPGK_INFERENCE_URL to the public inference worker URL.' }, { status: 200 })
  try {
    const upstream = await fetch(`${base}/health`, { cache: 'no-store', signal: AbortSignal.timeout(5000) })
    const data = await upstream.json().catch(() => ({}))
    return Response.json({ configured: true, upstream: data }, { status: upstream.ok ? 200 : 503 })
  } catch (error) {
    return Response.json({ configured: true, ok: false, message: error instanceof Error ? error.message : 'Worker unavailable' }, { status: 503 })
  }
}
