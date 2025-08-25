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
    <main style={{ maxWidth: 
