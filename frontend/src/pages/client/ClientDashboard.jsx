import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

const stats = [
  {
    label: 'Total Orders',
    value: '0',
  },
  {
    label: 'Pending Orders',
    value: '0',
  },
  {
    label: 'Favorites',
    value: '0',
  },
  {
    label: 'Addresses',
    value: '0',
  },
]

function ClientDashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-blue-600">
          Client Dashboard
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Welcome back, {user?.name}
        </h1>

        <p className="mt-2 text-slate-500">
          Manage your orders, favorites, addresses and account.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">
              {stat.label}
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Orders
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your latest orders will appear here.
              </p>
            </div>

            <Link
              to="/client/orders"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>

          <div className="mt-8 rounded-xl bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-500">
              No orders yet.
            </p>

            <Link
              to="/"
              className="mt-3 inline-block text-sm font-semibold text-slate-900 hover:underline"
            >
              Start shopping
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Quickly access your most used sections.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              to="/client/orders"
              className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <p className="font-semibold text-slate-900">
                My Orders
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Track your purchases
              </p>
            </Link>

            <Link
              to="/client/favorites"
              className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <p className="font-semibold text-slate-900">
                Favorites
              </p>

              <p className="mt-1 text-sm text-slate-500">
                View saved products
              </p>
            </Link>

            <Link
              to="/client/addresses"
              className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <p className="font-semibold text-slate-900">
                Addresses
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Manage delivery addresses
              </p>
            </Link>

            <Link
              to="/client/profile"
              className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <p className="font-semibold text-slate-900">
                Profile
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Manage your account
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ClientDashboard