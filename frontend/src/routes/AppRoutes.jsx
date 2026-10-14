import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import HomePage from '../pages/public/HomePage'
import ClientDashboard from '../pages/client/ClientDashboard'
import ClientOrders from '../pages/client/ClientOrders'
import ClientOrderDetails from '../pages/client/ClientOrderDetails'
import ClientLayout from '../components/layout/ClientLayout'
import ClientFavorites from '../pages/client/ClientFavorites'
import ClientAddresses from '../pages/client/ClientAddresses'
import ClientCart from '../pages/client/ClientCart'
import Products from '../pages/client/Products'
import ProductDetails from '../pages/client/ProductDetails'
import ClientCheckout from '../pages/client/ClientCheckout'
import ClientProfile from '../pages/client/ClientProfile'
import ClientNotifications from '../pages/client/ClientNotifications'
import SellerLayout from '../components/layout/SellerLayout'
import SellerDashboard from '../pages/seller/SellerDashboard'
import SellerProducts from '../pages/seller/SellerProducts'
import SellerOrders from '../pages/seller/SellerOrders'
import SellerShop from '../pages/seller/SellerShop'
import DriverLayout from '../components/layout/DriverLayout'
import DriverDashboard from '../pages/driver/DriverDashboard'
import DriverDeliveries from '../pages/driver/DriverDeliveries'
import DriverDeliveryDetails from '../pages/driver/DriverDeliveryDetails'
import DriverHistory from '../pages/driver/DriverHistory'
import AdminLayout from '../components/layout/AdminLayout'

const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'))
const AdminShops = lazy(() => import('../pages/admin/AdminShops'))
const AdminProducts = lazy(() => import('../pages/admin/AdminProducts'))
const AdminOrders = lazy(() => import('../pages/admin/AdminOrders'))
const AdminDeliveries = lazy(() => import('../pages/admin/AdminDeliveries'))
const AdminCategories = lazy(() => import('../pages/admin/AdminCategories'))
const AdminReviews = lazy(() => import('../pages/admin/AdminReviews'))
const AdminCoupons = lazy(() => import('../pages/admin/AdminCoupons'))
const AdminCommissions = lazy(() => import('../pages/admin/AdminCommissions'))
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route element={<ProtectedRoute />}>
          <Route
            element={
              <RoleRoute allowedRoles={['client']} />
            }
          >
            <Route element={<ClientLayout />}>
              <Route
                path="/client"
                element={<ClientDashboard />}
              />

              <Route
                path="/products"
                element={<Products />}
              />

              <Route
                path="/products/:id"
                element={<ProductDetails />}
              />

              <Route
                path="/client/cart"
                element={<ClientCart />}
              />

              <Route
                path="/client/checkout"
                element={<ClientCheckout />}
              />

              <Route
                path="/client/orders"
                element={<ClientOrders />}
              />

              <Route
                path="/client/orders/:id"
                element={<ClientOrderDetails />}
              />

              <Route
                path="/client/favorites"
                element={<ClientFavorites />}
              />

              <Route
                path="/client/addresses"
                element={<ClientAddresses />}
              />

              <Route
                path="/client/profile"
                element={<ClientProfile />}
              />

              <Route
                path="/client/notifications"
                element={<ClientNotifications />}
              />
            </Route>
          </Route>

          <Route
            element={
              <RoleRoute allowedRoles={['seller']} />
            }
          >
            <Route element={<SellerLayout />}>
              <Route
                path="/seller"
                element={<SellerDashboard />}
              />

              <Route
                path="/seller/products"
                element={<SellerProducts />}
              />

              <Route
                path="/seller/orders"
                element={<SellerOrders />}
              />

              <Route
                 path="/seller/shop"
                 element={<SellerShop />}
              />
            </Route>
          </Route>

          <Route
            element={
              <RoleRoute allowedRoles={['driver']} />
            }
          >
            <Route element={<DriverLayout />}>
              <Route
                path="/driver"
                element={<DriverDashboard />}
              />

              <Route
                path="/driver/deliveries"
                element={<DriverDeliveries />}
              />

              <Route
                path="/driver/deliveries/:id"
                element={<DriverDeliveryDetails />}
              />

              <Route
                path="/driver/history"
                element={<DriverHistory />}
              />
            </Route>
          </Route>

          <Route
            element={
              <RoleRoute allowedRoles={['admin']} />
            }
          >
            <Route
              element={(
                <Suspense fallback={<div className="min-h-screen bg-slate-50 p-8 text-sm text-slate-500">Loading admin workspace…</div>}>
                  <AdminLayout />
                </Suspense>
              )}
            >
              <Route
                path="/admin"
                element={<AdminDashboard />}
              />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/shops" element={<AdminShops />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/deliveries" element={<AdminDeliveries />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/reviews" element={<AdminReviews />} />
              <Route path="/admin/coupons" element={<AdminCoupons />} />
              <Route path="/admin/commissions" element={<AdminCommissions />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes