const TONE_MAP = {
  active: 'green',
  in_stock: 'green',
  paid: 'green',
  completed: 'green',
  delivered: 'green',
  received: 'green',
  sent: 'green',
  present: 'green',

  pending: 'amber',
  partial: 'amber',
  partially_received: 'amber',
  new: 'amber',
  low_stock: 'amber',
  requested: 'amber',
  draft: 'amber',
  half_day: 'amber',
  leave: 'amber',
  assigned: 'amber',
  in_transit: 'amber',
  rescheduled: 'amber',

  out_of_stock: 'red',
  cancelled: 'red',
  returned: 'red',
  absent: 'red',
  ended: 'red',
  failed: 'red',

  accepted: 'blue',
  dispatched: 'blue',
  out_for_delivery: 'blue',
  processing: 'blue',
  reached_destination: 'blue',
  refunded: 'blue',

  otp_verified: 'green',
}

export function statusTone(status) {
  return TONE_MAP[status] ?? 'slate'
}

export function formatStatusLabel(status) {
  return String(status)
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
