import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

const initialForm = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
}

function getDashboardPath(role) {
  return {
    client: '/client',
    seller: '/seller',
    driver: '/driver',
    admin: '/admin',
  }[role] || '/'
}

function Register() {
  const { register, user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={getDashboardPath(user?.role?.name)} replace />
  }

  const changeField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setServerError('')
  }

  const validate = () => {
    const nextErrors = {}
    const name = form.name.trim()

    if (!name) nextErrors.name = 'Full name is required.'
    else if (name.length > 150) nextErrors.name = 'Full name must be 150 characters or fewer.'

    if (!form.email.trim()) nextErrors.email = 'Email is required.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.'
    else if (form.email.length > 255) nextErrors.email = 'Email must be 255 characters or fewer.'

    if (!form.password) nextErrors.password = 'Password is required.'
    else if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.'
    else if (form.password.length > 255) nextErrors.password = 'Password must be 255 characters or fewer.'

    if (!form.password_confirmation) nextErrors.password_confirmation = 'Please confirm your password.'
    else if (form.password !== form.password_confirmation) nextErrors.password_confirmation = 'Passwords do not match.'

    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setLoading(true)
    setErrors({})
    setServerError('')

    try {
      const registeredUser = await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        password_confirmation: form.password_confirmation,
      })
      navigate(getDashboardPath(registeredUser?.role?.name), { replace: true })
    } catch (error) {
      const response = error.response
      if (response?.status === 422) {
        const validationErrors = response.data?.errors || {}
        setErrors(Object.fromEntries(
          Object.entries(validationErrors).map(([field, messages]) => [field, messages?.[0] || 'Invalid value.']),
        ))
      } else {
        setServerError(response?.data?.message || 'Unable to create your account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const fieldClass = (field) => `mt-1.5 w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ${errors[field] ? 'border-red-400' : 'border-slate-300'}`

  return (
    <main className="grid min-h-screen bg-slate-100 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)]">
      <section className="relative hidden overflow-hidden bg-slate-950 px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <Link to="/" className="text-lg font-bold tracking-wide">Market<span className="text-cyan-300">place</span></Link>
        <div className="relative z-10 max-w-xl py-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-300">A marketplace built around choice</p>
          <h1 className="mt-5 text-5xl font-semibold leading-tight">Find the things that make your day.</h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-300">Create a customer account to discover products and shop from independent sellers.</p>
        </div>
        <p className="text-xs text-slate-400">A single account for the marketplace.</p>
        <div aria-hidden="true" className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full border border-cyan-300/20" />
        <div aria-hidden="true" className="absolute -bottom-12 -right-4 h-56 w-56 rounded-full border border-cyan-300/20" />
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-slate-950 lg:hidden">Marketplace</Link>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
            <header className="mb-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Create account</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Join the marketplace</h2>
              <p className="mt-2 text-sm text-slate-500">Register as a customer to start exploring.</p>
            </header>

            {serverError && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="register-name" className="block text-sm font-medium text-slate-700">Full name</label>
                <input id="register-name" name="name" type="text" autoComplete="name" maxLength={150} value={form.name} onChange={changeField} className={fieldClass('name')} aria-invalid={Boolean(errors.name)} />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="register-email" className="block text-sm font-medium text-slate-700">Email</label>
                <input id="register-email" name="email" type="email" autoComplete="email" maxLength={255} value={form.email} onChange={changeField} className={fieldClass('email')} aria-invalid={Boolean(errors.email)} />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="register-password" className="block text-sm font-medium text-slate-700">Password</label>
                <input id="register-password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={changeField} className={fieldClass('password')} aria-invalid={Boolean(errors.password)} />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="register-password-confirmation" className="block text-sm font-medium text-slate-700">Confirm password</label>
                <input id="register-password-confirmation" name="password_confirmation" type="password" autoComplete="new-password" value={form.password_confirmation} onChange={changeField} className={fieldClass('password_confirmation')} aria-invalid={Boolean(errors.password_confirmation)} />
                {errors.password_confirmation && <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>}
              </div>

              <button type="submit" disabled={loading} className="mt-2 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60">
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account? <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-800">Sign in</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Register
