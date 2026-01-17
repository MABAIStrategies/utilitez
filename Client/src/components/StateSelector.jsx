import React from "react";

export default function StateSelector({ states, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-slate-300">State</label>
      <select
        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-600"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {states.map((s) => (
          <option key={s.code} value={s.code}>
            {s.name} ({s.code})
          </option>
        ))}
      </select>
    </div>
  );
}
