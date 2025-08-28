export async function api(path, opts = {}) {
  const base = import.meta.env.VITE_API_BASE || 'http://localhost:8787';
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  try { return await res.json(); } catch { return null; }
}