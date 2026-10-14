import { useEffect, useState } from 'react'
import { getPageRows } from '../components/admin/adminFormatters'

function useAdminList(loader, perPage = 12) {
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState(null)
  const [criteria, setCriteria] = useState({ search: '', status: '' })
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const criteriaJson = JSON.stringify(criteria)

  useEffect(() => {
    let cancelled = false

    const loadRows = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await loader({ ...JSON.parse(criteriaJson), page, per_page: perPage })
        if (!cancelled) {
          setRows(getPageRows(response))
          setPagination(response)
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.response?.data?.message || 'Unable to load records.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadRows()
    return () => {
      cancelled = true
    }
  }, [loader, criteriaJson, page, perPage, revision])

  const refresh = (nextPage = page) => {
    setPage(nextPage)
    setRevision((value) => value + 1)
  }

  const updateCriteria = (nextCriteria) => {
    setCriteria(nextCriteria)
    setPage(1)
  }

  return {
    rows,
    pagination,
    criteria,
    updateCriteria,
    page,
    refresh,
    loading,
    error,
    setError,
  }
}

export default useAdminList
