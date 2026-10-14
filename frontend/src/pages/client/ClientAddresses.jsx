import { useEffect, useState } from 'react'
import addressService from '../../services/addressService'

const emptyForm = {
  label: '',
  recipient_name: '',
  phone: '',
  address_line: '',
  city: '',
  postal_code: '',
  additional_info: '',
}

function getAddressesFromResponse(response) {
  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response?.data)) {
    return response.data
  }

  return []
}

function ClientAddresses() {
  const [addresses, setAddresses] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

useEffect(() => {
  const loadAddresses = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await addressService.getAddresses()

      setAddresses(getAddressesFromResponse(response))
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to load your addresses. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  loadAddresses()
}, [])

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    setError('')
    setSuccess('')
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (editingId) {
        const response = await addressService.updateAddress(
          editingId,
          form,
        )

        const updatedAddress =
          response?.data ?? response

        setAddresses((current) =>
          current.map((address) =>
            address.id === editingId
              ? updatedAddress
              : address,
          ),
        )

        setSuccess('Address updated successfully.')
      } else {
        const response = await addressService.createAddress(form)

        const newAddress =
          response?.data ?? response

        setAddresses((current) => [
          ...current,
          newAddress,
        ])

        setSuccess('Address added successfully.')
      }

      resetForm()
    } catch (requestError) {
      const validationErrors =
        requestError.response?.data?.errors

      if (validationErrors) {
        const firstError = Object.values(validationErrors)
          .flat()[0]

        setError(
          firstError ||
            'Please check the information and try again.',
        )
      } else {
        setError(
          requestError.response?.data?.message ||
            'Unable to save the address. Please try again.',
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (address) => {
    setEditingId(address.id)

    setForm({
      label: address.label ?? '',
      recipient_name: address.recipient_name ?? '',
      phone: address.phone ?? '',
      address_line: address.address_line ?? '',
      city: address.city ?? '',
      postal_code: address.postal_code ?? '',
      additional_info: address.additional_info ?? '',
    })

    setError('')
    setSuccess('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const handleDelete = async (addressId) => {
    setDeletingId(addressId)
    setError('')
    setSuccess('')

    try {
      await addressService.deleteAddress(addressId)

      setAddresses((current) =>
        current.filter(
          (address) => address.id !== addressId,
        ),
      )

      if (editingId === addressId) {
        resetForm()
      }

      setSuccess('Address deleted successfully.')
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to delete the address. Please try again.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-blue-600">
          Client Dashboard
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Addresses
        </h1>

        <p className="mt-2 text-slate-500">
          Manage your delivery addresses.
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

      {success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {success}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the information required for delivery.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              Cancel
            </button>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-5 md:grid-cols-2"
        >
          <div>
            <label
              htmlFor="label"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Label
            </label>

            <input
              id="label"
              name="label"
              value={form.label}
              onChange={handleChange}
              placeholder="Home"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          <div>
            <label
              htmlFor="recipient_name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Recipient Name
            </label>

            <input
              id="recipient_name"
              name="recipient_name"
              value={form.recipient_name}
              onChange={handleChange}
              placeholder="Full name"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Phone
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="0612345678"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          <div>
            <label
              htmlFor="city"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              City
            </label>

            <input
              id="city"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="Casablanca"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="address_line"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Address
            </label>

            <input
              id="address_line"
              name="address_line"
              value={form.address_line}
              onChange={handleChange}
              placeholder="123 Test Street"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          <div>
            <label
              htmlFor="postal_code"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Postal Code
            </label>

            <input
              id="postal_code"
              name="postal_code"
              value={form.postal_code}
              onChange={handleChange}
              placeholder="20000"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="additional_info"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Additional Information
            </label>

            <input
              id="additional_info"
              name="additional_info"
              value={form.additional_info}
              onChange={handleChange}
              placeholder="Apartment, floor..."
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? 'Saving...'
                : editingId
                  ? 'Update Address'
                  : 'Add Address'}
            </button>
          </div>
        </form>
      </section>

      <section>
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-slate-900">
            Your Addresses
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Saved delivery addresses.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Loading your addresses...
            </p>
          </div>
        ) : addresses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h3 className="font-semibold text-slate-900">
              No addresses yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Add an address above to use it for delivery.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {addresses.map((address) => (
              <article
                key={address.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {address.label}
                    </span>

                    <h3 className="mt-4 font-semibold text-slate-900">
                      {address.recipient_name}
                    </h3>
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-sm text-slate-600">
                  <p>{address.address_line}</p>
                  <p>
                    {address.city}
                    {address.postal_code
                      ? `, ${address.postal_code}`
                      : ''}
                  </p>
                  <p>{address.phone}</p>

                  {address.additional_info && (
                    <p className="pt-2 text-slate-500">
                      {address.additional_info}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleEdit(address)}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(address.id)}
                    disabled={deletingId === address.id}
                    className="flex-1 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === address.id
                      ? 'Deleting...'
                      : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default ClientAddresses