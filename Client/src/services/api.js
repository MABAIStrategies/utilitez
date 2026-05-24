const API_BASE =
  import.meta.env.VITE_API_BASE ??
  (import.meta.env.DEV ? "http://localhost:5050" : "/_/backend");

export async function fetchStates() {
  const res = await fetch(`${API_BASE}/api/states`);
  if (!res.ok) throw new Error("Failed to load states");
  return res.json();
}

export async function fetchProviders({ state, zip, type }) {
  const params = new URLSearchParams();
  params.set("state", state);
  params.set("zip", zip);
  if (type) params.set("type", type);

  const res = await fetch(`${API_BASE}/api/providers?${params.toString()}`);
  const data = await res.json();

  if (!res.ok) {
    const msg = data?.error || "Request failed";
    throw new Error(msg);
  }
  return data;
}
