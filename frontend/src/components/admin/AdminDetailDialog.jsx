function AdminDetailDialog({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-6" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-detail-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-xl bg-white shadow-xl sm:rounded-xl"
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h2 id="admin-detail-title" className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </header>
        <div className="space-y-5 p-5">{children}</div>
      </section>
    </div>
  )
}

export default AdminDetailDialog
