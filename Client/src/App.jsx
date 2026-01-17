import { useEffect, useMemo, useState } from "react";
import StateSelector from "./components/StateSelector.jsx";
import ZipSearch from "./components/ZipSearch.jsx";
import ProviderList from "./components/ProviderList.jsx";
import { fetchProviders, fetchStates } from "./services/api.js";

export default function App() {
  const [states, setStates] = useState([
    { code: "DE", name: "Delaware" },
    { code: "MD", name: "Maryland" },
    { code: "PA", name: "Pennsylvania" },
  ]);

  const [stateCode, setStateCode] = useState("PA");
  const [zip, setZip] = useState("");
  const [type, setType] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const providers = useMemo(() => result?.providers || [], [result]);

  useEffect(() => {
    // Load states from backend (optional—fallback already set)
    fetchStates()
      .then((data) => setStates(data))
      .catch(() => {
        // keep fallback silently
      });
  }, []);

  async function runSearch() {
    setError("");
    setIsLoading(true);
    setResult(null);
    try {
      const data = await fetchProviders({ state: stateCode, zip, type });
      setResult(data);
    } catch (e) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300">
            Champion Demo • DE / MD / PA
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Utilit-Ez
          </h1>
          <p className="text-slate-300 max-w-2xl">
            Find utility providers by location. This demo uses a curated dataset
            per state (swap to live sources later).
          </p>
        </header>

        <main className="mt-8 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StateSelector
                states={states}
                value={stateCode}
                onChange={setStateCode}
              />
              <div className="md:col-span-2">
                <ZipSearch
                  zip={zip}
                  setZip={setZip}
                  type={type}
                  setType={setType}
                  onSearch={runSearch}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-900/40 bg-red-950/40 p-4 text-red-200">
              {error}
            </div>
          )}

          {result && (
            <div className="text-sm text-slate-300">
              Results: <span className="text-slate-50">{result.count}</span>{" "}
              {result.query?.type ? (
                <>
                  • Type: <span className="text-slate-50">{result.query.type}</span>
                </>
              ) : null}
              {" "}• State: <span className="text-slate-50">{result.query.state}</span>
              {" "}• ZIP: <span className="text-slate-50">{result.query.zip}</span>
            </div>
          )}

          <ProviderList providers={providers} />

          <footer className="pt-6 text-xs text-slate-500">
            Demo note: Provider coverage is simplified using ZIP prefixes. Phase 2 will
            replace this logic with verified service territory rules and live datasets.
          </footer>
        </main>
      </div>
    </div>
  );
}
