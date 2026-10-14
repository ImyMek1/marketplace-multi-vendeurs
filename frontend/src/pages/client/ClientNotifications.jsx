import { useEffect, useState } from 'react'
import notificationService from '../../services/notificationService'

function formatDate(date) {
  if (!date) {
    return ''
  }

  return new Date(date).toLocaleString('fr-MA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function getNotificationsFromResponse(response) {
  return response?.data ?? response ?? []
}

function ClientNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)
  const [markingId, setMarkingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let cancelled = false

    const fetchNotifications = async () => {
      try {
        const response =
          await notificationService.getNotifications()

        if (!cancelled) {
          setNotifications(
            getNotificationsFromResponse(response),
          )
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              'Unable to load your notifications.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchNotifications()

    return () => {
      cancelled = true
    }
  }, [])

  const handleMarkAsRead = async (notificationId) => {
    setMarkingId(notificationId)
    setError('')
    setSuccess('')

    try {
      await notificationService.markAsRead(notificationId)

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                read_at: new Date().toISOString(),
              }
            : notification,
        ),
      )
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to mark this notification as read.',
      )
    } finally {
      setMarkingId(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true)
    setError('')
    setSuccess('')

    try {
      await notificationService.markAllAsRead()

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read_at:
            notification.read_at ||
            new Date().toISOString(),
        })),
      )

      setSuccess('All notifications marked as read.')
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to mark all notifications as read.',
      )
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.read_at,
  ).length

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Account
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Notifications
          </h1>

          <p className="mt-2 text-slate-500">
            Stay updated about your orders, deliveries and account activity.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {markingAll
              ? 'Marking...'
              : 'Mark all as read'}
          </button>
        )}
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl bg-emerald-50 px-5 py-4 text-sm text-emerald-700"
        >
          {success}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
            🔔
          </div>

          <h2 className="mt-5 text-xl font-semibold text-slate-900">
            No notifications
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            You are all caught up.
          </p>
        </div>
      ) : (
        <section className="space-y-3">
          {notifications.map((notification) => {
            const isUnread = !notification.read_at
            const isMarking =
              markingId === notification.id

            return (
              <article
                key={notification.id}
                className={`rounded-2xl border p-5 shadow-sm transition ${
                  isUnread
                    ? 'border-blue-200 bg-blue-50/50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex gap-4">
                  <div
                    className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      isUnread
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    🔔
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2
                          className={`text-sm font-semibold ${
                            isUnread
                              ? 'text-slate-900'
                              : 'text-slate-700'
                          }`}
                        >
                          {notification.type ||
                            'Notification'}
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {notification.content ||
                            notification.message ||
                            'You have a new notification.'}
                        </p>
                      </div>

                      {isUnread && (
                        <span className="inline-flex w-fit rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          New
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-slate-400">
                        {formatDate(
                          notification.created_at,
                        )}
                      </p>

                      {isUnread && (
                        <button
                          type="button"
                          onClick={() =>
                            handleMarkAsRead(
                              notification.id,
                            )
                          }
                          disabled={isMarking}
                          className="text-left text-sm font-semibold text-blue-600 transition hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-right"
                        >
                          {isMarking
                            ? 'Marking...'
                            : 'Mark as read'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </div>
  )
}

export default ClientNotifications