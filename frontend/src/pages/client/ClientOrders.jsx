import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import orderService from '../../services/orderService'

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  prepared: 'bg-indigo-50 text-indigo-700',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
}

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  prepared: 'Prepared',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

function formatDate(date) {
  if (!date) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(new Date(date))
}

function formatPrice(value) {
  return `${Number(value ?? 0).toFixed(2)} MAD`
}

function getOrdersFromResponse(response) {
  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response?.data)) {
    return response.data
  }

  return []
}

function ClientOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await orderService.getOrders()
        setOrders(getOrdersFromResponse(response))
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            'Unable to load your orders. Please try again.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <section>
          <p className="text-sm font-medium text-blue-600">
            Client Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            My Orders
          </h1>

          <p className="mt-2 text-slate-500">
            View and track your orders.
          </p>
        </section>

        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            Loading your orders...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <section>
          <p className="text-sm font-medium text-blue-600">
            Client Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            My Orders
          </h1>

          <p className="mt-2 text-slate-500">
            View and track your orders.
          </p>
        </section>

        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
        >
          {error}
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-8">
        <section>
          <p className="text-sm font-medium text-blue-600">
            Client Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            My Orders
          </h1>

          <p className="mt-2 text-slate-500">
            View and track your orders.
          </p>
        </section>

        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            No orders yet
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Your orders will appear here after you make a purchase.
          </p>

          <Link
            to="/"
            className="mt-6 inline-block rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-blue-600">
          Client Dashboard
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          My Orders
        </h1>

        <p className="mt-2 text-slate-500">
          View and track all your orders.
        </p>
      </section>

      <section className="space-y-4">
        {orders.map((order) => {
          const status = order.status ?? 'pending'

          return (
            <article
              key={order.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-semibold text-slate-900">
                      {order.order_number || `Order #${order.id}`}
                    </h2>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        statusStyles[status] ||
                        'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {statusLabels[status] || status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Placed on {formatDate(order.created_at)}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs text-slate-500">
                      Total
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {formatPrice(order.total)}
                    </p>
                  </div>

                  <Link
                    to={`/client/orders/${order.id}`}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}

export default ClientOrders