import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import productService from '../../services/productService'
import cartService from '../../services/cartService'
import reviewService from '../../services/reviewService'

function formatPrice(value) {
  return `${Number(value).toLocaleString('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MAD`
}

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

function getReviewsFromResponse(response) {
  const data = response?.data ?? response

  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.data)) {
    return data.data
  }

  return []
}

function ProductDetails() {
  const { id } = useParams()

  const [product, setProduct] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [reviews, setReviews] = useState([])
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [error, setError] = useState('')
  const [cartMessage, setCartMessage] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await productService.getProduct(id)
        const productData = response?.data ?? response

        setProduct(productData)

        if (productData?.images?.length > 0) {
          const primaryImage =
            productData.images.find(
              (image) => image.is_primary,
            ) ?? productData.images[0]

          setSelectedImage(primaryImage)
        }
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            'Unable to load this product.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [id])

  useEffect(() => {
    const loadReviews = async () => {
      setReviewsLoading(true)
      setReviewError('')

      try {
        const response =
          await reviewService.getProductReviews(id)

        setReviews(getReviewsFromResponse(response))
      } catch (requestError) {
        setReviewError(
          requestError.response?.data?.message ||
            'Unable to load reviews.',
        )
      } finally {
        setReviewsLoading(false)
      }
    }

    loadReviews()
  }, [id])

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0) {
      return
    }

    setAddingToCart(true)
    setError('')
    setCartMessage('')

    try {
      await cartService.addItem(product.id, quantity)
      setCartMessage('Product added to your cart successfully.')
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.errors?.quantity?.[0] ||
          requestError.response?.data?.errors?.product_id?.[0] ||
          'Unable to add this product to your cart.',
      )
    } finally {
      setAddingToCart(false)
    }
  }

  const handleSubmitReview = async (event) => {
    event.preventDefault()

    setSubmittingReview(true)
    setReviewError('')
    setReviewMessage('')

    try {
      await reviewService.createReview({
        product_id: Number(id),
        rating: reviewRating,
        comment: reviewComment.trim(),
      })

      setReviewComment('')
      setReviewRating(5)
      setReviewMessage(
        'Your review has been submitted and is awaiting moderation.',
      )
    } catch (requestError) {
      const response = requestError.response

      if (response?.status === 422) {
        const validationErrors = response.data?.errors
        const firstError = validationErrors
          ? Object.values(validationErrors).flat()[0]
          : null

        setReviewError(
          firstError ||
            response.data?.message ||
            'Please check your review.',
        )
      } else if (response?.status === 403) {
        setReviewError(
          response.data?.message ||
            'You are not allowed to review this product.',
        )
      } else {
        setReviewError(
          response?.data?.message ||
            'Unable to submit your review.',
        )
      }
    } finally {
      setSubmittingReview(false)
    }
  }

  const averageRating = useMemo(() => {
    if (reviews.length === 0) {
      return 0
    }

    const total = reviews.reduce(
      (sum, review) => sum + Number(review.rating),
      0,
    )

    return total / reviews.length
  }, [reviews])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="h-[500px] animate-pulse rounded-2xl bg-slate-200" />

          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-slate-200" />
            <div className="h-24 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <Link
          to="/products"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Back to products
        </Link>

        <div className="rounded-2xl bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-xl font-semibold text-slate-900">
            Product not found
          </h1>

          <Link
            to="/products"
            className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Back to products
          </Link>
        </div>
      </div>
    )
  }

  const hasPromotion =
    product.promotional_price !== null &&
    Number(product.promotional_price) < Number(product.price)

  const currentPrice = hasPromotion
    ? product.promotional_price
    : product.price

  const images = product.images ?? []

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <Link
        to="/products"
        className="inline-block text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        ← Back to products
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <div className="flex h-[500px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            {selectedImage ? (
              <img
                src={getImageUrl(selectedImage.path)}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-sm text-slate-400">
                No image available
              </span>
            )}
          </div>

          {images.length > 0 && (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {images.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-100 ${
                    selectedImage?.id === image.id
                      ? 'border-slate-900'
                      : 'border-slate-200'
                  }`}
                >
                  <img
                    src={getImageUrl(image.path)}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col">
          <p className="text-sm font-medium text-blue-600">
            {product.category?.name}
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {product.name}
          </h1>

          {product.brand && (
            <p className="mt-2 text-sm text-slate-500">
              Brand: {product.brand}
            </p>
          )}

          <div className="mt-6 flex items-end gap-3">
            <span className="text-3xl font-bold text-slate-900">
              {formatPrice(currentPrice)}
            </span>

            {hasPromotion && (
              <span className="text-lg text-slate-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                product.stock > 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {product.stock > 0
                ? `${product.stock} in stock`
                : 'Out of stock'}
            </span>

            <span className="text-sm text-slate-500">
              {product.shop?.name}
            </span>

            <span className="text-sm font-medium text-amber-600">
              {averageRating > 0
                ? `${averageRating.toFixed(1)} / 5`
                : 'No ratings yet'}
            </span>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-semibold text-slate-900">
              Description
            </h2>

            <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
              {product.description || 'No description available.'}
            </p>
          </div>

          {cartMessage && (
            <div
              role="status"
              className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            >
              {cartMessage}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="mt-8 border-t border-slate-200 pt-8">
            {product.stock > 0 && (
              <div className="mb-4">
                <label
                  htmlFor="product-quantity"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Quantity
                </label>

                <select
                  id="product-quantity"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(Number(event.target.value))
                  }
                  disabled={addingToCart}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                >
                  {Array.from(
                    { length: product.stock },
                    (_, index) => index + 1,
                  ).map((value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              disabled={product.stock <= 0 || addingToCart}
              onClick={handleAddToCart}
              className="w-full rounded-xl bg-slate-900 px-6 py-4 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addingToCart
                ? 'Adding to cart...'
                : product.stock > 0
                  ? 'Add to cart'
                  : 'Out of stock'}
            </button>

            {cartMessage && (
              <Link
                to="/client/cart"
                className="mt-3 block text-center text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View cart
              </Link>
            )}
          </div>
        </section>
      </div>

      <section className="border-t border-slate-200 pt-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  Customer feedback
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  Reviews & Ratings
                </h2>
              </div>

              <div className="text-right">
                <p className="text-3xl font-bold text-slate-900">
                  {averageRating > 0
                    ? averageRating.toFixed(1)
                    : '—'}
                </p>

                <p className="text-sm text-slate-500">
                  {reviews.length}{' '}
                  {reviews.length === 1
                    ? 'review'
                    : 'reviews'}
                </p>
              </div>
            </div>

            {reviewsLoading ? (
              <div className="mt-6 space-y-4">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-32 animate-pulse rounded-2xl bg-slate-200"
                  />
                ))}
              </div>
            ) : reviewError ? (
              <div className="mt-6 rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700">
                {reviewError}
              </div>
            ) : reviews.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <p className="font-medium text-slate-900">
                  No reviews yet
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Be the first customer to review this product.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {review.user?.name || 'Customer'}
                        </p>

                        <div className="mt-1 flex items-center gap-1">
                          {Array.from(
                            { length: 5 },
                            (_, index) => (
                              <span
                                key={index}
                                className={
                                  index <
                                  Number(review.rating)
                                    ? 'text-amber-400'
                                    : 'text-slate-300'
                                }
                              >
                                ★
                              </span>
                            ),
                          )}
                        </div>
                      </div>

                      {review.created_at && (
                        <span className="text-xs text-slate-400">
                          {new Date(
                            review.created_at,
                          ).toLocaleDateString('fr-MA')}
                        </span>
                      )}
                    </div>

                    {review.comment && (
                      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">
                        {review.comment}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Write a review
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Share your experience with this product.
            </p>

            {reviewMessage && (
              <div
                role="status"
                className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                {reviewMessage}
              </div>
            )}

            {reviewError && (
              <div
                role="alert"
                className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {reviewError}
              </div>
            )}

            <form
              onSubmit={handleSubmitReview}
              className="mt-6"
            >
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Your rating
                </p>

                <div className="mt-2 flex gap-1">
                  {Array.from(
                    { length: 5 },
                    (_, index) => {
                      const rating = index + 1

                      return (
                        <button
                          key={rating}
                          type="button"
                          onClick={() =>
                            setReviewRating(rating)
                          }
                          className={`text-3xl transition ${
                            rating <= reviewRating
                              ? 'text-amber-400'
                              : 'text-slate-300'
                          }`}
                          aria-label={`Rate ${rating} out of 5`}
                        >
                          ★
                        </button>
                      )
                    },
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="review-comment"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Comment
                </label>

                <textarea
                  id="review-comment"
                  value={reviewComment}
                  onChange={(event) =>
                    setReviewComment(event.target.value)
                  }
                  rows={5}
                  maxLength={2000}
                  placeholder="Tell us about your experience..."
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="mt-5 w-full rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submittingReview
                  ? 'Submitting...'
                  : 'Submit Review'}
              </button>
            </form>

            <p className="mt-4 text-xs leading-5 text-slate-400">
              Reviews are moderated before they become publicly
              visible.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ProductDetails