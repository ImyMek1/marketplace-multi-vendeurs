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

function DriverDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const fetchDashboard = async () => {
      try {
        const response = await driverService.getDashboard()

        if (!cancelled) {
          setDashboard(response?.data ?? response ?? {})
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              'Unable to load the driver dashboard.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200" />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <div
          role="alert"
          className="rounded-2xl bg-red-50 px-6 py-5 text-sm text-red-700"
        >
          {error}
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return null
  }

  const stats = dashboard.stats || {}
  const activeDeliveries = dashboard.active_deliveries || []
  const recentDeliveries = dashboard.recent_deliveries || []

  const statCards = [
    {
      label: 'Assigned',
      value: stats.assigned ?? 0,
      detail: 'Newly assigned deliveries',
    },
    {
      label: 'In progress',
      value: stats.in_progress ?? 0,
      detail: 'Picked up or in transit',
    },
    {
      label: 'Completed',
      value: stats.completed ?? 0,
      detail: 'Delivered successfully',
    },
    {
      label: 'Failed',
      value: stats.failed ?? 0,
      detail: 'Delivery issues requiring attention',
    },
  ]

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Driver space
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-500">
          Track your active deliveries and the latest assigned assignments.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">
              {stat.label}
            </p>

            <p className="mt-3 text-3xl font-bold text-slate-900">
              {stat.value}
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              {stat.detail}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Active deliveries
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Quick access to your current assignments.
              </p>
            </div>
          </div>

          <div className="p-4">
            {activeDeliveries.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No active deliveries right now.
              </div>
            ) : (
              <div className="space-y-3">
                {activeDeliveries.map((delivery) => (
                  <Link
                    key={delivery.id}
                    to={`/driver/deliveries/${delivery.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {delivery.order?.order_number || `#${delivery.id}`}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {delivery.order?.recipient_name || 'Customer'}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[delivery.status] || 'bg-slate-100 text-slate-700'}`}
                    >
                      {statusLabels[delivery.status] || delivery.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Recent assignments
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                The newest orders assigned to you.
              </p>
            </div>
          </div>

          <div className="p-4">
            {recentDeliveries.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No recent deliveries assigned.
              </div>
            ) : (
              <div className="space-y-3">
                {recentDeliveries.map((delivery) => (
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
                          {delivery.order?.recipient_name || 'Customer'} · {formatDate(delivery.assigned_at)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[delivery.status] || 'bg-slate-100 text-slate-700'}`}
                      >
                        {statusLabels[delivery.status] || delivery.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  )
}

export default DriverDashboard
