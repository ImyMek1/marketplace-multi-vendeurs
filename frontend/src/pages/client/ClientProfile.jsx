import { useState } from 'react'
import { useAuth } from '../../context/useAuth'
import profileService from '../../services/profileService'

function ClientProfile() {
  const { user, setUser } = useAuth()

  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  })

  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

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

    setServerError('')
    setSuccess('')
  }

  const validate = () => {
    const validationErrors = {}

    if (!form.name.trim()) {
      validationErrors.name = 'Name is required.'
    }

    if (!form.email.trim()) {
      validationErrors.email = 'Email is required.'
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      validationErrors.email = 'Enter a valid email address.'
    }

    if (
      form.phone &&
      !/^\+?[0-9\s().-]{7,30}$/.test(form.phone)
    ) {
      validationErrors.phone = 'Enter a valid phone number.'
    }

    return validationErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationErrors = validate()

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    setServerError('')
    setSuccess('')

    try {
      const response = await profileService.updateProfile({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
      })

      const updatedUser = response?.user

      if (updatedUser) {
        setUser(updatedUser)

        localStorage.setItem(
          'auth_user',
          JSON.stringify(updatedUser),
        )

        setForm({
          name: updatedUser.name ?? '',
          email: updatedUser.email ?? '',
          phone: updatedUser.phone ?? '',
        })
      }

      setSuccess('Profile updated successfully.')
    } catch (error) {
      const response = error.response

      if (response?.status === 422) {
        setErrors(response.data?.errors ?? {})
      } else {
        setServerError(
          response?.data?.message ||
            'Unable to update your profile.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <section>
        <p className="text-sm font-medium text-blue-600">
          Account
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          My Profile
        </h1>

        <p className="mt-2 text-slate-500">
          Manage your personal information and account details.
        </p>
      </section>

      {serverError && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700"
        >
          {serverError}
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

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="border-b border-slate-200 pb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Personal Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Update the information associated with your account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-6"
          noValidate
        >
          <div>
            <label
              htmlFor="profile-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Full Name
            </label>

            <input
              id="profile-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {errors.name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="profile-email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email
            </label>

            <input
              id="profile-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="profile-phone"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Phone
            </label>

            <input
              id="profile-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
              placeholder="+212 6XX XXX XXX"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">
                {errors.phone}
              </p>
            )}
          </div>

          <div className="flex justify-end border-t border-slate-200 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? 'Saving changes...'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">
          Account Information
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Account ID
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              #{user?.id}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Role
            </p>

            <p className="mt-1 font-semibold capitalize text-slate-900">
              {user?.role?.name ?? 'Client'}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Status
            </p>

            <p className="mt-1 font-semibold capitalize text-emerald-700">
              {user?.status ?? 'Active'}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ClientProfile