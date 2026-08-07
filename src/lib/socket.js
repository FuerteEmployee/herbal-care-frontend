// Socket connection has been disabled on the frontend side as it was removed in the backend.
// All subscribe functions return empty cleanup functions.

export const socket = {
  connected: false,
  on: () => {},
  off: () => {},
  emit: () => {},
}

export function subscribeStockUpdates(callback) {
  return () => {}
}

export function subscribeConnectionStatus(callback) {
  callback(false)
  return () => {}
}

export function subscribeAdminNotifications(callback) {
  return () => {}
}

export function subscribeDeliveryUpdates(callback) {
  return () => {}
}

export function subscribeDispatchScanUpdates(callback) {
  return () => {}
}

export function subscribeInvoiceUpdates(callback) {
  return () => {}
}
