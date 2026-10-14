import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import driverService from '../../services/driverService'

const statusStyles = {
  assigned: 'bg-indigo-100 text-indigo-700',
  picked_up: 'bg-amber-100 text-amber-700',
  in_transit: 'bg-blue-100 text-blue-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
}

const statusLabels = {
  assigned: 'Assigned',
  picked_up: 'Picked up',
  in_transit: 'In transit',
  delivered: 'Delivered',
  failed: 'Failed',
}

function formatDate(date) {
  if (!date) {
    return '—'
  }

  return new Date(date).toLocaleDateString('fr-MA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function extractDeliveries(page) {
  if (Array.isArray(page?.data)) {
    return page.data
  }

  if (Array.isArray(page)) {
    return page
  }

  return []
}

function DriverDeliveries() {
  const [deliveries, setDeliveries] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDeliveries = async (page = 1) => {
    setLoading(true)
    setError('')

    try {
      const response = await driverService.getDeliveries({
        page,
        per_page: 10,
      })

      setDeliveries(extractDeliveries(response))
      setPagination(response)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to load your deliveries.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDeliveries(1)
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="h-10 w-52 animate-pulse rounded-lg bg-slate-200" />

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Driver deliveries
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Assigned deliveries
        </h1>

        <p className="mt-2 text-slate-500">
          Review your active assignments and open any delivery details.
        </p>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {!loading && deliveries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-slate-500">
          No deliveries have been assigned to you yet.
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery) => {
            const order = delivery.order || {}
            const customer = order.user?.name || order.recipient_name || 'Customer'

            return (
              <article
                key={delivery.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-semibold text-slate-900">
                        {order.order_number || `Order #${delivery.id}`}
                      </p>

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[delivery.status] || 'bg-slate-100 text-slate-700'}`}
                      >
                        {statusLabels[delivery.status] || delivery.status}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <p>
                        <span className="font-medium text-slate-800">Customer:</span>{' '}
                        {customer}
                      </p>

                      <p>
                        <span className="font-medium text-slate-800">Address:</span>{' '}
                        {order.address_line || 'Delivery address pending'}
                      </p>

                      <p>
                        <span className="font-medium text-slate-800">Assigned:</span>{' '}
                        {formatDate(delivery.assigned_at)}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/driver/deliveries/${delivery.id}`}
                    className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Delivery details
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {pagination && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={() => loadDeliveries((pagination.current_page || 1) - 1)}
            disabled={(pagination.current_page || 1) <= 1}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-slate-500">
            Page {pagination.current_page || 1} of {pagination.last_page || 1}
          </span>

          <button
            type="button"
            onClick={() => loadDeliveries((pagination.current_page || 1) + 1)}
            disabled={(pagination.current_page || 1) >= (pagination.last_page || 1)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default DriverDeliveries
