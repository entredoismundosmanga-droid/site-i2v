"use client";

import { useRef, useState } from "react";

type GenResp = { ok: boolean; id?: string; error?: string };
type PollResp = { ok: boolean; status?: string; video_url?: string; error?: string };

export default function Page() {
  const f1Ref = useRef<HTMLInputElement>(null);
  const f2Ref = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState("");
  const [neg, setNeg] = useState("texto, logos, distorções, membros extras");
  const [ar, setAr] = useState("9:16");

  const [log, setLog] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const pushLog = (s: string) => setLog((L) => [...L, s]);

  async function uploadOne(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await r.json();
    if (!r.ok || !j?.ok) throw new Error(j?.error || `upload falhou: ${r.status}`);
    return j.url as string;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setVideoUrl(null);
    setLog([]);

    try {
      // 1) Uploads
      pushLog("⬆️ Fazendo upload das imagens...");
      const urls: string[] = [];
      const f1 = f1Ref.current?.files?.[0];
      if (!f1) throw new Error("Selecione pelo menos o Frame 1.");
      urls.push(await uploadOne(f1));
      const f2 = f2Ref.current?.files?.[0];
      if (f2) urls.push(await uploadOne(f2));

      // 2) Chamada Luma (criar geração)
      pushLog("🤖 Chamando a Luma...");
      const create = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          negative_prompt: neg,
          aspect_ratio: ar,
          frame0_url: urls[0],
          frame1_url: urls[1] || null
        })
      });
      const cj: GenResp = await create.json();
      if (!create.ok || !cj.ok || !cj.id) throw new Error(cj.error || "Falha ao criar geração");

      // 3) Poll até terminar
      pushLog("⏳ Gerando vídeo (isso pode levar ~1–3 min)...");
      let done = false;
      let tries = 0;
      while (!done && tries < 120) {
        await new Promise((r) => setTimeout(r, 3000));
        const poll = await fetch(`/api/generate?id=${encodeURIComponent(cj.id)}`);
        const pj: PollResp = await poll.json();

        if (!poll.ok || !pj.ok) throw new Error(pj.error || "Erro ao consultar geração");

        if (pj.status) pushLog(`• Status: ${pj.status}`);
        if (pj.status === "completed" && pj.video_url) {
          setVideoUrl(pj.video_url);
          pushLog("✅ Concluído!");
          done = true;
        } else if (pj.status === "failed") {
          throw new Error("Geração falhou");
        }
        tries++;
      }
      if (!done) throw new Error("Tempo excedido aguardando a geração");
    } catch (err: any) {
      pushLog(`❌ ${err?.message || String(err)}`);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1>Imagem → Vídeo (Só Vercel)</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Frame 1:
          <input type="file" accept="image/*" ref={f1Ref} />
        </label>
        <label>
          Frame 2 (opcional):
          <input type="file" accept="image/*" ref={f2Ref} />
        </label>

        <label>
          Prompt:
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} />
        </label>

        <label>
          Negative prompt:
          <input value={neg} onChange={(e) => setNeg(e.target.value)} />
        </label>

        <label>
          Aspect ratio:
          <select value={ar} onChange={(e) => setAr(e.target.value)}>
            <option>9:16</option>
            <option>1:1</option>
            <option>16:9</option>
          </select>
        </label>

        <button type="submit">Gerar vídeo</button>
      </form>

      <h3>Log</h3>
      <pre style={{ background: "#111", color: "#0f0", padding: 12, borderRadius: 8 }}>
        {log.join("\n")}
      </pre>

      {videoUrl && (
        <>
          <h3>Resultado</h3>
          <video src={videoUrl} controls style={{ width: "100%", borderRadius: 12 }} />
          <p><a href={videoUrl} target="_blank">Abrir direto</a></p>
        </>
      )}
    </div>
  );
    }
