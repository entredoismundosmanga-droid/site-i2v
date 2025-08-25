import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { frame1, frame2, prompt, negativePrompt, aspectRatio } = body;

    // 🔑 pega a chave da Luma do ambiente (Vercel Settings → Environment Variables)
    const apiKey = process.env.LUMA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key não encontrada no servidor." },
        { status: 401 }
      );
    }

    // monta o payload para a Luma
    const payload: any = {
      prompt,
      negative_prompt: negativePrompt,
      aspect_ratio: aspectRatio || "9:16",
      keyframes: {
        frame0: { type: "image", url: frame1 },
      },
    };

    if (frame2) {
      payload.keyframes.frame1 = { type: "image", url: frame2 };
    }

    // chamada para a API da Luma
    const res = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
