import { useEffect, useState } from 'react'
import sellerService from '../../services/sellerService'
import SellerProductForm from './SellerProductForm'

const statusStyles = {
  draft: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  published: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
}

function formatCurrency(value) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

function getProductsFromResponse(response) {
  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response?.data)) {
    return response.data
  }

  return []
}

function SellerProducts() {
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  const fetchProducts = async (page = 1) => {
    setLoading(true)
    setError('')

    try {
      const response = await sellerService.getProducts({
        page,
        per_page: 12,
      })

      setProducts(getProductsFromResponse(response))
      setPagination(response)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to load your products.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadProducts = async () => {
      try {
        const response = await sellerService.getProducts({
          page: 1,
          per_page: 12,
        })

        if (!cancelled) {
          setProducts(getProductsFromResponse(response))
          setPagination(response)
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              'Unable to load your products.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadProducts()

    return () => {
      cancelled = true
    }
  }, [])

  const handleAddProduct = () => {
    setEditingProduct(null)
    setShowForm(true)
    setError('')
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setShowForm(true)
    setError('')
  }

  const handleFormSuccess = async () => {
    setShowForm(false)
    setEditingProduct(null)
    await fetchProducts(pagination?.current_page || 1)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingProduct(null)
  }

  const handleDisableProduct = async (product) => {
    const confirmed = window.confirm(
      `Disable "${product.name}"?`,
    )

    if (!confirmed) {
      return
    }

    setError('')

    try {
      await sellerService.disableProduct(product.id)

      await fetchProducts(pagination?.current_page || 1)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to disable the product.',
      )
    }
  }

  if (showForm) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Seller space
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Products
            </h1>
          </div>
        </section>

        <SellerProductForm
          product={editingProduct}
          onSuccess={handleFormSuccess}
          onCancel={handleCancelForm}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Seller space
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            My Products
          </h1>

          <p className="mt-2 text-slate-500">
            Manage your products, prices, stock and publication status.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddProduct}
          className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Add product
        </button>
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
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            No products
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            You have not created any products yet.
          </p>

          <button
            type="button"
            onClick={handleAddProduct}
            className="mt-6 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add your first product
          </button>
        </section>
      ) : (
        <>
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const primaryImage =
                product.images?.find(
                  (image) => image.is_primary,
                ) || product.images?.[0]

              const isLowStock =
                product.stock <= product.alert_threshold

              return (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="aspect-[4/3] bg-slate-100">
                    {primaryImage ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/storage/${primaryImage.path}`}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-slate-900">
                          {product.name}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {product.category?.name || 'No category'}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          statusStyles[product.status] ||
                          'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {product.status}
                      </span>
                    </div>

                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <p className="text-lg font-bold text-slate-900">
                          {formatCurrency(product.price)}
                        </p>

                        {product.promotional_price && (
                          <p className="mt-1 text-xs text-emerald-600">
                            Promo:{' '}
                            {formatCurrency(
                              product.promotional_price,
                            )}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-400">
                          Stock
                        </p>

                        <p
                          className={`mt-1 text-sm font-semibold ${
                            isLowStock
                              ? 'text-red-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {product.stock}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleEditProduct(product)
                        }
                        className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDisableProduct(product)
                        }
                        className="flex-1 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Disable
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </section>

          {pagination?.last_page > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={!pagination.prev_page_url}
                onClick={() =>
                  fetchProducts(
                    pagination.current_page - 1,
                  )
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
                disabled={!pagination.next_page_url}
                onClick={() =>
                  fetchProducts(
                    pagination.current_page + 1,
                  )
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

export default SellerProducts