import ProviderCard from "./ProviderCard.jsx";

export default function ProviderList({ providers }) {
  if (!providers?.length) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">
        No providers found for that search.
        <div className="mt-2 text-xs text-slate-400">
          Tip: Try a nearby ZIP in the same region to see the demo dataset behavior.
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {providers.map((p) => (
        <ProviderCard key={p.id} provider={p} />
      ))}
    </div>
  );
}
