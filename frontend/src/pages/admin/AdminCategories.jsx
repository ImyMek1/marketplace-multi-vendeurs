import { useState } from 'react'
import AdminButton from '../../components/admin/AdminButton'
import AdminPageFrame from '../../components/admin/AdminPageFrame'
import AdminTable from '../../components/admin/AdminTable'
import { StatusBadge } from '../../components/admin/adminFormatters.jsx'
import useAdminList from '../../hooks/useAdminList'
import adminService from '../../services/adminService'

const emptyForm = { name: '', parent_id: '', status: 'active' }

function AdminCategories() {
  const list = useAdminList(adminService.getCategories)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState('')

  const closeForm = () => {
    setForm(emptyForm)
    setEditing(null)
    setFormOpen(false)
  }

  const save = async (event) => {
    event.preventDefault()
    setBusy(true)
    setSuccess('')
    list.setError('')
    const data = {
      name: form.name.trim(),
      parent_id: form.parent_id ? Number(form.parent_id) : null,
      status: form.status,
    }
    try {
      if (editing) await adminService.updateCategory(editing.id, data)
      else await adminService.createCategory(data)
      setSuccess(editing ? 'Category updated.' : 'Category created.')
      closeForm()
      list.refresh()
    } catch (error) {
      list.setError(error.response?.data?.message || 'Unable to save category.')
    } finally {
      setBusy(false)
    }
  }

  const edit = (category) => {
    setEditing(category)
    setForm({ name: category.name, parent_id: category.parent_id || '', status: category.status })
    setFormOpen(true)
  }

  const remove = async (category) => {
    if (!window.confirm(`Delete category “${category.name}”?`)) return
    setBusy(true)
    setSuccess('')
    list.setError('')
    try {
      await adminService.deleteCategory(category.id)
      setSuccess('Category deleted.')
      list.refresh()
    } catch (error) {
      list.setError(error.response?.data?.message || 'Unable to delete category.')
    } finally {
      setBusy(false)
    }
  }

  const submitSearch = (event) => {
    event.preventDefault()
    list.updateCriteria({ ...list.criteria, search })
  }

  return (
    <AdminPageFrame
      title="Categories"
      description="Organize the marketplace catalogue and category hierarchy."
      searchValue={search}
      onSearchChange={setSearch}
      onSearchSubmit={submitSearch}
      searchPlaceholder="Search category name"
      onRefresh={() => list.refresh()}
      onCreate={() => { setEditing(null); setForm(emptyForm); setFormOpen(true) }}
      createLabel="Add category"
      loading={list.loading}
      error={list.error}
      success={success}
      filters={(
        <select aria-label="Filter categories by status" value={list.criteria.status || ''} onChange={(event) => list.updateCriteria({ ...list.criteria, status: event.target.value })} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm">
          <option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
      )}
    >
      {formOpen && (
        <form onSubmit={save} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1.5fr_1fr_1fr_auto_auto] md:items-end">
          <label className="text-sm font-medium text-slate-700">Name
            <input required maxLength={150} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">Parent category
            <select value={form.parent_id} onChange={(event) => setForm({ ...form, parent_id: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
              <option value="">None</option>
              {list.rows.filter((row) => row.status === 'active' && row.id !== editing?.id).map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">Status
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="active">Active</option><option value="inactive">Inactive</option></select>
          </label>
          <AdminButton type="submit" tone="primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save' : 'Create'}</AdminButton>
          <AdminButton onClick={closeForm} disabled={busy}>Cancel</AdminButton>
        </form>
      )}
      <AdminTable
        rows={list.rows}
        loading={list.loading}
        pagination={list.pagination}
        onPageChange={list.refresh}
        columns={[
          { header: 'Category', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
          { header: 'Parent', render: (row) => row.parent?.name || '—' },
          { header: 'Products', key: 'products_count' },
          { header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
        ]}
        actions={(category) => <><AdminButton onClick={() => edit(category)} disabled={busy}>Edit</AdminButton><AdminButton tone="danger" onClick={() => remove(category)} disabled={busy}>Delete</AdminButton></>}
      />
    </AdminPageFrame>
  )
}

export default AdminCategories
