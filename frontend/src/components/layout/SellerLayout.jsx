
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import sellerService from '../../services/sellerService'

const navigation = [
  { label: 'Dashboard', path: '/seller' },
  { label: 'Products', path: '/seller/products' },
  { label: 'Orders', path: '/seller/orders' },
  { label: 'Shop', path: '/seller/shop' },
]

function SellerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [shop, setShop] = useState(null)

  useEffect(() => {
    let cancelled = false

    const loadShop = async () => {
      try {
        const response = await sellerService.getShop()

        if (!cancelled) {
          setShop(response.data)
        }
      } catch {
        if (!cancelled) {
          setShop(null)
        }
      }
    }

    loadShop()

    return () => {
      cancelled = true
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <NavLink
            to="/seller"
            className="text-xl font-bold text-slate-900"
          >
            Marketplace
          </NavLink>

          <div className="flex items-center gap-5">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {user?.name}
              </p>

              <p className="text-xs text-slate-500">
                {shop?.name || 'Seller'}
              </p>
            </div>

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
          {shop?.name && (
            <div className="mb-5 border-b border-slate-200 px-4 pb-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                My shop
              </p>

              <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                {shop.name}
              </p>
            </div>
          )}

          <nav className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/seller'}
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
          <Outlet context={{ shop, setShop }} />
        </main>
      </div>
    </div>
  )
}

export default SellerLayout
