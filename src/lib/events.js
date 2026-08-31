const EVENT_DATA_CHANGED = 'pmp:data-changed';
const EVENT_USER_CHANGED = 'pmp:user-changed';

export function emitDataChanged() {
  window.dispatchEvent(new CustomEvent(EVENT_DATA_CHANGED));
}

export function emitUserChanged() {
  window.dispatchEvent(new CustomEvent(EVENT_USER_CHANGED));
}

export function onDataChanged(handler) {
  window.addEventListener(EVENT_DATA_CHANGED, handler);
  return () => window.removeEventListener(EVENT_DATA_CHANGED, handler);
}

export function onUserChanged(handler) {
  window.addEventListener(EVENT_USER_CHANGED, handler);
  return () => window.removeEventListener(EVENT_USER_CHANGED, handler);
}