import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import productService from '../../services/productService'
import categoryService from '../../services/categoryService'

function getImageUrl(path) {
  if (!path) {
    return ''
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const backendOrigin = (import.meta.env.VITE_API_URL || '')
    .replace(/\/api\/v1\/?$/, '')
    .replace(/\/$/, '')

  return `${backendOrigin}/storage/${path.replace(/^\/+/, '')}`
}

function getProductsFromResponse(response) {
  if (Array.isArray(response)) {
    return response
  }

  return Array.isArray(response?.data) ? response.data : []
}

function getPaginationFromResponse(response) {
  return {
    currentPage: response?.current_page ?? 1,
    lastPage: response?.last_page ?? 1,
    total: response?.total ?? 0,
  }
}

function formatPrice(value) {
  return `${Number(value).toLocaleString('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MAD`
}

function getProductPrice(product) {
  if (
    product.promotional_price !== null &&
    Number(product.promotional_price) < Number(product.price)
  ) {
    return {
      current: product.promotional_price,
      original: product.price,
    }
  }

  return {
    current: product.price,
    original: null,
  }
}

function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('')
  const [page, setPage] = useState(1)

  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  })

  const [loading, setLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [error, setError] = useState('')
  const [categoriesError, setCategoriesError] = useState('')

  useEffect(() => {
    const loadCategories = async () => {
      setCategoriesLoading(true)
      setCategoriesError('')

      try {
        const response = await categoryService.getCategories()

        setCategories(getProductsFromResponse(response))
      } catch (requestError) {
        setCategoriesError(
          requestError.response?.data?.message ||
            'Unable to load categories.',
        )
      } finally {
        setCategoriesLoading(false)
      }
    }

    loadCategories()
  }, [])

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      setError('')

      try {
        const params = {
          page,
        }

        if (search.trim()) {
          params.search = search.trim()
        }

        if (selectedCategory) {
          params.category_id = selectedCategory
        }

        if (sort) {
          params.sort = sort
        }

        const response = await productService.getProducts(params)

        setProducts(getProductsFromResponse(response))
        setPagination(getPaginationFromResponse(response))
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            'Unable to load products. Please try again.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [page, search, selectedCategory, sort])

  const handleSearchChange = (event) => {
    setSearch(event.target.value)
    setPage(1)
  }

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value)
    setPage(1)
  }

  const handleSortChange = (event) => {
    setSort(event.target.value)
    setPage(1)
  }

  const handleReset = () => {
    setSearch('')
    setSelectedCategory('')
    setSort('')
    setPage(1)
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <section>
        <p className="text-sm font-medium text-blue-600">
          Marketplace
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Products
        </h1>

        <p className="mt-2 text-slate-500">
          Discover products from our marketplace sellers.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_auto]">
          <div>
            <label
              htmlFor="product-search"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Search
            </label>

            <input
              id="product-search"
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search products..."
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="product-category"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Category
            </label>

            <select
              id="product-category"
              value={selectedCategory}
              onChange={handleCategoryChange}
              disabled={categoriesLoading}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All categories</option>

              {categories.map((category) => (
                <optgroup
                  key={category.id}
                  label={category.name}
                >
                  <option value={category.id}>
                    {category.name}
                  </option>

                  {category.children?.map((child) => (
                    <option
                      key={child.id}
                      value={child.id}
                    >
                      {child.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="product-sort"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Sort by
            </label>

            <select
              id="product-sort"
              value={sort}
              onChange={handleSortChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Default</option>
              <option value="price_asc">
                Price: Low to High
              </option>
              <option value="price_desc">
                Price: High to Low
              </option>
              <option value="newest">
                Newest
              </option>
              <option value="popularity">
                Popularity
              </option>
              <option value="rating">
                Rating
              </option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleReset}
              className="w-full rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 lg:w-auto"
            >
              Reset
            </button>
          </div>
        </div>

        {categoriesError && (
          <p className="mt-3 text-sm text-red-600">
            {categoriesError}
          </p>
        )}
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {pagination.total}{' '}
            {pagination.total === 1 ? 'product' : 'products'}
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="h-56 bg-slate-200" />

                <div className="space-y-3 p-5">
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-4 w-1/2 rounded bg-slate-200" />
                  <div className="h-6 w-1/3 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              No products found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Try changing your search or filters.
            </p>

            <button
              type="button"
              onClick={handleReset}
              className="mt-5 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const price = getProductPrice(product)

              const image = product.images?.find(
                (item) => item.is_primary,
              )?.path || product.images?.[0]?.path

              return (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <Link to={`/products/${product.id}`}>
                    <div className="flex h-56 items-center justify-center bg-slate-100">
                      {image ? (
                        <img
                          src={getImageUrl(image)}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm text-slate-400">
                          No image
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                      {product.category?.name}
                    </p>

                    <Link
                      to={`/products/${product.id}`}
                      className="mt-2 block"
                    >
                      <h2 className="line-clamp-2 text-lg font-semibold text-slate-900 hover:text-blue-600">
                        {product.name}
                      </h2>
                    </Link>

                    {product.brand && (
                      <p className="mt-1 text-sm text-slate-500">
                        {product.brand}
                      </p>
                    )}

                    <p className="mt-1 text-xs text-slate-400">
                      {product.shop?.name}
                    </p>

                    <div className="mt-4 flex items-end gap-2">
                      <span className="text-xl font-bold text-slate-900">
                        {formatPrice(price.current)}
                      </span>

                      {price.original && (
                        <span className="text-sm text-slate-400 line-through">
                          {formatPrice(price.original)}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span
                        className={`text-xs font-medium ${
                          product.stock > 0
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }`}
                      >
                        {product.stock > 0
                          ? `${product.stock} in stock`
                          : 'Out of stock'}
                      </span>

                      <Link
                        to={`/products/${product.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-blue-600"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {!loading && pagination.lastPage > 1 && (
        <div className="flex items-center justify-center gap-2 pb-4">
          <button
            type="button"
            disabled={pagination.currentPage <= 1}
            onClick={() =>
              setPage((currentPage) => currentPage - 1)
            }
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="px-4 text-sm text-slate-600">
            Page {pagination.currentPage} of{' '}
            {pagination.lastPage}
          </span>

          <button
            type="button"
            disabled={
              pagination.currentPage >= pagination.lastPage
            }
            onClick={() =>
              setPage((currentPage) => currentPage + 1)
            }
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default Products