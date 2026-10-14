import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import orderService from '../../services/orderService'

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  prepared: 'Prepared',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  prepared: 'bg-indigo-50 text-indigo-700',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
}

const trackingSteps = [
  'pending',
  'confirmed',
  'prepared',
  'shipped',
  'delivered',
]

function formatDate(date) {
  if (!date) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

function formatPrice(value) {
  return `${Number(value ?? 0).toFixed(2)} MAD`
}

function getOrderFromResponse(response) {
  if (response?.data?.data) {
    return response.data.data
  }

  if (response?.data) {
    return response.data
  }

  return response
}

function ClientOrderDetails() {
  const { id } = useParams()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await orderService.getOrder(id)
        setOrder(getOrderFromResponse(response))
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            'Unable to load this order. Please try again.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Link
            to="/client/orders"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Back to orders
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            Order Details
          </h1>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            Loading order details...
          </p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="space-y-8">
        <div>
          <Link
            to="/client/orders"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Back to orders
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            Order Details
          </h1>
        </div>

        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
        >
          {error || 'Order not found.'}
        </div>
      </div>
    )
  }

  const currentStatus = order.status || 'pending'
  const currentStepIndex = trackingSteps.indexOf(currentStatus)
  const isCancelled = currentStatus === 'cancelled'

  const items = Array.isArray(order.items) ? order.items : []

  return (
    <div className="space-y-8">
      <section>
        <Link
          to="/client/orders"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to orders
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">
              Order
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {order.order_number || `#${order.id}`}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>

          <span
            className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${
              statusStyles[currentStatus] ||
              'bg-slate-100 text-slate-700'
            }`}
          >
            {statusLabels[currentStatus] || currentStatus}
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Order Tracking
        </h2>

        {isCancelled ? (
          <div className="mt-5 rounded-xl bg-red-50 p-5">
            <p className="font-semibold text-red-700">
              This order has been cancelled.
            </p>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto">
            <div className="flex min-w-[650px] items-start">
              {trackingSteps.map((step, index) => {
                const completed =
                  currentStepIndex >= index

                const active =
                  currentStatus === step

                return (
                  <div
                    key={step}
                    className="relative flex flex-1 flex-col items-center"
                  >
                    {index < trackingSteps.length - 1 && (
                      <div
                        className={`absolute left-1/2 top-4 h-0.5 w-full ${
                          currentStepIndex > index
                            ? 'bg-slate-900'
                            : 'bg-slate-200'
                        }`}
                      />
                    )}

                    <div
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${
                        completed
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 bg-white text-slate-400'
                      }`}
                    >
                      {completed ? '✓' : index + 1}
                    </div>

                    <p
                      className={`mt-3 text-sm ${
                        active
                          ? 'font-semibold text-slate-900'
                          : 'text-slate-500'
                      }`}
                    >
                      {statusLabels[step]}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Order Items
          </h2>
        </div>

        <div className="divide-y divide-slate-200">
          {items.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No items available for this order.
            </div>
          ) : (
            items.map((item) => {
              const product = item.product
              const quantity = Number(item.quantity ?? 0)
              const unitPrice = Number(
                item.unit_price ?? item.price ?? 0,
              )

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {product?.name || `Product #${item.product_id}`}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Quantity: {quantity}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-sm text-slate-500">
                      {formatPrice(unitPrice)} × {quantity}
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {formatPrice(unitPrice * quantity)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Delivery Address
          </h2>

          <div className="mt-5 space-y-1 text-sm text-slate-600">
            <p className="font-medium text-slate-900">
              {order.recipient_name || order.address?.recipient_name}
            </p>

            <p>
              {order.address_line || order.address?.address_line}
            </p>

            <p>
              {order.city || order.address?.city}
            </p>

            {(order.phone || order.address?.phone) && (
              <p>
                {order.phone || order.address?.phone}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Order Summary
          </h2>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">
                Subtotal
              </span>

              <span className="font-medium text-slate-900">
                {formatPrice(order.subtotal)}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-slate-500">
                Delivery
              </span>

              <span className="font-medium text-slate-900">
                {formatPrice(order.delivery_fee)}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-slate-500">
                Discount
              </span>

              <span className="font-medium text-emerald-600">
                -{formatPrice(order.discount)}
              </span>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <div className="flex justify-between gap-4">
                <span className="font-semibold text-slate-900">
                  Total
                </span>

                <span className="text-xl font-bold text-slate-900">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ClientOrderDetails