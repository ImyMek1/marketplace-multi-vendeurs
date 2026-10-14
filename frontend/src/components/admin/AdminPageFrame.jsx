function AdminPageFrame({
  eyebrow = 'Admin zone',
  title,
  description,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = 'Search records',
  filters,
  onRefresh,
  onCreate,
  createLabel,
  loading,
  error,
  success,
  children,
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          {description && <p className="mt-2 text-slate-500">{description}</p>}
        </div>
        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {createLabel || 'Create'}
          </button>
        )}
      </section>

      {(onSearchChange || filters || onRefresh) && (
        <form
          onSubmit={onSearchSubmit}
          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
        >
          {onSearchChange && (
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          )}
          {filters}
          {onSearchSubmit && (
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Search
            </button>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"
            >
              Refresh
            </button>
          )}
        </form>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {children}
    </div>
  )
}

export default AdminPageFrame
