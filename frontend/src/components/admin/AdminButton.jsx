function AdminButton({ children, onClick, disabled, tone = 'neutral', type = 'button' }) {
  const toneStyles = {
    neutral: 'border-slate-300 text-slate-700 hover:bg-slate-50',
    primary: 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800',
    success: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
    danger: 'border-red-200 text-red-700 hover:bg-red-50',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-50 ${toneStyles[tone]}`}
    >
      {children}
    </button>
  )
}

export default AdminButton
