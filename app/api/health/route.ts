export const runtime = 'nodejs'
export async function GET() {
  return Response.json({ ok: true, service: 'hpgk-agent-web', version: '0.6.1', inference: 'worker-proxy', aiApi: false, timestamp: new Date().toISOString() })
}
