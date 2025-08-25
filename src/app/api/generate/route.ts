import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { prompt, negative_prompt, aspect_ratio, frame0_url, frame1_url } = await req.json();
  const key = process.env.LUMA_API_KEY;
  if (!key) return NextResponse.json({ error: "LUMA_API_KEY ausente" }, { status: 400 });

  const payload: any = {
    prompt,
    model: "ray-2",
    aspect_ratio,
    keyframes: { frame0: { type: "image", url: frame0_url } },
  };
  if (frame1_url) payload.keyframes.frame1 = { type: "image", url: frame1_url };
  if (negative_prompt) payload.negative_prompt = negative_prompt;

  const r = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: r.status });
  const gen = await r.json();
  return NextResponse.json({ job_id: gen.id });
}
