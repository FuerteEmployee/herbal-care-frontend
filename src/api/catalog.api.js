import { api } from './httpClient'

// Products and categories as herbal-backend stores them
// (src/models/Product.js, src/models/Category.js).
//
// Fields the storefront schema does NOT have, so the admin form cannot persist
// them yet: sku / SAP code, HSN code, MRP-vs-selling split, gstPercent,
// gstMode, supplier, subCategory, brand, barcode. Adding any of those needs a
// schema change on the backend first — see the note in AddProductPage.

export const PRODUCT_UNITS = ['piece', 'gram', 'kg', 'ml', 'litre', 'pack', 'bottle', 'box']

function idOf(ref) {
  if (!ref) return ''
  return typeof ref === 'string' ? ref : ref._id
}

// ---------------------------------------------------------------- products

export function mapProductFromApi(p) {
  const stock = p.stock ?? 0
  return {
    id: p._id,
    name: p.name,
    slug: p.slug ?? '',
    categoryId: idOf(p.category),
    categoryName: p.category && typeof p.category === 'object' ? p.category.name : '',
    description: p.description ?? '',
    shortDescription: p.shortDescription ?? '',
    price: p.price ?? 0,
    discountPrice: p.discountPrice ?? null,
    // What a customer actually pays — the order controller uses
    // discountPrice || price, so mirror that here.
    effectivePrice: p.discountPrice || p.price || 0,
    images: p.images ?? [],
    stock,
    unit: p.unit ?? 'piece',
    isFeatured: !!p.isFeatured,
    isActive: p.isActive !== false,
    ratings: p.ratings ?? 0,
    numReviews: p.numReviews ?? 0,
    tags: p.tags ?? [],
    stockState: stock <= 0 ? 'out_of_stock' : stock < 10 ? 'low_stock' : 'in_stock',
    date: (p.createdAt ?? '').slice(0, 10),
  }
}

function mapProductToApi(data) {
  const discount =
    data.discountPrice === '' || data.discountPrice == null ? undefined : Number(data.discountPrice)

  return {
    name: data.name?.trim(),
    category: data.categoryId,
    description: data.description?.trim() || undefined,
    shortDescription: data.shortDescription?.trim() || undefined,
    price: Number(data.price) || 0,
    discountPrice: discount,
    stock: data.stock === '' || data.stock == null ? 0 : Number(data.stock),
    unit: data.unit || 'piece',
    isFeatured: !!data.isFeatured,
    ...(data.isActive !== undefined ? { isActive: !!data.isActive } : {}),
    images: (data.images ?? []).map((u) => String(u).trim()).filter(Boolean),
    tags: (data.tags ?? []).map((t) => String(t).trim()).filter(Boolean),
  }
}

function toQuery(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.set(k, v)
  })
  return qs.toString()
}

// GET /api/products?page&limit&category&search&sort&order&featured&includeInactive
// → { total, page, pages, products }
// includeInactive is passed so the admin list shows hidden products too; the
// public storefront omits it and only sees active ones.
export async function getProductsPage({
  page = 1,
  limit = 10,
  category,
  search,
  sort = 'createdAt',
  order = 'desc',
  featured,
} = {}) {
  const qs = toQuery({ page, limit, category, search, sort, order, featured, includeInactive: 'true' })
  const res = await api.get(`/products${qs ? `?${qs}` : ''}`)
  return {
    items: (res.products ?? []).map(mapProductFromApi),
    total: res.total ?? 0,
    page: res.page ?? page,
    pages: res.pages ?? 1,
  }
}

// Flat list, for pickers that need every product at once.
export async function getProducts() {
  const res = await api.get('/products?limit=500&includeInactive=true')
  return (res.products ?? []).map(mapProductFromApi)
}

// GET /api/products/id/:id — the admin-only lookup by ObjectId. (The public
// route is /api/products/slug/:slug.)
export async function getProductById(id) {
  const { product } = await api.get(`/products/id/${id}`)
  return mapProductFromApi(product)
}

/**
 * Builds a multipart body when the form has picked files.
 *
 * There is no separate upload endpoint: the photos ride along with the product
 * in one request, and the server pushes them to Cloudinary and stores the
 * returned URLs. `images` carries the URLs that should survive (existing photos
 * the admin kept); the files are appended under the same field name and the
 * controller concatenates uploads onto that list.
 */
function toFormData(payload, files) {
  const fd = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    // Arrays are JSON-encoded — the server's list() helper parses either a JSON
    // array or a comma-separated string back into a real array.
    fd.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value))
  })

  for (const file of files) fd.append('images', file)
  return fd
}

// `files` is an array of File objects chosen in the form; omit it (or pass an
// empty array) and the request goes out as ordinary JSON.
export async function createProduct(data, files = []) {
  const payload = mapProductToApi(data)
  const { product } = files.length
    ? await api.upload('/products', toFormData(payload, files))
    : await api.post('/products', payload)
  return mapProductFromApi(product)
}

export async function updateProduct(id, data, files = []) {
  const payload = mapProductToApi(data)
  const { product } = files.length
    ? await api.uploadPut(`/products/${id}`, toFormData(payload, files))
    : await api.put(`/products/${id}`, payload)
  return mapProductFromApi(product)
}

export async function deleteProduct(id) {
  return api.delete(`/products/${id}`)
}

// -------------------------------------------------------------- categories

export function mapCategoryFromApi(c) {
  return {
    id: c._id,
    name: c.name,
    slug: c.slug ?? '',
    description: c.description ?? '',
    image: c.image ?? '',
    isActive: c.isActive !== false,
  }
}

// GET /api/categories?includeInactive
export async function getCategories({ includeInactive = true } = {}) {
  const { categories } = await api.get(`/categories${includeInactive ? '?includeInactive=true' : ''}`)
  return (categories ?? []).map(mapCategoryFromApi)
}

export async function createCategory(data) {
  const { category } = await api.post('/categories', {
    name: data.name?.trim(),
    description: data.description?.trim() || undefined,
    image: data.image?.trim() || undefined,
  })
  return mapCategoryFromApi(category)
}

export async function updateCategory(id, data) {
  const { category } = await api.put(`/categories/${id}`, {
    name: data.name?.trim(),
    description: data.description?.trim() || undefined,
    image: data.image?.trim() || undefined,
    ...(data.isActive !== undefined ? { isActive: !!data.isActive } : {}),
  })
  return mapCategoryFromApi(category)
}

export async function deleteCategory(id) {
  return api.delete(`/categories/${id}`)
}
