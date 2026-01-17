import { useMemo, useState } from "react";

const TYPES = ["", "Electric", "Gas", "Water", "Internet"];

export default function ZipSearch({ zip, setZip, type, setType, onSearch, isLoading }) {
  const [touched, setTouched] = useState(false);

  const zipValid = useMemo(() => /^[0-9]{5}$/.test(zip), [zip]);
  const showError = touched && zip.length > 0 && !zipValid;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <label className="text-sm text-slate-300">ZIP Code</label>
          <input
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
            onBlur={() => setTouched(true)}
            placeholder="e.g., 19103"
            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-600"
          />
          {showError && (
            <div className="text-xs text-red-300">Enter a valid 5-digit ZIP.</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300">Utility Type (optional)</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-600"
          >
            {TYPES.map((t) => (
              <option key={t || "all"} value={t}>
                {t || "All"}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            disabled={isLoading || !zipValid}
            onClick={() => {
              setTouched(true);
              if (zipValid) onSearch();
            }}
            className="w-full rounded-xl bg-slate-50 text-slate-900 px-4 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          >
            {isLoading ? "Searching..." : "Find Providers"}
          </button>
        </div>
      </div>
    </div>
  );
}
