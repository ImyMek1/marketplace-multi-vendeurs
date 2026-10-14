import { useEffect, useState } from 'react'
import sellerService from '../../services/sellerService'

function formatCurrency(value) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

function formatDate(date) {
  if (!date) {
    return ''
  }

  return new Date(date).toLocaleDateString('fr-MA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  prepared: 'Prepared',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

function SellerDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const fetchDashboard = async () => {
      try {
        const response = await sellerService.getDashboard()

        if (!cancelled) {
          setDashboard(response.data)
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              'Unable to load the seller dashboard.',
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

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
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

  const shop = dashboard.shop
  const stats = dashboard.stats || {}
  const recentOrders = dashboard.recent_orders || []
  const bestSellers = dashboard.best_sellers || []

  const statCards = [
    {
      label: 'Revenue',
      value: formatCurrency(stats.revenue),
      description: 'Confirmed and completed sales',
    },
    {
      label: 'Orders',
      value: stats.orders ?? 0,
      description: 'Orders containing your products',
    },
    {
      label: 'Active products',
      value: stats.active_products ?? 0,
      description: 'Currently published',
    },
    {
      label: 'Low stock',
      value: stats.low_stock_products ?? 0,
      description: 'Products requiring attention',
    },
    {
      label: 'Commissions',
      value: formatCurrency(stats.commissions),
      description: 'Total seller commissions',
    },
  ]

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Seller space
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {shop?.name || 'Seller Dashboard'}
          </h1>

          <p className="mt-2 text-slate-500">
            Monitor your shop, products, orders and performance.
          </p>
        </div>

        {shop && (
          <span
            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
              shop.status === 'active'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {shop.status}
          </span>
        )}
      </section>

      {!shop ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            No shop found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Create your shop to start managing products and orders.
          </p>
        </section>
      ) : (
        <>
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            {statCards.map((stat) => (
              <article
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>

                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {stat.value}
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {stat.description}
                </p>
              </article>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Recent orders
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Latest orders containing your products.
                  </p>
                </div>
              </div>

              {recentOrders.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No orders yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="px-6 py-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {order.order_number}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {order.user?.name || 'Customer'}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(order.created_at)}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(order.total)}
                          </p>

                          <span
                            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              order.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-700'
                                : order.status === 'cancelled'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {statusLabels[order.status] ||
                              order.status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {order.items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                          >
                            <span className="text-slate-600">
                              {item.product?.name || 'Product'}
                            </span>

                            <span className="font-medium text-slate-900">
                              ×{item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  Best sellers
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your top-performing products.
                </p>
              </div>

              {bestSellers.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No sales data yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {bestSellers.map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 px-6 py-5"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">
                          {product.name}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {product.total_quantity} units sold
                        </p>
                      </div>

                      <p className="font-semibold text-slate-900">
                        {formatCurrency(product.total_revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Shop information
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Shop name
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  {shop.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Status
                </p>

                <p className="mt-1 text-sm font-medium capitalize text-slate-900">
                  {shop.status}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Description
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {shop.description || 'No shop description.'}
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default SellerDashboard