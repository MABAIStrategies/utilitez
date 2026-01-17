import { useEffect, useMemo, useState } from "react";
import "./App.css";

const STATES = ["DE", "MD", "PA"];
const TYPES = ["", "Electric", "Gas", "Water", "Electric/Gas"];

export default function App() {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5050";

  const [stateCode, setStateCode] = useState("DE");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState([]);
  const [error, setError] = useState("");

  const queryUrl = useMemo(() => {
    const u = new URL(`${apiUrl}/providers/search`);
    if (stateCode) u.searchParams.set("state", stateCode);
    if (type) u.searchParams.set("type", type);
    return u.toString();
  }, [apiUrl, stateCode, type]);

  async function fetchProviders() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(queryUrl);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setProviders(data.providers || []);
    } catch (e) {
      setError(e?.message || "Something went wrong");
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto" }}>
      <h1 style={{ marginBottom: 8 }}>Utilitez Demo</h1>
      <p style={{ marginTop: 0, color: "#555" }}>
        Search utility providers (mock data) by state and type.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#666" }}>State</span>
          <select value={stateCode} onChange={(e) => setStateCode(e.target.value)} style={{ padding: 10, borderRadius: 10 }}>
            {STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#666" }}>Type</span>
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: 10, borderRadius: 10 }}>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t === "" ? "All" : t}</option>
            ))}
          </select>
        </label>

        <div style={{ display: "flex", alignItems: "end" }}>
          <button
            onClick={fetchProviders}
            style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "white", cursor: "pointer" }}
          >
            {loading ? "Loading..." : "Search"}
          </button>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "end", color: "#666", fontSize: 12 }}>
          API: {apiUrl}
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #f00", borderRadius: 10, color: "#900" }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <h2 style={{ marginBottom: 8 }}>Results ({providers.length})</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          {providers.map((p) => (
            <div key={p.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div style={{ color: "#555", marginTop: 6 }}>{p.state} • {p.type}</div>
              <a href={p.website} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 10 }}>
                Visit website →
              </a>
            </div>
          ))}
        </div>

        {!loading && providers.length === 0 && !error && (
          <p style={{ color: "#666" }}>No providers found. Try another filter.</p>
        )}
      </div>
    </div>
  );
}
