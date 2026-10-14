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

function extractDeliveries(response) {
  if (Array.isArray(response?.data)) {
    return response.data
  }

  if (Array.isArray(response)) {
    return response
  }

  return []
}

function DriverHistory() {
  const [deliveries, setDeliveries] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const fetchHistory = async () => {
      try {
        const response = await driverService.getDeliveries({
          page: 1,
          per_page: 20,
        })

        if (!cancelled) {
          setDeliveries(extractDeliveries(response))
          setPagination(response)
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              'Unable to load delivery history.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchHistory()

    return () => {
      cancelled = true
    }
  }, [])

  const completed = deliveries.filter((delivery) => delivery.status === 'delivered')
  const failed = deliveries.filter((delivery) => delivery.status === 'failed')

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-200" />

        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-2xl bg-slate-200"
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
          Delivery history
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Completed and failed deliveries
        </h1>

        <p className="mt-2 text-slate-500">
          Keep track of items successfully delivered or requiring follow-up.
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

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Completed</h2>

          {completed.length === 0 ? (
            <div className="mt-5 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No completed deliveries in the history.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {completed.map((delivery) => (
                <Link
                  key={delivery.id}
                  to={`/driver/deliveries/${delivery.id}`}
                  className="block rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {delivery.order?.order_number || `#${delivery.id}`}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {delivery.order?.recipient_name || 'Customer'} · {formatDate(delivery.delivered_at)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles.delivered}`}
                    >
                      {statusLabels.delivered}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Failed</h2>

          {failed.length === 0 ? (
            <div className="mt-5 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No failed deliveries in the history.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {failed.map((delivery) => (
                <Link
                  key={delivery.id}
                  to={`/driver/deliveries/${delivery.id}`}
                  className="block rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {delivery.order?.order_number || `#${delivery.id}`}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {delivery.order?.recipient_name || 'Customer'} · {formatDate(delivery.failed_at)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles.failed}`}
                    >
                      {statusLabels.failed}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </article>
      </section>

      {pagination && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={() => null}
            disabled
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-slate-500">
            Page {pagination.current_page || 1}
          </span>

          <button
            type="button"
            onClick={() => null}
            disabled
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default DriverHistory
