import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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

const nextStatusMap = {
  assigned: ['picked_up', 'failed'],
  picked_up: ['in_transit', 'failed'],
  in_transit: ['delivered', 'failed'],
  delivered: [],
  failed: [],
}

function formatDate(date) {
  if (!date) {
    return '—'
  }

  return new Date(date).toLocaleString('fr-MA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function DriverDeliveryDetails() {
  const { id } = useParams()
  const [delivery, setDelivery] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState('')

  const loadDelivery = useCallback(async () => {
    try {
      const response = await driverService.getDelivery(id)
      setDelivery(response?.data ?? response ?? null)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to load delivery details.',
      )
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDelivery()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadDelivery])

  const handleStatusChange = async (nextStatus) => {
    if (!delivery) {
      return
    }

    setUpdatingStatus(nextStatus)
    setError('')

    try {
      let note = ''

      if (nextStatus === 'failed') {
        const reason = window.prompt(
          'Enter the reason for the delivery failure:',
          'Customer unavailable',
        )

        if (reason === null) {
          setUpdatingStatus('')
          return
        }

        note = reason.trim()

        if (!note) {
          setError('A failure reason is required before marking this delivery as failed.')
          setUpdatingStatus('')
          return
        }
      }

      await driverService.updateDeliveryStatus(id, nextStatus, note)
      await loadDelivery()
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
            'This status change is not allowed.',
        )
      } else if (response?.status === 403) {
        setError('You are not authorized to update this delivery.')
      } else {
        setError(
          response?.data?.message ||
            'Unable to update the delivery status.',
        )
      }
    } finally {
      setUpdatingStatus('')
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="h-12 w-52 animate-pulse rounded-lg bg-slate-200" />

        <div className="mt-6 h-80 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    )
  }

  if (error && !delivery) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div
          role="alert"
          className="rounded-2xl bg-red-50 px-6 py-5 text-sm text-red-700"
        >
          {error}
        </div>
      </div>
    )
  }

  if (!delivery) {
    return null
  }

  const order = delivery.order || {}
  const orderUser = order.user || {}
  const statusHistory = delivery.status_histories || delivery.statusHistories || []
  const availableStatuses = nextStatusMap[delivery.status] || []

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Delivery details
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {order.order_number || `Order #${delivery.id}`}
          </h1>
        </div>

        <Link
          to="/driver/deliveries"
          className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Back to deliveries
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Current status</p>

            <div className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1.5">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[delivery.status] || 'bg-slate-100 text-slate-700'}`}
              >
                {statusLabels[delivery.status] || delivery.status}
              </span>
            </div>
          </div>

          <div className="text-sm text-slate-500">
            Assigned {formatDate(delivery.assigned_at)}
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Customer information</h2>

            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div>
                <dt className="font-medium text-slate-800">Recipient</dt>
                <dd>{order.recipient_name || orderUser.name || 'Customer'}</dd>
              </div>

              <div>
                <dt className="font-medium text-slate-800">Phone</dt>
                <dd>{order.phone || orderUser.phone || 'Not provided'}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">Delivery address</h2>

            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div>
                <dt className="font-medium text-slate-800">Address</dt>
                <dd>{order.address_line || 'Address pending'}</dd>
              </div>

              <div>
                <dt className="font-medium text-slate-800">City</dt>
                <dd>{order.city || 'Not available'}</dd>
              </div>

              <div>
                <dt className="font-medium text-slate-800">Postal code</dt>
                <dd>{order.postal_code || 'Not available'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Order total</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {Number(order.total || 0).toFixed(2)} MAD
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Delivery status</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {statusLabels[delivery.status] || delivery.status}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Order status</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {order.status || 'Pending'}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Available actions</h2>

        {availableStatuses.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            This delivery has reached a terminal state.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-3">
            {availableStatuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusChange(status)}
                disabled={Boolean(updatingStatus)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatingStatus === status
                  ? 'Updating...'
                  : status === 'failed'
                    ? 'Mark as failed'
                    : status === 'delivered'
                      ? 'Mark as delivered'
                      : status === 'picked_up'
                        ? 'Mark as picked up'
                        : 'Mark as in transit'}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Status history</h2>

        {statusHistory.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No status updates have been recorded yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {statusHistory.map((entry) => (
              <div
                key={`${entry.id || entry.created_at}-${entry.status}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {statusLabels[entry.status] || entry.status}
                  </p>

                  {entry.note && (
                    <p className="mt-1 text-sm text-slate-500">
                      {entry.note}
                    </p>
                  )}
                </div>

                <span className="text-xs text-slate-400">
                  {formatDate(entry.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default DriverDeliveryDetails
