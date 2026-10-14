import { useState } from 'react'
import AdminPageFrame from '../../components/admin/AdminPageFrame'
import AdminTable from '../../components/admin/AdminTable'
import { formatCurrency, formatDate } from '../../components/admin/adminFormatters.js'
import useAdminList from '../../hooks/useAdminList'
import adminService from '../../services/adminService'

function AdminCommissions() {
  const list = useAdminList(adminService.getCommissions)
  const [search, setSearch] = useState('')
  const total = Number(list.pagination?.meta?.total_commissions || 0)

  const submitSearch = (event) => {
    event.preventDefault()
    list.updateCriteria({ ...list.criteria, search })
  }

  return (
    <AdminPageFrame
      title="Commissions"
      description="Review platform commission records by order and seller."
      searchValue={search}
      onSearchChange={setSearch}
      onSearchSubmit={submitSearch}
      searchPlaceholder="Search order number or seller"
      onRefresh={() => list.refresh()}
      loading={list.loading}
      error={list.error}
    >
      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">All-time commissions</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(total)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">Records matching filter</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{list.pagination?.meta?.total ?? 0}</p>
        </article>
      </section>
      <AdminTable
        rows={list.rows}
        loading={list.loading}
        pagination={list.pagination}
        onPageChange={list.refresh}
        columns={[
          { header: 'Order', render: (row) => row.order?.order_number || `#${row.order_id}` },
          { header: 'Seller', render: (row) => row.seller?.name || '—' },
          { header: 'Order status', render: (row) => row.order?.status || '—' },
          { header: 'Rate', render: (row) => `${row.rate}%` },
          { header: 'Commission', render: (row) => <span className="font-semibold text-slate-900">{formatCurrency(row.amount)}</span> },
          { header: 'Created', render: (row) => formatDate(row.created_at) },
        ]}
      />
    </AdminPageFrame>
  )
}

export default AdminCommissions
