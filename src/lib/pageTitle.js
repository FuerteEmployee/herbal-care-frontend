import { NAV_ITEMS } from '../constants/roles'

const EXTRA_TITLES = [{ test: (path) => /^\/admin\/orders\/[^/]+$/.test(path), title: 'Order Details' }]

export function getPageTitle(pathname) {
  const extra = EXTRA_TITLES.find((e) => e.test(pathname))
  if (extra) return extra.title
  const item = NAV_ITEMS.find((n) => n.path === pathname)
  return item?.label ?? 'Herbal Gujarat Admin'
}
