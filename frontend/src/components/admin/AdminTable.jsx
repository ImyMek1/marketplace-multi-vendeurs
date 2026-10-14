function AdminTable({
  columns,
  rows,
  loading,
  emptyText = 'No records found.',
  pagination,
  onPageChange,
  actions,
  rowKey = 'id',
}) {
  const page = pagination?.current_page ?? pagination?.meta?.current_page ?? 1
  const lastPage = pagination?.last_page ?? pagination?.meta?.last_page ?? 1

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {loading ? (
        <div className="space-y-3 p-5" aria-label="Loading records">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-slate-500">{emptyText}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.header}
                    scope="col"
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${column.className || ''}`}
                  >
                    {column.header}
                  </th>
                ))}
                {actions && <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row[rowKey]} className="hover:bg-slate-50/70">
                  {columns.map((column) => (
                    <td key={column.header} className={`px-4 py-4 text-sm text-slate-700 ${column.className || ''}`}>
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                  {actions && <td className="px-4 py-4 text-right"><div className="flex flex-wrap justify-end gap-2">{actions(row)}</div></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {onPageChange && lastPage > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
          <p className="text-sm text-slate-500">Page {page} of {lastPage}</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= lastPage || loading}
              onClick={() => onPageChange(page + 1)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminTable
