"use client";

import { useState } from "react";

export default function Page() {
  const [f1, setF1] = useState<File | null>(null);
  const [f2, setF2] = useState<File | null>(null);
  const [prompt, setPrompt] = useState(
    "Câmera dolly-in suave, estilo anime, Kael cabelo cinza e marca do sol sob a roupa"
  );
  const [neg, setNeg] = useState("texto, logos, distorções, membros extras");
  const [ar, setAr] = useState("9:16");
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  function log(msg: string) {
    setLogs((prev) => [...prev, msg]);
  }

  async function handleClick() {
    setVideoUrl(null);
    setLogs([]);
    if (!f1) {
      log("❗ Selecione ao menos 1 imagem (Frame 1).");
      return;
    }
    setBusy(true);
    try {
      log("⬆️ Fazendo upload das imagens...");
      const upload = async (file: File) => {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body });
        if (!res.ok) throw new Error(`upload falhou: ${await res.text()}`);
        const j = await res.json();
        return j.url as string;
      };

      const frame0_url = await upload(f1);
      let frame1_url: string | undefined;
      if (f2) frame1_url = await upload(f2);

      log("🤖 Chamando a Luma...");
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt,
          negative_prompt: neg,
          aspect_ratio: ar,
          frame0_url,
          frame1_url,
        }),
      });

      const genText = await genRes.text();
      let genJson: any = {};
      try { genJson = JSON.parse(genText); } catch {}
      if (!genRes.ok || genJson.ok === false) {
        throw new Error(genJson.error || genText || "erro desconhecido em /api/generate");
      }

      const { job_id } = genJson;
      log(`⏱️ Job criado: ${job_id}. Fazendo polling...`);

      // polling simples
      let tries = 0;
      while (tries < 120) { // ~2 min
        await new Promise((r) => setTimeout(r, 1000));
        const sRes = await fetch(`/api/status?job_id=${encodeURIComponent(job_id)}`);
        const sText = await sRes.text();
        let sJson: any = {};
        try { sJson = JSON.parse(sText); } catch {}
        if (!sRes.ok) throw new Error(sText);

        if (sJson.state === "completed" && sJson.video) {
          log("✅ Vídeo pronto!");
          setVideoUrl(sJson.video);
          break;
        } else if (sJson.state === "failed") {
          throw new Error(sJson.error || "O provedor retornou failed");
        } else {
          if (tries % 5 === 0) log(`⌛ status: ${sJson.state || "processando"}...`);
        }
        tries++;
      }
      if (!videoUrl && tries >= 120) throw new Error("Timeout aguardando o vídeo");
    } catch (e: any) {
      log("❌ " + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 16px" }}>
      <h1>Imagem → Vídeo (Só Vercel)</h1>
      <p>Envie 1–2 imagens, escreva o prompt e gere o clipe com a Luma.</p>

      <label>Frame 1:<br/>
        <input type="file" accept="image/*" onChange={e => setF1(e.target.files?.[0] || null)} />
      </label>
      <br/><br/>

      <label>Frame 2 (opcional):<br/>
        <input type="file" accept="image/*" onChange={e => setF2(e.target.files?.[0] || null)} />
      </label>
      <br/><br/>

      <label>Prompt:<br/>
        <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={4} style={{width:"100%"}} />
      </label>
      <br/>

      <label>Negative prompt:<br/>
        <input value={neg} onChange={e=>setNeg(e.target.value)} style={{width:"100%"}} />
      </label>
      <br/>

      <label>Aspect ratio:&nbsp;
        <select value={ar} onChange={e=>setAr(e.target.value)}>
          <option value="16:9">16:9</option>
          <option value="9:16">9:16</option>
          <option value="1:1">1:1</option>
        </select>
      </label>
      <br/><br/>

      <button onClick={handleClick} disabled={busy} style={{padding:"10px 16px"}}>
        {busy ? "Gerando..." : "Gerar vídeo"}
      </button>

      <h3 style={{marginTop:24}}>Log</h3>
      <pre style={{background:"#111", color:"#0f0", padding:12, minHeight:120, whiteSpace:"pre-wrap"}}>
        {logs.join("\n") || "Sem mensagens ainda."}
      </pre>

      {videoUrl && (
        <>
          <h3>Resultado</h3>
          <video src={videoUrl} controls style={{width:"100%"}} />
          <p><a href={videoUrl} target="_blank">Abrir vídeo</a></p>
        </>
      )}
    </main>
  );
                                                                 }
