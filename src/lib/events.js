const EVENT_DATA_CHANGED = 'pmp:data-changed';

export function emitDataChanged() {
  window.dispatchEvent(new CustomEvent(EVENT_DATA_CHANGED));
}

export function onDataChanged(handler) {
  window.addEventListener(EVENT_DATA_CHANGED, handler);
  return () => window.removeEventListener(EVENT_DATA_CHANGED, handler);
}
