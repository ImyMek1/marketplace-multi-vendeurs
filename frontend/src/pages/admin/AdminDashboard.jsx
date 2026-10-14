import { useEffect, useMemo, useState } from 'react'
import adminService from '../../services/adminService'

function formatCurrency(value) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const fetchDashboard = async () => {
      try {
        const response = await adminService.getDashboard()

        if (!cancelled) {
          setDashboard(response?.data ?? response ?? {})
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              'Unable to load the admin dashboard.',
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

  const stats = useMemo(() => {
    const values = dashboard?.stats || {}

    return [
      { label: 'Total users', value: values.total_users ?? 0, detail: 'All platform accounts' },
      { label: 'Sellers', value: values.sellers ?? 0, detail: 'Active vendor accounts' },
      { label: 'Drivers', value: values.drivers ?? 0, detail: 'Delivery partners' },
      { label: 'Pending shops', value: values.pending_shops ?? 0, detail: 'Need approval' },
      { label: 'Pending products', value: values.pending_products ?? 0, detail: 'Awaiting review' },
      { label: 'Total orders', value: values.total_orders ?? 0, detail: 'Processed orders' },
      { label: 'Revenue', value: formatCurrency(values.total_revenue ?? 0), detail: 'Gross platform revenue' },
    ]
  }, [dashboard])

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

  const recentOrders = dashboard.recent_orders || []
  const pendingProducts = dashboard.pending_products || []

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Operations overview
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Admin dashboard
        </h1>

        <p className="mt-2 text-slate-500">
          Monitor marketplace growth, moderation queues, and recent order activity.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{stat.value}</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">{stat.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">Recent orders</h2>
          </div>

          <div className="divide-y divide-slate-200">
            {recentOrders.length === 0 ? (
              <div className="px-6 py-8 text-sm text-slate-500">
                No recent orders available.
              </div>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div>
                    <p className="font-medium text-slate-900">{order.order_number}</p>
                    <p className="text-sm text-slate-500">
                      {order.user?.name || 'Customer'} · {order.status}
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-slate-700">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">Pending products</h2>
          </div>

          <div className="divide-y divide-slate-200">
            {pendingProducts.length === 0 ? (
              <div className="px-6 py-8 text-sm text-slate-500">
                There are no products waiting for review.
              </div>
            ) : (
              pendingProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div>
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="text-sm text-slate-500">
                      {product.shop?.name || 'Shop'} · {product.status}
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-amber-600">
                    {formatCurrency(product.price)}
                  </span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  )
}

export default AdminDashboard
