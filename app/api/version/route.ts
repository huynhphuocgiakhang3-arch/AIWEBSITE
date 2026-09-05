export const runtime = 'nodejs'
export async function GET() {
  return Response.json({ name: 'HPGK AGENT', version: '0.6.0', architecture: 'from-zero-transformer', tokenizer: 'custom-bpe', inference: 'independent-worker', streaming: 'sse', context: 'bounded', codingWorkflow: true })
}
