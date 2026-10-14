export function getPageRows(response) {
  return Array.isArray(response?.data) ? response.data : []
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

export function formatDate(value) {
  if (!value) return '—'

  return new Date(value).toLocaleString('fr-MA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}