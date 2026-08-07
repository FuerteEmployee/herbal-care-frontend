import { api } from './httpClient'

export function mapBlogFromApi(b) {
  return {
    id: b._id,
    title: b.title,
    slug: b.slug,
    content: b.content,
    summary: b.summary ?? '',
    author: b.author ?? "Herbal King's Man",
    image: b.image ?? '',
    tags: b.tags ?? [],
    isPublished: !!b.isPublished,
    publishedAt: b.publishedAt ? b.publishedAt.slice(0, 10) : '',
    date: (b.createdAt ?? '').slice(0, 10),
    createdAt: b.createdAt,
  }
}

function toQuery(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.set(k, v)
  })
  return qs.toString()
}

// GET /api/blogs?page&limit&search&status&adminMode=true
export async function getBlogsPage({ page = 1, limit = 10, search, status } = {}) {
  const qs = toQuery({ page, limit, search, status, adminMode: 'true' })
  const res = await api.get(`/blogs${qs ? `?${qs}` : ''}`)
  return {
    items: (res.items ?? []).map(mapBlogFromApi),
    total: res.total ?? 0,
    page: res.page ?? page,
    pages: res.pages ?? 1,
  }
}

// GET /api/blogs/:idOrSlug
export async function getBlog(idOrSlug) {
  const { blog } = await api.get(`/blogs/${idOrSlug}`)
  return mapBlogFromApi(blog)
}

/**
 * Multipart body for a post whose cover photo is a freshly chosen file.
 *
 * There is no separate upload call: the file travels with the post and the
 * server pushes it to Cloudinary, storing only the returned URL. The field is
 * named `image` — the same name the JSON path uses for a URL — so the controller
 * reads `req.file` when a file was sent and `req.body.image` otherwise.
 */
function toFormData(data, file) {
  const fd = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    fd.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value))
  })
  fd.append('image', file)
  return fd
}

// POST /api/blogs — pass a File as `imageFile` to upload a cover photo.
export async function createBlog(data, imageFile) {
  const { blog } = imageFile
    ? await api.upload('/blogs', toFormData(data, imageFile))
    : await api.post('/blogs', data)
  return mapBlogFromApi(blog)
}

// PUT /api/blogs/:id
export async function updateBlog(id, data, imageFile) {
  const { blog } = imageFile
    ? await api.uploadPut(`/blogs/${id}`, toFormData(data, imageFile))
    : await api.put(`/blogs/${id}`, data)
  return mapBlogFromApi(blog)
}

// DELETE /api/blogs/:id
export async function deleteBlog(id) {
  return api.delete(`/blogs/${id}`)
}
