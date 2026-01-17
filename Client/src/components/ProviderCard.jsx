function linkify(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.toString();
  } catch {
    return null;
  }
}

export default function ProviderCard({ provider }) {
  const website = linkify(provider.website);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">{provider.name}</div>
          <div className="text-sm text-slate-300">{provider.type}</div>
        </div>

        <span className="text-xs rounded-full border border-slate-700 px-2 py-1 text-slate-200">
          {provider.serviceArea}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-sm text-slate-200">
        {provider.phone && (
          <div>
            <span className="text-slate-400">Phone:</span>{" "}
            <a className="underline hover:opacity-80" href={`tel:${provider.phone}`}>
              {provider.phone}
            </a>
          </div>
        )}
        {website && (
          <div>
            <span className="text-slate-400">Website:</span>{" "}
            <a
              className="underline hover:opacity-80"
              href={website}
              target="_blank"
              rel="noreferrer"
            >
              {website}
            </a>
          </div>
        )}
        {provider.notes && (
          <div className="pt-2 text-xs text-slate-400">{provider.notes}</div>
        )}
      </div>
    </div>
  );
}
