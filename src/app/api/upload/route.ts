import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing BLOB_READ_WRITE_TOKEN" }, { status: 500 });
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "file ausente" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const safe = file.name.replace(/[^\w.\-]+/g, "_");
    const { url } = await put(`${Date.now()}_${safe}`, buffer, {
      access: "public",
      token,
      contentType: file.type || "application/octet-stream",
    });
    return NextResponse.json({ ok: true, url });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
