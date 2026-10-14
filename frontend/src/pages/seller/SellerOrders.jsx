import { useEffect, useState } from 'react'
import sellerService from '../../services/sellerService'

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  prepared: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  prepared: 'Prepared',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

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

function getOrdersFromResponse(response) {
  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response?.data)) {
    return response.data
  }

  return []
}

function getImageUrl(path) {
  if (!path) {
    return ''
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const baseUrl = (import.meta.env.VITE_API_URL || '')
    .replace(/\/api\/v1\/?$/, '')
    .replace(/\/$/, '')

  return `${baseUrl}/storage/${path.replace(/^\/+/, '')}`
}

function SellerOrders() {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingOrderId, setUpdatingOrderId] = useState(null)

  useEffect(() => {
    let cancelled = false

    const fetchOrders = async () => {
      try {
        const response = await sellerService.getOrders({
          page: 1,
          per_page: 10,
        })

        if (!cancelled) {
          setOrders(getOrdersFromResponse(response))
          setPagination(response)
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              'Unable to load your orders.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchOrders()

    return () => {
      cancelled = true
    }
  }, [])

  const loadOrders = async (page = 1) => {
    setLoading(true)
    setError('')

    try {
      const response = await sellerService.getOrders({
        page,
        per_page: 10,
      })

      setOrders(getOrdersFromResponse(response))
      setPagination(response)

      return true
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to load your orders.',
      )

      return false
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId, status) => {
    if (updatingOrderId !== null) {
      return
    }

    setUpdatingOrderId(orderId)
    setError('')

    try {
      await sellerService.updateOrderStatus(
        orderId,
        status,
      )

      await loadOrders(pagination?.current_page || 1)
    } catch (requestError) {
      const response = requestError.response

      if (response?.status === 422) {
        const validationErrors = response.data.errors || {}
        const firstError = Object.values(validationErrors)
          .flat()
          .at(0)

        setError(
          firstError ||
            response.data.message ||
            'This order status change is not allowed.',
        )
      } else if (response?.status === 403) {
        setError(
          'You are not authorized to update this order.',
        )
      } else {
        setError(
          response?.data?.message ||
            'Unable to update the order status.',
        )
      }
    } finally {
      setUpdatingOrderId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Seller space
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Orders
        </h1>

        <p className="mt-2 text-slate-500">
          View and manage orders containing your products.
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

      {loading ? (
        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            No orders
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            No orders containing your products have been placed yet.
          </p>
        </section>
      ) : (
        <>
          <section className="space-y-5">
            {orders.map((order) => {
              const fulfillment = order.seller_fulfillments?.[0]
              const sellerStatus = fulfillment?.status
              const canUpdate = ['pending', 'confirmed'].includes(order.status)
                && ['pending', 'confirmed'].includes(sellerStatus)
              const nextStatus = sellerStatus === 'pending' ? 'confirmed' : 'prepared'

              return (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-200 px-6 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-semibold text-slate-900">
                          {order.order_number ||
                            `Order #${order.id}`}
                        </h2>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            statusStyles[order.status] ||
                            'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {statusLabels[order.status] ||
                            order.status}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[sellerStatus] || 'bg-slate-100 text-slate-700'}`}>
                          Your status: {statusLabels[sellerStatus] || sellerStatus || 'Unavailable'}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        {order.user?.name || 'Customer'}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {order.user?.email}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(order.created_at)}
                      </p>
                    </div>

                    <div className="text-left lg:text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Your items subtotal
                      </p>

                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {formatCurrency(order.items?.reduce((sum, item) => sum + Number(item.subtotal ?? Number(item.unit_price) * Number(item.quantity)), 0) ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-5">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Your products in this order
                  </h3>

                  <div className="mt-4 space-y-3">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-4">
                          {item.product?.images?.[0] ? (
                            <img
                              src={getImageUrl(
                                item.product.images[0].path,
                              )}
                              alt={item.product.name}
                              className="h-14 w-14 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-200 text-xs text-slate-400">
                              No image
                            </div>
                          )}

                          <div>
                            <p className="font-medium text-slate-900">
                              {item.product?.name || 'Product'}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-sm text-slate-500">
                            Unit price
                          </p>

                          <p className="mt-1 font-semibold text-slate-900">
                            {formatCurrency(item.unit_price)}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Subtotal:{' '}
                            {formatCurrency(
                              Number(item.unit_price) *
                                Number(item.quantity),
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-5 border-t border-slate-200 px-6 py-5 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Payment
                    </p>

                    <p className="mt-1 text-sm font-medium capitalize text-slate-900">
                      {order.payment?.method ||
                        'Cash on delivery'}
                    </p>

                    <p className="mt-1 text-xs capitalize text-slate-500">
                      {order.payment?.status || 'pending'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Delivery
                    </p>

                    <p className="mt-1 text-sm font-medium capitalize text-slate-900">
                      {order.delivery?.status || 'Not assigned'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Commission
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {order.commissions?.length
                        ? formatCurrency(
                            order.commissions.reduce(
                              (total, commission) =>
                                total +
                                Number(commission.amount || 0),
                              0,
                            ),
                          )
                        : formatCurrency(0)}
                    </p>
                  </div>
                </div>

                {canUpdate && (
                  <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      {sellerStatus === 'pending'
                        ? 'Confirm this order to begin preparation.'
                        : 'Mark this order as prepared when it is ready for delivery.'}
                    </p>

                    <button
                      type="button"
                      disabled={
                        updatingOrderId !== null || loading
                      }
                      onClick={() =>
                        handleUpdateStatus(
                          order.id,
                          nextStatus,
                        )
                      }
                      className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updatingOrderId === order.id
                        ? 'Updating...'
                        : sellerStatus === 'pending'
                          ? 'Confirm order'
                          : 'Mark as prepared'}
                    </button>
                  </div>
                )}
              </article>
              )
            })}
          </section>

          {pagination?.last_page > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={
                  loading ||
                  updatingOrderId !== null ||
                  !pagination.prev_page_url
                }
                onClick={() =>
                  loadOrders(pagination.current_page - 1)
                }
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm text-slate-500">
                Page {pagination.current_page} of{' '}
                {pagination.last_page}
              </span>

              <button
                type="button"
                disabled={
                  loading ||
                  updatingOrderId !== null ||
                  !pagination.next_page_url
                }
                onClick={() =>
                  loadOrders(pagination.current_page + 1)
                }
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SellerOrders
