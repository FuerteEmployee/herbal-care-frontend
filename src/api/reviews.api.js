import { api } from './httpClient'

export function mapReviewFromApi(r) {
  return {
    id: r._id,
    rating: r.rating ?? 5,
    comment: r.comment ?? '',
    user: r.user ? {
      id: r.user._id,
      name: r.user.name ?? 'Deleted User',
      email: r.user.email ?? '',
    } : { id: '', name: 'Deleted User', email: '' },
    product: r.product ? {
      id: r.product._id,
      name: r.product.name ?? 'Deleted Product',
      image: r.product.image ?? '',
    } : { id: '', name: 'Deleted Product', image: '' },
    date: (r.createdAt ?? '').slice(0, 10),
    createdAt: r.createdAt,
  }
}

// GET /api/reviews (Admin only)
export async function getAllReviews() {
  const res = await api.get('/reviews')
  return (res.reviews ?? []).map(mapReviewFromApi)
}

// POST /api/reviews/admin (Admin only)
//
// A review always belongs to a registered customer — Review.user is required and
// (user, product) is uniquely indexed — so the customer has to be named
// explicitly. Posting a second review for the same customer/product pair edits
// the existing one, and the response says which happened via `created`.
export async function createReviewAsAdmin({ userId, productId, rating, comment }) {
  const res = await api.post('/reviews/admin', {
    userId,
    productId,
    rating: Number(rating),
    comment: comment?.trim() || undefined,
  })
  return {
    created: !!res.created,
    message: res.message,
    review: res.review ? mapReviewFromApi(res.review) : null,
  }
}

// DELETE /api/reviews/:id (Admin only)
export async function deleteReview(id) {
  return api.delete(`/reviews/${id}`)
}
