import { useEffect, useState } from 'react'
import AdminButton from '../../components/admin/AdminButton'
import AdminDetailDialog from '../../components/admin/AdminDetailDialog'
import AdminPageFrame from '../../components/admin/AdminPageFrame'
import AdminTable from '../../components/admin/AdminTable'
import { DetailRows, StatusBadge } from '../../components/admin/adminFormatters.jsx'
import { formatCurrency, formatDate, getPageRows } from '../../components/admin/adminFormatters.js'
import useAdminList from '../../hooks/useAdminList'
import adminService from '../../services/adminService'

function AdminDeliveries() {
  const list = useAdminList(adminService.getDeliveries)
  const [search, setSearch] = useState('')
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [history, setHistory] = useState([])
  const [drivers, setDrivers] = useState([])
  const [readyOrders, setReadyOrders] = useState([])
  const [readyPagination, setReadyPagination] = useState(null)
  const [readyPage, setReadyPage] = useState(1)
  const [driverSelections, setDriverSelections] = useState({})
  const [driverId, setDriverId] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [success, setSuccess] = useState('')
  const [assignmentError, setAssignmentError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadAssignmentChoices = async () => {
      try {
        const [ordersResponse, usersResponse] = await Promise.all([
          adminService.getOrders({ status: 'prepared', page: 1, per_page: 10 }),
          adminService.getUsers({ role: 'driver', status: 'active', per_page: 50 }),
        ])
        if (!cancelled) {
          setReadyOrders(getPageRows(ordersResponse))
          setReadyPagination(ordersResponse)
          setDrivers(usersResponse.data || [])
        }
      } catch (error) {
        if (!cancelled) setAssignmentError(error.response?.data?.message || 'Unable to load assignment choices.')
      }
    }

    loadAssignmentChoices()
    return () => { cancelled = true }
  }, [])

  const loadReadyOrders = async (page = readyPage) => {
    try {
      const response = await adminService.getOrders({ status: 'prepared', page, per_page: 10 })
      setReadyOrders(getPageRows(response))
      setReadyPagination(response)
      setReadyPage(page)
    } catch (error) {
      list.setError(error.response?.data?.message || 'Unable to refresh assignment choices.')
    }
  }

  const openDetails = async (delivery) => {
    try {
      const [detailResponse, historyResponse, usersResponse] = await Promise.all([
        adminService.getDelivery(delivery.id),
        adminService.getDeliveryHistory(delivery.id),
        adminService.getUsers({ role: 'driver', status: 'active', per_page: 50 }),
      ])
      setSelectedDelivery(detailResponse.data)
      setHistory(historyResponse.data || [])
      setDrivers(usersResponse.data || [])
      setDriverId(String(delivery.driver_id || ''))
    } catch (error) {
      list.setError(error.response?.data?.message || 'Unable to load delivery details.')
    }
  }

  const assign = async () => {
    if (!selectedDelivery || !driverId) return
    setBusyId(selectedDelivery.id)
    setSuccess('')
    list.setError('')
    try {
      const response = await adminService.assignDriver(selectedDelivery.order_id, Number(driverId))
      setSelectedDelivery(response.data)
      setSuccess(`Driver assigned to order ${selectedDelivery.order?.order_number}.`)
      list.refresh()
      const historyResponse = await adminService.getDeliveryHistory(selectedDelivery.id)
      setHistory(historyResponse.data || [])
    } catch (error) {
      list.setError(error.response?.data?.message || 'Unable to assign this driver.')
    } finally {
      setBusyId(null)
    }
  }

  const assignPreparedOrder = async (order) => {
    const selectedDriver = driverSelections[order.id]
    if (!selectedDriver) return
    setBusyId(order.id)
    setSuccess('')
    list.setError('')
    try {
      await adminService.assignDriver(order.id, Number(selectedDriver))
      setSuccess(`Driver assigned to order ${order.order_number}.`)
      setDriverSelections((current) => ({ ...current, [order.id]: '' }))
      await Promise.all([loadReadyOrders(readyPage), Promise.resolve(list.refresh())])
    } catch (error) {
      list.setError(error.response?.data?.message || 'Unable to assign this driver.')
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
      title="Deliveries"
      description="Inspect delivery progress, assignment, and status history."
      searchValue={search}
      onSearchChange={setSearch}
      onSearchSubmit={submitSearch}
      searchPlaceholder="Search order, customer, or driver"
      onRefresh={() => list.refresh()}
      loading={list.loading}
      error={list.error || assignmentError}
      success={success}
      filters={(
        <select
          aria-label="Filter by delivery status"
          value={list.criteria.status || ''}
          onChange={(event) => list.updateCriteria({ ...list.criteria, status: event.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"
        >
          <option value="">All statuses</option>
          {['assigned', 'picked_up', 'in_transit', 'delivered', 'failed'].map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
        </select>
      )}
    >
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Prepared orders awaiting a driver</h2>
        </div>
        {readyOrders.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">No prepared orders are awaiting assignment.</p>
        ) : (
          <div className="divide-y divide-slate-200">
            {readyOrders.map((order) => (
              <div key={order.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{order.order_number}</p>
                  <p className="mt-1 text-sm text-slate-500">{order.user?.name || order.recipient_name} · {formatCurrency(order.total)}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    aria-label={`Driver for order ${order.order_number}`}
                    value={driverSelections[order.id] || ''}
                    onChange={(event) => setDriverSelections((current) => ({ ...current, [order.id]: event.target.value }))}
                    className="min-w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Choose active driver</option>
                    {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name} · {driver.email}</option>)}
                  </select>
                  <AdminButton tone="primary" disabled={!driverSelections[order.id] || busyId === order.id} onClick={() => assignPreparedOrder(order)}>
                    {busyId === order.id ? 'Assigning…' : 'Assign'}
                  </AdminButton>
                </div>
              </div>
            ))}
          </div>
        )}
        {(readyPagination?.last_page || 1) > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
            <span className="text-sm text-slate-500">Page {readyPage} of {readyPagination.last_page}</span>
            <div className="flex gap-2">
              <AdminButton disabled={readyPage <= 1} onClick={() => loadReadyOrders(readyPage - 1)}>Previous</AdminButton>
              <AdminButton disabled={readyPage >= readyPagination.last_page} onClick={() => loadReadyOrders(readyPage + 1)}>Next</AdminButton>
            </div>
          </div>
        )}
      </section>
      <AdminTable
        rows={list.rows}
        loading={list.loading}
        pagination={list.pagination}
        onPageChange={list.refresh}
        columns={[
          { header: 'Order', render: (row) => row.order?.order_number || `#${row.order_id}` },
          { header: 'Driver', render: (row) => row.driver?.name || 'Unassigned' },
          { header: 'Order total', render: (row) => formatCurrency(row.order?.total) },
          { header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
          { header: 'Assigned', render: (row) => formatDate(row.assigned_at) },
        ]}
        actions={(delivery) => <AdminButton onClick={() => openDetails(delivery)}>Details / assign</AdminButton>}
      />
      {selectedDelivery && (
        <AdminDetailDialog title={`Delivery for ${selectedDelivery.order?.order_number || `#${selectedDelivery.order_id}`}`} onClose={() => setSelectedDelivery(null)}>
          <DetailRows values={[
            ['Delivery status', selectedDelivery.status],
            ['Order status', selectedDelivery.order?.status],
            ['Driver', selectedDelivery.driver?.name],
            ['Driver email', selectedDelivery.driver?.email],
            ['Assigned', formatDate(selectedDelivery.assigned_at)],
            ['Picked up', formatDate(selectedDelivery.picked_up_at)],
            ['In transit', formatDate(selectedDelivery.in_transit_at)],
            ['Delivered', formatDate(selectedDelivery.delivered_at)],
            ['Failure reason', selectedDelivery.failure_reason],
          ]} />
          {selectedDelivery.order?.status === 'prepared' && selectedDelivery.status === 'assigned' && (
            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row">
              <select
                aria-label="Select active driver"
                value={driverId}
                onChange={(event) => setDriverId(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="">Choose active driver</option>
                {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name} · {driver.email}</option>)}
              </select>
              <AdminButton tone="primary" disabled={!driverId || busyId === selectedDelivery.id} onClick={assign}>
                {busyId === selectedDelivery.id ? 'Assigning…' : 'Assign driver'}
              </AdminButton>
            </div>
          )}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Status history</h3>
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">No status history.</p>
            ) : (
              <ol className="space-y-3">
                {history.map((entry) => (
                  <li key={`${entry.delivery_id}-${entry.created_at}-${entry.status}`} className="flex gap-3 text-sm">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-medium capitalize text-slate-900">{entry.status.replaceAll('_', ' ')}</p>
                      <p className="text-slate-500">{entry.changed_by?.name || 'System'} · {formatDate(entry.created_at)}</p>
                      {entry.note && <p className="mt-1 text-slate-600">{entry.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </AdminDetailDialog>
      )}
    </AdminPageFrame>
  )
}

export default AdminDeliveries
