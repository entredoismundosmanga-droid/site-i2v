import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 });
  }

  // Envia para o Vercel Blob (público)
  const { url } = await put(`uploads/${Date.now()}_${file.name}`, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN, // coloque no projeto da Vercel
  });

  return NextResponse.json({ url });
}
