import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import categoryService from '../../services/categoryService'
import productService from '../../services/productService'

function dashboardPath(role) {
  return {
    client: '/client',
    seller: '/seller',
    driver: '/driver',
    admin: '/admin',
  }[role] || '/'
}

function imageUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path

  const baseUrl = (import.meta.env.VITE_API_URL || '')
    .replace(/\/api\/v1\/?$/, '')
    .replace(/\/$/, '')

  return `${baseUrl}/storage/${path.replace(/^\/+/, '')}`
}

function formatPrice(value) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

function productPrice(product) {
  const current = Number(product.promotional_price)
  if (product.promotional_price !== null && current < Number(product.price)) {
    return { current, original: Number(product.price) }
  }

  return { current: Number(product.price), original: null }
}

function getProductImage(product) {
  return product.images?.find((image) => image.is_primary)?.path || product.images?.[0]?.path || ''
}

function HomePage() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [productsError, setProductsError] = useState('')
  const [categoriesError, setCategoriesError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let cancelled = false

    const loadProducts = async () => {
      setLoadingProducts(true)
      setProductsError('')
      try {
        const response = await productService.getProducts({
          per_page: 8,
          ...(selectedCategory ? { category_id: selectedCategory } : {}),
        })
        if (!cancelled) setProducts(Array.isArray(response?.data) ? response.data : [])
      } catch (error) {
        if (!cancelled) setProductsError(error.response?.data?.message || 'Products could not be loaded right now.')
      } finally {
        if (!cancelled) setLoadingProducts(false)
      }
    }

    loadProducts()
    return () => { cancelled = true }
  }, [selectedCategory, reload])

  useEffect(() => {
    let cancelled = false

    const loadCategories = async () => {
      setLoadingCategories(true)
      setCategoriesError('')
      try {
        const response = await categoryService.getCategories()
        if (!cancelled) setCategories(Array.isArray(response?.data) ? response.data : [])
      } catch (error) {
        if (!cancelled) setCategoriesError(error.response?.data?.message || 'Categories could not be loaded right now.')
      } finally {
        if (!cancelled) setLoadingCategories(false)
      }
    }

    loadCategories()
    return () => { cancelled = true }
  }, [])

  const categoryOptions = categories.flatMap((category) => [
    category,
    ...(category.children || []),
  ])

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-5 px-5 py-3 sm:px-8">
          <Link to="/" className="text-xl font-bold tracking-tight text-slate-950">
            Market<span className="text-cyan-700">place</span>
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-3 sm:gap-5">
            <a href="#discover" className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 sm:inline">Discover</a>
            {isAuthenticated ? (
              <>
                <Link to={dashboardPath(user?.role?.name)} className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">My workspace</Link>
                <button type="button" onClick={handleLogout} className="text-sm font-medium text-slate-600 hover:text-red-700">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-950">Log in</Link>
                <Link to="/register" className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Create account</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="overflow-hidden bg-slate-950 text-white">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-cyan-300">Many sellers. One marketplace.</p>
              <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">Good finds start here.</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">Explore products from independent shops and discover something worth bringing home.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#discover" className="rounded-md bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">Explore products</a>
                {!isAuthenticated && <Link to="/register" className="rounded-md border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Join as a customer</Link>}
              </div>
            </div>
            <div className="relative min-h-64 overflow-hidden rounded-lg border border-white/10 bg-slate-900 sm:min-h-80">
              {products.length > 0 && getProductImage(products[0]) ? (
                <img src={imageUrl(getProductImage(products[0]))} alt={products[0].name} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-cyan-950">
                  <span className="text-sm text-slate-400">{loadingProducts ? 'Loading marketplace picks…' : 'Marketplace picks'}</span>
                </div>
              )}
              {products[0] && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5 pt-16">
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-200">Featured product</p>
                  <p className="mt-1 text-lg font-semibold">{products[0].name}</p>
                  <p className="mt-1 text-sm text-white/80">{products[0].shop?.name || products[0].category?.name}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-cyan-800">Browse by department</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Find your category</h2>
              </div>
              {selectedCategory && <button type="button" onClick={() => setSelectedCategory('')} className="self-start text-sm font-semibold text-blue-700 hover:text-blue-900 sm:self-auto">Show all products</button>}
            </div>

            {categoriesError && <p role="alert" className="mt-4 text-sm text-red-700">{categoriesError}</p>}
            {loadingCategories ? (
              <div className="mt-5 flex gap-3 overflow-hidden">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-11 w-32 shrink-0 animate-pulse rounded-md bg-slate-200" />)}</div>
            ) : categoryOptions.length === 0 ? (
              <p className="mt-5 text-sm text-slate-500">No categories are available yet.</p>
            ) : (
              <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
                {categoryOptions.map((category) => (
                  <button key={category.id} type="button" aria-pressed={String(category.id) === selectedCategory} onClick={() => setSelectedCategory(String(category.id) === selectedCategory ? '' : String(category.id))} className={`shrink-0 rounded-md border px-4 py-2.5 text-sm font-semibold transition ${String(category.id) === selectedCategory ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500 hover:text-slate-950'}`}>
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="discover" className="mx-auto max-w-7xl scroll-mt-6 px-5 py-12 sm:px-8 sm:py-16">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Marketplace discovery</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">{selectedCategory ? categoryOptions.find((category) => String(category.id) === selectedCategory)?.name : 'Recently listed'}</h2>
              <p className="mt-2 text-slate-500">Published products available from marketplace sellers.</p>
            </div>
            {user?.role?.name === 'client' ? (
              <Link to="/products" className="text-sm font-semibold text-blue-700 hover:text-blue-900">Browse all products →</Link>
            ) : user ? (
              <Link to={dashboardPath(user.role?.name)} className="text-sm font-semibold text-blue-700 hover:text-blue-900">Open your workspace →</Link>
            ) : (
              <Link to="/login" state={{ from: { pathname: '/products' } }} className="text-sm font-semibold text-blue-700 hover:text-blue-900">Sign in to browse all →</Link>
            )}
          </div>

          {productsError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              <p>{productsError}</p>
              <button type="button" onClick={() => setReload((value) => value + 1)} className="mt-3 font-semibold underline">Try again</button>
            </div>
          )}
          {loadingProducts ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="animate-pulse"><div className="aspect-[4/3] rounded-md bg-slate-200" /><div className="mt-3 h-4 w-2/3 rounded bg-slate-200" /><div className="mt-2 h-4 w-1/3 rounded bg-slate-200" /></div>)}</div>
          ) : productsError ? null : products.length === 0 ? (
            <div className="border-y border-slate-200 py-12 text-center">
              <h3 className="text-lg font-semibold">No published products found</h3>
              <p className="mt-2 text-sm text-slate-500">Try another category or check back later.</p>
              {selectedCategory && <button type="button" onClick={() => setSelectedCategory('')} className="mt-4 text-sm font-semibold text-blue-700">Show all products</button>}
            </div>
          ) : (
            <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => {
                const image = getProductImage(product)
                const price = productPrice(product)
                return (
                  <article key={product.id} className="group min-w-0">
                    <Link to={`/products/${product.id}`} className="block overflow-hidden rounded-md bg-slate-100">
                      <div className="aspect-[4/3]">
                        {image ? <img src={imageUrl(image)} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center text-sm text-slate-400">No image</div>}
                      </div>
                    </Link>
                    <div className="pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800">{product.category?.name || 'Marketplace'}</p>
                      <Link to={`/products/${product.id}`} className="mt-1 block font-semibold leading-5 text-slate-950 hover:text-blue-700">{product.name}</Link>
                      <p className="mt-1 truncate text-sm text-slate-500">{product.shop?.name || 'Independent shop'}</p>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="font-semibold text-slate-950">{formatPrice(price.current)}</span>
                        {price.original !== null && <span className="text-sm text-slate-400 line-through">{formatPrice(price.original)}</span>}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Link to="/" className="text-lg font-bold text-white">Market<span className="text-cyan-300">place</span></Link>
          <p className="text-sm">A marketplace for independent sellers and curious shoppers.</p>
          <div className="flex gap-5 text-sm">
            <Link to="/login" className="hover:text-white">Log in</Link>
            <Link to="/register" className="hover:text-white">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
