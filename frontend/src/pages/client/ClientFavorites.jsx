import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import favoriteService from '../../services/favoriteService'

function formatPrice(value) {
  return `${Number(value ?? 0).toFixed(2)} MAD`
}

function getFavoritesFromResponse(response) {
  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response?.data)) {
    return response.data
  }

  return []
}

function ClientFavorites() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await favoriteService.getFavorites()

        setFavorites(getFavoritesFromResponse(response))
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            'Unable to load your favorites. Please try again.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadFavorites()
  }, [])

  const handleRemove = async (favoriteId) => {
    setRemovingId(favoriteId)
    setError('')

    try {
      await favoriteService.removeFavorite(favoriteId)

      setFavorites((current) =>
        current.filter((favorite) => favorite.id !== favoriteId),
      )
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to remove this favorite. Please try again.',
      )
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <section>
          <p className="text-sm font-medium text-blue-600">
            Client Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Favorites
          </h1>

          <p className="mt-2 text-slate-500">
            Products you saved for later.
          </p>
        </section>

        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            Loading your favorites...
          </p>
        </div>
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <div className="space-y-8">
        <section>
          <p className="text-sm font-medium text-blue-600">
            Client Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Favorites
          </h1>

          <p className="mt-2 text-slate-500">
            Products you saved for later.
          </p>
        </section>

        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            No favorites yet
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Save products you like and find them here later.
          </p>

          <Link
            to="/"
            className="mt-6 inline-block rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-blue-600">
          Client Dashboard
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Favorites
        </h1>

        <p className="mt-2 text-slate-500">
          Products you saved for later.
        </p>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {favorites.map((favorite) => {
          const product = favorite.product

          return (
            <article
              key={favorite.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex h-48 items-center justify-center bg-slate-100">
                <span className="text-sm text-slate-400">
                  Product Image
                </span>
              </div>

              <div className="p-5">
                <h2 className="font-semibold text-slate-900">
                  {product?.name || `Product #${favorite.product_id}`}
                </h2>

                <p className="mt-2 text-lg font-bold text-slate-900">
                  {formatPrice(
                    product?.promotional_price ??
                      product?.price,
                  )}
                </p>

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleRemove(favorite.id)}
                    disabled={removingId === favorite.id}
                    className="flex-1 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {removingId === favorite.id
                      ? 'Removing...'
                      : 'Remove'}
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}

export default ClientFavorites