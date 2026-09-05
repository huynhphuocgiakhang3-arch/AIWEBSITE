export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function workerUrl(path: string) {
  const base = process.env.HPGK_INFERENCE_URL?.replace(/\/$/, '')
  if (!base) throw new Error('HPGK_INFERENCE_URL is not configured')
  return `${base}${path}`
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const upstream = await fetch(workerUrl('/stream'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.HPGK_WORKER_TOKEN ? { authorization: `Bearer ${process.env.HPGK_WORKER_TOKEN}` } : {}),
      },
      body,
      cache: 'no-store',
    })
    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => '')
      return Response.json({ error: 'inference_worker_error', status: upstream.status, message: text }, { status: upstream.status || 502 })
    }
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache, no-transform',
        'connection': 'keep-alive',
        'x-accel-buffering': 'no',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown proxy error'
    return Response.json({ error: 'inference_unavailable', message }, { status: 503 })
  }
}
