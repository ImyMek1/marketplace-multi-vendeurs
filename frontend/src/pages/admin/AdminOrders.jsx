import { useState } from 'react'
import AdminButton from '../../components/admin/AdminButton'
import AdminDetailDialog from '../../components/admin/AdminDetailDialog'
import AdminPageFrame from '../../components/admin/AdminPageFrame'
import AdminTable from '../../components/admin/AdminTable'
import { DetailRows, StatusBadge } from '../../components/admin/adminFormatters.jsx'
import { formatCurrency, formatDate } from '../../components/admin/adminFormatters.js'
import useAdminList from '../../hooks/useAdminList'
import adminService from '../../services/adminService'

const cancellableStatuses = ['pending', 'confirmed', 'prepared']
const orderStatuses = ['pending', 'confirmed', 'prepared', 'shipped', 'delivered', 'cancelled']

function AdminOrders() {
  const list = useAdminList(adminService.getOrders)
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [success, setSuccess] = useState('')

  const openDetails = async (order) => {
    try {
      const response = await adminService.getOrder(order.id)
      setSelectedOrder(response.data)
    } catch (error) {
      list.setError(error.response?.data?.message || 'Unable to load order details.')
    }
  }

  const changeStatus = async (order, status) => {
    setBusyId(order.id)
    setSuccess('')
    list.setError('')
    try {
      await adminService.updateOrderStatus(order.id, status)
      setSuccess(`Order ${order.order_number} updated to ${status}.`)
      if (selectedOrder?.id === order.id) {
        setSelectedOrder({ ...selectedOrder, status })
      }
      list.refresh()
    } catch (error) {
      list.setError(error.response?.data?.message || 'Unable to update order status.')
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
      title="Orders"
      description="Review customer orders and apply valid lifecycle transitions."
      searchValue={search}
      onSearchChange={setSearch}
      onSearchSubmit={submitSearch}
      searchPlaceholder="Search order number or customer"
      onRefresh={() => list.refresh()}
      loading={list.loading}
      error={list.error}
      success={success}
      filters={(
        <select
          aria-label="Filter by order status"
          value={list.criteria.status || ''}
          onChange={(event) => list.updateCriteria({ ...list.criteria, status: event.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"
        >
          <option value="">All statuses</option>
          {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      )}
    >
      <AdminTable
        rows={list.rows}
        loading={list.loading}
        pagination={list.pagination}
        onPageChange={list.refresh}
        columns={[
          { header: 'Order', render: (row) => <button type="button" onClick={() => openDetails(row)} className="font-semibold text-slate-900 hover:text-blue-700">{row.order_number}</button> },
          { header: 'Customer', render: (row) => row.user?.name || row.recipient_name },
          { header: 'Total', render: (row) => formatCurrency(row.total) },
          { header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
          { header: 'Placed', render: (row) => formatDate(row.created_at) },
        ]}
        actions={(order) => (
          <>
            <AdminButton onClick={() => openDetails(order)}>Details</AdminButton>
            {cancellableStatuses.includes(order.status) && (
              <AdminButton
                tone="danger"
                disabled={busyId === order.id}
                onClick={() => changeStatus(order, 'cancelled')}
              >
                {busyId === order.id ? 'Saving…' : 'Cancel order'}
              </AdminButton>
            )}
          </>
        )}
      />
      {selectedOrder && (
        <AdminDetailDialog title={`Order ${selectedOrder.order_number}`} onClose={() => setSelectedOrder(null)}>
          <DetailRows values={[
            ['Status', selectedOrder.status],
            ['Customer', selectedOrder.user?.name],
            ['Email', selectedOrder.user?.email],
            ['Phone', selectedOrder.phone],
            ['Recipient', selectedOrder.recipient_name],
            ['Address', `${selectedOrder.address_line}, ${selectedOrder.city} ${selectedOrder.postal_code || ''}`],
            ['Subtotal', formatCurrency(selectedOrder.subtotal)],
            ['Delivery fee', formatCurrency(selectedOrder.delivery_fee)],
            ['Discount', formatCurrency(selectedOrder.discount)],
            ['Total', formatCurrency(selectedOrder.total)],
            ['Created', formatDate(selectedOrder.created_at)],
          ]} />
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Items</h3>
            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
              {(selectedOrder.items || []).map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 p-3 text-sm">
                  <span className="text-slate-700">{item.product?.name || 'Product'} × {item.quantity}</span>
                  <span className="font-medium text-slate-900">{formatCurrency(Number(item.unit_price) * Number(item.quantity))}</span>
                </div>
              ))}
            </div>
          </div>
          <section className="border-t border-slate-200 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Seller preparation</h3>
            {(selectedOrder.fulfillments || []).length === 0 ? (
              <p className="text-sm text-slate-500">No seller fulfillment records are available for this order.</p>
            ) : (
              <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                {selectedOrder.fulfillments.map((fulfillment) => (
                  <li key={fulfillment.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="font-medium text-slate-800">{fulfillment.seller?.name || `Seller #${fulfillment.seller_id}`}</span>
                    <StatusBadge value={fulfillment.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
          {cancellableStatuses.includes(selectedOrder.status) && (
            <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              <AdminButton tone="danger" disabled={busyId === selectedOrder.id} onClick={() => changeStatus(selectedOrder, 'cancelled')}>
                Cancel entire order
              </AdminButton>
            </div>
          )}
        </AdminDetailDialog>
      )}
    </AdminPageFrame>
  )
}

export default AdminOrders
