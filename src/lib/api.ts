export async function apiUpload(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`/api/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Falha no upload");
  return res.json() as Promise<{ url: string }>;
}

export async function apiGenerate(payload: {
  prompt: string;
  negative_prompt?: string;
  aspect_ratio: string;
  frame0_url: string;
  frame1_url?: string;
}) {
  const res = await fetch(`/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Falha ao iniciar geração");
  return res.json() as Promise<{ job_id: string }>;
}

export async function apiStatus(job_id: string) {
  const res = await fetch(`/api/status?job_id=${encodeURIComponent(job_id)}`);
  if (!res.ok) throw new Error("Falha no status");
  return res.json() as Promise<any>;
}
