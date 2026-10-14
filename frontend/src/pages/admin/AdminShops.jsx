import { useState } from 'react'
import AdminButton from '../../components/admin/AdminButton'
import AdminDetailDialog from '../../components/admin/AdminDetailDialog'
import AdminPageFrame from '../../components/admin/AdminPageFrame'
import AdminTable from '../../components/admin/AdminTable'
import { DetailRows, StatusBadge } from '../../components/admin/adminFormatters.jsx'
import useAdminList from '../../hooks/useAdminList'
import adminService from '../../services/adminService'

function AdminShops() {
  const list = useAdminList(adminService.getShops)
  const [search, setSearch] = useState('')
  const [selectedShop, setSelectedShop] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [success, setSuccess] = useState('')

  const mutate = async (shop, action, label) => {
    setBusyId(shop.id)
    setSuccess('')
    list.setError('')
    try {
      await action(shop.id)
      setSuccess(`${shop.name}: ${label}.`)
      list.refresh()
      if (selectedShop?.id === shop.id) setSelectedShop({ ...shop, status: label === 'approved' || label === 'activated' ? 'active' : 'suspended' })
    } catch (error) {
      list.setError(error.response?.data?.message || 'Unable to update this shop.')
    } finally {
      setBusyId(null)
    }
  }

  const openDetails = async (shop) => {
    try {
      const response = await adminService.getShop(shop.id)
      setSelectedShop(response.data)
    } catch (error) {
      list.setError(error.response?.data?.message || 'Unable to load shop details.')
    }
  }

  const submitSearch = (event) => {
    event.preventDefault()
    list.updateCriteria({ ...list.criteria, search })
  }

  return (
    <AdminPageFrame
      title="Shops"
      description="Approve vendor shops and manage their operational status."
      searchValue={search}
      onSearchChange={setSearch}
      onSearchSubmit={submitSearch}
      searchPlaceholder="Search shops or sellers"
      onRefresh={() => list.refresh()}
      loading={list.loading}
      error={list.error}
      success={success}
      filters={(
        <select
          aria-label="Filter by shop status"
          value={list.criteria.status || ''}
          onChange={(event) => list.updateCriteria({ ...list.criteria, status: event.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      )}
    >
      <AdminTable
        rows={list.rows}
        loading={list.loading}
        pagination={list.pagination}
        onPageChange={list.refresh}
        columns={[
          { header: 'Shop', render: (row) => <button type="button" onClick={() => openDetails(row)} className="font-semibold text-slate-900 hover:text-blue-700">{row.name}</button> },
          { header: 'Seller', render: (row) => row.seller?.name || '—' },
          { header: 'Products', key: 'products_count' },
          { header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
        ]}
        actions={(shop) => (
          <>
            <AdminButton onClick={() => openDetails(shop)}>Details</AdminButton>
            {shop.status === 'pending' && (
              <AdminButton tone="success" disabled={busyId === shop.id} onClick={() => mutate(shop, adminService.approveShop, 'approved')}>
                {busyId === shop.id ? 'Saving…' : 'Approve'}
              </AdminButton>
            )}
            {shop.status === 'active' && (
              <AdminButton tone="danger" disabled={busyId === shop.id} onClick={() => mutate(shop, adminService.suspendShop, 'suspended')}>
                {busyId === shop.id ? 'Saving…' : 'Suspend'}
              </AdminButton>
            )}
            {shop.status === 'suspended' && (
              <AdminButton tone="success" disabled={busyId === shop.id} onClick={() => mutate(shop, adminService.activateShop, 'activated')}>
                {busyId === shop.id ? 'Saving…' : 'Reactivate'}
              </AdminButton>
            )}
          </>
        )}
      />
      {selectedShop && (
        <AdminDetailDialog title={selectedShop.name} onClose={() => setSelectedShop(null)}>
          <DetailRows values={[
            ['Status', selectedShop.status],
            ['Seller', selectedShop.seller?.name],
            ['Seller email', selectedShop.seller?.email],
            ['Seller phone', selectedShop.seller?.phone],
            ['Product count', selectedShop.products_count],
            ['Description', selectedShop.description],
          ]} />
        </AdminDetailDialog>
      )}
    </AdminPageFrame>
  )
}

export default AdminShops
