import { useState } from 'react'
import AdminButton from '../../components/admin/AdminButton'
import AdminPageFrame from '../../components/admin/AdminPageFrame'
import AdminTable from '../../components/admin/AdminTable'
import { StatusBadge } from '../../components/admin/adminFormatters.jsx'
import { formatCurrency, formatDate } from '../../components/admin/adminFormatters.js'
import useAdminList from '../../hooks/useAdminList'
import adminService from '../../services/adminService'

const emptyCoupon = {
  code: '', type: 'fixed', value: '', starts_at: '', expires_at: '',
  min_order_amount: '0', max_usage: '', status: 'active',
}

function inputDate(value) {
  return value ? new Date(value).toISOString().slice(0, 16) : ''
}

function AdminCoupons() {
  const list = useAdminList(adminService.getCoupons)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyCoupon)
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [success, setSuccess] = useState('')

  const openCreate = () => {
    setEditing(null)
    setForm(emptyCoupon)
    setFormOpen(true)
  }

  const openEdit = (coupon) => {
    setEditing(coupon)
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      starts_at: inputDate(coupon.starts_at),
      expires_at: inputDate(coupon.expires_at),
      min_order_amount: coupon.min_order_amount ?? '0',
      max_usage: coupon.max_usage ?? '',
      status: coupon.status,
    })
    setFormOpen(true)
  }

  const save = async (event) => {
    event.preventDefault()
    setBusyId('form')
    setSuccess('')
    list.setError('')
    const data = {
      ...form,
      code: form.code.trim().toUpperCase(),
      value: Number(form.value),
      starts_at: form.starts_at || null,
      expires_at: form.expires_at || null,
      min_order_amount: Number(form.min_order_amount || 0),
      max_usage: form.max_usage ? Number(form.max_usage) : null,
    }
    try {
      if (editing) await adminService.updateCoupon(editing.id, data)
      else await adminService.createCoupon(data)
      setFormOpen(false)
      setSuccess(editing ? 'Coupon updated.' : 'Coupon created.')
      list.refresh()
    } catch (error) {
      const firstValidation = Object.values(error.response?.data?.errors || {}).flat()[0]
      list.setError(firstValidation || error.response?.data?.message || 'Unable to save coupon.')
    } finally {
      setBusyId(null)
    }
  }

  const changeStatus = async (coupon) => {
    const status = coupon.status === 'active' ? 'inactive' : 'active'
    setBusyId(coupon.id)
    setSuccess('')
    list.setError('')
    try {
      await adminService.updateCouponStatus(coupon.id, status)
      setSuccess(`Coupon ${status === 'active' ? 'activated' : 'deactivated'}.`)
      list.refresh()
    } catch (error) {
      list.setError(error.response?.data?.message || 'Unable to update coupon status.')
    } finally {
      setBusyId(null)
    }
  }

  const submitSearch = (event) => {
    event.preventDefault()
    list.updateCriteria({ ...list.criteria, search })
  }

  return (
    <AdminPageFrame
      title="Coupons"
      description="Create and maintain discount codes using the marketplace coupon rules."
      searchValue={search}
      onSearchChange={setSearch}
      onSearchSubmit={submitSearch}
      searchPlaceholder="Search coupon code"
      onRefresh={() => list.refresh()}
      onCreate={openCreate}
      createLabel="Add coupon"
      loading={list.loading}
      error={list.error}
      success={success}
      filters={(
        <select aria-label="Filter coupons by status" value={list.criteria.status || ''} onChange={(event) => list.updateCriteria({ ...list.criteria, status: event.target.value })} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm">
          <option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
      )}
    >
      {formOpen && (
        <form onSubmit={save} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-medium text-slate-700">Code
            <input required maxLength={100} pattern="[A-Za-z0-9_-]+" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">Discount type
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="fixed">Fixed amount</option><option value="percentage">Percentage</option></select>
          </label>
          <label className="text-sm font-medium text-slate-700">Value
            <input required type="number" min="0.01" max={form.type === 'percentage' ? 100 : undefined} step="0.01" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">Starts at
            <input type="datetime-local" value={form.starts_at} onChange={(event) => setForm({ ...form, starts_at: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">Expires at
            <input type="datetime-local" min={form.starts_at || undefined} value={form.expires_at} onChange={(event) => setForm({ ...form, expires_at: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">Minimum order
            <input type="number" min="0" step="0.01" value={form.min_order_amount} onChange={(event) => setForm({ ...form, min_order_amount: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">Maximum uses
            <input type="number" min="1" step="1" value={form.max_usage} onChange={(event) => setForm({ ...form, max_usage: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">Status
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="active">Active</option><option value="inactive">Inactive</option></select>
          </label>
          <div className="flex items-end gap-2">
            <AdminButton type="submit" tone="primary" disabled={busyId === 'form'}>{busyId === 'form' ? 'Saving…' : editing ? 'Save changes' : 'Create coupon'}</AdminButton>
            <AdminButton onClick={() => setFormOpen(false)} disabled={busyId === 'form'}>Cancel</AdminButton>
          </div>
        </form>
      )}
      <AdminTable
        rows={list.rows}
        loading={list.loading}
        pagination={list.pagination}
        onPageChange={list.refresh}
        columns={[
          { header: 'Code', render: (row) => <span className="font-semibold text-slate-900">{row.code}</span> },
          { header: 'Discount', render: (row) => row.type === 'percentage' ? `${row.value}%` : formatCurrency(row.value) },
          { header: 'Usage', render: (row) => `${row.used_count}${row.max_usage ? ` / ${row.max_usage}` : ''}` },
          { header: 'Expires', render: (row) => formatDate(row.expires_at) },
          { header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
        ]}
        actions={(coupon) => <><AdminButton onClick={() => openEdit(coupon)} disabled={busyId === coupon.id}>Edit</AdminButton><AdminButton tone={coupon.status === 'active' ? 'danger' : 'success'} onClick={() => changeStatus(coupon)} disabled={busyId === coupon.id}>{busyId === coupon.id ? 'Saving…' : coupon.status === 'active' ? 'Desactivate' : 'Activate'}</AdminButton></>}
      />
    </AdminPageFrame>
  )
}

export default AdminCoupons
