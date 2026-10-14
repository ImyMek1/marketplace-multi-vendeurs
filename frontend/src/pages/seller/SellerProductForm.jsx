import { useEffect, useState } from 'react'
import categoryService from '../../services/categoryService'
import sellerService from '../../services/sellerService'
import SellerProductImages from './SellerProductImages'

const initialForm = {
  name: '',
  description: '',
  brand: '',
  price: '',
  promotional_price: '',
  stock: '0',
  alert_threshold: '5',
  category_id: '',
}

function getCategoriesFromResponse(response) {
  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response?.data)) {
    return response.data
  }

  return []
}

function getFormFromProduct(product) {
  if (!product) {
    return initialForm
  }

  return {
    name: product.name || '',
    description: product.description || '',
    brand: product.brand || '',
    price: product.price || '',
    promotional_price: product.promotional_price || '',
    stock: product.stock ?? '0',
    alert_threshold: product.alert_threshold ?? '5',
    category_id: product.category_id || '',
  }
}

function SellerProductForm({
  product = null,
  onSuccess,
  onCancel,
}) {
  const isEditing = Boolean(product)

  const [form, setForm] = useState(() =>
    getFormFromProduct(product),
  )
  const [savedProduct, setSavedProduct] = useState(product)
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    let cancelled = false

    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategories()

        if (!cancelled) {
          setCategories(getCategoriesFromResponse(response))
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load categories.')
        }
      } finally {
        if (!cancelled) {
          setLoadingCategories(false)
        }
      }
    }

    fetchCategories()

    return () => {
      cancelled = true
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    setErrors((current) => ({
      ...current,
      [name]: '',
    }))

    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setSaving(true)
    setError('')
    setErrors({})

    const data = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      brand: form.brand.trim() || null,
      price: Number(form.price),
      promotional_price:
        form.promotional_price === ''
          ? null
          : Number(form.promotional_price),
      stock: Number(form.stock),
      alert_threshold: Number(form.alert_threshold),
      category_id: Number(form.category_id),
    }

    try {
      let response

      if (isEditing || savedProduct) {
        const productId =
          savedProduct?.id || product?.id

        response = await sellerService.updateProduct(
          productId,
          data,
        )
      } else {
        const shopResponse =
          await sellerService.getShop()

        const shop = shopResponse.data

        response = await sellerService.createProduct({
          ...data,
          shop_id: shop.id,
        })
      }

      const updatedProduct = response.data

      setSavedProduct(updatedProduct)
      setForm(getFormFromProduct(updatedProduct))
    } catch (requestError) {
      const response = requestError.response

      if (response?.status === 422) {
        setErrors(response.data.errors || {})

        setError(
          response.data.message ||
            'Please check the entered information.',
        )
      } else {
        setError(
          response?.data?.message ||
            'Unable to save the product.',
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const handleImagesChange = (updatedProduct) => {
    setSavedProduct(updatedProduct)
  }

  const handleFinish = () => {
    if (savedProduct) {
      onSuccess(savedProduct)
      return
    }

    onCancel()
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="border-b border-slate-200 pb-6">
        <h2 className="text-xl font-semibold text-slate-900">
          {savedProduct
            ? isEditing
              ? 'Edit product'
              : 'Product created'
            : 'Add product'}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {savedProduct
            ? 'Manage your product information and images.'
            : 'Create a new product for your shop.'}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-6"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Product name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
              maxLength={200}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Product name"
            />

            {errors.name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.name[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="brand"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Brand
            </label>

            <input
              id="brand"
              name="brand"
              type="text"
              value={form.brand}
              onChange={handleChange}
              maxLength={150}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Brand"
            />

            {errors.brand && (
              <p className="mt-1 text-sm text-red-600">
                {errors.brand[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="category_id"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Category
            </label>

            <select
              id="category_id"
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              required
              disabled={loadingCategories}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            >
              <option value="">
                {loadingCategories
                  ? 'Loading categories...'
                  : 'Select a category'}
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>

            {errors.category_id && (
              <p className="mt-1 text-sm text-red-600">
                {errors.category_id[0]}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Describe your product..."
            />

            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="price"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Price (MAD)
            </label>

            <input
              id="price"
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="0.00"
            />

            {errors.price && (
              <p className="mt-1 text-sm text-red-600">
                {errors.price[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="promotional_price"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Promotional price (MAD)
            </label>

            <input
              id="promotional_price"
              name="promotional_price"
              type="number"
              min="0.01"
              step="0.01"
              value={form.promotional_price}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Optional"
            />

            {errors.promotional_price && (
              <p className="mt-1 text-sm text-red-600">
                {errors.promotional_price[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="stock"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Stock
            </label>

            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {errors.stock && (
              <p className="mt-1 text-sm text-red-600">
                {errors.stock[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="alert_threshold"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Low stock alert threshold
            </label>

            <input
              id="alert_threshold"
              name="alert_threshold"
              type="number"
              min="0"
              step="1"
              value={form.alert_threshold}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {errors.alert_threshold && (
              <p className="mt-1 text-sm text-red-600">
                {errors.alert_threshold[0]}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving || loadingCategories}
            className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? 'Saving...'
              : savedProduct
                ? 'Save changes'
                : 'Create product'}
          </button>
        </div>
      </form>

      {savedProduct && (
        <SellerProductImages
          product={savedProduct}
          onImagesChange={handleImagesChange}
        />
      )}

      {savedProduct && (
        <div className="mt-6 flex justify-end border-t border-slate-200 pt-6">
          <button
            type="button"
            onClick={handleFinish}
            className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Done
          </button>
        </div>
      )}
    </section>
  )
}

export default SellerProductForm