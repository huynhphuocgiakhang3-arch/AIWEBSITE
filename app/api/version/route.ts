export const runtime = "nodejs";
export async function GET() {
  return Response.json({
    name: "VIETCODE-AI",
    version: "0.3.0",
    architecture: "from-zero-transformer",
    tokenizer: "custom-bpe",
    training: "python-core",
    deployment: "vercel-web"
  });
}
