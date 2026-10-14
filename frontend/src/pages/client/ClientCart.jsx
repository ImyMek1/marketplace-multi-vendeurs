import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import cartService from '../../services/cartService'

function formatPrice(value) {
  return `${Number(value).toLocaleString('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MAD`
}

function getCartFromResponse(response) {
  return response?.data ?? response
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

function ClientCart() {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingItem, setUpdatingItem] = useState(null)
  const [removingItem, setRemovingItem] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadCart = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await cartService.getCart()
        setCart(getCartFromResponse(response))
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            'Unable to load your cart.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadCart()
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

  const handleQuantityChange = async (item, quantity) => {
    const productStock = Number(item.product?.stock ?? 0)
    const newQuantity = Number(quantity)

    if (newQuantity < 1 || newQuantity > productStock) {
      return
    }

    setUpdatingItem(item.id)
    setError('')
    setSuccess('')

    try {
      const response = await cartService.updateItem(
        item.id,
        newQuantity,
      )

      setCart(getCartFromResponse(response))
      setSuccess('Cart updated successfully.')
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.errors?.quantity?.[0] ||
          'Unable to update this item.',
      )
    } finally {
      setUpdatingItem(null)
    }
  }

  const handleRemove = async (itemId) => {
    setRemovingItem(itemId)
    setError('')
    setSuccess('')

    try {
      const response = await cartService.removeItem(itemId)

      setCart(getCartFromResponse(response))
      setSuccess('Item removed from your cart.')
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to remove this item.',
      )
    } finally {
      setRemovingItem(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>

          <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
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
          Shopping Cart
        </h1>

        <p className="mt-2 text-slate-500">
          Review your selected products before checkout.
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

      {success && (
        <div
          role="status"
          className="rounded-xl bg-emerald-50 px-5 py-4 text-sm text-emerald-700"
        >
          {success}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Your cart is empty
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Browse our products and add something to your cart.
          </p>

          <Link
            to="/products"
            className="mt-6 inline-block rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-4">
            {items.map((item) => {
              const product = item.product
              const price = getItemPrice(product)

              const image =
                product?.images?.find(
                  (itemImage) => itemImage.is_primary,
                )?.path ||
                product?.images?.[0]?.path

              const stock = Number(product?.stock ?? 0)
              const isUpdating = updatingItem === item.id
              const isRemoving = removingItem === item.id

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-5 sm:flex-row">
                    <Link
                      to={`/products/${product?.id}`}
                      className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 sm:w-32"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={product?.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">
                          No image
                        </span>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                            {product?.category?.name}
                          </p>

                          <Link
                            to={`/products/${product?.id}`}
                            className="mt-1 block text-lg font-semibold text-slate-900 hover:text-blue-600"
                          >
                            {product?.name}
                          </Link>

                          <p className="mt-1 text-sm text-slate-500">
                            {product?.shop?.name}
                          </p>
                        </div>

                        <p className="text-lg font-bold text-slate-900">
                          {formatPrice(price)}
                        </p>
                      </div>

                      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <label
                            htmlFor={`quantity-${item.id}`}
                            className="mr-3 text-sm font-medium text-slate-700"
                          >
                            Quantity
                          </label>

                          <select
                            id={`quantity-${item.id}`}
                            value={item.quantity}
                            disabled={isUpdating || isRemoving}
                            onChange={(event) =>
                              handleQuantityChange(
                                item,
                                event.target.value,
                              )
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                          >
                            {Array.from(
                              { length: stock },
                              (_, index) => index + 1,
                            ).map((quantity) => (
                              <option
                                key={quantity}
                                value={quantity}
                              >
                                {quantity}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-4">
                          <p className="text-sm font-semibold text-slate-900">
                            {formatPrice(
                              price * Number(item.quantity),
                            )}
                          </p>

                          <button
                            type="button"
                            disabled={isUpdating || isRemoving}
                            onClick={() =>
                              handleRemove(item.id)
                            }
                            className="text-sm font-medium text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isRemoving
                              ? 'Removing...'
                              : 'Remove'}
                          </button>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-slate-400">
                        {stock} available in stock
                      </p>
                    </div>
                  </div>
                </article>
              )
            })}
          </section>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Order Summary
            </h2>

            <div className="mt-6 space-y-4">
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
                  Calculated at checkout
                </span>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">
                    Total
                  </span>

                  <span className="text-xl font-bold text-slate-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>
              </div>
            </div>

            <Link
              to="/client/checkout"
              className="mt-6 block w-full rounded-xl bg-slate-900 px-6 py-4 text-center font-semibold text-white transition hover:bg-slate-800"
            >
              Proceed to checkout
            </Link>

            <Link
              to="/products"
              className="mt-3 block text-center text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  )
}

export default ClientCart