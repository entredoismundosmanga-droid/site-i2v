async function readTextSafe(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

export async function apiUpload(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`/api/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const msg = await readTextSafe(res);
    throw new Error(`Upload falhou (${res.status}): ${msg}`);
  }
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
  if (!res.ok) {
    const msg = await readTextSafe(res);
    throw new Error(`Geração falhou (${res.status}): ${msg}`);
  }
  return res.json() as Promise<{ job_id: string }>;
}

export async function apiStatus(job_id: string) {
  const res = await fetch(`/api/status?job_id=${encodeURIComponent(job_id)}`);
  if (!res.ok) {
    const msg = await readTextSafe(res);
    throw new Error(`Status falhou (${res.status}): ${msg}`);
  }
  return res.json() as Promise<any>;
}
