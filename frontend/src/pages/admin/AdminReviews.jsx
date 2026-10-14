import { useState } from 'react'
import AdminButton from '../../components/admin/AdminButton'
import AdminDetailDialog from '../../components/admin/AdminDetailDialog'
import AdminPageFrame from '../../components/admin/AdminPageFrame'
import AdminTable from '../../components/admin/AdminTable'
import { DetailRows, StatusBadge } from '../../components/admin/adminFormatters.jsx'
import { formatDate } from '../../components/admin/adminFormatters.js'
import useAdminList from '../../hooks/useAdminList'
import adminService from '../../services/adminService'

function AdminReviews() {
  const list = useAdminList(adminService.getReviews)
  const [search, setSearch] = useState('')
  const [selectedReview, setSelectedReview] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [success, setSuccess] = useState('')

  const moderate = async (review, action, status) => {
    setBusyId(review.id)
    setSuccess('')
    list.setError('')
    try {
      await action(review.id)
      setSuccess(`Review ${status}.`)
      if (selectedReview?.id === review.id) setSelectedReview({ ...review, status })
      list.refresh()
    } catch (error) {
      list.setError(error.response?.data?.message || 'Unable to moderate review.')
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
      title="Reviews"
      description="Moderate customer feedback before it appears on product pages."
      searchValue={search}
      onSearchChange={setSearch}
      onSearchSubmit={submitSearch}
      searchPlaceholder="Search review, product, or reviewer"
      onRefresh={() => list.refresh()}
      loading={list.loading}
      error={list.error}
      success={success}
      filters={(
        <select aria-label="Filter reviews by status" value={list.criteria.status || ''} onChange={(event) => list.updateCriteria({ ...list.criteria, status: event.target.value })} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm">
          <option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
        </select>
      )}
    >
      <AdminTable
        rows={list.rows}
        loading={list.loading}
        pagination={list.pagination}
        onPageChange={list.refresh}
        columns={[
          { header: 'Product', render: (row) => row.product?.name || '—' },
          { header: 'Reviewer', render: (row) => row.user?.name || '—' },
          { header: 'Rating', render: (row) => <span aria-label={`${row.rating} out of 5`}>{'★'.repeat(row.rating)}<span className="text-slate-300">{'★'.repeat(5 - row.rating)}</span></span> },
          { header: 'Comment', render: (row) => <span className="block max-w-xs truncate">{row.comment || 'No comment'}</span> },
          { header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
        ]}
        actions={(review) => (
          <>
            <AdminButton onClick={() => setSelectedReview(review)}>Details</AdminButton>
            {review.status === 'pending' && <>
              <AdminButton tone="success" disabled={busyId === review.id} onClick={() => moderate(review, adminService.approveReview, 'approved')}>{busyId === review.id ? 'Saving…' : 'Approve'}</AdminButton>
              <AdminButton tone="danger" disabled={busyId === review.id} onClick={() => moderate(review, adminService.rejectReview, 'rejected')}>{busyId === review.id ? 'Saving…' : 'Reject'}</AdminButton>
            </>}
          </>
        )}
      />
      {selectedReview && (
        <AdminDetailDialog title="Review details" onClose={() => setSelectedReview(null)}>
          <DetailRows values={[
            ['Product', selectedReview.product?.name],
            ['Reviewer', selectedReview.user?.name],
            ['Rating', `${selectedReview.rating} / 5`],
            ['Status', selectedReview.status],
            ['Submitted', formatDate(selectedReview.created_at)],
          ]} />
          <div className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">{selectedReview.comment || 'No written comment.'}</div>
        </AdminDetailDialog>
      )}
    </AdminPageFrame>
  )
}

export default AdminReviews
