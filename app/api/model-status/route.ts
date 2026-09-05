export const dynamic = 'force-dynamic'

export async function GET() {
  const manifest = {
    project: 'HPGK AGENT',
    version: '0.6.0',
    mode: process.env.HPGK_INFERENCE_URL ? 'connected' : 'on-demand',
    training: 'Kaggle GPU sessions',
    modelReady: Boolean(process.env.HPGK_MODEL_READY === 'true'),
    inferenceUrlConfigured: Boolean(process.env.HPGK_INFERENCE_URL),
    zeroCost: true,
    warning: 'Free compute has quotas; no 24/7 GPU is promised.'
  }
  return Response.json(manifest, { headers: { 'cache-control': 'no-store' } })
}
