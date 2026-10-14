import { useState } from 'react'
import AdminButton from '../../components/admin/AdminButton'
import AdminDetailDialog from '../../components/admin/AdminDetailDialog'
import AdminPageFrame from '../../components/admin/AdminPageFrame'
import AdminTable from '../../components/admin/AdminTable'
import { DetailRows, StatusBadge } from '../../components/admin/adminFormatters.jsx'
import { formatCurrency } from '../../components/admin/adminFormatters.js'
import useAdminList from '../../hooks/useAdminList'
import adminService from '../../services/adminService'

function imageUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path

  const baseUrl = (import.meta.env.VITE_API_URL || '')
    .replace(/\/api\/v1\/?$/, '')
    .replace(/\/$/, '')

  return `${baseUrl}/storage/${path.replace(/^\/+/, '')}`
}

function AdminProducts() {
  const list = useAdminList(adminService.getProducts)
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [success, setSuccess] = useState('')

  const mutate = async (product, action, label) => {
    setBusyId(product.id)
    setSuccess('')
    list.setError('')
    try {
      await action(product.id)
      setSuccess(`${product.name}: ${label}.`)
      list.refresh()
      setSelectedProduct(null)
    } catch (error) {
      list.setError(error.response?.data?.message || 'Unable to update this product.')
    } finally {
      setBusyId(null)
    }
  }

  const openDetails = async (product) => {
    try {
      const response = await adminService.getProduct(product.id)
      setSelectedProduct(response.data)
    } catch (error) {
      list.setError(error.response?.data?.message || 'Unable to load product details.')
    }
  }

  const submitSearch = (event) => {
    event.preventDefault()
    list.updateCriteria({ ...list.criteria, search })
  }

  return (
    <AdminPageFrame
      title="Products"
      description="Review product submissions and manage published listings."
      searchValue={search}
      onSearchChange={setSearch}
      onSearchSubmit={submitSearch}
      searchPlaceholder="Search product or brand"
      onRefresh={() => list.refresh()}
      loading={list.loading}
      error={list.error}
      success={success}
      filters={(
        <select
          aria-label="Filter by product status"
          value={list.criteria.status || ''}
          onChange={(event) => list.updateCriteria({ ...list.criteria, status: event.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"
        >
          <option value="">All statuses</option>
          {['draft', 'pending', 'approved', 'published', 'rejected'].map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      )}
    >
      <AdminTable
        rows={list.rows}
        loading={list.loading}
        pagination={list.pagination}
        onPageChange={list.refresh}
        columns={[
          { header: 'Product', render: (row) => <button type="button" onClick={() => openDetails(row)} className="font-semibold text-slate-900 hover:text-blue-700">{row.name}</button> },
          { header: 'Shop', render: (row) => row.shop?.name || '—' },
          { header: 'Category', render: (row) => row.category?.name || '—' },
          { header: 'Price', render: (row) => formatCurrency(row.price) },
          { header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
        ]}
        actions={(product) => (
          <>
            <AdminButton onClick={() => openDetails(product)}>Details</AdminButton>
            {['pending', 'draft'].includes(product.status) && (
              <AdminButton tone="success" disabled={busyId === product.id} onClick={() => mutate(product, adminService.approveProduct, 'approved')}>
                {busyId === product.id ? 'Saving…' : 'Approve'}
              </AdminButton>
            )}
            {['pending', 'approved'].includes(product.status) && (
              <AdminButton tone="danger" disabled={busyId === product.id} onClick={() => mutate(product, adminService.rejectProduct, 'rejected')}>
                {busyId === product.id ? 'Saving…' : 'Reject'}
              </AdminButton>
            )}
            {product.status !== 'draft' && (
              <AdminButton tone="danger" disabled={busyId === product.id} onClick={() => mutate(product, adminService.disableProduct, 'disabled')}>
                {busyId === product.id ? 'Saving…' : 'Disable'}
              </AdminButton>
            )}
          </>
        )}
      />
      {selectedProduct && (
        <AdminDetailDialog title={selectedProduct.name} onClose={() => setSelectedProduct(null)}>
          <DetailRows values={[
            ['Status', selectedProduct.status],
            ['Shop', selectedProduct.shop?.name],
            ['Category', selectedProduct.category?.name],
            ['Brand', selectedProduct.brand],
            ['Price', formatCurrency(selectedProduct.price)],
            ['Promotional price', selectedProduct.promotional_price ? formatCurrency(selectedProduct.promotional_price) : '—'],
            ['Stock', selectedProduct.stock],
            ['Description', selectedProduct.description],
          ]} />
          {selectedProduct.images?.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Images</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {selectedProduct.images.map((image) => (
                  <img key={image.id} src={imageUrl(image.path)} alt={selectedProduct.name} className="aspect-square w-full rounded-lg border border-slate-200 object-cover" />
                ))}
              </div>
            </div>
          )}
        </AdminDetailDialog>
      )}
    </AdminPageFrame>
  )
}

export default AdminProducts
