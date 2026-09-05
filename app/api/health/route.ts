export const runtime = "nodejs";
export async function GET() {
  return Response.json({
    ok: true,
    service: "vietcode-ai-web",
    version: "0.3.0",
    inference: "demo",
    aiApi: false,
    timestamp: new Date().toISOString()
  });
}
