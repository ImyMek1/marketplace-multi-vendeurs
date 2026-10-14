export function StatusBadge({ value }) {
  const styles = {
    active: 'bg-emerald-100 text-emerald-800',
    approved: 'bg-emerald-100 text-emerald-800',
    published: 'bg-emerald-100 text-emerald-800',
    delivered: 'bg-emerald-100 text-emerald-800',
    pending: 'bg-amber-100 text-amber-800',
    prepared: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-blue-100 text-blue-800',
    assigned: 'bg-blue-100 text-blue-800',
    picked_up: 'bg-cyan-100 text-cyan-800',
    in_transit: 'bg-cyan-100 text-cyan-800',
    inactive: 'bg-slate-100 text-slate-700',
    suspended: 'bg-orange-100 text-orange-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-red-100 text-red-800',
    failed: 'bg-red-100 text-red-800',
    draft: 'bg-slate-100 text-slate-700',
  }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[value] || 'bg-slate-100 text-slate-700'}`}>
      {String(value || 'unknown').replaceAll('_', ' ')}
    </span>
  )
}

export function DetailRows({ values }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {values.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
          <dd className="mt-1 break-words text-sm text-slate-900">{value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  )
}
