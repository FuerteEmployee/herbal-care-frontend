import { useCallback, useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, FileText, Image as ImageIcon, User, Tag, Calendar, Upload, X } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import TableEmpty from '../../components/ui/TableEmpty'
import TableLoading, { TableLoadBar } from '../../components/ui/TableLoading'
import Pagination from '../../components/ui/Pagination'
import { useToast } from '../../components/ui/ToastContext'
import {
  getBlogsPage,
  createBlog,
  updateBlog,
  deleteBlog,
} from '../../api/blogs.api'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

export default function BlogsPage() {
  const { showToast } = useToast()

  const [blogs, setBlogs] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('') // '', 'published', 'draft'
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  // Form states
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [author, setAuthor] = useState("Herbal King's Man")
  const [image, setImage] = useState('')
  // Cover photo staged for upload: { file, previewUrl }. Sent with the post on
  // save; until then nothing has left the browser.
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [tags, setTags] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await getBlogsPage({
        page,
        limit: pageSize,
        search,
        status,
      })
      setBlogs(data.items)
      setTotal(data.total)
      setPages(data.pages)
    } catch (err) {
      setLoadError(err.message)
      setBlogs([])
      setTotal(0)
      setPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, status])

  useEffect(() => {
    load()
  }, [load])

  // Searching or changing filters resets to page 1
  useEffect(() => {
    setPage(1)
  }, [search, status, pageSize])

  function openCreate() {
    setEditing(null)
    setTitle('')
    setSummary('')
    setContent('')
    setAuthor("Herbal King's Man")
    setImage('')
    setTags('')
    setIsPublished(false)
    setFormError('')
    setFormOpen(true)
  }

  // Object URLs must be revoked or they leak for the tab's lifetime.
  function clearImageFile() {
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return ''
    })
    setImageFile(null)
  }

  function pickImageFile(file) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Cover photo must be 5 MB or smaller.')
      return
    }
    clearImageFile()
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setFormError('')
  }

  function openEdit(blog) {
    clearImageFile()
    setEditing(blog)
    setTitle(blog.title)
    setSummary(blog.summary)
    setContent(blog.content)
    setAuthor(blog.author)
    setImage(blog.image)
    setTags(blog.tags.join(', '))
    setIsPublished(blog.isPublished)
    setFormError('')
    setFormOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    if (!title.trim()) {
      setFormError('Title is required.')
      return
    }
    if (!content.trim()) {
      setFormError('Content is required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        title,
        content,
        summary,
        author,
        image,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        isPublished,
      }

      // A chosen file is sent with the post; the server uploads it to
      // Cloudinary and stores the URL it returns.
      if (editing) {
        await updateBlog(editing.id, payload, imageFile)
        showToast(`Blog "${title}" updated.`, 'success')
      } else {
        await createBlog(payload, imageFile)
        showToast(`Blog "${title}" created.`, 'success')
      }
      clearImageFile()
      setFormOpen(false)
      load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    try {
      await deleteBlog(pendingDelete.id)
      showToast(`Blog "${pendingDelete.title}" deleted.`, 'success')
      load()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setPendingDelete(null)
    }
  }

  async function handleTogglePublish(blog) {
    try {
      await updateBlog(blog.id, { isPublished: !blog.isPublished })
      showToast(
        `Blog "${blog.title}" is now ${!blog.isPublished ? 'published' : 'draft'}.`,
        'success'
      )
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Blogs & Articles"
        description="Write, edit and publish informative articles or news for the storefront blog."
        action={
          <Button onClick={openCreate}>
            <Plus size={15} /> Add Blog Post
          </Button>
        }
      />

      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={15} />
          <input
            type="search"
            autoComplete="off"
            placeholder="Search blogs by title or content…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <select
            className="form-input"
            style={{ width: 140, height: 38 }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </div>

      <div className="tbl-card">
        <div className="tbl-head">
          <div>
            <p className="tbl-head-title">All Articles</p>
            <p className="tbl-head-sub">
              {total} blog post{total === 1 ? '' : 's'} found
            </p>
          </div>
        </div>

        <TableLoadBar active={loading} />
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Article</th>
                <th>Author</th>
                <th>Tags</th>
                <th>Status</th>
                <th>Created At</th>
                <th className="tbl-right col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && blogs.length === 0 ? (
                <TableLoading colSpan={6} />
              ) : loadError ? (
                <TableEmpty colSpan={6} variant="error" message={loadError} onRetry={load} />
              ) : blogs.length === 0 ? (
                <TableEmpty
                  colSpan={6}
                  variant={search.trim() || status ? 'filtered' : 'empty'}
                  icon={FileText}
                  message={
                    search.trim() || status
                      ? 'No articles match your filters.'
                      : 'No blog posts yet — add your first post to engage customers!'
                  }
                />
              ) : (
                blogs.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        {b.image ? (
                          <img
                            src={b.image}
                            alt=""
                            className="tbl-thumb"
                            onError={(e) => {
                              e.currentTarget.style.visibility = 'hidden'
                            }}
                          />
                        ) : (
                          <span className="tbl-thumb tbl-thumb-empty">
                            <FileText size={15} />
                          </span>
                        )}
                        <div>
                          <div className="tbl-strong">{b.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                            <code className="slug-chip">{b.slug}</code>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={13} style={{ color: 'var(--ink-muted)' }} />
                        {b.author}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1" style={{ maxWidth: 200 }}>
                        {b.tags.map((tag) => (
                          <span
                            key={tag}
                            className="pill pill-slate"
                            style={{ fontSize: 10, padding: '2px 6px' }}
                          >
                            {tag}
                          </span>
                        ))}
                        {b.tags.length === 0 && <span style={{ color: 'var(--ink-muted)', fontSize: 12 }}>—</span>}
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(b)}
                        className={`pill cursor-pointer border-0 ${
                          b.isPublished ? 'pill-green' : 'pill-slate'
                        }`}
                        title="Click to toggle publish status"
                      >
                        {b.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={13} style={{ color: 'var(--ink-muted)' }} />
                        {b.date}
                      </div>
                    </td>
                    <td>
                      <div className="tbl-actions">
                        <button className="row-action" title="Edit article" onClick={() => openEdit(b)}>
                          <Pencil size={14} />
                        </button>
                        <button
                          className="row-action row-action-red"
                          title="Delete article"
                          onClick={() => setPendingDelete(b)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="p-4 border-t border-slate-200">
            <Pagination
              page={page}
              pages={pages}
              onChange={setPage}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={setPageSize}
              total={total}
            />
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Blog Post' : 'Add Blog Post'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
              {formError}
            </div>
          )}

          <div className="form-field">
            <label className="form-label">Article Title *</label>
            <input
              className="form-input"
              type="text"
              required
              placeholder="e.g. 5 Benefits of Herbal Gujarat Amla Juice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-field">
              <label className="form-label">Author Name</label>
              <div className="input-group">
                <User size={15} />
                <input
                  className="form-input"
                  type="text"
                  placeholder="Herbal King's Man"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </div>
            </div>

            {/* Cover photo. A chosen file is uploaded to Cloudinary by the
                server when the post is saved; the URL box stays for images
                already hosted elsewhere. */}
            <div className="form-field">
              <label className="form-label">Cover Photo</label>
              {imagePreview || image ? (
                <div className="cover-preview">
                  <img
                    src={imagePreview || image}
                    alt=""
                    onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
                  />
                  <div className="cover-preview-meta">
                    <span className="cover-preview-name">
                      {imageFile ? imageFile.name : 'Current photo'}
                    </span>
                    {imageFile && <span className="cover-preview-tag">Uploads on save</span>}
                  </div>
                  <button
                    type="button"
                    aria-label="Remove cover photo"
                    onClick={() => {
                      clearImageFile()
                      setImage('')
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <label className="dropzone" style={{ padding: '14px 12px' }}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    onChange={(e) => {
                      pickImageFile(e.target.files?.[0])
                      e.target.value = ''
                    }}
                  />
                  <Upload size={16} />
                  <span className="dropzone-title">Choose a cover photo</span>
                  <span className="dropzone-hint">JPG, PNG, WEBP · up to 5 MB</span>
                </label>
              )}

              <details className="url-fallback">
                <summary>Or use an image URL</summary>
                <div className="input-group" style={{ marginTop: 8 }}>
                  <ImageIcon size={15} />
                  <input
                    className="form-input"
                    type="text"
                    placeholder="https://…"
                    value={image}
                    onChange={(e) => {
                      setImage(e.target.value)
                      clearImageFile()
                    }}
                  />
                </div>
              </details>
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Tags (comma-separated)</label>
            <div className="input-group">
              <Tag size={15} />
              <input
                className="form-input"
                type="text"
                placeholder="e.g. wellness, amla, summer, hair-care"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Summary / Description (displays in list cards)</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="A brief teaser to prompt user clicks..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Article Content * (supports full text/html)</label>
            <textarea
              className="form-textarea font-mono text-sm"
              rows={8}
              required
              placeholder="Write your article body here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <label className="check-row">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            Publish article immediately (will show on E-com storefront)
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 10 }}>
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Article'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete blog post?"
        message={`Are you sure you want to delete "${pendingDelete?.title}"? This will permanently remove the article and cannot be undone.`}
      />
    </div>
  )
}
