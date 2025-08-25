"use client";
import { useEffect, useRef, useState } from "react";
import { apiUpload, apiGenerate, apiStatus } from "../lib/api";

export default function Page() {
  const [img1, setImg1] = useState<File | null>(null);
  const [img2, setImg2] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("Câmera dolly-in suave, estilo anime, Kael cabelo cinza e marca do sol sob a roupa");
  const [neg, setNeg] = useState("texto, logos, distorções, membros extras");
  const [ar, setAr] = useState("9:16");
  const [job, setJob] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const timer = useRef<any>(null);
  const [msg, setMsg] = useState<string>("");

  async function generate() {
    if (!img1) return alert("Envie pelo menos a primeira imagem");
    const u1 = await apiUpload(img1);
    const payload: any = { prompt, negative_prompt: neg, aspect_ratio: ar, frame0_url: u1.url };
    if (img2) {
      const u2 = await apiUpload(img2);
      payload.frame1_url = u2.url;
    }
    const { job_id } = await apiGenerate(payload);
    setJob(job_id);
  }

  useEffect(() => {
    if (!job) return;
    async function tick() {
      try {
        const s = await apiStatus(job);
        if (s.state === "completed" && s.result?.video) {
          setVideo(s.result.video);
          if (timer.current) clearInterval(timer.current);
        }
      } catch {}
    }
    timer.current = setInterval(tick, 2500);
    return () => timer.current && clearInterval(timer.current);
  }, [job]);

  return (
    <main style={{ maxWidth: 920, margin: "40px auto", padding: 16 }}>
      <h1>Imagem → Vídeo (Só Vercel)</h1>
      <p>Envie 1–2 imagens, escreva o prompt e gere o clipe com a Luma.</p>
      <div style={{ display: "grid", gap: 12 }}>
        <label>
          Frame 1: <input type="file" accept="image/*" onChange={(e) => setImg1(e.target.files?.[0] || null)} />
        </label>
        <label>
          Frame 2 (opcional): <input type="file" accept="image/*" onChange={(e) => setImg2(e.target.files?.[0] || null)} />
        </label>
        <label>
          Prompt:
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} style={{ width: "100%" }} />
        </label>
        <label>
          Negative prompt:
          <input value={neg} onChange={(e) => setNeg(e.target.value)} style={{ width: "100%" }} />
        </label>
        <label>
          Aspect ratio:
          <select value={ar} onChange={(e) => setAr(e.target.value)}>
            <option>16:9</option>
            <option>9:16</option>
            <option>1:1</option>
          </select>
        </label>
        <button onClick={generate}>Gerar vídeo</button>
      </div>

      {job && !video && <p style={{ marginTop: 16 }}>Job: {job} — processando…</p>}

      {video && (
        <div style={{ marginTop: 24 }}>
          <h3>Resultado</h3>
          <video src={video} controls style={{ width: "100%", borderRadius: 12 }} />
          <p><a href={video} download>Baixar MP4</a></p>
        </div>
      )}
    </main>
  );
}
