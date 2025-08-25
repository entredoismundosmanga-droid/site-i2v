import { NextResponse, NextRequest } from "next/server";
export const runtime = "nodejs";
const LUMA = "https://api.lumalabs.ai/dream-machine/v1";

export async function POST(req: NextRequest) {
  try {
    const key = process.env.LUMA_API_KEY?.trim();
    if (!key) return NextResponse.json({ ok: false, error: "Missing LUMA_API_KEY" }, { status: 500 });

    const { prompt, negative_prompt, aspect_ratio = "9:16", frame0_url, frame1_url } = await req.json();

    if (!prompt || !frame0_url)
      return NextResponse.json({ ok: false, error: "prompt e frame0_url são obrigatórios" }, { status: 400 });

    const payload: any = {
      model: "ray-2",
      prompt,
      aspect_ratio,
      keyframes: { frame0: { type: "image", url: frame0_url } },
    };
    if (frame1_url) payload.keyframes.frame1 = { type: "image", url: frame1_url };
    if (negative_prompt) payload.negative_prompt = negative_prompt;

    const r = await fetch(`${LUMA}/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const j = await r.json();
    if (!r.ok) return NextResponse.json({ ok: false, error: j?.detail || JSON.stringify(j) }, { status: r.status });
    return NextResponse.json({ ok: true, id: j?.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const key = process.env.LUMA_API_KEY?.trim();
    if (!key) return NextResponse.json({ ok: false, error: "Missing LUMA_API_KEY" }, { status: 500 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "id é obrigatório" }, { status: 400 });

    const r = await fetch(`${LUMA}/generations/${id}`, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    });
    const j = await r.json();
    if (!r.ok) return NextResponse.json({ ok: false, error: j?.detail || JSON.stringify(j) }, { status: r.status });

    const status = j?.state || j?.status;
    const video_url = j?.assets?.video || null;
    return NextResponse.json({ ok: true, status, video_url });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
