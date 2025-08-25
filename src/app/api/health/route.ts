export const runtime = "edge";
export async function GET() {
  const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
  const hasLuma = !!process.env.LUMA_API_KEY;
  return new Response(
    JSON.stringify({ ok: true, env: { BLOB_READ_WRITE_TOKEN: hasBlob, LUMA_API_KEY: hasLuma } }),
    { headers: { "content-type": "application/json" } }
  );
}
