import { useState } from 'react'
import sellerService from '../../services/sellerService'

function SellerProductImages({
  product,
  onImagesChange,
}) {
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  const images = product?.images || []

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || [])

    event.target.value = ''

    if (files.length === 0) {
      return
    }

    setUploading(true)
    setError('')

    const formData = new FormData()

    files.forEach((file) => {
      formData.append('images[]', file)
    })

    if (images.length === 0) {
      formData.append('primary_index', '0')
    }

    try {
      const response =
        await sellerService.uploadProductImage(
          product.id,
          formData,
        )

      onImagesChange(response.data)
    } catch (requestError) {
      const response = requestError.response

      if (response?.status === 422) {
        const validationErrors =
          response.data.errors || {}

        const firstError = Object.values(validationErrors)
          .flat()
          .at(0)

        setError(
          firstError ||
            response.data.message ||
            'Please check the selected images.',
        )
      } else {
        setError(
          response?.data?.message ||
            'Unable to upload the images.',
        )
      }
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (image) => {
    const confirmed = window.confirm(
      'Delete this product image?',
    )

    if (!confirmed) {
      return
    }

    setDeletingId(image.id)
    setError('')

    try {
      await sellerService.deleteProductImage(image.id)

      onImagesChange({
        ...product,
        images: images.filter(
          (currentImage) =>
            currentImage.id !== image.id,
        ),
      })
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to delete the image.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mt-8 border-t border-slate-200 pt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Product images
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Add up to 10 images. JPG, PNG and WebP are supported.
          </p>
        </div>

        <label
          className={`inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 ${
            uploading
              ? 'cursor-not-allowed opacity-60'
              : 'cursor-pointer'
          }`}
        >
          {uploading ? 'Uploading...' : 'Add images'}

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {images.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-500">
            No images added yet.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="aspect-[4/3] bg-slate-100">
                <img
                  src={`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/storage/${image.path}`}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex items-center justify-between gap-3 p-3">
                {image.is_primary ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Primary
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    Image
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(image)}
                  disabled={deletingId === image.id}
                  className="text-sm font-medium text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId === image.id
                    ? 'Deleting...'
                    : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SellerProductImages