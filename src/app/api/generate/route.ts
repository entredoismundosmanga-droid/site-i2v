import { NextResponse } from "next/server";

export const runtime = "nodejs";

const LUMA_BASE = "https://api.lumalabs.ai/dream-machine/v1";

export async function POST(req: Request) {
  try {
    const key = process.env.LUMA_API_KEY;
    if (!key) return NextResponse.json({ ok: false, error: "Missing LUMA_API_KEY" }, { status: 500 });

    const { prompt, negative_prompt, aspect_ratio, frame0_url, frame1_url } = await req.json();

    if (!prompt || !frame0_url) {
      return NextResponse.json({ ok: false, error: "prompt e frame0_url são obrigatórios" }, { status: 400 });
    }

    const payload: any = {
      prompt,
      negative_prompt,
      aspect_ratio: aspect_ratio || "9:16",
      model: "ray-2",
      keyframes: {
        frame0: { type: "image", url: frame0_url }
      }
    };
    if (frame1_url) payload.keyframes.frame1 = { type: "image", url: frame1_url };

    const r = await fetch(`${LUMA_BASE}/generations`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const j = await r.json();
    if (!r.ok) return NextResponse.json({ ok: false, error: j?.detail || "Luma erro" }, { status: r.status });

    return NextResponse.json({ ok: true, id: j?.id });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const key = process.env.LUMA_API_KEY;
    if (!key) return NextResponse.json({ ok: false, error: "Missing LUMA_API_KEY" }, { status: 500 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "id é obrigatório" }, { status: 400 });

    const r = await fetch(`${LUMA_BASE}/generations/${id}`, {
      headers: { "Authorization": `Bearer ${key}` }
    });
    const j = await r.json();

    if (!r.ok) return NextResponse.json({ ok: false, error: j?.detail || "Luma erro" }, { status: r.status });

    const status = j?.state || j?.status;
    const video_url = j?.assets?.video || j?.output_video || null;

    return NextResponse.json({ ok: true, status, video_url });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
