import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import addressService from '../../services/addressService'
import cartService from '../../services/cartService'
import orderService from '../../services/orderService'

function formatPrice(value) {
  return `${Number(value).toLocaleString('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MAD`
}

function getItemPrice(product) {
  if (
    product?.promotional_price !== null &&
    product?.promotional_price !== undefined &&
    Number(product.promotional_price) < Number(product.price)
  ) {
    return Number(product.promotional_price)
  }

  return Number(product?.price ?? 0)
}

function ClientCheckout() {
  const navigate = useNavigate()

  const [cart, setCart] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCheckoutData = async () => {
      setLoading(true)
      setError('')

      try {
        const [cartResponse, addressesResponse] =
          await Promise.all([
            cartService.getCart(),
            addressService.getAddresses(),
          ])

        const cartData = cartResponse?.data ?? cartResponse
        const addressData =
          addressesResponse?.data ?? addressesResponse

        setCart(cartData)

        const loadedAddresses = Array.isArray(addressData)
          ? addressData
          : []

        setAddresses(loadedAddresses)

        if (loadedAddresses.length > 0) {
          setSelectedAddress(String(loadedAddresses[0].id))
        }
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            'Unable to load checkout information.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadCheckoutData()
  }, [])

  const items = useMemo(
    () => cart?.items ?? [],
    [cart],
  )

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      return (
        total +
        getItemPrice(item.product) * Number(item.quantity)
      )
    }, 0)
  }, [items])

  const deliveryFee = items.length > 0 ? 30 : 0

  const handlePlaceOrder = async (event) => {
    event.preventDefault()

    if (!selectedAddress) {
      setError('Please select a delivery address.')
      return
    }

    if (items.length === 0) {
      setError('Your cart is empty.')
      return
    }

    setPlacingOrder(true)
    setError('')

    try {
      const response = await orderService.createOrder({
        address_id: Number(selectedAddress),
        ...(couponCode.trim()
          ? {
              coupon_code: couponCode
                .trim()
                .toUpperCase(),
            }
          : {}),
      })

      const order =
        response?.data ??
        response?.order ??
        response

      const orderId = order?.id

      if (orderId) {
        navigate(`/client/orders/${orderId}`, {
          replace: true,
        })
        return
      }

      navigate('/client/orders', {
        replace: true,
      })
    } catch (requestError) {
      const response = requestError.response

      if (response?.status === 422) {
        const validationErrors =
          response.data?.errors

        const firstError = validationErrors
          ? Object.values(validationErrors).flat()[0]
          : null

        setError(
          firstError ||
            response.data?.message ||
            'Please check your checkout information.',
        )
      } else {
        setError(
          response?.data?.message ||
            'Unable to place your order. Please try again.',
        )
      }
    } finally {
      setPlacingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
          </div>

          <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="space-y-8">
        <section>
          <p className="text-sm font-medium text-blue-600">
            Marketplace
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Checkout
          </h1>
        </section>

        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Your cart is empty
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Add products to your cart before checkout.
          </p>

          <Link
            to="/products"
            className="mt-6 inline-block rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Browse products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-blue-600">
          Marketplace
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Checkout
        </h1>

        <p className="mt-2 text-slate-500">
          Confirm your delivery details and place your order.
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

      <form
        onSubmit={handlePlaceOrder}
        className="grid gap-6 lg:grid-cols-[1fr_380px]"
      >
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Delivery Address
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select where you want your order delivered.
              </p>
            </div>

            {addresses.length === 0 ? (
              <div className="mt-6 rounded-xl bg-slate-50 p-6">
                <p className="text-sm text-slate-600">
                  You don't have any delivery address yet.
                </p>

                <Link
                  to="/client/addresses"
                  className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Add a delivery address
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={`block cursor-pointer rounded-xl border p-4 transition ${
                      String(address.id) === selectedAddress
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex gap-3">
                      <input
                        type="radio"
                        name="address"
                        value={address.id}
                        checked={
                          String(address.id) === selectedAddress
                        }
                        onChange={(event) =>
                          setSelectedAddress(
                            event.target.value,
                          )
                        }
                        className="mt-1"
                      />

                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {address.label}
                        </p>

                        <p className="mt-1 text-sm text-slate-700">
                          {address.recipient_name}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {address.address_line},{' '}
                          {address.city}
                        </p>

                        {address.postal_code && (
                          <p className="mt-1 text-sm text-slate-500">
                            {address.postal_code}
                          </p>
                        )}

                        <p className="mt-1 text-sm text-slate-500">
                          {address.phone}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Payment Method
            </h2>

            <div className="mt-5 rounded-xl border border-slate-900 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  checked
                  readOnly
                  className="mt-1"
                />

                <div>
                  <p className="font-semibold text-slate-900">
                    Cash on Delivery
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Pay when your order is delivered.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Promotion Code
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Have a coupon? Enter it below.
            </p>

            <input
              type="text"
              value={couponCode}
              onChange={(event) =>
                setCouponCode(event.target.value)
              }
              placeholder="e.g. WELCOME10"
              className="mt-5 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Order Summary
          </h2>

          <div className="mt-6 space-y-4">
            {items.map((item) => {
              const price = getItemPrice(item.product)

              return (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {item.product?.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Qty: {item.quantity}
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-medium text-slate-900">
                    {formatPrice(
                      price * Number(item.quantity),
                    )}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">
                Subtotal
              </span>

              <span className="font-medium text-slate-900">
                {formatPrice(subtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">
                Delivery
              </span>

              <span className="font-medium text-slate-900">
                {formatPrice(deliveryFee)}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="font-semibold text-slate-900">
                Total
              </span>

              <span className="text-xl font-bold text-slate-900">
                {formatPrice(subtotal + deliveryFee)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={
              placingOrder ||
              addresses.length === 0 ||
              !selectedAddress
            }
            className="mt-6 w-full rounded-xl bg-slate-900 px-6 py-4 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {placingOrder
              ? 'Placing order...'
              : 'Place Order'}
          </button>

          <Link
            to="/client/cart"
            className="mt-3 block text-center text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Back to cart
          </Link>
        </aside>
      </form>
    </div>
  )
}

export default ClientCheckout