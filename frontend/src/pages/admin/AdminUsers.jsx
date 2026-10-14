import { useState } from 'react'
import { useAuth } from '../../context/useAuth'
import AdminButton from '../../components/admin/AdminButton'
import AdminDetailDialog from '../../components/admin/AdminDetailDialog'
import AdminPageFrame from '../../components/admin/AdminPageFrame'
import AdminTable from '../../components/admin/AdminTable'
import { DetailRows, StatusBadge } from '../../components/admin/adminFormatters.jsx'
import { formatDate } from '../../components/admin/adminFormatters.js'
import useAdminList from '../../hooks/useAdminList'
import adminService from '../../services/adminService'

function AdminUsers() {
  const { user: currentUser } = useAuth()
  const list = useAdminList(adminService.getUsers)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [success, setSuccess] = useState('')

  const runStatus = async (target, status) => {
    setBusyId(target.id)
    setSuccess('')
    list.setError('')
    try {
      await adminService.updateUserStatus(target.id, status)
      setSuccess(`Account ${status === 'active' ? 'activated' : 'deactivated'}.`)
      list.refresh()
      if (selectedUser?.id === target.id) setSelectedUser({ ...target, status })
    } catch (error) {
      list.setError(error.response?.data?.message || 'Unable to update this account.')
    } finally {
      setBusyId(null)
    }
  }

  const showDetails = async (target) => {
    try {
      const response = await adminService.getUser(target.id)
      setSelectedUser(response.data)
    } catch (error) {
      list.setError(error.response?.data?.message || 'Unable to load account details.')
    }
  }

  const submitSearch = (event) => {
    event.preventDefault()
    list.updateCriteria({ ...list.criteria, search })
  }

  return (
    <AdminPageFrame
      title="Users"
      description="Review marketplace accounts and manage account access."
      searchValue={search}
      onSearchChange={setSearch}
      onSearchSubmit={submitSearch}
      searchPlaceholder="Search name, email, or phone"
      onRefresh={() => list.refresh()}
      loading={list.loading}
      error={list.error}
      success={success}
      filters={(
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            aria-label="Filter by role"
            value={list.criteria.role || ''}
            onChange={(event) => list.updateCriteria({ ...list.criteria, role: event.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"
          >
            <option value="">All roles</option>
            <option value="client">Client</option>
            <option value="seller">Seller</option>
            <option value="driver">Driver</option>
            <option value="admin">Admin</option>
          </select>
          <select
            aria-label="Filter by account status"
            value={list.criteria.status || ''}
            onChange={(event) => list.updateCriteria({ ...list.criteria, status: event.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      )}
    >
      <AdminTable
        rows={list.rows}
        loading={list.loading}
        pagination={list.pagination}
        onPageChange={list.refresh}
        columns={[
          { header: 'User', render: (row) => <button type="button" onClick={() => showDetails(row)} className="text-left font-semibold text-slate-900 hover:text-blue-700">{row.name}</button> },
          { header: 'Email', key: 'email' },
          { header: 'Role', render: (row) => row.role?.name || '—' },
          { header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
          { header: 'Joined', render: (row) => formatDate(row.created_at) },
        ]}
        actions={(row) => (
          <>
            <AdminButton onClick={() => showDetails(row)}>Details</AdminButton>
            {row.role?.name !== 'admin' && row.id !== currentUser?.id && (
              <AdminButton
                tone={row.status === 'active' ? 'danger' : 'success'}
                disabled={busyId === row.id}
                onClick={() => runStatus(row, row.status === 'active' ? 'suspended' : 'active')}
              >
                {busyId === row.id ? 'Saving…' : row.status === 'active' ? 'Deactivate' : 'Activate'}
              </AdminButton>
            )}
          </>
        )}
      />
      {selectedUser && (
        <AdminDetailDialog title="User details" onClose={() => setSelectedUser(null)}>
          <DetailRows values={[
            ['Name', selectedUser.name],
            ['Email', selectedUser.email],
            ['Phone', selectedUser.phone],
            ['Role', selectedUser.role?.name],
            ['Status', selectedUser.status],
            ['Joined', formatDate(selectedUser.created_at)],
          ]} />
        </AdminDetailDialog>
      )}
    </AdminPageFrame>
  )
}

export default AdminUsers
