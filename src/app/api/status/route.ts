import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const job_id = new URL(req.url).searchParams.get("job_id");
  const key = process.env.LUMA_API_KEY;
  if (!job_id || !key) return NextResponse.json({ error: "Parâmetros ausentes" }, { status: 400 });

  const r = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${job_id}`, {
    headers: { authorization: `Bearer ${key}`, accept: "application/json" },
  });
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: r.status });

  const data = await r.json();
  const out = { state: data.state, result: data.assets ? { video: data.assets.video, thumbnail: data.assets.thumbnail } : null };
  return NextResponse.json(out);
}
