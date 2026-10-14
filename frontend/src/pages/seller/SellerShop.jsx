
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import sellerService from '../../services/sellerService'

function SellerShop() {
  const { shop, setShop } = useOutletContext()

  const [form, setForm] = useState({
    name: '',
    description: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let cancelled = false

    const fetchShop = async () => {
      try {
        const response = await sellerService.getShop()

        if (!cancelled) {
          const shopData = response.data

          setShop(shopData)
          setForm({
            name: shopData.name || '',
            description: shopData.description || '',
          })
        }
      } catch (requestError) {
        if (!cancelled) {
          if (requestError.response?.status === 404) {
            setShop(null)
          } else {
            setError(
              requestError.response?.data?.message ||
                'Unable to load your shop.',
            )
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchShop()

    return () => {
      cancelled = true
    }
  }, [setShop])

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (saving) {
      return
    }

    const name = form.name.trim()

    if (!name) {
      setError('Shop name is required.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const data = {
      name,
      description: form.description.trim() || null,
    }

    try {
      const response = shop
        ? await sellerService.updateShop(data)
        : await sellerService.createShop(data)

      const updatedShop = response.data

      setShop((current) => ({
        ...current,
        ...updatedShop,
      }))

      setForm({
        name: updatedShop.name || '',
        description: updatedShop.description || '',
      })

      setSuccess(
        shop
          ? 'Shop updated successfully.'
          : 'Shop created successfully. Your shop is pending admin approval.',
      )
    } catch (requestError) {
      const response = requestError.response

      if (response?.status === 422) {
        const validationErrors = response.data.errors || {}
        const firstError = Object.values(validationErrors)
          .flat()
          .at(0)

        setError(
          firstError ||
            response.data.message ||
            'Please check your information.',
        )
      } else if (response?.status === 409) {
        setError(
          'You already have a shop. Please refresh the page.',
        )
      } else {
        setError(
          response?.data?.message ||
            'Unable to save your shop.',
        )
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="h-10 w-56 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-[500px] animate-pulse rounded-2xl bg-slate-200" />
      </div>
    )
  }

  const isCreating = !shop

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Seller space
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {isCreating ? 'Create your shop' : 'My Shop'}
        </h1>

        <p className="mt-2 text-slate-500">
          {isCreating
            ? 'Set up your shop to start selling on the marketplace.'
            : 'Manage your shop information and status.'}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isCreating
                ? 'New shop information'
                : 'Shop information'}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isCreating
                ? 'Enter the details of your new shop.'
                : 'Update the information displayed for your shop.'}
            </p>
          </div>

          {shop && (
            <span
              className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                shop.status === 'active'
                  ? 'bg-emerald-100 text-emerald-700'
                  : shop.status === 'suspended'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
              }`}
            >
              {shop.status}
            </span>
          )}
        </div>

        {shop?.status === 'pending' && (
          <div className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your shop is awaiting administrator approval.
            You can manage your shop information, but you
            cannot add products until it is activated.
          </div>
        )}

        {shop?.status === 'suspended' && (
          <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Your shop is currently suspended.
            Please contact the administrator for assistance.
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-6"
        >
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Shop name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              maxLength={200}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter your shop name"
            />
          </div>

          <div>
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
              rows={6}
              className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Describe your shop..."
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            {shop ? (
              <div className="text-sm text-slate-500">
                <p>
                  Products:{' '}
                  <span className="font-semibold text-slate-900">
                    {shop.products_count ?? 0}
                  </span>
                </p>

                <p className="mt-1">
                  Status:{' '}
                  <span className="font-semibold capitalize text-slate-900">
                    {shop.status}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Your shop will require administrator approval
                before you can start selling.
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? 'Saving...'
                : isCreating
                  ? 'Create shop'
                  : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default SellerShop
