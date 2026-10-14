import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

const navigation = [
  {
    label: 'Dashboard',
    path: '/client',
  },
  {
    label: 'Products',
    path: '/products',
  },
  {
    label: 'Cart',
    path: '/client/cart',
  },
  {
    label: 'Orders',
    path: '/client/orders',
  },
  {
    label: 'Favorites',
    path: '/client/favorites',
  },
  {
    label: 'Notifications',
    path: '/client/notifications',
  },
  {
    label: 'Addresses',
    path: '/client/addresses',
  },
  {
    label: 'Profile',
    path: '/client/profile',
  },
]

function ClientLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <NavLink
            to="/client"
            className="text-xl font-bold text-slate-900"
          >
            Marketplace
          </NavLink>

          <div className="flex items-center gap-5">
            <span className="hidden text-sm text-slate-600 sm:block">
              {user?.name}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-slate-600 transition hover:text-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden min-h-[calc(100vh-4rem)] w-64 border-r border-slate-200 bg-white p-5 md:block">
          <nav className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/client'}
                className={({ isActive }) =>
                  `block rounded-lg px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default ClientLayout